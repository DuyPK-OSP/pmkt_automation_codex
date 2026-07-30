import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { Logger } from '@utils/logger';

export class DashboardPage extends BasePage {
  readonly navigation: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.navigation = page.getByRole('navigation').first();
  }

  async isLoaded(): Promise<boolean> { return this.isVisible(this.navigation); }
}
