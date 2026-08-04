import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import {
  createNganhNgheLocatorMap,
  type NganhNgheLocatorMap,
} from './nganh-nghe.locators';
import type { Logger } from '@utils/logger';

export interface IndustryInput {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
}

export interface CreateDialogUiState {
  readonly title: string;
  readonly dialogBox: Readonly<{ x: number; y: number; width: number; height: number }>;
  readonly viewport: Readonly<{ width: number; height: number }>;
  readonly hasDimmedOverlay: boolean;
  readonly fields: readonly Readonly<{
    id: string;
    tagName: string;
    label: string;
    required: boolean;
    placeholder: string;
    maxLength: number;
    y: number;
  }>[];
  readonly buttons: readonly Readonly<{
    text: string;
    x: number;
    backgroundColor: string;
    borderColor: string;
  }>[];
}

export class NganhNghePage extends BasePage {
  readonly locators: NganhNgheLocatorMap;

  /** Khởi tạo Page Object và locator map của màn hình Danh mục Ngành nghề. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = createNganhNgheLocatorMap(page);
  }

  /** Mở màn hình Danh mục Ngành nghề và chờ danh sách sẵn sàng thao tác. */
  async openFromCatalogue(): Promise<void> {
    await this.click(this.locators.industryEntry, 'Mở danh mục Ngành nghề');
    await expect(this.page).toHaveURL(/\/master-data\/nganh-nghe$/);
    await expect(this.locators.addButton).toBeVisible();
  }

  /** Mở form Thêm mới Ngành nghề và chờ hiệu ứng hiển thị popup hoàn tất. */
  async openCreateDialog(): Promise<void> {
    await this.click(this.locators.addButton, 'Mở popup Thêm mới ngành nghề');
    await expect(this.locators.createDialog).toBeVisible();
    await expect.poll(
      async () => this.locators.createDialog.evaluate((dialog) => {
        const modal = dialog.closest<HTMLElement>('.ant-modal') ?? dialog;
        return modal.getBoundingClientRect().width;
      }),
      { message: 'Chờ animation popup Thêm mới ngành nghề hoàn tất' },
    ).toBeGreaterThanOrEqual(550);
  }

  /** Nhập dữ liệu Ngành nghề; chỉ nhập Diễn giải khi testcase có truyền giá trị. */
  async fillIndustry(data: IndustryInput): Promise<void> {
    await this.type(this.locators.codeInput, data.code, 'Mã ngành nghề');
    await this.type(this.locators.nameInput, data.name, 'Tên ngành nghề');
    if (data.description !== undefined) {
      await this.type(this.locators.descriptionInput, data.description, 'Diễn giải');
    }
  }

  /** Nhấn Lưu để tạo bản ghi và kết thúc thao tác trên form hiện tại. */
  async save(): Promise<void> {
    await this.click(this.locators.saveButton, 'Lưu ngành nghề');
  }

  /** Nhấn Lưu và tiếp tục để tạo bản ghi nhưng giữ form mở cho lần nhập tiếp theo. */
  async saveAndContinue(): Promise<void> {
    await this.click(this.locators.saveAndContinueButton, 'Lưu ngành nghề và tiếp tục');
  }

  /** Nhấn nút Hủy ở cuối form Thêm mới. */
  async cancelCreate(): Promise<void> {
    await this.click(this.locators.cancelButton, 'Hủy thêm mới ngành nghề');
  }

  /** Nhấn biểu tượng X để yêu cầu đóng form Thêm mới. */
  async closeCreate(): Promise<void> {
    await this.click(this.locators.closeButton, 'Đóng popup thêm mới ngành nghề');
  }

  /** Xác nhận bỏ dữ liệu đang nhập và đóng form Thêm mới. */
  async confirmCancelCreate(): Promise<void> {
    await this.click(this.locators.confirmCancelButton, 'Xác nhận hủy thêm mới ngành nghề');
  }

  /** Hủy thao tác đóng form để quay lại tiếp tục chỉnh sửa dữ liệu. */
  async keepEditing(): Promise<void> {
    await this.click(this.locators.keepEditingButton, 'Hủy đóng popup và tiếp tục chỉnh sửa');
  }

  /** Kiểm tra trường Mã có được hiển thị viền lỗi hay không. */
  async isCodeInputHighlightedAsError(): Promise<boolean> {
    return this.isInputHighlightedAsError(this.locators.codeInput);
  }

  /** Kiểm tra trường Tên có được hiển thị viền lỗi hay không. */
  async isNameInputHighlightedAsError(): Promise<boolean> {
    return this.isInputHighlightedAsError(this.locators.nameInput);
  }

