import type { Locator, Page } from '@playwright/test';

/** Locator màn Danh mục Đơn vị tính dùng cho cleanup dữ liệu Thêm nhanh. */
export class DonViTinhLocators {
  constructor(private readonly page: Page) {}
  catalogueEntry = (): Locator => this.page.getByRole('button', { name: 'Đơn vị tính', exact: true });
  searchInput = (): Locator => this.page.getByRole('textbox', { name: 'Tìm kiếm...', exact: true });
  row = (code: string): Locator => this.page.getByRole('row').filter({ has: this.page.getByRole('button', { name: code, exact: true }) });
  deleteButton = (code: string): Locator => this.row(code).getByRole('button', { name: 'Xóa', exact: true });
  deleteConfirmation = (): Locator => this.page.getByRole('dialog').filter({ hasText: /Xác nhận xóa đơn vị tính/i });
  confirmDeleteButton = (): Locator => this.deleteConfirmation().getByRole('button', { name: 'Xác nhận', exact: true });
}
