import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { analyzeFailure } from './reporting/codex-failure-analyzer.mjs';
import { readReportBugRegistry, updateIncrementalReport } from './reporting/incremental-report-writer.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
const target = args.find((value) => !value.startsWith('--'));
if (!target) throw new Error('Cách dùng: npm run suite:report -- <manifest.json> hoặc npm run spec:report -- <file.spec.ts>.');
const headed = args.includes('--headed');
const listOnly = args.includes('--list');
const targetPath = resolve(root, target);
if (!existsSync(targetPath)) throw new Error(`Không tìm thấy target: ${target}`);

function command(commandName, commandArguments, options = {}) {
  return spawnSync(commandName, commandArguments, { cwd: root, stdio: options.capture ? 'pipe' : 'inherit', encoding: 'utf8', shell: false, ...options });
}

function specReport(path) {
  return `report/${basename(path, '.spec.ts')}-report.html`;
}

function readManifest(path) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  const schema = JSON.parse(readFileSync(resolve(root, 'suites/schemas/suite-manifest.schema.json'), 'utf8'));
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  if (!validate(manifest)) throw new Error(`Manifest không hợp lệ:\n${validate.errors.map((item) => `${item.instancePath || '/'} ${item.message}`).join('\n')}`);
  return manifest;
}

