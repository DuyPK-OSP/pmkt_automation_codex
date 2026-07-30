import type { Locator, Page, TestInfo } from '@playwright/test';

export class ScreenshotUtil {
  static async attach(page: Page, testInfo: TestInfo, name: string): Promise<void> {
    const body = await page.screenshot({ fullPage: true });
    await testInfo.attach(name, { body, contentType: 'image/png' });
  }

  static async attachLocator(locator: Locator, testInfo: TestInfo, name: string): Promise<void> {
    const body = await locator.screenshot();
    await testInfo.attach(name, { body, contentType: 'image/png' });
  }
}
