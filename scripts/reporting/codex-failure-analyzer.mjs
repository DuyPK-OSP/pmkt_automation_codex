import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const schema = resolve(root, 'scripts/reporting/failure-analysis.schema.json');

/** Phân tích failure bằng Codex non-interactive và chỉ cho phép đọc workspace. */
export function analyzeFailure(packet, outputPath) {
  const prompt = `Bạn là Codex Analyzer trong pipeline QA PMKT. Không sửa file và không thay đổi dữ liệu ứng dụng.
Không mặc định FAIL là Product Bug. Phân loại đúng một trong Product Bug, Automation Bug, Test Data, Environment, Unknown.
Trong workflow Chạy và report, spec đang chạy là contract thực thi. Phải tuân thủ nguyên văn flow, assertion và Expected trong spec; không audit, bắt bẻ hoặc đánh giá spec có lệch manual testcase hay không.
Không được phân loại Automation Bug với lý do assertion trong spec "quá chặt", khác casing, ngoài phạm vi manual testcase hoặc Expected chưa hợp lý. Khi assertion của spec đã chạy đúng đối tượng và Actual khác Expected thì phải xem xét Product Bug.
Chỉ phân loại Automation Bug khi lỗi kỹ thuật của automation làm testcase chưa thực thi/đánh giá được contract trong spec, ví dụ locator sai/không ổn định, wait sai, setup/teardown hỏng hoặc mock không tạo được trạng thái mà chính spec yêu cầu.
Expected/Actual chỉ lấy từ evidence; nếu root cause là suy luận phải đặt rootCauseConfidence=inferred.
Đọc spec liên quan ở chế độ read-only để trả đúng preconditions, steps và testData; không dùng manual testcase để phủ định hoặc sửa nghĩa spec, không dùng mô tả chung chung và không tự bịa dữ liệu còn thiếu.
Chỉ dùng DevTools MCP để kiểm tra DOM, Console, Network, API hoặc trạng thái ứng dụng khi evidence ban đầu chưa đủ; mọi kiểm tra phải read-only.
deduplicationKey phải mô tả root cause ổn định, không chứa testcase ID. isProductBug chỉ true khi classification=Product Bug.
Nếu packet.existingBugsForTestcase có bug cũ, phải đối chiếu failure hiện tại với Expected/Actual/root cause cũ. Chỉ điền matchesExistingBugId khi cùng bug; existingBugStillPresent=yes khi tái hiện, no khi evidence xác nhận đã hết, unknown khi testcase không đủ tin cậy.
Failure packet:\n${JSON.stringify(packet)}`;
  const command = process.platform === 'win32' ? 'codex.cmd' : 'codex';
  const images = (packet.attachments ?? []).filter((item) => item.contentType === 'image/png' && item.path && existsSync(resolve(root, item.path))).slice(0, 3);
  const imageArguments = images.flatMap((item) => ['--image', resolve(root, item.path)]);
  // Xóa kết quả cũ để không nhận nhầm fallback của lần chạy trước là phân tích mới.
  if (existsSync(outputPath)) unlinkSync(outputPath);
  const result = spawnSync(command, ['exec', '--ephemeral', '--sandbox', 'read-only', ...imageArguments, '--output-schema', schema, '--output-last-message', outputPath, '-'], {
    cwd: root,
    input: prompt,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
    // Windows cần command shell để thực thi shim codex.cmd từ Node child_process.
    shell: process.platform === 'win32',
  });
  if (result.status !== 0 || !existsSync(outputPath)) {
    const fallback = {
      classification: 'Unknown', summary: 'Codex Analyzer không trả về kết quả hợp lệ.',
      preconditions: 'Chưa trích xuất được', steps: 'Chưa trích xuất được', testData: 'Chưa trích xuất được',
      expected: packet.errors?.[0]?.expected ?? 'Chưa trích xuất được', actual: packet.errors?.[0]?.actual ?? 'Chưa trích xuất được',
      rootCause: `Analyzer không khả dụng (exit=${result.status ?? 'null'}${result.error ? `, ${result.error.message}` : ''}).`, rootCauseConfidence: 'unknown',
      severity: 'Không áp dụng', isProductBug: false, deduplicationKey: 'unknown', matchesExistingBugId: '', existingBugStillPresent: 'unknown',
    };
    writeFileSync(outputPath, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
  return JSON.parse(readFileSync(outputPath, 'utf8'));
}
