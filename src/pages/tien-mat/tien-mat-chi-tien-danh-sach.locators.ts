import type { Locator, Page } from '@playwright/test';

/** Locator contract của danh sách Phiếu chi tiền mặt. */
export interface TienMatChiTienDanhSachLocatorMap {
  readonly table: Locator;
  readonly loadingSpinner: Locator;
  readonly searchInput: Locator;
  readonly receiptRow: (documentNumber: string) => Locator;
}

/** Khởi tạo locator đã được xác minh trên DOM hiện tại của danh sách Phiếu chi tiền mặt. */
export function createTienMatChiTienDanhSachLocatorMap(page: Page): TienMatChiTienDanhSachLocatorMap {
  return {
    table: page.getByRole('table'),
    loadingSpinner: page.locator('.ant-spin-spinning'),
    searchInput: page.getByRole('textbox', { name: 'Nhập từ khóa tìm kiếm…' }),
    receiptRow: (documentNumber) => page.getByRole('row').filter({ hasText: documentNumber }),
  };
}
