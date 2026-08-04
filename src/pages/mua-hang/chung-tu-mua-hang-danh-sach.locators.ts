import type { Locator, Page } from '@playwright/test';

/** Locator contract của danh sách và popup chi tiết Chứng từ mua hàng. */
export interface ChungTuMuaHangDanhSachLocatorMap {
  readonly successToast: Locator;
  readonly detailDialog: Locator;
  readonly table: Locator;
  readonly searchInput: Locator;
  readonly documentRow: (documentNumber: string) => Locator;
  readonly detailButton: (row: Locator) => Locator;
  readonly detailDocumentNumber: Locator;
  readonly detailItemName: Locator;
  readonly detailPaymentTab: (name: string) => Locator;
  readonly enabledEditableFields: Locator;
  readonly deleteButton: Locator;
  readonly deleteConfirmation: Locator;
  readonly confirmDeleteButton: (confirmation: Locator) => Locator;
}

/** Khởi tạo locator đã được xác minh trên DOM hiện tại của Chứng từ mua hàng. */
export function createChungTuMuaHangDanhSachLocatorMap(page: Page): ChungTuMuaHangDanhSachLocatorMap {
  const detailDialog = page.getByRole('dialog').filter({ hasText: 'Chi tiết chứng từ mua hàng' });
  const deleteConfirmation = page.getByRole('dialog').filter({ hasText: /chắc chắn.*xóa/i }).last();
  return {
    successToast: page.getByText('Thêm mới chứng từ mua hàng thành công', { exact: true }),
    detailDialog,
    table: page.getByRole('table'),
    searchInput: page.getByRole('textbox', { name: 'Tìm kiếm...' }),
    documentRow: (documentNumber) => page.getByRole('row').filter({
      has: page.getByRole('button', { name: documentNumber, exact: true }),
    }),
    detailButton: (row) => row.getByRole('button', { name: 'Xem chi tiết' }),
    detailDocumentNumber: detailDialog.locator('#soChungTu'),
    detailItemName: detailDialog.locator('#chiTiet_0_tenHang'),
    detailPaymentTab: (name) => detailDialog.getByRole('tab', { name, exact: true }),
    enabledEditableFields: detailDialog.locator('input:not([type="hidden"]):enabled, textarea:enabled'),
    deleteButton: detailDialog.getByRole('button', { name: 'Xóa', exact: true }),
    deleteConfirmation,
    confirmDeleteButton: (confirmation) => confirmation.getByRole('button', { name: 'Xác nhận', exact: true }),
  };
}
