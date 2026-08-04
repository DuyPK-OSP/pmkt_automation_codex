import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import {
  createTienGuiChiTienDanhSachLocatorMap,
  type TienGuiChiTienDanhSachLocatorMap,
} from './tien-gui-chi-tien-danh-sach.locators';

export class TienGuiChiTienDanhSachPage extends BasePage {
  readonly locators: TienGuiChiTienDanhSachLocatorMap;

  /** Khởi tạo Page Object của danh sách chứng từ Chi tiền gửi. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = createTienGuiChiTienDanhSachLocatorMap(page);
  }

  /** Mở danh sách chứng từ Chi tiền gửi và chờ bảng dữ liệu tải xong. */
  async open(): Promise<void> {
    await this.navigate('/cash-bank/phieu-chi-tien-gui');
    await this.locators.table.waitFor({ state: 'visible' });
    await this.locators.loadingSpinner.waitFor({ state: 'hidden' }).catch(() => undefined);
  }

  /** Tìm chứng từ Chi tiền gửi theo Số chứng từ và trả về dòng kết quả tương ứng. */
  async findPaymentDocument(documentNumber: string): Promise<Locator> {
    await this.locators.searchInput.fill(documentNumber);
    await this.locators.searchInput.press('Enter');
    return this.locators.paymentDocumentRow(documentNumber);
  }

}
