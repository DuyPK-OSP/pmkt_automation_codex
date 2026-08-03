import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';

export class TienGuiChiTienDanhSachPage extends BasePage {
  /** Khởi tạo Page Object của danh sách chứng từ Chi tiền gửi. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
  }

  /** Mở danh sách chứng từ Chi tiền gửi và chờ bảng dữ liệu tải xong. */
  async open(): Promise<void> {
    await this.navigate('/cash-bank/phieu-chi-tien-gui');
    await this.page.getByRole('table').waitFor({ state: 'visible' });
    await this.page.locator('.ant-spin-spinning').waitFor({ state: 'hidden' }).catch(() => undefined);
  }

  /** Tìm chứng từ Chi tiền gửi theo Số chứng từ và trả về dòng kết quả tương ứng. */
  async findPaymentDocument(documentNumber: string): Promise<Locator> {
    const search = this.page.getByRole('textbox', { name: 'Nhập từ khóa tìm kiếm…' });
    await search.fill(documentNumber);
    await search.press('Enter');
    return this.page.getByRole('row').filter({ hasText: documentNumber });
  }

}
