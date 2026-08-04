import type { Locator, Page } from '@playwright/test';

/** Locator contract của danh sách Chứng từ mua hàng. */
export interface ChungTuMuaHangLocatorMap {
  readonly purchaseBreadcrumb: Locator;
  readonly globalSearchInput: Locator;
  readonly table: Locator;
  readonly headerRow: Locator;
  readonly headerColumns: Locator;
  readonly headerCheckbox: Locator;
  readonly dataRows: Locator;
  readonly firstDocumentButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageSizeDisplay: Locator;
  readonly emptyStateMessage: Locator;
  readonly exactText: (text: string) => Locator;
  readonly documentRow: (documentNumber: string) => Locator;
  readonly invoiceNumberCell: (documentNumber: string) => Locator;
}

/** Khởi tạo locator đã được xác minh trên DOM hiện tại của danh sách Chứng từ mua hàng. */
export function createChungTuMuaHangLocatorMap(page: Page): ChungTuMuaHangLocatorMap {
  const table = page.getByRole('table').filter({
    has: page.getByRole('columnheader', { name: 'STT', exact: true }),
  });
  const headerRow = table.getByRole('row').first();
  const dataRows = table.getByRole('rowgroup').nth(1).getByRole('row').filter({
    has: page.getByRole('checkbox'),
  });
  return {
    purchaseBreadcrumb: page.getByRole('navigation', { name: 'breadcrumb' }).getByText('Chứng từ mua hàng'),
    globalSearchInput: page.getByRole('textbox', { name: 'Tìm kiếm...' }),
    table,
    headerRow,
    headerColumns: headerRow.getByRole('columnheader'),
    headerCheckbox: headerRow.getByRole('checkbox'),
    dataRows,
    firstDocumentButton: dataRows.first().getByRole('button').first(),
    nextPageButton: page.getByRole('button', { name: 'right' }),
    pageSizeDisplay: page.getByText('20 / trang', { exact: true }),
    emptyStateMessage: page.getByText(
      'Không tìm thấy chứng từ nào phù hợp với điều kiện tìm kiếm',
      { exact: true },
    ),
    exactText: (text) => page.getByText(text, { exact: true }),
    documentRow: (documentNumber) => dataRows.filter({
      has: page.getByRole('button', { name: documentNumber, exact: true }),
    }),
    invoiceNumberCell: (documentNumber) => dataRows.filter({
      has: page.getByRole('button', { name: documentNumber, exact: true }),
    }).getByRole('cell').nth(4),
  };
}
