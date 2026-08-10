import type { Locator, Page } from '@playwright/test';

/** Locator semantic của màn Danh mục Kho, phục vụ cleanup bản ghi tạo từ Thêm nhanh. */
export class KhoLocators {
  constructor(private readonly page: Page) {}

  catalogueEntry = (): Locator => this.page.getByRole('button', { name: 'Kho', exact: true });
  searchInput = (): Locator => this.page.getByRole('textbox', { name: 'Tìm kiếm...', exact: true });
  row = (code: string): Locator => this.page.getByRole('row').filter({ hasText: code });
  deleteButton = (code: string): Locator => this.row(code).getByRole('button', { name: 'Xóa', exact: true });
  deleteConfirmation = (): Locator => this.page.getByRole('dialog').filter({ hasText: 'Xác nhận xóa kho' });
  confirmDeleteButton = (): Locator => this.deleteConfirmation().getByRole('button', { name: 'Xác nhận', exact: true });
}
