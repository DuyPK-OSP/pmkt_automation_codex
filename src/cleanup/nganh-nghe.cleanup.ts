import type { TestInfo } from '@playwright/test';
import type { NganhNghePage } from '@pages/danh-muc/nganh-nghe.page';

/** Đăng ký và cleanup các Ngành nghề có mã automation sau testcase. */
export class IndustryCleanupTracker {
  private readonly createdCodes = new Set<string>();

  /** Khởi tạo tracker cleanup với Page Object Ngành nghề. */
  constructor(private readonly industryPage: NganhNghePage) {}

  /** Đăng ký Mã ngành nghề automation cần cleanup; từ chối mã không có tiền tố AUTO_. */
  register(code: string): void {
    if (!code.startsWith('AUTO_')) throw new Error('Cleanup chỉ nhận mã automation bắt đầu bằng AUTO_.');
    this.createdCodes.add(code);
  }

  /** Thực thi teardown, ghi nhận kết quả từng bản ghi và attach JSON cleanup vào test result. */
  async cleanup(testInfo: TestInfo): Promise<void> {
    const results: Array<{ code: string; deleted: boolean; detail: string }> = [];
    for (const code of [...this.createdCodes].reverse()) {
      try {
        const deleted = await this.industryPage.deleteIfPresent(code);
        results.push({ code, deleted, detail: deleted ? 'Đã xóa qua UI' : 'Không tìm thấy trên danh sách' });
      } catch (error) {
        results.push({
          code,
          deleted: false,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (results.length > 0) {
      await testInfo.attach('test-data-cleanup', {
        body: Buffer.from(JSON.stringify(results, null, 2)),
        contentType: 'application/json',
      });
    }
  }
}
