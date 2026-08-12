import { test as base } from '@playwright/test';
import { DashboardPage } from '@pages/common/dashboard.page';
import { LoginPage } from '@pages/common/login.page';
import { ChungTuMuaHangPage } from '@pages/mua-hang/chung-tu-mua-hang.page';
import { VatTuPage } from '@pages/danh-muc/vat-tu.page';
import { Logger } from '@utils/logger';
import { ScreenshotUtil } from '@utils/screenshot.util';
import { MaterialCleanupTracker } from '@cleanup/vat-tu.cleanup';
import { PurchaseDocumentCleanupTracker } from '@cleanup/chung-tu-mua-hang.cleanup';
import { ChungTuMuaHangThemMoiPage } from '@pages/mua-hang/chung-tu-mua-hang-them-moi.page';
import { ChungTuMuaHangDanhSachPage } from '@pages/mua-hang/chung-tu-mua-hang-danh-sach.page';
import { PhieuNhapKhoDanhSachPage } from '@pages/kho/phieu-nhap-kho-danh-sach.page';
import { TienMatChiTienDanhSachPage } from '@pages/tien-mat/tien-mat-chi-tien-danh-sach.page';
import { TienGuiChiTienDanhSachPage } from '@pages/tien-gui/tien-gui-chi-tien-danh-sach.page';
import { DatabaseContext } from '@database/database.context';
import { NganhNghePage } from '@pages/danh-muc/nganh-nghe.page';
import { IndustryCleanupTracker } from '@cleanup/nganh-nghe.cleanup';
import { expect, runWithEvidenceContext } from '@utils/evidence-expect';
import { KhoPage } from '@pages/danh-muc/kho.page';
import { QuickAddCleanupRegistry } from '@cleanup/quick-add.cleanup';

/** Danh sách Page Object, logger và cleanup tracker được khởi tạo riêng cho từng testcase. */
interface FrameworkFixtures {
  readonly evidenceContext: void;
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
  readonly industryPage: NganhNghePage;
  readonly industryCleanup: IndustryCleanupTracker;
  readonly warehousePage: KhoPage;
  readonly quickAddCleanup: QuickAddCleanupRegistry;
}

/** Database context được tái sử dụng trong một worker để tránh mở pool theo từng testcase. */
interface FrameworkWorkerFixtures {
  readonly db: DatabaseContext;
}

/** Mở rộng Playwright test bằng các fixture của framework và lifecycle setup/teardown tương ứng. */
export const test = base.extend<FrameworkFixtures, FrameworkWorkerFixtures>({
  // Fixture auto bao toàn bộ testcase để expect.soft() chụp evidence ngay tại thời điểm mismatch.
  evidenceContext: [async ({ page }, use, testInfo) => {
    await runWithEvidenceContext(page, testInfo, use);
  }, { auto: true }],
  db: [async ({ }, use) => {
    const database = new DatabaseContext();
    await use(database);
    // Teardown đóng pool một lần sau khi toàn bộ testcase của worker hoàn tất truy vấn DB.
    await database.close();
  }, { scope: 'worker' }],
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
  industryPage: async ({ page, logger }, use) => { await use(new NganhNghePage(page, logger)); },
  warehousePage: async ({ page, logger }, use) => { await use(new KhoPage(page, logger)); },
  quickAddCleanup: [async ({ warehousePage, db }, use, testInfo) => {
    const registry = new QuickAddCleanupRegistry(warehousePage, db);
    await use(registry);
    await registry.cleanup(testInfo);
  }, { auto: true }],
  industryCleanup: [async ({ industryPage }, use, testInfo) => {
    const tracker = new IndustryCleanupTracker(industryPage);
    await use(tracker);
    // Cleanup chạy sau testcase, kể cả khi assertion trước đó thất bại.
    await tracker.cleanup(testInfo);
  }, { auto: true }],
  materialCleanup: [async ({ page, vatTuPage }, use, testInfo) => {
    const tracker = new MaterialCleanupTracker(page, vatTuPage);
    await use(tracker);
    // Tracker xóa các Mã vật tư AUTO_ đã bắt được từ response tạo mới thành công.
    await tracker.cleanup(testInfo);
  }, { auto: true }],
  purchaseDocumentCleanup: [async ({ page, logger }, use, testInfo) => {
    const tracker = new PurchaseDocumentCleanupTracker(page, logger);
    await use(tracker);
    // Xóa Chứng từ mua hàng rồi xác minh các chứng từ Kho/Tiền bị xóa cascade.
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
