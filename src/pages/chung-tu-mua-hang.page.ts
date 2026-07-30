import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { Logger } from '@utils/logger';

export class ChungTuMuaHangPage extends BasePage {
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

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.purchaseBreadcrumb = page.getByRole('navigation', { name: 'breadcrumb' }).getByText('Chứng từ mua hàng');
    this.globalSearchInput = page.getByRole('textbox', { name: 'Tìm kiếm...' });
    this.table = page.getByRole('table').filter({
      has: page.getByRole('columnheader', { name: 'STT', exact: true }),
    });
    this.headerRow = this.table.getByRole('row').first();
    this.headerColumns = this.headerRow.getByRole('columnheader');
    this.headerCheckbox = this.headerRow.getByRole('checkbox');
    this.dataRows = this.table.getByRole('rowgroup').nth(1).getByRole('row').filter({ has: page.getByRole('checkbox') });
    this.firstDocumentButton = this.dataRows.first().getByRole('button').first();
    this.nextPageButton = page.getByRole('button', { name: 'right' });
    this.pageSizeDisplay = page.getByText('20 / trang', { exact: true });
    this.emptyStateMessage = page.getByText(
      'Không tìm thấy chứng từ nào phù hợp với điều kiện tìm kiếm',
      { exact: true },
    );
  }

  async open(): Promise<void> {
    await this.navigate('/purchase/chung-tu-mua-hang');
    await this.purchaseBreadcrumb.waitFor({ state: 'visible' });
    await this.waitForTableSettled();
  }

  async search(keyword: string): Promise<void> {
    await this.type(this.globalSearchInput, keyword, 'Tìm kiếm chứng từ');
    await this.page.keyboard.press('Enter');
    await this.waitForTableSettled();
  }

  async goToNextPage(): Promise<void> {
    await this.click(this.nextPageButton, 'Chuyển sang trang tiếp theo');
  }

  async textHeaderNames(): Promise<string[]> {
    const names = await this.headerColumns.allTextContents();
    return names.map((name) => name.trim()).filter(Boolean);
  }

  async columnTexts(columnIndex: number): Promise<string[]> {
    return this.dataRows.evaluateAll(
      (rows, index) => rows.map((row) => (row as HTMLTableRowElement).cells[index]?.textContent?.trim() ?? ''),
      columnIndex,
    );
  }

  async columnTextAlignments(columnIndex: number): Promise<string[]> {
    return this.dataRows.evaluateAll(
      (rows, index) => rows.map((row) => getComputedStyle((row as HTMLTableRowElement).cells[index]!).textAlign),
      columnIndex,
    );
  }

  async invoiceNumberForDocument(documentNumber: string): Promise<string> {
    await this.search(documentNumber);
    const documentRow = this.dataRows.filter({
      has: this.page.getByRole('button', { name: documentNumber, exact: true }),
    });
    await documentRow.waitFor({ state: 'visible' });
    return (await documentRow.getByRole('cell').nth(4).textContent())?.trim() ?? '';
  }

  async firstDocumentVisualStyle(): Promise<Readonly<{ color: string; cursor: string }>> {
    return this.firstDocumentButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, cursor: style.cursor };
    });
  }

  async postingRowVisualSignatures(): Promise<Readonly<{ unposted?: string; posted?: string }>> {
    const rows = await this.dataRows.all();
    let unposted: string | undefined;
    let posted: string | undefined;
    for (const row of rows) {
      const text = await row.innerText();
      const visualSignature = await row.evaluate((element) => {
        const elements = [element, ...Array.from(element.querySelectorAll('td'))];
        return elements.map((target) => {
          const style = getComputedStyle(target);
          return [style.backgroundColor, style.color, style.fontWeight, style.border, style.outline].join('|');
        }).join('||');
      });
      if (text.includes('Chưa ghi sổ') && unposted === undefined) unposted = visualSignature;
      if (text.includes('Đã ghi sổ') && posted === undefined) posted = visualSignature;
      if (unposted !== undefined && posted !== undefined) break;
    }
    return { ...(unposted !== undefined ? { unposted } : {}), ...(posted !== undefined ? { posted } : {}) };
  }

  async hasText(text: string): Promise<boolean> {
    return this.page.getByText(text, { exact: true }).isVisible();
  }

  private async waitForTableSettled(): Promise<void> {
    await this.table.waitFor({ state: 'visible' });
    await this.dataRows.first().or(this.emptyStateMessage).waitFor({ state: 'visible' });
  }
}
