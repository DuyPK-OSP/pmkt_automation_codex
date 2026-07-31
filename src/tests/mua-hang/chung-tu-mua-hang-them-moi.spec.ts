import { test, expect } from '@fixtures/base.fixture';
import { requireCredentials } from '@utils/env.config';
import { purchaseDocumentData } from '@test-data/chung-tu-mua-hang.data';
import { executeImmediatePaymentCase } from '@helpers/chung-tu-mua-hang.flow';
import type { ImmediatePaymentExecutionResult, ImmediatePaymentScenario } from '@helpers/chung-tu-mua-hang.flow';

function assertImmediatePaymentResult(
  result: Readonly<ImmediatePaymentExecutionResult>,
  scenario: Readonly<ImmediatePaymentScenario>,
): void {
  const { actual } = result;
  expect(actual.immediatePaymentChecked, 'Thanh toán ngay phải được chọn').toBe(true);
  expect(actual.paymentTab).toBe(scenario.paymentTab);
  expect(actual.paymentValues.length, `Tab ${scenario.paymentTab} phải có dữ liệu tài khoản/NCC hợp lệ`).toBeGreaterThan(0);
  expect(actual.autoFilled.supplierName, 'Tên NCC phải được autofill').not.toBe('');
  expect(actual.autoFilled.deliveryPerson, 'Người giao hàng phải được autofill').not.toBe('');
  expect(actual.autoFilled.address, 'Địa chỉ phải được autofill').not.toBe('');
  expect(actual.autoFilled.description, 'Diễn giải phải được autofill').not.toBe('');
  expect(actual.employee, 'Nhân viên mua hàng phải được autofill').not.toBe('');
  expect(actual.item, 'Phải chọn được vật tư hợp lệ đầu tiên').not.toBe('');
  expect(actual.warehouse, 'Phải chọn được kho hợp lệ đầu tiên').not.toBe('');
  expect(actual.department, 'Phải chọn được đơn vị hợp lệ đầu tiên').not.toBe('');
  expect(Number(actual.autoFilled.amount.replace(/\./g, ''))).toBe(Number(result.quantity) * Number(result.unitPrice));
  expect(actual.savedRowText).toContain('Chưa ghi sổ');
  expect(actual.detailDocumentNumber).toBe(result.documentNumber);
  expect(actual.detailDialogText).toContain(actual.autoFilled.supplierName);
  expect(actual.detailItemName).toBe(actual.autoFilled.itemName);
  expect(actual.detailPaymentTabVisible).toBe(true);
  expect(actual.enabledEditableFieldCount).toBe(0);
}

