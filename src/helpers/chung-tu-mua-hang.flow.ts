import { purchaseDocumentData } from '@test-data/chung-tu-mua-hang.data';
import type { PurchaseDocumentData } from '@test-data/chung-tu-mua-hang.data';
import type { ChungTuMuaHangThemMoiPage, PurchaseDocumentAutoFilledValues } from '@pages/mua-hang/chung-tu-mua-hang-them-moi.page';
import type { ChungTuMuaHangDanhSachPage } from '@pages/mua-hang/chung-tu-mua-hang-danh-sach.page';
import type { PurchaseDocumentCleanupTracker } from '@cleanup/chung-tu-mua-hang.cleanup';

/** Các hình thức Thanh toán ngay được hỗ trợ trong luồng Chứng từ mua hàng. */
export type ImmediatePaymentType = 'Tiền mặt' | 'Ủy nhiệm chi' | 'Séc tiền mặt' | 'Séc chuyển khoản';

/** Cấu hình đầu vào xác định testcase, hình thức thanh toán và tab chứng từ chi tương ứng. */
export interface ImmediatePaymentScenario {
  readonly id: 241 | 242 | 243 | 244;
  readonly type: ImmediatePaymentType;
  readonly paymentTab: string;
}

/** Kết quả luồng thanh toán ngay, gồm dữ liệu test và toàn bộ giá trị UI thực tế đã thu thập. */
export interface ImmediatePaymentExecutionResult extends PurchaseDocumentData {
  readonly actual: Readonly<{
    immediatePaymentChecked: boolean;
    paymentTab: string;
    paymentValues: string[];
    employee: string;
    item: string;
    warehouse: string;
    department: string;
    autoFilled: PurchaseDocumentAutoFilledValues;
    savedRowText: string;
    detailDocumentNumber: string;
    detailDialogText: string;
    detailItemName: string;
    detailPaymentTabVisible: boolean;
    enabledEditableFieldCount: number;
  }>;
}

/** Các Page Object và cleanup tracker cần để điều phối luồng mua hàng thanh toán ngay. */
interface ImmediatePaymentContext {
  readonly purchaseCreatePage: ChungTuMuaHangThemMoiPage;
  readonly purchaseListPage: ChungTuMuaHangDanhSachPage;
  readonly purchaseDocumentCleanup: PurchaseDocumentCleanupTracker;
}

/** Thực hiện trọn luồng tạo Chứng từ mua hàng thanh toán ngay và trả dữ liệu thực tế cho spec assertion. */
export async function executeImmediatePaymentCase(
  context: ImmediatePaymentContext,
  scenario: Readonly<ImmediatePaymentScenario>,
): Promise<ImmediatePaymentExecutionResult> {
  const { purchaseCreatePage, purchaseListPage, purchaseDocumentCleanup } = context;
  const data = purchaseDocumentData(scenario.id, true);
  if (!data.paymentDocumentNumber) throw new Error(`Thiếu số chứng từ thanh toán cho TC${scenario.id}`);

  await purchaseCreatePage.selectInvoiceStatus('Chưa có hóa đơn');
  await purchaseCreatePage.selectImmediatePayment(scenario.type);
  await purchaseCreatePage.chooseSupplier(data.supplierCode);
  const employee = await purchaseCreatePage.employeeValue();
  await purchaseCreatePage.enterDocumentNumber(data.documentNumber);
  const payment = await purchaseCreatePage.fillImmediatePayment(scenario.paymentTab, data.paymentDocumentNumber);
  const item = await purchaseCreatePage.chooseFirstItem();
  const detailSelections = await purchaseCreatePage.enterDetail(data.quantity, data.unitPrice, data.lot, data.expiry);
  const autoFilled = await purchaseCreatePage.autoFilledValues();
  const immediatePaymentChecked = await purchaseCreatePage.immediatePayment.isChecked();

  await purchaseCreatePage.save();
  await purchaseListPage.successToast.waitFor({ state: 'visible' });
  purchaseDocumentCleanup.track(
    data.documentNumber,
    scenario.type === 'Tiền mặt'
      ? { type: 'cash-payment', number: data.paymentDocumentNumber }
      : { type: 'bank-payment', number: data.paymentDocumentNumber, kind: scenario.type },
  );
  await purchaseCreatePage.dialog.waitFor({ state: 'hidden' });
  const savedRow = await purchaseListPage.findDocument(data.documentNumber);
  const savedRowText = await savedRow.innerText();
  await purchaseListPage.openDocumentDetail(data.documentNumber);

  return {
    ...data,
    actual: {
      immediatePaymentChecked,
      paymentTab: payment.tab,
      paymentValues: payment.values,
      employee,
      item,
      warehouse: detailSelections.warehouse,
      department: detailSelections.department,
      autoFilled,
      savedRowText,
      detailDocumentNumber: await purchaseListPage.detailDocumentNumber().inputValue(),
      detailDialogText: await purchaseListPage.detailDialog.innerText(),
      detailItemName: await purchaseListPage.detailItemName().inputValue(),
      detailPaymentTabVisible: await purchaseListPage.detailPaymentTab(scenario.paymentTab).isVisible(),
      enabledEditableFieldCount: await purchaseListPage.enabledEditableFields().count(),
    },
  };
}
