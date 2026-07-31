import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';

export class ChungTuMuaHangDanhSachPage extends BasePage {
  readonly successToast: Locator;
  readonly detailDialog: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.successToast = page.getByText('Thêm mới chứng từ mua hàng thành công', { exact: true });
    this.detailDialog = page.getByRole('dialog').filter({ hasText: 'Chi tiết chứng từ mua hàng' });
  }

  async open(): Promise<void> {
    await this.navigate('/purchase/chung-tu-mua-hang');
    await this.page.getByRole('table').waitFor({ state: 'visible' });
  }

  async findDocument(documentNumber: string): Promise<Locator> {
    const search = this.page.getByRole('textbox', { name: 'Tìm kiếm...' });
    await search.fill(documentNumber);
    await search.press('Enter');
    return this.documentRow(documentNumber);
  }

  async openDocumentDetail(documentNumber: string): Promise<Locator> {
    const row = await this.findDocument(documentNumber);
    await row.getByRole('button', { name: 'Xem chi tiết' }).click();
    await this.detailDialog.waitFor({ state: 'visible' });
    return this.detailDialog;
  }

  detailDocumentNumber(): Locator {
    return this.detailDialog.locator('#soChungTu');
  }

  detailItemName(): Locator {
    return this.detailDialog.locator('#chiTiet_0_tenHang');
  }

  detailPaymentTab(name: string): Locator {
    return this.detailDialog.getByRole('tab', { name, exact: true });
  }

  enabledEditableFields(): Locator {
    return this.detailDialog.locator('input:not([type="hidden"]):enabled, textarea:enabled');
  }

  async deleteOpenDocument(): Promise<void> {
    await this.detailDialog.getByRole('button', { name: 'Xóa', exact: true }).click();
    const confirmation = this.page.getByRole('dialog').filter({ hasText: /chắc chắn.*xóa/i }).last();
    await confirmation.waitFor({ state: 'visible' });
    await confirmation.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await confirmation.waitFor({ state: 'hidden' });
    await this.detailDialog.waitFor({ state: 'hidden' });
  }

  documentRow(documentNumber: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('button', { name: documentNumber, exact: true }),
    });
  }
}
