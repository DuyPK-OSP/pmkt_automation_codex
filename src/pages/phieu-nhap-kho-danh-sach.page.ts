import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { Logger } from '@utils/logger';

export class PhieuNhapKhoDanhSachPage extends BasePage {
  constructor(page: Page, logger: Logger) {
    super(page, logger);
  }

  async open(): Promise<void> {
    await this.navigate('/kho/nhap-kho');
    await this.page.getByRole('table').waitFor({ state: 'visible' });
    await this.page.locator('.ant-spin-spinning').waitFor({ state: 'hidden' }).catch(() => undefined);
  }

  async findReceipt(documentNumber: string): Promise<Locator> {
    const search = this.page.getByRole('textbox', { name: 'Tìm kiếm...' });
    await search.fill(documentNumber);
    await search.press('Enter');
    return this.page.getByRole('row').filter({ hasText: documentNumber });
  }
}
