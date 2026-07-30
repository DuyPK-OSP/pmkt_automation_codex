import { expect, type Locator, type Page } from '@playwright/test';

export class WaitHelper {
  static async untilVisible(locator: Locator): Promise<void> {
    await expect(locator, 'Element phải hiển thị trước khi tiếp tục').toBeVisible();
  }

  static async untilUrlMatches(page: Page, expected: RegExp): Promise<void> {
    await expect(page, `URL phải khớp ${expected}`).toHaveURL(expected);
  }
}
