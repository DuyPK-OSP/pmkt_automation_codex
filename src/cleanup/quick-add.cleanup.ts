import { expect, type TestInfo } from '@playwright/test';
import type { KhoPage } from '@pages/danh-muc/kho.page';
import type { DatabaseContext } from '@database/database.context';
import { requireCredentials } from '@utils/env.config';

export type QuickAddCatalogue = 'warehouse';

interface QuickAddRecord {
  readonly catalogue: QuickAddCatalogue;
  readonly code: string;
}

/** Registry chỉ dành cho dữ liệu được tạo thành công từ popup Thêm nhanh của dropdown/combogrid. */
export class QuickAddCleanupRegistry {
  private readonly records: QuickAddRecord[] = [];

  constructor(
    private readonly warehousePage: KhoPage,
    private readonly db: DatabaseContext,
  ) {}

  /** Đăng ký đúng một mã AUTO_ sau khi Thêm nhanh và kiểm tra DB thành công. */
  register(catalogue: QuickAddCatalogue, code: string): void {
    if (!code.startsWith('AUTO_')) throw new Error('Quick Add cleanup chỉ nhận mã bắt đầu bằng AUTO_.');
    this.records.push({ catalogue, code });
  }

  /** Cleanup các bản ghi Thêm nhanh qua UI và attach kết quả riêng. */
  async cleanup(testInfo: TestInfo): Promise<void> {
    const results: Array<{ catalogue: QuickAddCatalogue; code: string; status: 'deleted' | 'failed'; detail: string }> = [];
    for (const record of [...this.records].reverse()) {
      try {
        await this.warehousePage.deleteByCode(record.code);
        const credentials = requireCredentials();
        await expect.poll(
          () => this.db.kho.findByCodeForDefaultTenant(credentials.username, record.code),
          { message: `Kho ${record.code} phải được xóa khỏi DB sau cleanup UI`, timeout: 15_000 },
        ).toBeNull();
        results.push({ ...record, status: 'deleted', detail: 'Đã tìm và xóa qua màn Danh mục Kho' });
      } catch (error) {
        results.push({
          ...record,
          status: 'failed',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (results.length > 0) {
      await testInfo.attach('quick-add-test-data-cleanup', {
        body: Buffer.from(JSON.stringify(results, null, 2)),
        contentType: 'application/json',
      });
    }
    const failures = results.filter(({ status }) => status === 'failed');
    if (failures.length > 0) {
      throw new Error(`Quick Add cleanup thất bại: ${failures.map(({ code, detail }) => `${code}: ${detail}`).join('; ')}`);
    }
  }
}
