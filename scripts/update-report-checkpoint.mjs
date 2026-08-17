import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [artifactArgument, runId, reportArgument, expectedTotalArgument] = process.argv.slice(2);
if (!artifactArgument || !runId || !reportArgument || !expectedTotalArgument) {
  throw new Error('Usage: node scripts/update-report-checkpoint.mjs <artifact-root> <run-id> <report.html> <expected-total>');
}

const artifactRoot = resolve(artifactArgument);
const reportPath = resolve(reportArgument);
const expectedTotal = Number(expectedTotalArgument);

/** Escape dữ liệu runner trước khi chèn vào vùng checkpoint của report hiện có. */
function html(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

/** Đọc record của từng output process mà không thay đổi artifact nguồn. */
function readResults() {
  if (!existsSync(artifactRoot)) return [];
  const collected = readdirSync(artifactRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((entry) => {
    const directory = join(artifactRoot, entry.name, `run-${runId}`, 'case-results');
    const indexPath = join(directory, 'index.json');
    if (!existsSync(indexPath)) return [];
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    return (index.caseResults ?? []).map((item) => {
      const recordPath = join(directory, item.file);
      const record = existsSync(recordPath) ? JSON.parse(readFileSync(recordPath, 'utf8')) : {};
      const id = /^([A-Za-z]+(?:-[A-Za-z]+)*-\d+)/.exec(record.title ?? '')?.[1] ?? entry.name;
      return { id, title: record.title ?? entry.name, status: item.status, durationMs: record.durationMs ?? 0 };
    });
  });
  return [...new Map(collected.map((item) => [item.id, item])).values()]
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

const results = readResults();
const counts = Object.fromEntries(['PASS', 'FAIL', 'SKIP'].map((status) => [status, results.filter((item) => item.status === status).length]));
const rows = results.map((item) => `<tr><td>${html(item.id)}</td><td>${html(item.title)}</td><td>${item.status}</td><td>${(item.durationMs / 1000).toFixed(2)}s</td></tr>`).join('');
const checkpoint = `<!-- RUN-CHECKPOINT:START --><section id="current-run-checkpoint" style="margin:16px 0;padding:14px;border:1px solid #f59e0b;border-radius:10px;background:#fffbeb"><h2 style="margin-top:0">Kết quả lần chạy hiện tại</h2><p>Đã hoàn tất <strong>${results.length}/${expectedTotal}</strong> testcase — PASS ${counts.PASS}, FAIL ${counts.FAIL}, SKIP ${counts.SKIP}.</p><div class="table-wrap"><table><thead><tr><th>TC ID</th><th>Tên testcase</th><th>Trạng thái</th><th>Thời lượng</th></tr></thead><tbody>${rows}</tbody></table></div></section><!-- RUN-CHECKPOINT:END -->`;
let report = readFileSync(reportPath, 'utf8');
const markerPattern = /<!-- RUN-CHECKPOINT:START -->[\s\S]*?<!-- RUN-CHECKPOINT:END -->/;
if (markerPattern.test(report)) report = report.replace(markerPattern, checkpoint);
else report = report.replace(/(<h1[^>]*>.*?<\/h1>)/, `$1${checkpoint}`);
writeFileSync(reportPath, report, 'utf8');
console.log(`Checkpoint ${results.length}/${expectedTotal}: PASS ${counts.PASS}, FAIL ${counts.FAIL}, SKIP ${counts.SKIP}.`);
