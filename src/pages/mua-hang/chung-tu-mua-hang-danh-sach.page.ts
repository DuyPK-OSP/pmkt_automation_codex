import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import {
  createChungTuMuaHangDanhSachLocatorMap,
  type ChungTuMuaHangDanhSachLocatorMap,
} from './chung-tu-mua-hang-danh-sach.locators';

export class ChungTuMuaHangDanhSachPage extends BasePage {
  readonly locators: ChungTuMuaHangDanhSachLocatorMap;
  readonly successToast: Locator;
  readonly detailDialog: Locator;

  /** Khởi tạo Page Object và các locator dùng chung của màn hình. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = createChungTuMuaHangDanhSachLocatorMap(page);
    this.successToast = this.locators.successToast;
    this.detailDialog = this.locators.detailDialog;
  }

  /** Mở màn hình Chứng từ mua hàng và chờ dữ liệu sẵn sàng thao tác. */
  async open(): Promise<void> {
    await this.navigate('/purchase/chung-tu-mua-hang');
    await this.locators.table.waitFor({ state: 'visible' });
  }

  /** Tìm Chứng từ mua hàng theo Số chứng từ và trả về dòng tương ứng. */
  async findDocument(documentNumber: string): Promise<Locator> {
    await this.locators.searchInput.fill(documentNumber);
    await this.locators.searchInput.press('Enter');
    return this.documentRow(documentNumber);
  }

  /** Tìm và mở chi tiết Chứng từ mua hàng theo Số chứng từ. */
  async openDocumentDetail(documentNumber: string): Promise<Locator> {
    const row = await this.findDocument(documentNumber);
    await this.locators.detailButton(row).click();
    await this.detailDialog.waitFor({ state: 'visible' });
    return this.detailDialog;
  }

  /** Trả về trường Số chứng từ trong popup chi tiết. */
  detailDocumentNumber(): Locator {
    return this.locators.detailDocumentNumber;
  }

  /** Trả về trường Tên hàng tại dòng chi tiết đầu tiên. */
  detailItemName(): Locator {
    return this.locators.detailItemName;
  }

  /** Trả về tab chứng từ thanh toán theo tên. */
  detailPaymentTab(name: string): Locator {
    return this.locators.detailPaymentTab(name);
  }

  /** Trả về các input và textarea còn cho phép chỉnh sửa trong popup chi tiết. */
  enabledEditableFields(): Locator {
    return this.locators.enabledEditableFields;
  }

  /** Xóa chứng từ đang mở và chờ popup chi tiết đóng hoàn toàn. */
  async deleteOpenDocument(): Promise<void> {
    await this.locators.deleteButton.click();
    const confirmation = this.locators.deleteConfirmation;
    await confirmation.waitFor({ state: 'visible' });
    await this.locators.confirmDeleteButton(confirmation).click();
    await confirmation.waitFor({ state: 'hidden' });
    await this.detailDialog.waitFor({ state: 'hidden' });
  }

  /** Trả về dòng Chứng từ mua hàng được xác định bằng Số chứng từ unique. */
  documentRow(documentNumber: string): Locator {
    return this.locators.documentRow(documentNumber);
  }
}
