import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import {
  createChungTuMuaHangLocatorMap,
  type ChungTuMuaHangLocatorMap,
} from './chung-tu-mua-hang.locators';

export class ChungTuMuaHangPage extends BasePage {
  readonly locators: ChungTuMuaHangLocatorMap;
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

  /** Khởi tạo Page Object và các locator dùng chung của màn hình. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = createChungTuMuaHangLocatorMap(page);
    this.purchaseBreadcrumb = this.locators.purchaseBreadcrumb;
    this.globalSearchInput = this.locators.globalSearchInput;
    this.table = this.locators.table;
    this.headerRow = this.locators.headerRow;
    this.headerColumns = this.locators.headerColumns;
    this.headerCheckbox = this.locators.headerCheckbox;
    this.dataRows = this.locators.dataRows;
    this.firstDocumentButton = this.locators.firstDocumentButton;
    this.nextPageButton = this.locators.nextPageButton;
    this.pageSizeDisplay = this.locators.pageSizeDisplay;
    this.emptyStateMessage = this.locators.emptyStateMessage;
  }

  /** Mở màn hình Chứng từ mua hàng và chờ dữ liệu sẵn sàng thao tác. */
  async open(): Promise<void> {
    await this.navigate('/purchase/chung-tu-mua-hang');
    await this.purchaseBreadcrumb.waitFor({ state: 'visible' });
    await this.waitForTableSettled();
  }

  /** Tìm kiếm chứng từ theo từ khóa và chờ bảng cập nhật kết quả. */
  async search(keyword: string): Promise<void> {
    await this.type(this.globalSearchInput, keyword, 'Tìm kiếm chứng từ');
    await this.page.keyboard.press('Enter');
    await this.waitForTableSettled();
  }

  /** Chuyển danh sách Chứng từ mua hàng sang trang kế tiếp. */
  async goToNextPage(): Promise<void> {
    await this.click(this.nextPageButton, 'Chuyển sang trang tiếp theo');
  }

  /** Trả về danh sách tiêu đề cột có nội dung text theo thứ tự hiển thị. */
  async textHeaderNames(): Promise<string[]> {
    const names = await this.headerColumns.allTextContents();
    return names.map((name) => name.trim()).filter(Boolean);
  }

  /** Trả về toàn bộ nội dung của cột theo chỉ số cột được truyền vào. */
  async columnTexts(columnIndex: number): Promise<string[]> {
    return this.dataRows.evaluateAll(
      (rows, index) => rows.map((row) => (row as HTMLTableRowElement).cells[index]?.textContent?.trim() ?? ''),
      columnIndex,
    );
  }

  /** Trả về kiểu căn lề thực tế của từng ô trong một cột. */
  async columnTextAlignments(columnIndex: number): Promise<string[]> {
    return this.dataRows.evaluateAll(
      (rows, index) => rows.map((row) => getComputedStyle((row as HTMLTableRowElement).cells[index]!).textAlign),
      columnIndex,
    );
  }

  /** Tìm chứng từ theo số và trả về nội dung cột Số hóa đơn của chứng từ đó. */
  async invoiceNumberForDocument(documentNumber: string): Promise<string> {
    await this.search(documentNumber);
    const documentRow = this.locators.documentRow(documentNumber);
    await documentRow.waitFor({ state: 'visible' });
    return (await this.locators.invoiceNumberCell(documentNumber).textContent())?.trim() ?? '';
  }

  /** Trả về màu chữ và kiểu con trỏ của link Số chứng từ đầu tiên. */
  async firstDocumentVisualStyle(): Promise<Readonly<{ color: string; cursor: string }>> {
    return this.firstDocumentButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, cursor: style.cursor };
    });
  }

  /** Thu thập dấu hiệu hiển thị của dòng Đã ghi sổ và Chưa ghi sổ để spec so sánh. */
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

  /** Kiểm tra nội dung chính xác có đang hiển thị trên màn hình hay không. */
  async hasText(text: string): Promise<boolean> {
    return this.locators.exactText(text).isVisible();
  }

  /** Chờ bảng hiển thị dữ liệu hoặc trạng thái không có kết quả. */
  private async waitForTableSettled(): Promise<void> {
    await this.table.waitFor({ state: 'visible' });
    await this.dataRows.first().or(this.emptyStateMessage).waitFor({ state: 'visible' });
  }
}