test.describe('PMKT-U-00502 - Thêm mới chứng từ mua hàng', () => {
  test.beforeEach(async ({ loginPage, purchaseCreatePage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
    await purchaseCreatePage.open();
  });

  test('CL-UAT-U-00502-240 - Mua hàng nhập kho trong nước, không có hóa đơn, chưa thanh toán', async ({
    purchaseCreatePage,
    purchaseListPage,
    inventoryReceiptListPage,
    purchaseDocumentCleanup,
  }) => {
    const data = purchaseDocumentData(240);

    await expect(purchaseCreatePage.businessType).toContainText('Mua hàng nhập kho');
    await expect(purchaseCreatePage.purchaseMethod).toContainText('Trong nước');
    await expect(purchaseCreatePage.immediatePayment).not.toBeChecked();
    await expect(
      purchaseCreatePage.invoiceStatusOptions(),
      'UI phải có lựa chọn “Chưa có hóa đơn” theo xác nhận nghiệp vụ',
    ).resolves.toContain('Chưa có hóa đơn');
    await purchaseCreatePage.selectInvoiceStatus('Chưa có hóa đơn');

    await purchaseCreatePage.chooseSupplier(data.supplierCode);
    const employee = await purchaseCreatePage.employeeValue();
    const paymentTerm = await purchaseCreatePage.paymentTermValue();
    await purchaseCreatePage.enterDocumentNumber(data.documentNumber);
    const item = await purchaseCreatePage.chooseFirstItem();
    const detailSelections = await purchaseCreatePage.enterDetail(data.quantity, data.unitPrice, data.lot, data.expiry);
    const autoFilled = await purchaseCreatePage.autoFilledValues();

    expect(autoFilled.supplierName, 'Tên NCC phải được autofill từ Mã NCC').not.toBe('');
    expect(autoFilled.deliveryPerson, 'Người giao hàng phải được autofill từ Mã NCC').not.toBe('');
    expect(autoFilled.address, 'Địa chỉ phải được autofill từ Mã NCC').not.toBe('');
    expect(autoFilled.description, 'Diễn giải phải được autofill từ Mã NCC').not.toBe('');
    expect(employee, 'Nhân viên mua hàng phải được autofill từ Mã NCC').not.toBe('');
    expect(paymentTerm, 'Điều khoản thanh toán phải được autofill từ Mã NCC').not.toBe('');
    expect(item, 'Phải chọn được vật tư hợp lệ đầu tiên').not.toBe('');
    expect(detailSelections.warehouse, 'Phải chọn được kho hợp lệ đầu tiên').not.toBe('');
    expect(detailSelections.warehouse, 'Kho phải có giá trị thực, không được giữ placeholder').not.toBe('Kho');
    expect(detailSelections.department, 'Phải chọn được đơn vị hợp lệ đầu tiên').not.toBe('');
    expect(detailSelections.department, 'Đơn vị phải có giá trị thực, không được giữ placeholder').not.toBe('Đơn vị');
    expect(autoFilled.itemName, 'Tên hàng phải được autofill từ Mã hàng').not.toBe('');
    expect(autoFilled.inventoryAccount, 'TK Kho phải được autofill từ vật tư').not.toBe('');
    expect(autoFilled.payableAccount, 'TK công nợ phải được autofill').not.toBe('');
    expect(autoFilled.unit, 'ĐVT phải được autofill từ vật tư').not.toBe('');
    expect(Number(autoFilled.amount.replace(/\./g, '')), 'Thành tiền phải bằng Số lượng × Đơn giá')
      .toBe(Number(data.quantity) * Number(data.unitPrice));
    await expect(purchaseCreatePage.currency).toContainText('VND');
    await expect(purchaseCreatePage.discountType).toContainText('Không chiết khấu');

    await purchaseCreatePage.save();
    await expect(purchaseListPage.successToast).toBeVisible();
    purchaseDocumentCleanup.track(data.documentNumber);
    await expect(purchaseCreatePage.dialog).toBeHidden();

    const savedRow = await purchaseListPage.findDocument(data.documentNumber);
    await expect(savedRow).toContainText('Chưa ghi sổ');
    await purchaseListPage.openDocumentDetail(data.documentNumber);
    await expect(purchaseListPage.detailDocumentNumber()).toHaveValue(data.documentNumber);
    await expect(purchaseListPage.detailDialog).toContainText(autoFilled.supplierName);
    await expect(purchaseListPage.detailItemName()).toHaveValue(autoFilled.itemName);
    await expect(purchaseListPage.enabledEditableFields()).toHaveCount(0);

    await inventoryReceiptListPage.open();
    const inventoryReceipt = await inventoryReceiptListPage.findReceipt(data.documentNumber);
    await expect(inventoryReceipt, 'Phải sinh Phiếu nhập kho tương ứng với chứng từ mua hàng').toBeVisible();
    await expect(inventoryReceipt, 'Phiếu nhập kho phải có Lý do nhập = Nhập mua').toContainText('Nhập mua');
    await expect(inventoryReceipt, 'Phiếu nhập kho phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');
  });

  test('CL-UAT-U-00502-241 - Mua hàng nhập kho trong nước, thanh toán ngay bằng Tiền mặt', async ({
    purchaseCreatePage,
    purchaseListPage,
    inventoryReceiptListPage,
    cashPaymentListPage,
    purchaseDocumentCleanup,
  }) => {
    const scenario = { id: 241, type: 'Tiền mặt', paymentTab: 'Phiếu chi' } as const;
    const data = await executeImmediatePaymentCase(
      { purchaseCreatePage, purchaseListPage, purchaseDocumentCleanup },
      scenario,
    );
    assertImmediatePaymentResult(data, scenario);
    if (!data.paymentDocumentNumber) throw new Error('Thiếu số chứng từ Phiếu chi cho TC241');

    await inventoryReceiptListPage.open();
    const inventoryReceipt = await inventoryReceiptListPage.findReceipt(data.documentNumber);
    await expect(inventoryReceipt, 'Phải sinh Phiếu nhập kho tương ứng').toBeVisible();
    await expect(inventoryReceipt, 'Lý do nhập phải là Nhập mua').toContainText('Nhập mua');
    await expect(inventoryReceipt, 'Phiếu nhập kho phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');

    await cashPaymentListPage.open();
    const cashPayment = await cashPaymentListPage.findReceipt(data.paymentDocumentNumber);
    await expect(cashPayment, 'Tiền mặt > Chi tiền phải sinh Phiếu chi tương ứng').toBeVisible();
    await expect(cashPayment, 'Phiếu chi phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');
  });

  test('CL-UAT-U-00502-242 - Mua hàng nhập kho trong nước, thanh toán ngay bằng Ủy nhiệm chi', async ({
    purchaseCreatePage,
    purchaseListPage,
    inventoryReceiptListPage,
    paymentOrderListPage,
    purchaseDocumentCleanup,
  }) => {
    const scenario = { id: 242, type: 'Ủy nhiệm chi', paymentTab: 'Ủy nhiệm chi' } as const;
    const data = await executeImmediatePaymentCase(
      { purchaseCreatePage, purchaseListPage, purchaseDocumentCleanup },
      scenario,
    );
    assertImmediatePaymentResult(data, scenario);
    if (!data.paymentDocumentNumber) throw new Error('Thiếu số chứng từ Ủy nhiệm chi cho TC242');

    await inventoryReceiptListPage.open();
    const inventoryReceipt = await inventoryReceiptListPage.findReceipt(data.documentNumber);
    await expect(inventoryReceipt, 'Phải sinh Phiếu nhập kho tương ứng').toBeVisible();
    await expect(inventoryReceipt, 'Lý do nhập phải là Nhập mua').toContainText('Nhập mua');
    await expect(inventoryReceipt, 'Phiếu nhập kho phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');

    await paymentOrderListPage.open();
    const paymentOrder = await paymentOrderListPage.findPaymentDocument(data.paymentDocumentNumber);
    await expect(paymentOrder, 'Tiền gửi > Chi tiền phải sinh Ủy nhiệm chi tương ứng').toBeVisible();
    await expect(paymentOrder, 'Ủy nhiệm chi phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');
  });

  test('CL-UAT-U-00502-243 - Mua hàng nhập kho trong nước, thanh toán ngay bằng Séc tiền mặt', async ({
    purchaseCreatePage,
    purchaseListPage,
    inventoryReceiptListPage,
    paymentOrderListPage,
    purchaseDocumentCleanup,
  }) => {
    const scenario = { id: 243, type: 'Séc tiền mặt', paymentTab: 'Séc tiền mặt' } as const;
    const data = await executeImmediatePaymentCase(
      { purchaseCreatePage, purchaseListPage, purchaseDocumentCleanup },
      scenario,
    );
    assertImmediatePaymentResult(data, scenario);
    if (!data.paymentDocumentNumber) throw new Error('Thiếu số chứng từ Séc tiền mặt cho TC243');

    await inventoryReceiptListPage.open();
    const inventoryReceipt = await inventoryReceiptListPage.findReceipt(data.documentNumber);
    await expect(inventoryReceipt, 'Phải sinh Phiếu nhập kho tương ứng').toBeVisible();
    await expect(inventoryReceipt, 'Lý do nhập phải là Nhập mua').toContainText('Nhập mua');
    await expect(inventoryReceipt, 'Phiếu nhập kho phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');

    await paymentOrderListPage.open();
    const cashCheck = await paymentOrderListPage.findPaymentDocument(data.paymentDocumentNumber);
    await expect(cashCheck, 'Tiền gửi > Chi tiền phải sinh Séc tiền mặt tương ứng').toBeVisible();
    await expect(cashCheck, 'Séc tiền mặt phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');
  });

  test('CL-UAT-U-00502-244 - Mua hàng nhập kho trong nước, thanh toán ngay bằng Séc chuyển khoản', async ({
    purchaseCreatePage,
    purchaseListPage,
    inventoryReceiptListPage,
    paymentOrderListPage,
    purchaseDocumentCleanup,
  }) => {
    const scenario = { id: 244, type: 'Séc chuyển khoản', paymentTab: 'Séc chuyển khoản' } as const;
    const data = await executeImmediatePaymentCase(
      { purchaseCreatePage, purchaseListPage, purchaseDocumentCleanup },
      scenario,
    );
    assertImmediatePaymentResult(data, scenario);
    if (!data.paymentDocumentNumber) throw new Error('Thiếu số chứng từ Séc chuyển khoản cho TC244');

    await inventoryReceiptListPage.open();
    const inventoryReceipt = await inventoryReceiptListPage.findReceipt(data.documentNumber);
    await expect(inventoryReceipt, 'Phải sinh Phiếu nhập kho tương ứng').toBeVisible();
    await expect(inventoryReceipt, 'Lý do nhập phải là Nhập mua').toContainText('Nhập mua');
    await expect(inventoryReceipt, 'Phiếu nhập kho phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');

    await paymentOrderListPage.open();
    const transferCheck = await paymentOrderListPage.findPaymentDocument(data.paymentDocumentNumber);
    await expect(transferCheck, 'Tiền gửi > Chi tiền phải sinh Séc chuyển khoản tương ứng').toBeVisible();
    await expect(transferCheck, 'Séc chuyển khoản phải ở trạng thái Chưa ghi sổ').toContainText('Chưa ghi sổ');
  });
});
