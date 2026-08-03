import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';

export class ChungTuMuaHangDanhSachPage extends BasePage {
  readonly successToast: Locator;
  readonly detailDialog: Locator;

  /** Khởi tạo Page Object và các locator dùng chung của màn hình. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.successToast = page.getByText('Thêm mới chứng từ mua hàng thành công', { exact: true });
    this.detailDialog = page.getByRole('dialog').filter({ hasText: 'Chi tiết chứng từ mua hàng' });
  }

  /** Mở màn hình Chứng từ mua hàng và chờ dữ liệu sẵn sàng thao tác. */
  async open(): Promise<void> {
    await this.navigate('/purchase/chung-tu-mua-hang');
    await this.page.getByRole('table').waitFor({ state: 'visible' });
  }

  /** Tìm Chứng từ mua hàng theo Số chứng từ và trả về dòng tương ứng. */
  async findDocument(documentNumber: string): Promise<Locator> {
    const search = this.page.getByRole('textbox', { name: 'Tìm kiếm...' });
    await search.fill(documentNumber);
    await search.press('Enter');
    return this.documentRow(documentNumber);
  }

  /** Tìm và mở chi tiết Chứng từ mua hàng theo Số chứng từ. */
  async openDocumentDetail(documentNumber: string): Promise<Locator> {
    const row = await this.findDocument(documentNumber);
    await row.getByRole('button', { name: 'Xem chi tiết' }).click();
    await this.detailDialog.waitFor({ state: 'visible' });
    return this.detailDialog;
  }

  /** Trả về trường Số chứng từ trong popup chi tiết. */
  detailDocumentNumber(): Locator {
    return this.detailDialog.locator('#soChungTu');
  }

  /** Trả về trường Tên hàng tại dòng chi tiết đầu tiên. */
  detailItemName(): Locator {
    return this.detailDialog.locator('#chiTiet_0_tenHang');
  }

  /** Trả về tab chứng từ thanh toán theo tên. */
  detailPaymentTab(name: string): Locator {
    return this.detailDialog.getByRole('tab', { name, exact: true });
  }

  /** Trả về các input và textarea còn cho phép chỉnh sửa trong popup chi tiết. */
  enabledEditableFields(): Locator {
    return this.detailDialog.locator('input:not([type="hidden"]):enabled, textarea:enabled');
  }

  /** Xóa chứng từ đang mở và chờ popup chi tiết đóng hoàn toàn. */
  async deleteOpenDocument(): Promise<void> {
    await this.detailDialog.getByRole('button', { name: 'Xóa', exact: true }).click();
    const confirmation = this.page.getByRole('dialog').filter({ hasText: /chắc chắn.*xóa/i }).last();
    await confirmation.waitFor({ state: 'visible' });
    await confirmation.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await confirmation.waitFor({ state: 'hidden' });
    await this.detailDialog.waitFor({ state: 'hidden' });
  }

  /** Trả về dòng Chứng từ mua hàng được xác định bằng Số chứng từ unique. */
  documentRow(documentNumber: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('button', { name: documentNumber, exact: true }),
    });
  }
}
