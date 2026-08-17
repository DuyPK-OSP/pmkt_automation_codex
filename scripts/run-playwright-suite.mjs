import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const repositoryRoot = process.cwd();
const rawArguments = process.argv.slice(2);
const manifestArgument = rawArguments.find((argument) => !argument.startsWith('--'));

if (!manifestArgument) {
  throw new Error('Thiếu manifest. Cách dùng: npm run suite:run -- <suite.json> [--list] [--headed].');
}

const forwardedArguments = rawArguments.filter((argument) => argument !== manifestArgument);
const manifestPath = resolve(repositoryRoot, manifestArgument);
const schemaPath = resolve(repositoryRoot, 'suites/schemas/suite-manifest.schema.json');
if (!existsSync(schemaPath)) throw new Error('Không tìm thấy suite manifest schema.');
if (!existsSync(manifestPath)) throw new Error(`Không tìm thấy suite manifest: ${manifestArgument}`);

/** Kiểm tra đường dẫn nằm trong workspace và trả đường dẫn tương đối chuẩn hóa. */
function resolveWorkspacePath(value) {
  const absolutePath = isAbsolute(value) ? resolve(value) : resolve(repositoryRoot, value);
  const relativePath = relative(repositoryRoot, absolutePath);
  if (relativePath.startsWith(`..${sep}`) || relativePath === '..') {
    throw new Error(`Đường dẫn vượt ngoài workspace: ${value}`);
  }
  return { absolutePath, relativePath: relativePath.replaceAll('\\', '/') };
}

/** Escape TC ID để ghép thành regular expression exact an toàn cho Playwright grep. */
function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Validate các tham chiếu runtime mà JSON Schema không thể đối chiếu với filesystem/source code. */
function validateRuntimeReferences(value) {
  const seenSpecs = new Set();
  const seenTestCases = new Set();
  for (const spec of value.specs) {
    const resolvedSpec = resolveWorkspacePath(spec.path);
    if (!existsSync(resolvedSpec.absolutePath)) throw new Error(`Không tìm thấy spec: ${spec.path}`);
    const specSource = readFileSync(resolvedSpec.absolutePath, 'utf8');
    if (seenSpecs.has(resolvedSpec.relativePath)) throw new Error(`Spec bị khai báo trùng: ${spec.path}`);
    seenSpecs.add(resolvedSpec.relativePath);
    for (const testCaseId of spec.testCases ?? []) {
      if (seenTestCases.has(testCaseId)) throw new Error(`TC ID bị khai báo trùng trong suite: ${testCaseId}`);
      if (!specSource.includes(testCaseId)) throw new Error(`Không tìm thấy ${testCaseId} trong ${spec.path}.`);
      seenTestCases.add(testCaseId);
    }
  }
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const validateSchema = new Ajv2020({ allErrors: true }).compile(schema);
if (!validateSchema(manifest)) {
  const details = validateSchema.errors
    .map(({ instancePath, message }) => `- ${instancePath || '/'} ${message}`)
    .join('\n');
  throw new Error(`Suite manifest không hợp lệ theo schema:\n${details}`);
}
validateRuntimeReferences(manifest);

const executionArguments = forwardedArguments.includes('--headed') || manifest.execution?.headed
  ? [...forwardedArguments.filter((argument) => argument !== '--headed'), '--headed']
  : forwardedArguments;
let suiteFailed = false;

for (const [index, spec] of manifest.specs.entries()) {
  const testCases = spec.testCases ?? [];
  const playwrightArguments = ['node_modules/@playwright/test/cli.js', 'test', spec.path, '--workers=1'];
  if (Number.isInteger(manifest.execution?.retries)) playwrightArguments.push(`--retries=${manifest.execution.retries}`);
  if (testCases.length > 0) {
    const pattern = `^(?=.*(?:${testCases.map(escapeRegularExpression).join('|')}))`;
    playwrightArguments.push('--grep', pattern);
  }
  playwrightArguments.push(...executionArguments);
  process.stdout.write(`\n[${index + 1}/${manifest.specs.length}] ${spec.path}\n`);
  const result = spawnSync(process.execPath, playwrightArguments, { cwd: repositoryRoot, stdio: 'inherit', shell: false });
  if (result.status !== 0) suiteFailed = true;
}

process.stdout.write(`\nSuite ${manifest.name} hoàn tất từ ${basename(manifestPath)}.\n`);
process.exitCode = suiteFailed ? 1 : 0;
