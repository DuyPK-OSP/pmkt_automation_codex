import { test as base, expect } from '@playwright/test';
import { DashboardPage } from '@pages/dashboard.page';
import { LoginPage } from '@pages/login.page';
import { ChungTuMuaHangPage } from '@pages/chung-tu-mua-hang.page';
import { VatTuPage } from '@pages/vat-tu.page';
import { Logger } from '@utils/logger';
import { ScreenshotUtil } from '@utils/screenshot.util';
import { MaterialCleanupTracker } from '@cleanup/vat-tu.cleanup';
import { PurchaseDocumentCleanupTracker } from '@cleanup/chung-tu-mua-hang.cleanup';
import { ChungTuMuaHangThemMoiPage } from '@pages/chung-tu-mua-hang-them-moi.page';
import { ChungTuMuaHangDanhSachPage } from '@pages/chung-tu-mua-hang-danh-sach.page';
import { PhieuNhapKhoDanhSachPage } from '@pages/phieu-nhap-kho-danh-sach.page';
import { TienMatChiTienDanhSachPage } from '@pages/tien-mat-chi-tien-danh-sach.page';
import { TienGuiChiTienDanhSachPage } from '@pages/tien-gui-chi-tien-danh-sach.page';
import { DatabaseContext } from '@database/database.context';

interface FrameworkFixtures {
  readonly db: DatabaseContext;
  readonly logger: Logger;
  readonly loginPage: LoginPage;
  readonly dashboardPage: DashboardPage;
  readonly purchaseDocumentsPage: ChungTuMuaHangPage;
  readonly vatTuPage: VatTuPage;
  readonly materialCleanup: MaterialCleanupTracker;
  readonly purchaseDocumentCleanup: PurchaseDocumentCleanupTracker;
  readonly purchaseCreatePage: ChungTuMuaHangThemMoiPage;
  readonly purchaseListPage: ChungTuMuaHangDanhSachPage;
  readonly inventoryReceiptListPage: PhieuNhapKhoDanhSachPage;
  readonly cashPaymentListPage: TienMatChiTienDanhSachPage;
  readonly paymentOrderListPage: TienGuiChiTienDanhSachPage;
}

export const test = base.extend<FrameworkFixtures>({
  db: async ({ }, use) => {
    const database = new DatabaseContext();
    await use(database);
    await database.close();
  },
  logger: async ({ }, use) => { await use(new Logger()); },
  loginPage: async ({ page, logger }, use) => { await use(new LoginPage(page, logger)); },
  dashboardPage: async ({ page, logger }, use) => { await use(new DashboardPage(page, logger)); },
  purchaseDocumentsPage: async ({ page, logger }, use) => { await use(new ChungTuMuaHangPage(page, logger)); },
  vatTuPage: async ({ page, logger }, use) => { await use(new VatTuPage(page, logger)); },
  purchaseCreatePage: async ({ page, logger }, use) => { await use(new ChungTuMuaHangThemMoiPage(page, logger)); },
  purchaseListPage: async ({ page, logger }, use) => { await use(new ChungTuMuaHangDanhSachPage(page, logger)); },
  inventoryReceiptListPage: async ({ page, logger }, use) => { await use(new PhieuNhapKhoDanhSachPage(page, logger)); },
  cashPaymentListPage: async ({ page, logger }, use) => { await use(new TienMatChiTienDanhSachPage(page, logger)); },
  paymentOrderListPage: async ({ page, logger }, use) => { await use(new TienGuiChiTienDanhSachPage(page, logger)); },
  materialCleanup: [async ({ page, vatTuPage }, use, testInfo) => {
    const tracker = new MaterialCleanupTracker(page, vatTuPage);
    await use(tracker);
    await tracker.cleanup(testInfo);
  }, { auto: true }],
  purchaseDocumentCleanup: [async ({ page, logger }, use, testInfo) => {
    const tracker = new PurchaseDocumentCleanupTracker(page, logger);
    await use(tracker);
    await tracker.cleanup(testInfo);
  }, { auto: true }],
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
