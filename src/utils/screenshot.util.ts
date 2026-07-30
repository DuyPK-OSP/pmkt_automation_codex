import type { Page, TestInfo } from '@playwright/test';

export class ScreenshotUtil {
  static async attach(page: Page, testInfo: TestInfo, name: string): Promise<void> {
    const body = await page.screenshot({ fullPage: true });
    await testInfo.attach(name, { body, contentType: 'image/png' });
  }
}
