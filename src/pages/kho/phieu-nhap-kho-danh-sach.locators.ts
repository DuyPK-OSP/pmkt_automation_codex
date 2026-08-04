import type { Locator, Page } from '@playwright/test';

/** Locator contract của danh sách Phiếu nhập kho. */
export interface PhieuNhapKhoDanhSachLocatorMap {
  readonly table: Locator;
  readonly loadingSpinner: Locator;
  readonly searchInput: Locator;
  readonly receiptRow: (documentNumber: string) => Locator;
}

/** Khởi tạo locator đã được xác minh trên DOM hiện tại của danh sách Phiếu nhập kho. */
export function createPhieuNhapKhoDanhSachLocatorMap(page: Page): PhieuNhapKhoDanhSachLocatorMap {
  return {
    table: page.getByRole('table'),
    loadingSpinner: page.locator('.ant-spin-spinning'),
    searchInput: page.getByRole('textbox', { name: 'Tìm kiếm...' }),
    receiptRow: (documentNumber) => page.getByRole('row').filter({ hasText: documentNumber }),
  };
}
