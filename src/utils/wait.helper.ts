import { expect, type Locator, type Page } from '@playwright/test';

/** Cung cấp các smart wait dùng chung dựa trên assertion tự chờ của Playwright. */
export class WaitHelper {
  /** Chờ phần tử hiển thị trước khi luồng test tiếp tục. */
  static async untilVisible(locator: Locator): Promise<void> {
    await expect(locator, 'Element phải hiển thị trước khi tiếp tục').toBeVisible();
  }

  /** Chờ URL hiện tại khớp biểu thức chính quy mong đợi. */
  static async untilUrlMatches(page: Page, expected: RegExp): Promise<void> {
    await expect(page, `URL phải khớp ${expected}`).toHaveURL(expected);
  }
}
