import { expect, type Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import { KhoLocators } from './kho.locators';
import type { Logger } from '@utils/logger';

/** Màn Danh mục Kho dùng riêng cho teardown dữ liệu được tạo bằng Thêm nhanh. */
export class KhoPage extends BasePage {
  readonly locators: KhoLocators;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = new KhoLocators(page);
  }

  /** Chuyển tới trang Danh mục và mở màn Kho bằng nút semantic đã inspect. */
  async openFromCatalogue(): Promise<void> {
    await this.navigate('/danh-muc');
    await this.click(this.locators.catalogueEntry(), 'Mở Danh mục Kho');
    await expect(this.page).toHaveURL(/\/danh-muc\/kho$/);
    await expect(this.locators.searchInput()).toBeVisible();
  }

  /** Tìm chính xác mã đã đăng ký và xóa bản ghi qua UI. */
  async deleteByCode(code: string): Promise<boolean> {
    await this.openFromCatalogue();
    await this.type(this.locators.searchInput(), code, 'Tìm Kho cần cleanup theo mã');
    const row = this.locators.row(code);
    await expect(row, `Kho ${code} phải xuất hiện để cleanup`).toBeVisible();
    await expect(async () => {
      if (!await this.locators.deleteConfirmation().isVisible()) {
        await this.locators.deleteButton(code).hover();
        await this.click(this.locators.deleteButton(code), `Xóa Kho ${code}`);
      }
      await expect(this.locators.deleteConfirmation(), `Popup xác nhận xóa Kho ${code} phải hiển thị`).toBeVisible();
    }).toPass({ timeout: 12_000 });
    await this.click(this.locators.confirmDeleteButton(), `Xác nhận xóa Kho ${code}`);
    await expect(row).toBeHidden();
    return true;
  }
}
