import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import {
  createNganhNgheLocatorMap,
  type NganhNgheLocatorMap,
} from './nganh-nghe.locators';
import type { Logger } from '@utils/logger';

export interface IndustryInput {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
}

export class NganhNghePage extends BasePage {
  readonly locators: NganhNgheLocatorMap;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = createNganhNgheLocatorMap(page);
  }

  async openFromCatalogue(): Promise<void> {
    await this.click(this.locators.industryEntry, 'Mở danh mục Ngành nghề');
    await expect(this.page).toHaveURL(/\/master-data\/nganh-nghe$/);
    await expect(this.locators.addButton).toBeVisible();
  }

  async openCreateDialog(): Promise<void> {
    await this.click(this.locators.addButton, 'Mở popup Thêm mới ngành nghề');
    await expect(this.locators.createDialog).toBeVisible();
  }

  async fillIndustry(data: IndustryInput): Promise<void> {
    await this.type(this.locators.codeInput, data.code, 'Mã ngành nghề');
    await this.type(this.locators.nameInput, data.name, 'Tên ngành nghề');
    if (data.description !== undefined) {
      await this.type(this.locators.descriptionInput, data.description, 'Diễn giải');
    }
  }

  async save(): Promise<void> {
    await this.click(this.locators.saveButton, 'Lưu ngành nghề');
  }

  async saveAndContinue(): Promise<void> {
    await this.click(this.locators.saveAndContinueButton, 'Lưu ngành nghề và tiếp tục');
  }

  industryRow(code: string): Locator {
    return this.locators.row(code);
  }

  async deleteIfPresent(code: string): Promise<boolean> {
    if (await this.locators.createDialog.isVisible()) {
      await this.click(this.locators.closeButton, 'Đóng popup thêm mới trước khi cleanup');
      if (await this.locators.createDialog.isVisible()) {
        this.logger.info('Popup reset không đóng bằng nút Close, reload danh sách để cleanup');
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
      await expect(this.locators.createDialog).toBeHidden();
    }
    const row = this.industryRow(code);
    await expect(row, `Bản ghi ${code} phải xuất hiện để cleanup`).toBeVisible();
    await row.getByRole('button').last().click();
    const confirmation = this.page.getByRole('dialog').filter({ hasText: /xóa/i }).last();
    await expect(confirmation, `Popup xác nhận xóa ${code} phải hiển thị`).toBeVisible();
    await confirmation.getByRole('button', { name: /xác nhận|xóa/i }).last().click();
    await expect(row).toBeHidden();
    return true;
  }
}
