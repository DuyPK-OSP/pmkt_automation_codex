import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import {
  createTienMatChiTienDanhSachLocatorMap,
  type TienMatChiTienDanhSachLocatorMap,
} from './tien-mat-chi-tien-danh-sach.locators';

export class TienMatChiTienDanhSachPage extends BasePage {
  readonly locators: TienMatChiTienDanhSachLocatorMap;

  /** Khởi tạo Page Object của danh sách Phiếu chi tiền mặt. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = createTienMatChiTienDanhSachLocatorMap(page);
  }

  /** Mở danh sách Phiếu chi tiền mặt và chờ bảng dữ liệu tải xong. */
  async open(): Promise<void> {
    await this.navigate('/cash-bank/phieu-chi');
    await this.locators.table.waitFor({ state: 'visible' });
    await this.locators.loadingSpinner.waitFor({ state: 'hidden' }).catch(() => undefined);
  }

  /** Tìm Phiếu chi theo Số chứng từ và trả về dòng kết quả tương ứng. */
  async findReceipt(documentNumber: string): Promise<Locator> {
    await this.locators.searchInput.fill(documentNumber);
    await this.locators.searchInput.press('Enter');
    return this.locators.receiptRow(documentNumber);
  }
}
