import { expect, type Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import { DonViTinhLocators } from './don-vi-tinh.locators';

/** Hành vi UI tối thiểu của Danh mục Đơn vị tính phục vụ teardown theo mã AUTO_. */
export class DonViTinhPage extends BasePage {
  readonly locators: DonViTinhLocators;
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = new DonViTinhLocators(page);
  }
  async openFromDanhMuc(): Promise<void> {
    await this.navigate('/danh-muc');
    await this.locators.catalogueEntry().click();
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/don-vi-tinh');
    await this.locators.searchInput().waitFor({ state: 'visible' });
  }
  async deleteByCode(code: string): Promise<void> {
    await this.openFromDanhMuc();
    await this.locators.searchInput().fill(code);
    await this.locators.searchInput().press('Enter');
    await expect(this.locators.row(code)).toBeVisible();
    await this.locators.deleteButton(code).click();
    await expect(this.locators.deleteConfirmation()).toBeVisible();
    await this.locators.confirmDeleteButton().click();
    await expect(this.locators.row(code)).toBeHidden();
  }
}
