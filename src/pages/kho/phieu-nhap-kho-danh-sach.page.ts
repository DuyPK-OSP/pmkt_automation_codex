import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import {
  createPhieuNhapKhoDanhSachLocatorMap,
  type PhieuNhapKhoDanhSachLocatorMap,
} from './phieu-nhap-kho-danh-sach.locators';

export class PhieuNhapKhoDanhSachPage extends BasePage {
  readonly locators: PhieuNhapKhoDanhSachLocatorMap;

  /** Khởi tạo Page Object của danh sách Phiếu nhập kho. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = createPhieuNhapKhoDanhSachLocatorMap(page);
  }

  /** Mở danh sách Phiếu nhập kho và chờ bảng dữ liệu tải xong. */
  async open(): Promise<void> {
    await this.navigate('/kho/nhap-kho');
    await this.locators.table.waitFor({ state: 'visible' });
    await this.locators.loadingSpinner.waitFor({ state: 'hidden' }).catch(() => undefined);
  }

  /** Tìm Phiếu nhập kho theo Số chứng từ và trả về dòng kết quả tương ứng. */
  async findReceipt(documentNumber: string): Promise<Locator> {
    await this.locators.searchInput.fill(documentNumber);
    await this.locators.searchInput.press('Enter');
    return this.locators.receiptRow(documentNumber);
  }
}
