import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';

export class PhieuNhapKhoDanhSachPage extends BasePage {
  /** Khởi tạo Page Object của danh sách Phiếu nhập kho. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
  }

  /** Mở danh sách Phiếu nhập kho và chờ bảng dữ liệu tải xong. */
  async open(): Promise<void> {
    await this.navigate('/kho/nhap-kho');
    await this.page.getByRole('table').waitFor({ state: 'visible' });
    await this.page.locator('.ant-spin-spinning').waitFor({ state: 'hidden' }).catch(() => undefined);
  }

  /** Tìm Phiếu nhập kho theo Số chứng từ và trả về dòng kết quả tương ứng. */
  async findReceipt(documentNumber: string): Promise<Locator> {
    const search = this.page.getByRole('textbox', { name: 'Tìm kiếm...' });
    await search.fill(documentNumber);
    await search.press('Enter');
    return this.page.getByRole('row').filter({ hasText: documentNumber });
  }
}