function discoverTestcases(specPath) {
  const source = readFileSync(resolve(root, specPath), 'utf8');
  const matches = [...source.matchAll(/\btest(?:\.\w+)?\s*\(\s*(['"`])((?:TC|CL)[A-Za-z0-9_-]+)\s+-[^\r\n]*?\1/g)];
  const ids = [...new Set(matches.map((match) => match[2]))];
  if (!ids.length) throw new Error(`Không tìm thấy TC ID trong ${specPath}.`);
  return ids;
}

function readCaseRecord(outputDir, runId) {
  const caseDir = resolve(outputDir, `run-${runId}`, 'case-results');
  const indexPath = resolve(caseDir, 'index.json');
  if (!existsSync(indexPath)) throw new Error(`Reporter không tạo index: ${indexPath}`);
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const item = index.caseResults?.at(-1);
  if (!item) throw new Error(`Reporter không ghi testcase trong ${indexPath}`);
  return JSON.parse(readFileSync(resolve(caseDir, item.file), 'utf8'));
}

function evidencePath(record) {
  const preferred = ['mismatch-test-01', 'failure-screenshot', 'screenshot'];
  for (const name of preferred) {
    const attachment = record.attachments?.find((item) => item.name === name && item.path && existsSync(resolve(root, item.path)));
    if (attachment) return attachment.path;
  }
  return '';
}

/** Chuẩn hóa một hoặc nhiều Bug ID Analyzer trả về trong cùng failure. */
function matchedBugIds(analysis) {
  return String(analysis?.matchesExistingBugId ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Trả lifecycle dùng chung của spec; hook chạy ngoài từng process testcase. */
function specLifecycle(specPath) {
  if (!specPath.endsWith('/danh-sach-vat-tu.spec.ts')) return null;
  return {
    config: 'scripts/lifecycle/vat-tu/playwright.vat-tu-list-lifecycle.config.ts',
    setup: 'vat-tu-list-lifecycle.setup.spec.ts',
    teardown: 'vat-tu-list-lifecycle.teardown.spec.ts',
    state: resolve(root, 'test-results/vat-tu-list-dataset-state.json'),
  };
}

/** Chạy một hook lifecycle và dừng ngay nếu setup/teardown không bảo đảm dữ liệu. */
function runLifecycleHook(lifecycle, hook) {
  const result = command(process.execPath, [
    'node_modules/@playwright/test/cli.js', 'test', hook,
    `--config=${lifecycle.config}`, '--workers=1', '--retries=0',
  ]);
  if (result.status !== 0) throw new Error(`Spec lifecycle ${hook} thất bại.`);
}

/** Cập nhật trạng thái bug cũ theo toàn bộ testcase ảnh hưởng đã thực sự chạy trong scope. */
function reconcileBugLifecycle(state) {
  for (const bug of state.bugs) {
    if (['Done', 'Rejected'].includes(bug.status)) continue;
    const affected = bug.affectedTestcases ?? [];
    const executed = affected.map((id) => state.cases.find((item) => item.id === id));
    const reproduced = executed.some((item) => matchedBugIds(item?.analysis).includes(bug.id) && item.analysis.existingBugStillPresent === 'yes');
    if (reproduced) { bug.status = 'Re-Open'; continue; }
    const fullyCovered = affected.length > 0 && executed.every(Boolean);
    const trustworthyPass = fullyCovered && executed.every((item) => item.status === 'PASS');
    if (trustworthyPass) bug.status = 'Fixed';
  }
}

/** Phân tích một failure sau khi Playwright đã chạy xong toàn bộ spec và cập nhật bug registry tích lũy. */
function analyzeRecordedFailure({ state, spec, testCaseId, record, stateRoot }) {
  const caseState = state.cases.find((item) => item.id === testCaseId);
  if (!caseState) throw new Error(`Không tìm thấy kết quả đã ghi của ${testCaseId}.`);
  const analysisPath = resolve(stateRoot, `${testCaseId}-analysis.json`);
  const existingBugsForTestcase = state.bugs
    .filter((bug) => bug.affectedTestcases?.includes(testCaseId))
    .map(({ evidenceData, evidencePath: oldEvidencePath, ...bug }) => bug);
  const packet = { specPath: spec.path, testCaseId, title: record.title, source: record.source, errors: record.errors, attachments: record.attachments, existingBugsForTestcase };
  caseState.analysis = analyzeFailure(packet, analysisPath);
  if (!caseState.analysis.isProductBug) return;

  const matchedBugs = matchedBugIds(caseState.analysis)
    .map((id) => state.bugs.find((item) => item.id === id))
    .filter(Boolean);
  let targetBugs = matchedBugs;
  if (!targetBugs.length) {
    const deduplicated = state.bugs.find((item) => item.deduplicationKey === caseState.analysis.deduplicationKey);
    if (deduplicated) targetBugs = [deduplicated];
  }
  if (!targetBugs.length) {
    const bug = { id: `BUG-${basename(spec.path, '.spec.ts').toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${String(state.bugs.length + 1).padStart(3, '0')}`, status: 'Open', severity: caseState.analysis.severity, summary: caseState.analysis.summary, preconditions: caseState.analysis.preconditions, steps: caseState.analysis.steps, testData: caseState.analysis.testData, expected: caseState.analysis.expected, actual: caseState.analysis.actual, deduplicationKey: caseState.analysis.deduplicationKey, affectedTestcases: [], evidencePath: evidencePath(record) };
    state.bugs.push(bug);
    targetBugs = [bug];
  }
  for (const bug of targetBugs) {
    if (matchedBugs.length) bug.status = 'Re-Open';
    bug.actual = caseState.analysis.actual;
    bug.evidencePath = evidencePath(record) || bug.evidencePath;
    if (!bug.affectedTestcases.includes(testCaseId)) bug.affectedTestcases.push(testCaseId);
  }
}

const isManifest = extname(targetPath).toLowerCase() === '.json';
const manifest = isManifest ? readManifest(targetPath) : null;
const specs = manifest?.specs ?? [{ path: target.replaceAll('\\', '/'), report: specReport(target) }];
for (const spec of specs) {
  if (!existsSync(resolve(root, spec.path))) throw new Error(`Không tìm thấy spec: ${spec.path}`);
  spec.report ??= specReport(spec.path);
  const discovered = discoverTestcases(spec.path);
  spec.selectedCases = spec.testCases?.length ? spec.testCases : discovered;
  for (const id of spec.selectedCases) if (!discovered.includes(id)) throw new Error(`${id} không thuộc ${spec.path}.`);
}

if (listOnly) {
  for (const spec of specs) process.stdout.write(`${spec.path}\n${spec.selectedCases.map((id) => `  - ${id}`).join('\n')}\n  report: ${spec.report}\n`);
  process.exit(0);
}

const preflight = command(process.execPath, ['scripts/preflight-evidence.mjs', ...specs.map((spec) => spec.path)]);
if (preflight.status !== 0) throw new Error('Preflight evidence thất bại; runner không chạy testcase.');

const runId = `${(manifest?.name ?? basename(target, '.spec.ts'))}-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
const stateRoot = resolve(root, 'test-results', `pipeline-${runId}`);
mkdirSync(stateRoot, { recursive: true });
let anyFailure = false;

for (const spec of specs) {
  const lifecycle = specLifecycle(spec.path);
  let lifecycleReady = false;
  try {
  if (lifecycle) {
    runLifecycleHook(lifecycle, lifecycle.setup);
    const dataset = JSON.parse(readFileSync(lifecycle.state, 'utf8'));
    process.env.MATERIAL_LIST_DATASET_PREFIX = dataset.prefix;
    lifecycleReady = true;
  }
  const state = { specPath: spec.path, reportPath: spec.report, expectedTotal: spec.selectedCases.length, cases: [], bugs: readReportBugRegistry(spec.report) };
  const pendingFailures = [];
  for (const [index, testCaseId] of spec.selectedCases.entries()) {
    const outputDir = resolve(root, 'test-results', 'artifacts', runId, basename(spec.path, '.spec.ts'), testCaseId);
    const playwrightArgs = ['node_modules/@playwright/test/cli.js', 'test', spec.path, '--grep', `${testCaseId} -`, '--workers=1', '--retries=0', '--output', outputDir];
    if (headed || manifest?.execution?.headed) playwrightArgs.push('--headed');
    process.stdout.write(`\n[${index + 1}/${spec.selectedCases.length}] ${testCaseId}\n`);
    const previousRunId = process.env.TEST_RUN_ID;
    process.env.TEST_RUN_ID = runId;
    const result = command(process.execPath, playwrightArgs, { env: { ...process.env, TEST_RUN_ID: runId } });
    if (previousRunId === undefined) delete process.env.TEST_RUN_ID; else process.env.TEST_RUN_ID = previousRunId;
    const record = readCaseRecord(outputDir, runId);
    const caseState = {
      id: testCaseId,
      title: record.title,
      status: record.status,
      durationMs: record.durationMs,
      ...(record.skipReason ? { skipReason: record.skipReason } : {}),
    };
    if (record.status === 'FAIL') {
      anyFailure = true;
      pendingFailures.push({ testCaseId, record });
    }
    state.cases.push(caseState);
    writeFileSync(resolve(stateRoot, `${basename(spec.path, '.spec.ts')}.json`), JSON.stringify(state, null, 2), 'utf8');
    if (result.status !== 0 && record.status !== 'FAIL') anyFailure = true;
  }
  process.stdout.write(`\nPhân tích ${pendingFailures.length} failure sau khi hoàn tất spec ${spec.path}.\n`);
  for (const [index, failure] of pendingFailures.entries()) {
    process.stdout.write(`[analysis ${index + 1}/${pendingFailures.length}] ${failure.testCaseId}\n`);
    analyzeRecordedFailure({ state, spec, stateRoot, ...failure });
    writeFileSync(resolve(stateRoot, `${basename(spec.path, '.spec.ts')}.json`), JSON.stringify(state, null, 2), 'utf8');
  }
  reconcileBugLifecycle(state);
  writeFileSync(resolve(stateRoot, `${basename(spec.path, '.spec.ts')}.json`), JSON.stringify(state, null, 2), 'utf8');
  await updateIncrementalReport({ ...state, runId });
  } finally {
    if (lifecycle && (lifecycleReady || existsSync(lifecycle.state))) {
      try {
        runLifecycleHook(lifecycle, lifecycle.teardown);
      } finally {
        delete process.env.MATERIAL_LIST_DATASET_PREFIX;
      }
    }
  }
}

writeFileSync(resolve(stateRoot, 'summary.json'), JSON.stringify({ runId, target, reports: specs.map((spec) => spec.report), completedAt: new Date().toISOString() }, null, 2), 'utf8');
process.stdout.write(`\nHoàn tất ${runId}. Reports:\n${specs.map((spec) => `- ${spec.report}`).join('\n')}\n`);
process.exitCode = anyFailure ? 1 : 0;
