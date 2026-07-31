import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import { ChungTuMuaHangDanhSachPage } from '@pages/mua-hang/chung-tu-mua-hang-danh-sach.page';
import { PhieuNhapKhoDanhSachPage } from '@pages/kho/phieu-nhap-kho-danh-sach.page';
import { TienMatChiTienDanhSachPage } from '@pages/tien-mat/tien-mat-chi-tien-danh-sach.page';
import { TienGuiChiTienDanhSachPage } from '@pages/tien-gui/tien-gui-chi-tien-danh-sach.page';
import type { Logger } from '@utils/logger';

interface PurchaseCleanupResult {
  readonly code: string;
  readonly purchaseDocument: Readonly<{ status: 'deleted'; method: 'UI' }>;
  readonly inventoryReceipt: Readonly<{ status: 'deleted'; method: 'UI cascade from purchase document' }>;
  readonly cashPayment?: Readonly<{ code: string; status: 'deleted'; method: 'UI cascade from purchase document' }>;
  readonly bankPayment?: Readonly<{ code: string; kind: 'Ủy nhiệm chi' | 'Séc tiền mặt' | 'Séc chuyển khoản'; status: 'deleted'; method: 'UI cascade from purchase document' }>;
}

type GeneratedPaymentDocument =
  | Readonly<{ type: 'cash-payment'; number: string }>
  | Readonly<{ type: 'bank-payment'; number: string; kind: 'Ủy nhiệm chi' | 'Séc tiền mặt' | 'Séc chuyển khoản' }>;

export class PurchaseDocumentCleanupTracker {
  private readonly createdDocuments = new Map<string, GeneratedPaymentDocument | undefined>();

  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
  ) { }

  track(documentNumber: string, generatedPayment?: GeneratedPaymentDocument): void {
    if (!documentNumber.startsWith('AUTO_')) {
      throw new Error(`Từ chối cleanup chứng từ mua hàng không thuộc automation: ${documentNumber}`);
    }
    this.createdDocuments.set(documentNumber, generatedPayment);
  }

  async cleanup(testInfo: TestInfo): Promise<void> {
    const results: PurchaseCleanupResult[] = [];
    const purchasePage = new ChungTuMuaHangDanhSachPage(this.page, this.logger);
    const inventoryPage = new PhieuNhapKhoDanhSachPage(this.page, this.logger);
    const cashPaymentPage = new TienMatChiTienDanhSachPage(this.page, this.logger);
    const paymentOrderPage = new TienGuiChiTienDanhSachPage(this.page, this.logger);

    for (const [documentNumber, generatedPayment] of [...this.createdDocuments.entries()].reverse()) {
      await inventoryPage.open();
      const inventoryReceiptBeforeCleanup = await inventoryPage.findReceipt(documentNumber);
      await expect(inventoryReceiptBeforeCleanup, `Cleanup phải tìm thấy Phiếu nhập kho ${documentNumber} trước khi xóa`).toBeVisible();

      if (generatedPayment?.type === 'cash-payment') {
        await cashPaymentPage.open();
        await expect(
          await cashPaymentPage.findReceipt(generatedPayment.number),
          `Cleanup phải tìm thấy Phiếu chi ${generatedPayment.number} trước khi xóa`,
        ).toBeVisible();
      }
      if (generatedPayment?.type === 'bank-payment') {
        await paymentOrderPage.open();
        await expect(
          await paymentOrderPage.findPaymentDocument(generatedPayment.number),
          `Cleanup phải tìm thấy ${generatedPayment.kind} ${generatedPayment.number} trước khi xóa`,
        ).toBeVisible();
      }

      await purchasePage.open();
      await purchasePage.openDocumentDetail(documentNumber);
      await purchasePage.deleteOpenDocument();
      const purchaseRow = purchasePage.documentRow(documentNumber);
      await expect(purchaseRow, `Cleanup phải xóa chứng từ ${documentNumber} khỏi UI`).toBeHidden();

      await inventoryPage.open();
      const inventoryReceiptAfterCleanup = await inventoryPage.findReceipt(documentNumber);
      await expect(inventoryReceiptAfterCleanup, `Cleanup phải xóa cascade Phiếu nhập kho ${documentNumber} khỏi UI`).toBeHidden();

      if (generatedPayment?.type === 'cash-payment') {
        await cashPaymentPage.open();
        await expect(
          await cashPaymentPage.findReceipt(generatedPayment.number),
          `Cleanup phải xóa cascade Phiếu chi ${generatedPayment.number} khỏi UI`,
        ).toBeHidden();
      }
      if (generatedPayment?.type === 'bank-payment') {
        await paymentOrderPage.open();
        await expect(
          await paymentOrderPage.findPaymentDocument(generatedPayment.number),
          `Cleanup phải xóa cascade ${generatedPayment.kind} ${generatedPayment.number} khỏi UI`,
        ).toBeHidden();
      }

      results.push({
        code: documentNumber,
        purchaseDocument: { status: 'deleted', method: 'UI' },
        inventoryReceipt: { status: 'deleted', method: 'UI cascade from purchase document' },
        ...(generatedPayment?.type === 'cash-payment'
          ? { cashPayment: { code: generatedPayment.number, status: 'deleted' as const, method: 'UI cascade from purchase document' as const } }
          : {}),
        ...(generatedPayment?.type === 'bank-payment'
          ? { bankPayment: { code: generatedPayment.number, kind: generatedPayment.kind, status: 'deleted' as const, method: 'UI cascade from purchase document' as const } }
          : {}),
      });
    }

    if (results.length > 0) {
      await testInfo.attach('test-data-cleanup', {
        body: Buffer.from(JSON.stringify(results, null, 2)),
        contentType: 'application/json',
      });
    }
  }
}
