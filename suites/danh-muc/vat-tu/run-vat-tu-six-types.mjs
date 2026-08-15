import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Sáu file Vật tư được chạy tuần tự theo đúng thứ tự nghiệp vụ đã thống nhất.
 * Mỗi file dùng một tiến trình Playwright riêng để reporter hoàn tất lifecycle trước khi sang loại kế tiếp.
 */
const materialSpecs = [
  'src/tests/danh-muc/pmkt-u-00106_vat_tu/them-moi-vat-tu-hang-hoa.spec.ts',
  'src/tests/danh-muc/pmkt-u-00106_vat_tu/them-moi-vat-tu-dich-vu.spec.ts',
  'src/tests/danh-muc/pmkt-u-00106_vat_tu/them-moi-vat-tu-nguyen-vat-lieu.spec.ts',
  'src/tests/danh-muc/pmkt-u-00106_vat_tu/them-moi-vat-tu-cong-cu-dung-cu.spec.ts',
  'src/tests/danh-muc/pmkt-u-00106_vat_tu/them-moi-vat-tu-thanh-pham.spec.ts',
  'src/tests/danh-muc/pmkt-u-00106_vat_tu/them-moi-vat-tu-ban-thanh-pham.spec.ts',
];

const rawArguments = process.argv.slice(2);
const startFromArgument = rawArguments.find((argument) => argument.startsWith('--start-from='));
const startFrom = startFromArgument ? Number(startFromArgument.split('=')[1]) : 1;
if (!Number.isInteger(startFrom) || startFrom < 1 || startFrom > materialSpecs.length) {
  throw new Error(`--start-from phải nằm trong khoảng 1-${materialSpecs.length}.`);
}
const forwardedArguments = rawArguments.filter((argument) => !argument.startsWith('--start-from='));
let suiteFailed = false;
const suiteStartedAt = new Date();
const suiteRunId = suiteStartedAt.toISOString().replace(/[-:.]/g, '').replace('T', 'T').replace('Z', 'Z');
// Playwright dọn test-results khi bắt đầu từng process, vì vậy manifest và bản lưu
// case-results của cả suite phải nằm ngoài thư mục đó.
const manifestDirectory = resolve('suite-results', 'vat-tu-six-types', suiteRunId);
const manifestPath = resolve(manifestDirectory, `vat-tu-six-types-${suiteRunId}.json`);
const manifest = {
  suite: 'vat-tu-six-types',
  startedAt: suiteStartedAt.toISOString(),
  finishedAt: null,
  command: `npm run test:vat-tu-six-types${forwardedArguments.includes('--headed') ? ':headed' : ''}`,
  specs: [],
};
mkdirSync(manifestDirectory, { recursive: true });

/** Ghi manifest theo cơ chế file tạm rồi đổi tên để giữ dữ liệu hợp lệ nếu suite bị gián đoạn. */
const persistManifest = () => {
  mkdirSync(manifestDirectory, { recursive: true });
  const temporaryPath = `${manifestPath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, manifestPath);
};

/** Liệt kê run ID đã tồn tại để nhận diện chính xác run mới do một spec vừa tạo. */
const listRunIds = () => new Set(
  (existsSync(resolve('test-results')) ? readdirSync(resolve('test-results'), { withFileTypes: true }) : [])
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('run-'))
    .map((entry) => entry.name.slice(4)),
);

persistManifest();

for (const [index, spec] of materialSpecs.entries()) {
  if (index + 1 < startFrom) continue;
  const runIdsBefore = listRunIds();
  const startedAt = new Date().toISOString();
  process.stdout.write(`\n[${index + 1}/${materialSpecs.length}] Chạy ${spec}\n`);
  const result = spawnSync(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', spec, '--workers=1', ...forwardedArguments],
    { stdio: 'inherit', shell: false },
  );
  if (result.status !== 0) suiteFailed = true;
  const newRunIds = [...listRunIds()].filter((runId) => !runIdsBefore.has(runId)).sort();
  const runId = newRunIds.at(-1) ?? null;
  const archivedCaseResults = runId
    ? resolve(manifestDirectory, `run-${runId}-case-results.tar`)
    : null;
  if (runId && archivedCaseResults) {
    const archiveResult = spawnSync(
      'tar.exe',
      ['-cf', archivedCaseResults, '-C', resolve('test-results', `run-${runId}`), 'case-results'],
      { stdio: 'inherit', shell: false },
    );
    if (archiveResult.status !== 0) throw new Error(`Không thể lưu artifacts của run ${runId}.`);
  }
  manifest.specs.push({
    order: index + 1,
    spec,
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: result.status ?? 1,
    runId,
    caseResultsArchive: archivedCaseResults,
  });
  persistManifest();
}

manifest.finishedAt = new Date().toISOString();
persistManifest();
process.stdout.write(`\nSuite manifest: ${manifestPath}\n`);
process.exitCode = suiteFailed ? 1 : 0;
