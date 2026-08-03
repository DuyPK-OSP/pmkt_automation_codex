import type { Locator, Page, TestInfo } from '@playwright/test';

/** Chụp và attach screenshot vào kết quả Playwright. */
export class ScreenshotUtil {
  /** Chụp toàn trang và attach ảnh PNG với tên evidence được truyền vào. */
  static async attach(page: Page, testInfo: TestInfo, name: string): Promise<void> {
    const body = await page.screenshot({ fullPage: true });
    await testInfo.attach(name, { body, contentType: 'image/png' });
  }

  /** Chụp riêng vùng locator và attach ảnh PNG vào test result. */
  static async attachLocator(locator: Locator, testInfo: TestInfo, name: string): Promise<void> {
    const body = await locator.screenshot();
    await testInfo.attach(name, { body, contentType: 'image/png' });
  }
}