  /** Kiểm tra trường Diễn giải có được hiển thị viền lỗi hay không. */
  async isDescriptionInputHighlightedAsError(): Promise<boolean> {
    return this.isInputHighlightedAsError(this.locators.descriptionInput);
  }

  /** Xác định trạng thái lỗi bằng cách so sánh kênh màu đỏ của viền với xanh lá và xanh dương. */
  private async isInputHighlightedAsError(locator: Locator): Promise<boolean> {
    return locator.evaluate((input) => {
      const channels = getComputedStyle(input).borderColor.match(/\d+/g)?.map(Number) ?? [];
      const [red = 0, green = 0, blue = 0] = channels;
      return red > green && red > blue;
    });
  }

  /** Thu thập trạng thái giao diện của form để spec kiểm tra layout, field và action button. */
  async getCreateDialogUiState(): Promise<CreateDialogUiState> {
    return this.locators.createDialog.evaluate((dialog) => {
      const modal = dialog.closest<HTMLElement>('.ant-modal') ?? dialog;
      const dialogRect = modal.getBoundingClientRect();
      const overlay = Array.from(document.body.querySelectorAll<HTMLElement>('*')).find((element) => {
        if (element.contains(dialog) || dialog.contains(element)) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.position === 'fixed'
          && rect.width >= window.innerWidth * 0.9
          && rect.height >= window.innerHeight * 0.9
          && style.backgroundColor !== 'rgba(0, 0, 0, 0)';
      });
      const fieldIds = ['ma', 'ten', 'moTa'];
      const fields = fieldIds.map((id) => {
        const control = dialog.querySelector<HTMLElement>(`#${id}`);
        if (!control) throw new Error(`Không tìm thấy control #${id} trong popup Ngành nghề`);
        const label = dialog.querySelector<HTMLLabelElement>(`label[for="${id}"]`)
          ?? control.closest('.ant-form-item')?.querySelector<HTMLLabelElement>('label');
        const rect = control.getBoundingClientRect();
        return {
          id,
          tagName: control.tagName.toLowerCase(),
          label: label?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          required: label?.classList.contains('ant-form-item-required') ?? false,
          placeholder: control.getAttribute('placeholder') ?? '',
          maxLength: Number(control.getAttribute('maxlength') ?? -1),
          y: rect.y,
        };
      });
      const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button'))
        .filter((button) => button.textContent?.trim())
        .map((button) => {
          const rect = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return {
            text: button.textContent?.replace(/\s+/g, ' ').trim() ?? '',
            x: rect.x,
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
          };
        });
      return {
        title: dialog.getAttribute('aria-label')
          ?? dialog.querySelector('[id$="title"]')?.textContent?.trim()
          ?? dialog.querySelector('.ant-modal-title')?.textContent?.trim()
          ?? '',
        dialogBox: {
          x: dialogRect.x,
          y: dialogRect.y,
          width: dialogRect.width,
          height: dialogRect.height,
        },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        hasDimmedOverlay: overlay
          ? getComputedStyle(overlay).backgroundColor !== 'rgba(0, 0, 0, 0)'
          : false,
        fields,
        buttons,
      };
    });
  }

  /** Nhấn Tab để chuyển focus đến phần tử kế tiếp. */
  async pressTab(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  /** Nhấn Shift+Tab để chuyển focus về phần tử trước đó. */
  async pressShiftTab(): Promise<void> {
    await this.page.keyboard.press('Shift+Tab');
  }

  /** Nhấn Enter để thực thi phần tử đang được focus. */
  async pressEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  /** Nhấn Escape để yêu cầu đóng popup hiện tại. */
  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /** Trả về dòng dữ liệu được xác định bằng Mã ngành nghề unique. */
  industryRow(code: string): Locator {
    return this.locators.row(code);
  }

  /** Cleanup đúng bản ghi theo mã; trả về true khi bản ghi đã được xóa khỏi danh sách. */
  async deleteIfPresent(code: string): Promise<boolean> {
    if (await this.locators.createDialog.isVisible()) {
      await this.click(this.locators.closeButton, 'Đóng popup thêm mới trước khi cleanup');
      if (await this.locators.createDialog.isVisible()) {
        this.logger.info('Popup reset không đóng bằng nút Close, reload danh sách để cleanup');
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
      await expect(this.locators.createDialog).toBeHidden();
    }
    const row = this.industryRow(code);
    await expect(row, `Bản ghi ${code} phải xuất hiện để cleanup`).toBeVisible();
    await this.locators.deleteButton(code).click();
    const confirmation = this.locators.deleteConfirmationDialog;
    await expect(confirmation, `Popup xác nhận xóa ${code} phải hiển thị`).toBeVisible();
    await this.locators.confirmDeleteButton.click();
    await expect(row).toBeHidden();
    return true;
  }
}
