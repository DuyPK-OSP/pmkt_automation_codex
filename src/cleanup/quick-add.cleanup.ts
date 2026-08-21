import { expect, type TestInfo } from '@playwright/test';
import type { KhoPage } from '@pages/danh-muc/kho.page';
import type { DonViTinhPage } from '@pages/danh-muc/don-vi-tinh.page';
import type { DatabaseContext } from '@database/database.context';
import { requireCredentials } from '@utils/env.config';

export type QuickAddCatalogue = 'warehouse' | 'unit';

interface QuickAddRecord {
  readonly catalogue: QuickAddCatalogue;
  readonly code: string;
}

/** Registry chỉ dành cho dữ liệu được tạo thành công từ popup Thêm nhanh của dropdown/combogrid. */
export class QuickAddCleanupRegistry {
  private readonly records: QuickAddRecord[] = [];

  constructor(
    private readonly warehousePage: KhoPage,
    private readonly unitPage: DonViTinhPage,
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
        const credentials = requireCredentials();
        if (record.catalogue === 'warehouse') await this.warehousePage.deleteByCode(record.code);
        else await this.unitPage.deleteByCode(record.code);
        await expect.poll(
          () => record.catalogue === 'warehouse'
            ? this.db.kho.findByCodeForDefaultTenant(credentials.username, record.code)
            : this.db.donViTinh.findByCodeForDefaultTenant(credentials.username, record.code),
          { message: `${record.catalogue} ${record.code} phải được xóa khỏi DB sau cleanup UI`, timeout: 15_000 },
        ).toBeNull();
        results.push({ ...record, status: 'deleted', detail: `Đã xóa qua màn Danh mục ${record.catalogue === 'warehouse' ? 'Kho' : 'Đơn vị tính'}` });
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
