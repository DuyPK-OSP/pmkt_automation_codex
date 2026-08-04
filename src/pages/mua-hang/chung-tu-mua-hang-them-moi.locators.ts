import type { Locator, Page } from '@playwright/test';

/** Locator contract của form Thêm mới Chứng từ mua hàng. */
export interface ChungTuMuaHangThemMoiLocatorMap {
  readonly dialog: Locator;
  readonly addButton: Locator;
  readonly saveButton: Locator;
  readonly businessType: Locator;
  readonly purchaseMethod: Locator;
  readonly immediatePayment: Locator;
  readonly currency: Locator;
  readonly discountType: Locator;
  readonly table: Locator;
  readonly loadingSpinner: Locator;
  readonly invoiceStatusInput: Locator;
  readonly invoiceStatusOptions: Locator;
  readonly immediatePaymentTypeInput: Locator;
  readonly paymentTab: (name: string) => Locator;
  readonly paymentPanel: (panelId: string) => Locator;
  readonly cashAccountLabel: (panel: Locator) => Locator;
  readonly bankAccountLabel: (panel: Locator) => Locator;
  readonly paymentComboboxes: (panel: Locator) => Locator;
  readonly paymentDocumentNumberInput: (panel: Locator) => Locator;
  readonly paymentCashAccountCombobox: (panel: Locator) => Locator;
  readonly paymentBankAccountCombobox: (panel: Locator) => Locator;
  readonly controlParent: (control: Locator) => Locator;
  readonly searchablePlaceholder: (placeholder: string) => Locator;
  readonly detailRow: Locator;
  readonly detailRowComboboxes: Locator;
  readonly documentNumberInput: Locator;
  readonly quantityInput: Locator;
  readonly unitPriceInput: Locator;
  readonly lotInput: Locator;
  readonly expiryInput: Locator;
  readonly supplierNameInput: Locator;
  readonly deliveryPersonInput: Locator;
  readonly addressInput: Locator;
  readonly descriptionInput: Locator;
  readonly creditDaysInput: Locator;
  readonly dueDateInput: Locator;
  readonly itemNameInput: Locator;
  readonly amountInput: Locator;
  readonly accountingDateInput: Locator;
  readonly documentDateInput: Locator;
  readonly headerField: (label: string) => Locator;
  readonly controlContainerById: (id: string) => Locator;
  readonly searchableCombobox: (placeholder: string) => Locator;
  readonly headerCombobox: (label: string) => Locator;
}

/** Khởi tạo locator đã được xác minh trên DOM hiện tại của form Thêm mới Chứng từ mua hàng. */
export function createChungTuMuaHangThemMoiLocatorMap(page: Page): ChungTuMuaHangThemMoiLocatorMap {
  const dialog = page.getByRole('dialog').filter({ hasText: 'Thêm chứng từ mua hàng' });
  return {
    dialog,
    addButton: page.getByRole('button', { name: 'Thêm mới', exact: true }),
    saveButton: dialog.getByRole('button', { name: 'Lưu', exact: true }),
    businessType: dialog.locator('#loaiNghiepVu').locator('..'),
    purchaseMethod: dialog.locator('#hinhThuc').locator('..'),
    immediatePayment: dialog.locator('#thanhToanNgay'),
    currency: dialog.locator('#loaiTienId').locator('..'),
    discountType: dialog.locator('#loaiChietKhau').locator('..'),
    table: page.getByRole('table'),
    loadingSpinner: page.locator('.ant-spin-spinning'),
    invoiceStatusInput: dialog.locator('#trangThaiHoaDon'),
    invoiceStatusOptions: page.locator('[role="option"][aria-label]'),
    immediatePaymentTypeInput: dialog.locator('#hinhThucThanhToan'),
    paymentTab: (name) => dialog.getByRole('tab', { name, exact: true }),
    paymentPanel: (panelId) => dialog.locator(`#${panelId}`),
    cashAccountLabel: (panel) => panel.getByText(/^TK Tiền/).first(),
    bankAccountLabel: (panel) => panel.getByText(/^Tài khoản chi/).first(),
    paymentComboboxes: (panel) => panel.getByRole('combobox'),
    paymentDocumentNumberInput: (panel) => panel.locator('#soChungTuPhieuChi'),
    paymentCashAccountCombobox: (panel) => panel.getByText(/^TK Tiền/).first().locator('..').locator('..').getByRole('combobox'),
    paymentBankAccountCombobox: (panel) => panel.getByText(/^Tài khoản chi/).first().locator('..').locator('..').getByRole('combobox'),
    controlParent: (control) => control.locator('..'),
    searchablePlaceholder: (placeholder) => dialog.getByText(placeholder, { exact: true }).first(),
    detailRow: dialog.locator('tr:has(#chiTiet_0_soLuong)'),
    detailRowComboboxes: dialog.locator('tr:has(#chiTiet_0_soLuong)').getByRole('combobox'),
    documentNumberInput: dialog.locator('#soChungTu'),
    quantityInput: dialog.locator('#chiTiet_0_soLuong'),
    unitPriceInput: dialog.locator('#chiTiet_0_donGia'),
    lotInput: dialog.locator('#chiTiet_0_soLo'),
    expiryInput: dialog.locator('#chiTiet_0_hanSuDung'),
    supplierNameInput: dialog.locator('#tenNhaCungCap').first(),
    deliveryPersonInput: dialog.locator('#nguoiGiaoHang'),
    addressInput: dialog.locator('#diaChi').first(),
    descriptionInput: dialog.locator('#dienGiai'),
    creditDaysInput: dialog.locator('#soNgayDuocNo'),
    dueDateInput: dialog.locator('#hanThanhToan'),
    itemNameInput: dialog.locator('#chiTiet_0_tenHang'),
    amountInput: dialog.locator('#chiTiet_0_thanhTien'),
    accountingDateInput: dialog.locator('#ngayHachToan'),
    documentDateInput: dialog.locator('#ngayChungTu'),
    headerField: (label) => dialog.getByText(label, { exact: true }).locator('..').locator('..'),
    controlContainerById: (id) => dialog.locator(`#${id}`).locator('..'),
    searchableCombobox: (placeholder) => dialog.getByText(placeholder, { exact: true }).first().locator('..').getByRole('combobox'),
    headerCombobox: (label) => dialog.getByText(label, { exact: true }).locator('..').locator('..').getByRole('combobox'),
  };
}
