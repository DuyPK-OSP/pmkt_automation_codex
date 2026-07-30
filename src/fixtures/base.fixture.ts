import { test as base, expect } from '@playwright/test';
import { DashboardPage } from '@pages/dashboard.page';
import { LoginPage } from '@pages/login.page';
import { ChungTuMuaHangPage } from '@pages/chung-tu-mua-hang.page';
import { VatTuPage } from '@pages/vat-tu.page';
import { Logger } from '@utils/logger';
import { ScreenshotUtil } from '@utils/screenshot.util';

interface FrameworkFixtures {
  readonly logger: Logger;
  readonly loginPage: LoginPage;
  readonly dashboardPage: DashboardPage;
  readonly purchaseDocumentsPage: ChungTuMuaHangPage;
  readonly vatTuPage: VatTuPage;
}

export const test = base.extend<FrameworkFixtures>({
  logger: async ({}, use) => { await use(new Logger()); },
  loginPage: async ({ page, logger }, use) => { await use(new LoginPage(page, logger)); },
  dashboardPage: async ({ page, logger }, use) => { await use(new DashboardPage(page, logger)); },
  purchaseDocumentsPage: async ({ page, logger }, use) => { await use(new ChungTuMuaHangPage(page, logger)); },
  vatTuPage: async ({ page, logger }, use) => { await use(new VatTuPage(page, logger)); },
});

test.afterEach(async ({ page, logger }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await ScreenshotUtil.attach(page, testInfo, 'failure-screenshot');
    await testInfo.attach('structured-log', {
      body: Buffer.from(JSON.stringify(logger.snapshot(), null, 2)),
      contentType: 'application/json',
    });
  }
});

export { expect };
