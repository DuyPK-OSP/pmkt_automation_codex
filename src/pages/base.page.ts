import { expect, type Locator, type Page } from '@playwright/test';
import type { Logger } from '@utils/logger';

export abstract class BasePage {
  protected constructor(protected readonly page: Page, protected readonly logger: Logger) {}

  async navigate(path: string): Promise<void> {
    this.logger.info('Điều hướng', { path });
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  protected async click(locator: Locator, action: string): Promise<void> {
    this.logger.info(action);
    await expect(locator, `${action}: element phải hiển thị`).toBeVisible();
    await expect(locator, `${action}: element phải bật`).toBeEnabled();
    await locator.click();
  }

  protected async type(locator: Locator, value: string, fieldName: string): Promise<void> {
    this.logger.info('Nhập dữ liệu', { fieldName });
    await expect(locator, `${fieldName} phải có thể nhập`).toBeEditable();
    await locator.fill(value);
  }

  protected async getText(locator: Locator): Promise<string> {
    await expect(locator).toBeVisible();
    return (await locator.textContent())?.trim() ?? '';
  }

  protected async isVisible(locator: Locator): Promise<boolean> { return locator.isVisible(); }
}
