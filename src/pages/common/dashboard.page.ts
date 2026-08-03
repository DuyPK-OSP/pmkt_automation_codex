import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { Logger } from '@utils/logger';

export class DashboardPage extends BasePage {
  readonly navigation: Locator;

  /** Khởi tạo Page Object và locator điều hướng chính của Dashboard. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.navigation = page.getByRole('navigation').first();
  }

  /** Trả về true khi thanh điều hướng Dashboard đã hiển thị. */
  async isLoaded(): Promise<boolean> { return this.isVisible(this.navigation); }
}
