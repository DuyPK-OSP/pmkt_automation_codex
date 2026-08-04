import type { Locator, Page } from '@playwright/test';

/** Locator contract của danh sách chứng từ Chi tiền gửi. */
export interface TienGuiChiTienDanhSachLocatorMap {
  readonly table: Locator;
  readonly loadingSpinner: Locator;
  readonly searchInput: Locator;
  readonly paymentDocumentRow: (documentNumber: string) => Locator;
}

/** Khởi tạo locator đã được xác minh trên DOM hiện tại của danh sách chứng từ Chi tiền gửi. */
export function createTienGuiChiTienDanhSachLocatorMap(page: Page): TienGuiChiTienDanhSachLocatorMap {
  return {
    table: page.getByRole('table'),
    loadingSpinner: page.locator('.ant-spin-spinning'),
    searchInput: page.getByRole('textbox', { name: 'Nhập từ khóa tìm kiếm…' }),
    paymentDocumentRow: (documentNumber) => page.getByRole('row').filter({ hasText: documentNumber }),
  };
}
