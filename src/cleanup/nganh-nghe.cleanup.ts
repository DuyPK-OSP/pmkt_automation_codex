import type { TestInfo } from '@playwright/test';
import type { NganhNghePage } from '@pages/danh-muc/nganh-nghe.page';

export class IndustryCleanupTracker {
  private readonly createdCodes = new Set<string>();

  constructor(private readonly industryPage: NganhNghePage) {}

  register(code: string): void {
    if (!code.startsWith('AUTO_')) throw new Error('Cleanup chỉ nhận mã automation bắt đầu bằng AUTO_.');
    this.createdCodes.add(code);
  }

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
