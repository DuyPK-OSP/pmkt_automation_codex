import type { Locator, Page, Response } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
import { collectVirtualDropdownItems } from '@utils/virtual-dropdown.util';
import { VatTuLocators } from './vat-tu.locators';

export const MATERIAL_TYPES = [
  'Hàng hóa',
  'Dịch vụ',
  'Nguyên vật liệu',
  'Công cụ, dụng cụ',
  'Thành phẩm',
  'Bán thành phẩm',
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

export interface CatalogueOption {
  readonly code: string;
  readonly name: string;
  readonly status: string;
  readonly label: string;
}

export interface AccountOption extends CatalogueOption {
  readonly allowed: boolean;
}

/** Dòng danh mục thuế được chuẩn hóa từ DB hoặc combogrid UI. */
export interface TaxOption extends CatalogueOption {
  readonly rate: string;
}

export interface VatTuCatalogues {
  readonly groups: readonly CatalogueOption[];
  readonly units: readonly CatalogueOption[];
}

export interface FullGoodsMaterialInput {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly purchaseName: string;
  readonly saleName: string;
  readonly imagePath: string;
  readonly group: CatalogueOption;
  readonly mainUnit: CatalogueOption;
}

export interface FullGoodsMaterialSelection {
  readonly specialGoodsType: string;
  readonly warrantyUnit: string;
  readonly expenseAccount: string;
  readonly accounts: Readonly<Record<string, string | null>>;
  readonly warehouse: string;
  readonly pricingMethod: string;
  readonly vatRate: string;
  readonly vatRateValue: string;
  readonly exciseTax: string;
  readonly resourceTax: string;
  readonly conversion: Readonly<{
    unit: string;
    ratio: string;
    operation: string;
    description: string;
  }>;
}

export interface FullServiceMaterialInput {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly purchaseName: string;
  readonly saleName: string;
  readonly group: CatalogueOption;
  readonly mainUnit: CatalogueOption;
}

export interface FullServiceMaterialSelection {
  readonly accounts: Readonly<Record<string, string>>;
  readonly vatRate: string;
  readonly exciseTax: string;
  readonly alternativeUnit: string;
}

/** Giá trị mặc định đang hiển thị trên UI của các trường không nhập trong luồng tối thiểu. */
export interface RequiredGoodsUiDefaults {
  readonly purchaseName: string;
  readonly saleName: string;
  readonly description: string;
  readonly groups: readonly string[];
  readonly imageVisible: boolean;
  readonly specialGoodsType: string | null;
  readonly warrantyPeriod: string;
  readonly warrantyUnit: string | null;
  readonly reducedTax: boolean;
  readonly accounts: Readonly<Record<string, string | null>>;
  readonly warehouse: string | null;
  readonly pricingMethod: string | null;
  readonly minimumStock: string;
  readonly maximumStock: string;
  readonly trackLot: boolean;
  readonly trackBarcode: boolean;
  readonly defaultVatRate: string | null;
  readonly defaultVatValue: string;
  readonly importTax: string;
  readonly exportTax: string;
  readonly exciseTax: string | null;
  readonly resourceTax: string | null;
  readonly conversionRowCount: number;
}

export class VatTuPage extends BasePage {
  readonly locators: VatTuLocators;
  readonly addButton: Locator;
  readonly materialTypeDialog: Locator;
  readonly createMaterialDialog: Locator;
  readonly changeMaterialTypeButton: Locator;
  readonly closeConfirmationDialog: Locator;
  readonly groupCombobox: Locator;
  readonly mainUnitCombobox: Locator;
  readonly defaultAccountingTab: Locator;
  readonly accountingAccountDropdown: Locator;
  readonly accountingAccountColumnHeaders: Locator;

  /** Khởi tạo Page Object và các locator dùng chung của màn hình Danh mục Vật tư. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.locators = new VatTuLocators(page);
    this.addButton = this.locators.addButton;
    this.materialTypeDialog = this.locators.materialTypeDialog;
    this.createMaterialDialog = this.locators.createMaterialDialog;
    this.changeMaterialTypeButton = this.locators.changeMaterialTypeButton;
    this.closeConfirmationDialog = this.locators.closeConfirmationDialog;
    this.groupCombobox = this.locators.groupCombobox;
    this.mainUnitCombobox = this.locators.mainUnitCombobox;
    this.defaultAccountingTab = this.locators.defaultAccountingTab;
    this.accountingAccountDropdown = this.locators.visibleDropdown;
    this.accountingAccountColumnHeaders = this.locators.accountingAccountColumnHeaders;
  }

  /** Mở màn hình Danh mục Vật tư và chờ danh sách sẵn sàng thao tác. */
  async openFromDanhMuc(): Promise<void> {
    await this.navigate('/danh-muc');
    await this.click(
      this.locators.catalogueButton,
      'Truy cập menu Vật tư',
    );
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });
  }

  /** Mở popup chọn Loại vật tư trước khi tạo mới. */
  async openMaterialTypePopup(): Promise<void> {
    await this.click(this.addButton, 'Nhấn Thêm mới');
    await this.materialTypeDialog.waitFor({ state: 'visible' });
  }

  /** Trả về locator của một Loại vật tư theo tên hiển thị. */
  materialTypeTitle(type: MaterialType): Locator {
    return this.locators.materialTypeTitle(type);
  }

  /** Trả về mô tả của một thẻ Tính chất hàng hóa dịch vụ. */
  materialTypeDescription(description: string): Locator {
    return this.locators.materialTypeDescription(description);
  }

  /** Đóng popup chọn Tính chất bằng nút X và chờ popup biến mất. */
  async closeMaterialTypePopup(): Promise<void> {
    await this.click(this.locators.closeMaterialTypeButton(), 'Đóng popup chọn Tính chất');
    await this.materialTypeDialog.waitFor({ state: 'hidden' });
  }

  /** Chọn Loại vật tư và chờ form Thêm mới tương ứng hiển thị. */
  async selectMaterialType(type: MaterialType): Promise<void> {
    await this.click(this.materialTypeTitle(type), `Chọn Loại vật tư ${type}`);
    await this.createMaterialDialog.waitFor({ state: 'visible' });
  }

  /** Quay lại popup chọn Loại vật tư từ form Thêm mới hiện tại. */
  async changeMaterialType(): Promise<void> {
    await this.click(this.changeMaterialTypeButton, 'Thay đổi Loại vật tư');
    await this.materialTypeDialog.waitFor({ state: 'visible' });
  }

  /** Trả về locator của nút Hủy trên form Thêm mới Vật tư. */
  cancelButton(): Locator {
    return this.locators.cancelButton();
  }

  /** Nhấn Hủy để yêu cầu đóng form Thêm mới Vật tư. */
  async cancelCreatingMaterial(): Promise<void> {
    await this.click(this.cancelButton(), 'Hủy tạo mới vật tư');
  }

  /** Nhấn icon X ở góc form để yêu cầu đóng form Thêm mới Vật tư. */
  async closeCreatingMaterial(): Promise<void> {
    await this.click(this.locators.closeCreateMaterialButton(), 'Đóng form thêm mới vật tư bằng icon X');
  }

  /** Trả về nội dung cảnh báo khi đóng form có dữ liệu chưa lưu. */
  closeConfirmationMessage(): Locator {
    return this.locators.closeConfirmationMessage();
  }

  /** Trả về nút hành động trên popup Xác nhận đóng để testcase kiểm tra trạng thái hiển thị. */
  closeConfirmationButton(name: 'Xác nhận' | 'Hủy'): Locator {
    return name === 'Xác nhận'
      ? this.locators.confirmCloseButton()
      : this.locators.dismissCloseConfirmationButton();
  }

  /** Hủy thao tác đóng để tiếp tục chỉnh sửa Vật tư. */
  async dismissCloseConfirmation(): Promise<void> {
    await this.click(
      this.locators.dismissCloseConfirmationButton(),
      'Hủy thao tác đóng form',
    );
  }

  /** Xác nhận bỏ dữ liệu chưa lưu và đóng form Thêm mới. */
  async confirmClose(): Promise<void> {
    await this.click(
      this.locators.confirmCloseButton(),
      'Xác nhận đóng form',
    );
  }

  /** Mở danh sách Nhóm vật tư để tìm kiếm hoặc lựa chọn. */
  async openGroupDropdown(): Promise<void> {
    await this.click(this.groupCombobox, 'Mở dropdown Nhóm vật tư');
    await this.groupCombobox.waitFor({ state: 'visible' });
  }

  /** Tìm kiếm Nhóm vật tư theo mã hoặc tên được truyền vào. */
  async searchGroup(query: string): Promise<void> {
    await this.type(this.groupCombobox, query, 'Tìm kiếm Nhóm vật tư');
  }

  /** Trả về locator của một lựa chọn Nhóm vật tư theo nhãn hiển thị. */
  groupOption(label: string): Locator {
    return this.locators.groupOption(label);
  }

  /** Đọc style hiển thị của một Nhóm vật tư trong dropdown. */
  async groupOptionStyle(label: string): Promise<Readonly<{ color: string; opacity: string }>> {
    return this.groupOption(label).evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, opacity: style.opacity };
    });
  }

  /** Tìm và chọn Nhóm vật tư theo dữ liệu danh mục thực tế. */
  async selectGroup(option: CatalogueOption): Promise<void> {
    await this.searchGroup(option.code);
    await this.click(this.groupOption(option.label), `Chọn Nhóm vật tư ${option.label}`);
  }

  /** Trả về locator của Nhóm vật tư đang được chọn. */
  selectedGroup(label: string): Locator {
    return this.locators.selectedGroup(label);
  }

  /** Xóa riêng một tag Nhóm vật tư đã chọn. */
  async removeSelectedGroup(label: string): Promise<void> {
    await this.click(this.locators.removeSelectedGroupButton(label), `Xóa Nhóm vật tư ${label}`);
  }

  /** Xóa nhanh toàn bộ tag Nhóm vật tư đã chọn. */
  async clearAllSelectedGroups(): Promise<void> {
    await this.click(this.locators.clearAllGroupsButton(), 'Xóa toàn bộ Nhóm vật tư đã chọn');
  }

  /** Mở danh sách Đơn vị tính chính. */
  async openMainUnitDropdown(): Promise<void> {
    await this.click(this.mainUnitCombobox, 'Mở dropdown Đơn vị tính chính');
  }

  /** Trả về dropdown Đơn vị tính chính đang hiển thị để spec xác nhận trạng thái đóng/mở. */
  mainUnitDropdown(): Locator {
    return this.locators.visibleDropdown;
  }

  /** Tìm kiếm Đơn vị tính chính theo mã hoặc tên. */
  async searchMainUnit(query: string): Promise<void> {
    await this.type(this.mainUnitCombobox, query, 'Tìm kiếm Đơn vị tính chính');
  }

  /** Đọc các dòng Đơn vị tính đang hiển thị sau khi combogrid lọc dữ liệu. */
  async visibleMainUnitLabels(expectedCount?: number): Promise<readonly string[]> {
    const rows = this.locators.mainUnitRows();
    await rows.first().waitFor({ state: 'visible' });
    return collectVirtualDropdownItems({
      dropdown: this.locators.visibleDropdown,
      readVisibleItems: async () => rows.evaluateAll((elements) => elements.map((row) => {
        const cells = Array.from(row.querySelectorAll('[role="cell"], td'))
          .map((cell) => (cell.textContent ?? '').trim());
        return `${cells[0] ?? ''} — ${cells[1] ?? ''}`.trim();
      }).filter((label) => label !== '—')),
      itemKey: (label) => label,
      expectedCount,
    });
  }

  /** Đọc style hiển thị của từng cell để theo dõi vùng chọn bàn phím trên combogrid Ant Table. */
  async mainUnitRowVisualStates(): Promise<readonly string[]> {
    return this.locators.mainUnitRows().evaluateAll((rows) => rows.map((row) =>
      Array.from(row.querySelectorAll('[role="cell"], td')).map((cell) => {
        const style = getComputedStyle(cell);
        return [style.backgroundColor, style.color, style.outline, cell.className].join('|');
      }).join('||'),
    ));
  }

  /** Gửi phím điều hướng vào combogrid Đơn vị tính chính đang mở. */
  async pressMainUnitKey(key: 'Enter' | 'Escape' | 'ArrowDown' | 'ArrowUp'): Promise<void> {
    await this.mainUnitCombobox.press(key);
  }

  /** Đọc option active của Ant Select cũ để giữ tương thích với các spec legacy. */
  async activeMainUnitLabel(): Promise<string> {
    return (await this.locators.mainUnitActiveOption().innerText()).trim();
  }

  /** Trả về locator của một lựa chọn Đơn vị tính chính. */
  mainUnitOption(label: string): Locator {
    return this.locators.mainUnitOption(label);
  }

  /** Trả về tiêu đề cột của combogrid Đơn vị tính chính. */
  mainUnitColumnHeader(name: string): Locator {
    return this.locators.mainUnitColumnHeader(name);
  }

  /** Đọc cột Trạng thái theo đúng thứ tự row đang hiển thị trong combogrid Đơn vị tính chính. */
  async visibleMainUnitStatuses(expectedCount?: number): Promise<readonly ('HoatDong' | 'NgungHoatDong')[]> {
    const rows = this.locators.mainUnitRows();
    await rows.first().waitFor({ state: 'visible' });
    const collected = await collectVirtualDropdownItems({
      dropdown: this.locators.visibleDropdown,
      readVisibleItems: async () => rows.evaluateAll((elements) => elements.map((row) => {
        const cells = Array.from(row.querySelectorAll('[role="cell"], td'))
          .map((cell) => (cell.textContent ?? '').trim());
        return { key: `${cells[0] ?? ''}|${cells[1] ?? ''}`, status: cells.at(-1) ?? '' };
      })),
      itemKey: (item) => item.key,
      expectedCount,
    });
    return collected.map(({ status }) => status === 'Hoạt động' ? 'HoatDong' : 'NgungHoatDong');
  }

  /** Đọc màu và độ mờ thực tế của một dòng Đơn vị tính chính. */
  async mainUnitOptionStyle(label: string): Promise<Readonly<{ color: string; opacity: string }>> {
    return this.mainUnitOption(label).evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, opacity: style.opacity };
    });
  }

  /** Tìm theo mã để option của dropdown ảo hóa được render rồi chọn đúng đơn vị tính. */
  async selectMainUnit(option: CatalogueOption): Promise<void> {
    await this.searchMainUnit(option.code);
    await this.click(this.mainUnitOption(option.label), `Chọn Đơn vị tính ${option.label}`);
  }

  /** Xóa nhanh Đơn vị tính chính đã chọn bằng icon clear của combogrid. */
  async clearMainUnit(): Promise<void> {
    await this.locators.formField('Đơn vị tính chính').hover();
    await this.click(this.locators.clearMainUnitButton(), 'Xóa nhanh Đơn vị tính chính đã chọn');
  }

  /** Trả về nút thêm nhanh Đơn vị tính dành cho tài khoản có đủ quyền. */
  mainUnitQuickAddButton(): Locator {
    return this.locators.mainUnitQuickAddButton();
  }

  /** Trả về locator của Đơn vị tính chính đang được chọn. */
  selectedMainUnit(label: string): Locator {
    return this.locators.selectedMainUnit(label);
  }

  /** Trả về popup cảnh báo khi người dùng chọn Đơn vị tính Ngừng hoạt động. */
  mainUnitConfirmationDialog(): Locator {
    return this.locators.mainUnitConfirmationDialog();
  }

  /** Trả về nội dung cảnh báo chọn Đơn vị tính Ngừng hoạt động. */
  mainUnitConfirmationMessage(): Locator {
    return this.locators.mainUnitConfirmationMessage();
  }

  /** Trả về nút thao tác trong popup cảnh báo Đơn vị tính Ngừng hoạt động. */
  mainUnitConfirmationButton(name: 'Xác nhận' | 'Hủy'): Locator {
    return this.locators.mainUnitConfirmationButton(name);
  }

  /** Xác nhận tiếp tục sử dụng Đơn vị tính đang Ngừng hoạt động. */
  async confirmInactiveMainUnit(): Promise<void> {
    await this.click(this.mainUnitConfirmationButton('Xác nhận'), 'Xác nhận sử dụng Đơn vị tính Ngừng hoạt động');
  }

  /** Hủy sử dụng Đơn vị tính đang Ngừng hoạt động trong popup cảnh báo. */
  async cancelInactiveMainUnit(): Promise<void> {
    await this.click(this.mainUnitConfirmationButton('Hủy'), 'Hủy sử dụng Đơn vị tính Ngừng hoạt động');
  }

  /** Mở tab Hạch toán ngầm định trên form Vật tư. */
  async openDefaultAccountingTab(): Promise<void> {
    await this.click(this.defaultAccountingTab, 'Chuyển sang Tab Hạch toán ngầm định');
  }

  /** Trả về locator của tab trên form theo tên hiển thị. */
  formTab(name: string): Locator {
    return this.locators.formTab(name);
  }

  /** Mở một tab trên form theo tên được truyền vào. */
  async openFormTab(name: string): Promise<void> {
    await this.click(this.formTab(name), `Chuyển sang Tab ${name}`);
  }

  /** Trả về vùng form-item của trường theo label. */
  formField(label: string): Locator {
    return this.locators.formField(label);
  }

  /** Trả về control có role tương ứng trong trường theo label. */
  formFieldControl(
    label: string,
    role: Parameters<Locator['getByRole']>[0],
  ): Locator {
    return this.locators.formFieldControl(label, role);
  }

  /** Đọc nội dung và màu của dấu bắt buộc được render cạnh label trường. */
  async requiredIndicatorStyle(label: string): Promise<Readonly<{ content: string; color: string }>> {
    return this.locators.requiredIndicator(label).evaluate((element) => {
      const star = Array.from(element.querySelectorAll('*'))
        .find((child) => child.textContent?.trim() === '*');
      if (star) {
        return { content: '*', color: getComputedStyle(star).color };
      }

      const style = getComputedStyle(element, '::before');
      return { content: style.content.replace(/["']/g, ''), color: style.color };
    });
  }

  /** Đọc nội dung và màu dấu bắt buộc của Trạng thái được render ngoài Ant Form Item. */
  async statusRequiredIndicatorStyle(): Promise<Readonly<{ content: string; color: string }>> {
    return this.locators.statusRequiredLabel().evaluate((element) => {
      const star = Array.from(element.querySelectorAll('*')).find((child) => child.textContent?.trim() === '*');
      return {
        content: star?.textContent?.trim() ?? element.textContent?.trim() ?? '',
        color: getComputedStyle(star ?? element).color,
      };
    });
  }

  /** Trả về dấu bắt buộc cạnh label để kiểm tra có/không hiển thị. */
  requiredIndicator(label: string): Locator {
    return this.locators.requiredIndicator(label);
  }

  /** Trả về control TextArea của trường theo label nghiệp vụ. */
  textarea(label: string): Locator {
    return this.locators.textarea(label);
  }

  /** Trả về giá trị đang được chọn của một trường trên form. */
  selectedFormValue(label: string): Locator {
    return this.locators.selectedFormValue(label);
  }

  /** Trả về lựa chọn hợp lệ đầu tiên trong dropdown đang mở. */
  firstEnabledDropdownOption(): Locator {
    return this.locators.firstEnabledDropdownOption();
  }

  /** Chọn giá trị hợp lệ đầu tiên của trường và trả về nội dung đã chọn. */
  async selectFirstFormOption(label: string): Promise<string> {
    await this.click(
      this.formFieldControl(label, 'combobox'),
      `Mở danh sách ${label}`,
    );
    const option = this.firstEnabledDropdownOption();
    const value = (await option.innerText()).trim();
    await this.click(option, `Chọn giá trị hợp lệ đầu tiên của ${label}`);
    await option.waitFor({ state: 'hidden' });
    return value;
  }

  /** Giữ giá trị hiện tại hoặc chọn giá trị hợp lệ đầu tiên nếu trường đang trống. */
  async ensureFirstFormOption(label: string): Promise<string> {
    const selected = this.selectedFormValue(label);
    if (await selected.count()) return (await selected.innerText()).trim();
    return this.selectFirstFormOption(label);
  }

  /** Đọc option hiện tại của một trường select/combogrid mà không thay đổi dữ liệu form. */
  async currentFormOption(label: string): Promise<string | null> {
    const actualValue = (value: string): string | null => {
      const normalized = value.trim();
      return normalized && !normalized.startsWith('Chọn') ? normalized : null;
    };
    const selected = this.selectedFormValue(label);
    if (await selected.count()) {
      const text = actualValue(await selected.innerText());
      if (text) return text;
    }

    const combobox = this.formFieldControl(label, 'combobox');
    if (await combobox.count()) {
      const value = actualValue(await combobox.inputValue());
      if (value) return value;
    }

    const field = this.formField(label);
    const titledValues = (await field.locator('[title]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('title')?.trim() ?? '').filter(Boolean)))
      .filter((value) => value !== label);
    const titledValue = titledValues.map(actualValue).find((value) => value !== null);
    if (titledValue) return titledValue;

    const visibleLines = (await field.innerText()).split(/\r?\n/)
      .map((value) => value.trim())
      .filter((value) => value && value !== label);
    const visibleValue = visibleLines.map(actualValue).find((value) => value !== null);
    if (visibleValue) return visibleValue;
    return null;
  }

  /** Đọc toàn bộ bảy tài khoản hạch toán đang tự động điền trên form. */
  async readDefaultAccountingAccounts(): Promise<Readonly<Record<string, string | null>>> {
    await this.openDefaultAccountingTab();
    const accounts: Record<string, string | null> = {};
    for (const label of [
      'Tài khoản vật tư',
      'Tài khoản giá vốn',
      'Tài khoản doanh thu',
      'Tài khoản hàng bán trả lại',
      'Tài khoản chi phí',
      'Tài khoản chiết khấu',
      'Tài khoản giảm giá',
    ]) {
      accounts[label] = await this.currentFormOption(label);
    }
    return accounts;
  }

  /** Đọc toàn bộ giá trị mặc định hiển thị trên UI trước khi lưu Hàng hóa tối thiểu. */
  async readRequiredGoodsUiDefaults(): Promise<RequiredGoodsUiDefaults> {
    const readInput = async (label: string): Promise<string> => {
      const textbox = this.formFieldControl(label, 'textbox');
      if (await textbox.count()) return textbox.inputValue();
      return this.formFieldControl(label, 'spinbutton').inputValue();
    };
    const purchaseName = await readInput('Tên vật tư khi mua');
    const saleName = await readInput('Tên vật tư khi bán');
    const description = await readInput('Mô tả');
    const groups = (await this.locators.formField('Nhóm vật tư').locator('.ant-select-selection-item').allTextContents())
      .map((value) => value.trim()).filter(Boolean);
    const imageVisible = await this.materialImagePreview().isVisible();
    const specialGoodsType = await this.currentFormOption('Loại hàng hóa đặc trưng');
    const warrantyPeriod = await readInput('Thời hạn bảo hành');
    const warrantyUnit = await this.currentFormOption('Thời hạn bảo hành');
    const reducedTax = await this.checkbox('Giảm thuế theo quy định').isChecked();
    const accounts = await this.readDefaultAccountingAccounts();

    await this.openFormTab('Thông tin kho');
    const warehouse = await this.currentFormOption('Kho mặc định');
    const pricingMethod = await this.currentFormOption('Phương pháp tính giá');
    const minimumStock = await readInput('Tồn tối thiểu');
    const maximumStock = await readInput('Tồn tối đa');
    const trackLot = await this.checkbox('Theo dõi lô').isChecked();
    const trackBarcode = await this.checkbox('Theo dõi mã vạch').isChecked();

    await this.openFormTab('Thông tin thuế');
    const defaultVatRate = await this.currentFormOption('Thuế suất GTGT mặc định');
    const defaultVatValue = await this.vatRateValueInput().inputValue();
    const importTax = await readInput('Thuế nhập khẩu');
    const exportTax = await readInput('Thuế xuất khẩu');
    const exciseTax = await this.currentFormOption('Thuế tiêu thụ đặc biệt');
    const resourceTax = await this.currentFormOption('Thuế tài nguyên');

    await this.openFormTab('Đơn vị quy đổi');
    const conversionRowCount = await this.conversionRowControls('spinbutton').count();
    return {
      purchaseName,
      saleName,
      description,
      groups,
      imageVisible,
      specialGoodsType,
      warrantyPeriod,
      warrantyUnit,
      reducedTax,
      accounts,
      warehouse,
      pricingMethod,
      minimumStock,
      maximumStock,
      trackLot,
      trackBarcode,
      defaultVatRate,
      defaultVatValue,
      importTax,
      exportTax,
      exciseTax,
      resourceTax,
      conversionRowCount,
    };
  }

  /** Nhập giá trị vào trường text hoặc number được xác định bằng label. */
  async fillFormField(label: string, value: string): Promise<void> {
    const textbox = this.formFieldControl(label, 'textbox');
    if (await textbox.count()) {
      await this.type(textbox, value, label);
      return;
    }
    await this.type(this.formFieldControl(label, 'spinbutton'), value, label);
  }

  /** Bật hoặc tắt checkbox theo trạng thái mong muốn. */
  async setCheckbox(name: string, checked: boolean): Promise<void> {
    const checkbox = this.locators.checkbox(name);
    if ((await checkbox.isChecked()) !== checked) {
      await this.click(checkbox, `${checked ? 'Bật' : 'Tắt'} ${name}`);
    }
  }

  /** Trả về checkbox trên form theo accessible name nghiệp vụ. */
  checkbox(name: string): Locator {
    return this.locators.checkbox(name);
  }

  /** Trả về label hiển thị cạnh checkbox theo đúng tên nghiệp vụ. */
  checkboxLabel(name: string): Locator {
    return this.locators.checkboxLabel(name);
  }

  /** Tải ảnh Vật tư lên và chờ API upload hoàn tất. */
  async uploadMaterialImage(filePath: string): Promise<void> {
    const uploadCompleted = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/master-data/vat-tu/anh' &&
        response.ok(),
    );
    await this.locators.uploadInput().setInputFiles(filePath);
    await uploadCompleted;
  }

  /** Chọn file ảnh để kiểm tra validation phía client mà không giả định API upload sẽ được gọi. */
  async chooseMaterialImage(filePath: string): Promise<void> {
    await this.locators.uploadInput().setInputFiles(filePath);
  }

  /** Nhập đầy đủ dữ liệu cho loại Vật tư có quản lý kho và trả về các giá trị đã chọn từ UI. */
  async fillFullGoodsMaterial(
    input: FullGoodsMaterialInput,
  ): Promise<FullGoodsMaterialSelection> {
    await this.fillRequiredMaterialFields(input.code, input.name, input.mainUnit);
    await this.openGroupDropdown();
    await this.selectGroup(input.group);
    await this.closeDropdown();
    await this.setCheckbox('Giảm thuế theo quy định', true);
    const specialGoodsType = await this.specialGoodsTypeCombobox().isVisible()
      ? await this.selectFirstFormOption('Loại hàng hóa đặc trưng')
      : '';
    await this.fillFormField('Thời hạn bảo hành', '12');
    await this.selectWarrantyUnit('Ngày');
    await this.fillFormField('Tên vật tư khi mua', input.purchaseName);
    await this.fillFormField('Tên vật tư khi bán', input.saleName);
    await this.fillFormField('Mô tả', input.description);
    await this.uploadMaterialImage(input.imagePath);
    await this.setMaterialStatus(true);

    const accounts = await this.readDefaultAccountingAccounts();
    const expenseAccount = accounts['Tài khoản chi phí']
      ?? await this.selectFirstFormOption('Tài khoản chi phí');

    await this.openFormTab('Thông tin kho');
    const warehouse = await this.currentFormOption('Kho mặc định')
      ?? await this.selectFirstActiveWarehouse();
    const pricingMethod = await this.selectFirstFormOption('Phương pháp tính giá');
    await this.fillFormField('Tồn tối thiểu', '10');
    await this.fillFormField('Tồn tối đa', '1000');
    await this.setCheckbox('Theo dõi lô', true);
    await this.setCheckbox('Theo dõi mã vạch', true);

    await this.openFormTab('Thông tin thuế');
    const vatRate = await this.selectFirstFormOption('Thuế suất GTGT mặc định');
    const vatRateValue = await this.vatRateValueInput().inputValue();
    await this.fillFormField('Thuế xuất khẩu', '0');
    await this.fillFormField('Thuế nhập khẩu', '0');
    const exciseTax = await this.selectFirstFormOption('Thuế tiêu thụ đặc biệt');
    const resourceTax = await this.selectFirstFormOption('Thuế tài nguyên');

    await this.openFormTab('Đơn vị quy đổi');
    await this.addConversionRow();
    const conversion = await this.fillFirstConversionRow('2', input.mainUnit.label);

    return {
      specialGoodsType,
      warrantyUnit: 'Ngày',
      expenseAccount,
      accounts: { ...accounts, 'Tài khoản chi phí': expenseAccount },
      warehouse,
      pricingMethod,
      vatRate,
      vatRateValue,
      exciseTax,
      resourceTax,
      conversion,
    };
  }

  /** Nhập hai thông tin định danh bắt buộc là Mã và Tên vật tư. */
  async fillMaterialIdentity(code: string, name: string): Promise<void> {
    await this.type(this.materialCodeInput(), code, 'Mã vật tư');
    await this.type(this.materialNameInput(), name, 'Tên vật tư');
  }

  /** Nhập đầy đủ dữ liệu cho loại Dịch vụ và trả về các giá trị đã chọn từ UI. */
  async fillFullServiceMaterial(
    input: FullServiceMaterialInput,
  ): Promise<FullServiceMaterialSelection> {
    await this.fillMaterialIdentity(input.code, input.name);
    await this.openGroupDropdown();
    await this.selectGroup(input.group);
    await this.closeDropdown();
    await this.openMainUnitDropdown();
    await this.selectMainUnit(input.mainUnit);
    await this.setCheckbox('Giảm thuế theo quy định', true);
    await this.fillFormField('Tên vật tư khi mua', input.purchaseName);
    await this.fillFormField('Tên vật tư khi bán', input.saleName);
    await this.fillFormField('Mô tả', input.description);
    await this.setMaterialStatus(true);

    await this.openDefaultAccountingTab();
    const accounts: Record<string, string> = {};
    for (const label of [
      'Tài khoản doanh thu',
      'Tài khoản hàng bán trả lại',
      'Tài khoản chi phí',
      'Tài khoản chiết khấu',
      'Tài khoản giảm giá',
    ]) {
      accounts[label] = await this.ensureFirstFormOption(label);
    }

    await this.openFormTab('Thông tin thuế');
    const vatRate = await this.selectFirstFormOption('Thuế suất GTGT mặc định');
    const exciseTax = await this.selectFirstFormOption('Thuế tiêu thụ đặc biệt');

    const alternativeUnit = await this.fillFirstAlternativeUnit(input.mainUnit.label);
    return { accounts, vatRate, exciseTax, alternativeUnit };
  }

  /** Chọn Đơn vị tính khác hợp lệ đầu tiên, không trùng Đơn vị tính chính. */
  async fillFirstAlternativeUnit(mainUnit: string): Promise<string> {
    await this.openFormTab('Đơn vị tính khác');
    await this.addConversionRow();
    const combobox = this.locators.alternativeUnitCombobox();
    await this.click(combobox, 'Mở Đơn vị tính khác');
    const option = this.locators.alternativeUnitOption(mainUnit);
    const value = (await option.innerText()).trim();
    await this.click(option, 'Chọn Đơn vị tính khác hợp lệ đầu tiên');
    await option.waitFor({ state: 'hidden' });
    return value;
  }

  /** Trả về locator đại diện cho ảnh Vật tư đã upload thành công. */
  materialImagePreview(): Locator {
    return this.locators.materialImagePreview();
  }

  /** Trả về khu vực Hình ảnh hàng hóa trên form. */
  materialImageSection(): Locator {
    return this.locators.materialImageSection();
  }

  /** Trả về label Ảnh theo tên trường được quy định trong manual testcase. */
  materialImageLabel(): Locator {
    return this.locators.materialImageLabel();
  }

  /** Trả về input file của control tải ảnh để xác minh đúng loại control. */
  materialImageInput(): Locator {
    return this.locators.uploadInput();
  }

  /** Trả về cảnh báo dung lượng của control tải ảnh. */
  materialImageSizeError(): Locator {
    return this.locators.materialImageSizeError();
  }

  /** Trả về cảnh báo định dạng không hợp lệ của control tải ảnh. */
  materialImageFormatError(): Locator {
    return this.locators.materialImageFormatError();
  }

  /** Trả về label của trường bắt buộc theo tên trường. */
  requiredFormField(label: string): Locator {
    return this.locators.requiredFormField(label);
  }

  /** Trả về control trong form Thêm mới theo role và accessible name. */
  dialogControl(
    role: Parameters<Locator['getByRole']>[0],
    name: string,
  ): Locator {
    return this.locators.dialogControl(role, name);
  }

  /** Trả về combobox chọn Đơn vị thời hạn bảo hành. */
  warrantyUnitCombobox(): Locator {
    return this.locators.warrantyUnitCombobox();
  }

  /** Trả về một lựa chọn Đơn vị thời hạn bảo hành theo tên. */
  warrantyUnitOption(name: string): Locator {
    return this.locators.namedDropdownOption(name);
  }

  /** Trả về toàn bộ lựa chọn Đơn vị thời hạn bảo hành. */
  warrantyUnitOptions(): Locator {
    return this.locators.enabledDropdownOptions();
  }

  /** Mở danh sách Đơn vị thời hạn bảo hành. */
  async openWarrantyUnitDropdown(): Promise<void> {
    await this.click(this.warrantyUnitCombobox(), 'Mở Đơn vị thời hạn bảo hành');
  }

  /** Chọn Đơn vị thời hạn bảo hành theo tên. */
  async selectWarrantyUnit(name: string): Promise<void> {
    if (!(await this.locators.visibleDropdown.count())) {
      await this.openWarrantyUnitDropdown();
    }
    await this.locators.visibleDropdown.waitFor({ state: 'visible' });
    const option = this.warrantyUnitOption(name);
    await option.waitFor({ state: 'visible' });
    await this.click(option, `Chọn Đơn vị bảo hành ${name}`);
  }

  /** Trả về Đơn vị thời hạn bảo hành đang được chọn. */
  selectedWarrantyUnit(name: string): Locator {
    return this.locators.selectedDialogValue(name);
  }

  /** Trả về combobox Loại hàng hóa đặc trưng. */
  specialGoodsTypeCombobox(): Locator {
    return this.formFieldControl('Loại hàng hóa đặc trưng', 'combobox');
  }

  /** Mở danh sách Loại hàng hóa đặc trưng. */
  async openSpecialGoodsTypeDropdown(): Promise<void> {
    await this.click(
      this.specialGoodsTypeCombobox(),
      'Mở dropdown Loại hàng hóa đặc trưng',
    );
  }

  /** Trả về một lựa chọn Loại hàng hóa đặc trưng theo tên. */
  specialGoodsTypeOption(name: string): Locator {
    return this.locators.namedDropdownOption(name);
  }

  /** Chọn Loại hàng hóa đặc trưng theo tên. */
  async selectSpecialGoodsType(name: string): Promise<void> {
    await this.click(
      this.specialGoodsTypeOption(name),
      `Chọn Loại hàng hóa đặc trưng ${name}`,
    );
  }

  /** Trả về Loại hàng hóa đặc trưng đang được chọn. */
  selectedSpecialGoodsType(name: string): Locator {
    return this.locators.selectedFieldValue('Loại hàng hóa đặc trưng', name);
  }

  /** Trả về Loại vật tư đang hiển thị trên form. */
  materialTypeValue(type: MaterialType): Locator {
    return this.locators.materialTypeValue(type);
  }

  /** Trả về công tắc Trạng thái của Vật tư. */
  statusSwitch(): Locator {
    return this.locators.statusSwitch();
  }

  /** Đặt trạng thái Vật tư thành Hoạt động hoặc Ngừng hoạt động theo đầu vào. */
  async setMaterialStatus(active: boolean): Promise<void> {
    const statusSwitch = this.statusSwitch();
    if ((await statusSwitch.isChecked()) !== active) {
      await this.click(
        statusSwitch,
        `Chuyển Trạng thái sang ${active ? 'Hoạt động' : 'Ngừng hoạt động'}`,
      );
    }
  }

  /** Trả về trường nhập Mã vật tư. */
  materialCodeInput(): Locator {
    return this.formFieldControl('Mã vật tư', 'textbox');
  }

  /** Trả về trường nhập Tên vật tư. */
  materialNameInput(): Locator {
    return this.formFieldControl('Tên vật tư', 'textbox');
  }

  /** Nhập các trường bắt buộc dùng chung gồm Mã, Tên và Đơn vị tính chính. */
  async fillRequiredMaterialFields(
    code: string,
    name: string,
    unit: CatalogueOption,
  ): Promise<void> {
    await this.type(this.materialCodeInput(), code, 'Mã vật tư');
    await this.type(this.materialNameInput(), name, 'Tên vật tư');
    await this.openMainUnitDropdown();
    await this.selectMainUnit(unit);
  }

  /** Nhập trường bắt buộc của Vật tư quản lý kho và trả về Phương pháp tính giá đã chọn. */
  async fillRequiredInventoryMaterialFields(
    code: string,
    name: string,
    unit: CatalogueOption,
  ): Promise<string> {
    await this.fillRequiredMaterialFields(code, name, unit);
    await this.openFormTab('Thông tin kho');
    return this.ensureFirstFormOption('Phương pháp tính giá');
  }

  /** Trả về nút Lưu trên form Thêm mới Vật tư. */
  saveButton(): Locator {
    return this.locators.saveButton();
  }

  /** Nhấn Lưu để tạo Vật tư và đóng form hiện tại. */
  async saveMaterial(): Promise<void> {
    await this.click(this.saveButton(), 'Lưu vật tư');
  }

  /** Trả về nút Lưu và Thêm mới trên form Vật tư. */
  saveAndAddButton(): Locator {
    return this.locators.saveAndAddButton();
  }

  /** Nhấn Lưu và Thêm mới để tạo Vật tư nhưng giữ form mở. */
  async saveAndAddMaterial(): Promise<void> {
    await this.click(this.saveAndAddButton(), 'Lưu vật tư và mở form thêm mới');
  }

  /** Trả về thông báo thành công đang hiển thị. */
  successNotification(): Locator {
    return this.locators.successNotification();
  }

  /** Chờ thông báo thành công và trả về nội dung thông báo thực tế. */
  async waitForSuccessNotification(): Promise<string> {
    await this.successNotification().waitFor({ state: 'visible' });
    return (await this.successNotification().innerText()).trim();
  }

  /** Trả về combobox Phương pháp tính giá. */
  pricingMethodCombobox(): Locator {
    return this.formFieldControl('Phương pháp tính giá', 'combobox');
  }

  /** Trả về một lựa chọn Phương pháp tính giá theo tên. */
  pricingMethodOption(name: string): Locator {
    return this.locators.namedDropdownOption(name);
  }

  /** Trả về toàn bộ lựa chọn Phương pháp tính giá đang hiển thị. */
  pricingMethodOptions(): Locator {
    return this.locators.enabledDropdownOptions();
  }

  /** Trả về Phương pháp tính giá đang được chọn. */
  selectedPricingMethod(name: string): Locator {
    return this.locators.selectedFieldValue('Phương pháp tính giá', name);
  }

  /** Chọn Phương pháp tính giá theo tên. */
  async selectPricingMethod(name: string): Promise<void> {
    await this.openFormTab('Thông tin kho');
    await this.click(this.pricingMethodCombobox(), 'Mở Phương pháp tính giá');
    await this.click(
      this.pricingMethodOption(name),
      `Chọn Phương pháp tính giá ${name}`,
    );
  }

  /** Xóa giá trị Phương pháp tính giá đang chọn. */
  async clearPricingMethod(): Promise<void> {
    await this.locators.formField('Phương pháp tính giá').hover();
    if (await this.locators.clearPricingMethodButton().isVisible()) {
      await this.click(this.locators.clearPricingMethodButton(), 'Xóa Phương pháp tính giá');
    }
  }

  /** Trả về select Thuế suất GTGT mặc định. */
  defaultVatRateCombobox(): Locator {
    return this.formFieldControl('Thuế suất GTGT mặc định', 'combobox');
  }

  /** Trả về các lựa chọn đang hiển thị của Thuế suất GTGT mặc định. */
  defaultVatRateOptions(): Locator {
    return this.locators.enabledDropdownOptions();
  }

  /** Chọn Thuế suất GTGT mặc định theo đúng giá trị hiển thị. */
  async selectDefaultVatRate(value: string): Promise<void> {
    await this.openFormTab('Thông tin thuế');
    await this.click(this.defaultVatRateCombobox(), 'Mở Thuế suất GTGT mặc định');
    await this.click(this.locators.defaultVatRateOption(value), `Chọn Thuế suất GTGT mặc định ${value}`);
  }

  /** Xóa nhanh Thuế suất GTGT mặc định đang chọn. */
  async clearDefaultVatRate(): Promise<void> {
    const field = this.formField('Thuế suất GTGT mặc định');
    await field.hover();
    await this.click(this.locators.clearDefaultVatRateButton(), 'Xóa Thuế suất GTGT mặc định');
  }

  /** Trả về ô numeric Giá trị thuế suất GTGT. */
  vatRateValueInput(): Locator {
    return this.formFieldControl('Giá trị thuế suất GTGT', 'spinbutton');
  }

  /** Trả về combobox Kho mặc định. */
  warehouseCombobox(): Locator {
    return this.formFieldControl('Kho mặc định', 'combobox');
  }

  /** Trả về dropdown Kho đang hiển thị. */
  warehouseDropdown(): Locator {
    return this.locators.visibleDropdown;
  }

  /** Trả về các tiêu đề cột trong combogrid Kho. */
  warehouseColumnHeaders(): Locator {
    return this.locators.warehouseColumnHeaders();
  }

  /** Trả về một lựa chọn Kho theo nhãn hiển thị. */
  warehouseOption(label: string): Locator {
    return this.locators.warehouseOptionRow(label);
  }

  /** Trả về dòng dữ liệu của một Kho trong combogrid. */
  warehouseOptionRow(label: string): Locator {
    return this.locators.warehouseOptionRow(label);
  }

  /** Mở combogrid Kho mặc định. */
  async openWarehouseDropdown(): Promise<void> {
    await this.openFormTab('Thông tin kho');
    await this.click(this.warehouseCombobox(), 'Mở combogrid Kho mặc định');
    await this.warehouseDropdown().waitFor({ state: 'visible' });
  }

  /** Trả về tiêu đề các cột của combogrid thuế đang mở. */
  taxColumnHeaders(): Locator {
    return this.locators.taxColumnHeaders();
  }

  /** Cuộn hết virtual dropdown và đọc toàn bộ nhãn thuế đang hiển thị theo thứ tự UI. */
  async visibleTaxLabels(expectedCount?: number): Promise<readonly string[]> {
    const rows = this.locators.taxOptions();
    await rows.first().waitFor({ state: 'visible' });
    return collectVirtualDropdownItems({
      dropdown: this.locators.visibleDropdown,
      readVisibleItems: async () => rows.evaluateAll((elements) => elements
        .map((row) => (row.textContent ?? '').trim().replace(/\s*\(Ngừng hoạt động\)\s*$/u, ''))
        .filter(Boolean)),
      itemKey: (item) => item,
      expectedCount,
    });
  }

  /** Tìm kiếm Kho theo mã hoặc tên. */
  async searchWarehouse(query: string): Promise<void> {
    await this.type(this.warehouseCombobox(), query, 'Tìm kiếm Kho mặc định');
  }

  /** Đọc các Kho đang hiển thị sau khi combogrid lọc dữ liệu. */
  async visibleWarehouseLabels(expectedCount?: number): Promise<readonly string[]> {
    const options = this.locators.warehouseOptions();
    await options.first().waitFor({ state: 'visible' });
    return collectVirtualDropdownItems({
      dropdown: this.locators.visibleDropdown,
      readVisibleItems: async () => options.evaluateAll((rows) => rows.map((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        const code = cells[0]?.textContent?.trim() ?? '';
        const name = (cells[1]?.textContent?.trim() ?? '').replace(/\s*\(Ngừng hoạt động\)\s*$/u, '');
        return code && name ? `${code} — ${name}` : '';
      }).filter(Boolean)),
      itemKey: (label) => label,
      expectedCount,
    });
  }

  /** Chọn Kho hoạt động đầu tiên từ combogrid và trả về nhãn chuẩn hóa mã — tên. */
  async selectFirstActiveWarehouse(): Promise<string> {
    await this.openWarehouseDropdown();
    const row = this.locators.warehouseOptions()
      .filter({ hasNotText: 'Ngừng hoạt động' })
      .first();
    await row.waitFor({ state: 'visible' });
    const cells = row.locator('td');
    const code = (await cells.nth(0).innerText()).trim();
    const name = (await cells.nth(1).innerText()).trim();
    await this.click(row, `Chọn kho hoạt động đầu tiên ${code}`);
    return `${code} — ${name}`;
  }

  /** Gửi phím điều hướng vào combogrid Kho mặc định đang mở. */
  async pressWarehouseKey(key: 'Enter' | 'Escape' | 'ArrowDown' | 'ArrowUp'): Promise<void> {
    await this.warehouseCombobox().press(key);
  }

  /** Đọc dòng Kho đang được Ant Select đánh dấu active. */
  async activeWarehouseLabel(): Promise<string> {
    const option = this.locators.warehouseActiveOption().first();
    if (await option.count() === 0) return '';
    return (await option.innerText()).trim();
  }

  /** Đọc màu và độ mờ thực tế của một dòng Kho. */
  async warehouseOptionStyle(label: string): Promise<Readonly<{ color: string; opacity: string }>> {
    return this.warehouseOptionRow(label).evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, opacity: style.opacity };
    });
  }

  /** Tìm và chọn Kho theo dữ liệu danh mục thực tế. */
  async selectWarehouse(option: CatalogueOption): Promise<void> {
    await this.searchWarehouse(option.code);
    await this.click(this.warehouseOption(option.label), `Chọn kho ${option.label}`);
  }

  /** Xóa nhanh Kho mặc định đã chọn bằng icon clear của combogrid. */
  async clearWarehouse(): Promise<void> {
    await this.locators.formField('Kho mặc định').hover();
    await this.click(this.locators.clearWarehouseButton(), 'Xóa nhanh Kho mặc định đã chọn');
  }

  /** Trả về nút Thêm nhanh trong combogrid Kho mặc định. */
  warehouseQuickAddButton(): Locator {
    return this.locators.warehouseQuickAddButton();
  }

  /** Mở popup Thêm mới nhanh Kho từ combogrid Kho mặc định. */
  async openWarehouseQuickAdd(): Promise<void> {
    if (!await this.warehouseDropdown().isVisible()) await this.openWarehouseDropdown();
    await this.click(this.warehouseQuickAddButton(), 'Mở form Thêm nhanh Kho');
    await this.locators.warehouseQuickAddDialog().waitFor({ state: 'visible' });
  }

  /** Trả về popup Thêm mới nhanh Kho. */
  warehouseQuickAddDialog(): Locator {
    return this.locators.warehouseQuickAddDialog();
  }

  /** Trả về ô nhập liệu của form Thêm mới nhanh Kho. */
  warehouseQuickAddTextbox(name: 'Mã kho' | 'Tên kho'): Locator {
    return this.locators.warehouseQuickAddTextbox(name);
  }

  /** Trả về công tắc Trạng thái của form Thêm mới nhanh Kho. */
  warehouseQuickAddStatus(): Locator {
    return this.locators.warehouseQuickAddStatus();
  }

  /** Nhập hai trường bắt buộc của form Thêm mới nhanh Kho. */
  async fillWarehouseQuickAdd(code: string, name: string): Promise<void> {
    await this.type(this.warehouseQuickAddTextbox('Mã kho'), code, 'Nhập Mã kho thêm nhanh');
    await this.type(this.warehouseQuickAddTextbox('Tên kho'), name, 'Nhập Tên kho thêm nhanh');
  }

  /** Lưu form Thêm mới nhanh Kho. */
  async saveWarehouseQuickAdd(): Promise<void> {
    await this.click(this.locators.warehouseQuickAddAction('Lưu'), 'Lưu Kho thêm nhanh');
  }

  /** Hủy form Thêm mới nhanh Kho. */
  async cancelWarehouseQuickAdd(): Promise<void> {
    await this.click(this.locators.warehouseQuickAddAction('Hủy'), 'Hủy form Thêm nhanh Kho');
  }

  /** Trả về validation dưới trường bắt buộc của form Thêm mới nhanh Kho. */
  warehouseQuickAddValidation(label: 'Mã kho' | 'Tên kho'): Locator {
    return this.locators.warehouseQuickAddValidation(label);
  }

  /** Trả về popup cảnh báo dùng Kho Ngừng hoạt động. */
  warehouseConfirmationDialog(): Locator {
    return this.locators.mainUnitConfirmationDialog();
  }

  /** Trả về nội dung cảnh báo dùng Kho Ngừng hoạt động. */
  warehouseConfirmationMessage(): Locator {
    return this.locators.mainUnitConfirmationMessage();
  }

  /** Xác nhận hoặc hủy sử dụng Kho Ngừng hoạt động. */
  async chooseInactiveWarehouse(action: 'Xác nhận' | 'Hủy'): Promise<void> {
    await this.click(this.locators.mainUnitConfirmationButton(action), `${action} sử dụng Kho Ngừng hoạt động`);
  }

  /** Trả về Kho đang được chọn. */
  selectedWarehouse(label: string): Locator {
    const [code = '', name = ''] = label.split(' — ');
    return this.formField('Kho mặc định').getByText(`${code} - ${name}`, { exact: false });
  }

  /** Mở dropdown của trường Thuế được xác định bằng label. */
  async openTaxDropdown(label: string): Promise<void> {
    await this.openFormTab('Thông tin thuế');
    await this.click(this.formFieldControl(label, 'combobox'), `Mở ${label}`);
    await this.locators.visibleDropdown.waitFor({ state: 'visible' });
  }

  /** Trả về một lựa chọn Thuế theo nhãn hiển thị. */
  taxOption(label: string): Locator {
    return this.locators.dropdownOption(label);
  }

  /** Tìm kiếm giá trị trong dropdown Thuế theo label trường. */
  async searchTax(label: string, query: string): Promise<void> {
    await this.type(this.formFieldControl(label, 'combobox'), query, `Tìm kiếm ${label}`);
  }

  /** Tìm và chọn giá trị Thuế theo dữ liệu danh mục thực tế. */
  async selectTax(label: string, option: CatalogueOption): Promise<void> {
    await this.searchTax(label, option.code);
    await this.click(this.taxOption(option.label), `Chọn ${label} ${option.label}`);
  }

  /** Trả về giá trị Thuế đang được chọn. */
  selectedTax(label: string, value: string): Locator {
    return this.locators.selectedFieldValue(label, value);
  }

  /** Mở dropdown Đơn vị tính tại dòng quy đổi đầu tiên. */
  async openFirstConversionUnitDropdown(): Promise<void> {
    await this.click(this.conversionRowControls('combobox').first(), 'Mở Đơn vị tính quy đổi');
  }

  /** Tìm kiếm Đơn vị tính trong dòng quy đổi đầu tiên. */
  async searchFirstConversionUnit(query: string): Promise<void> {
    await this.type(this.conversionRowControls('combobox').first(), query, 'Tìm kiếm Đơn vị tính quy đổi');
  }

  /** Chọn Đơn vị tính cho dòng quy đổi đầu tiên. */
  async selectFirstConversionUnit(option: CatalogueOption): Promise<void> {
    await this.searchFirstConversionUnit(option.code);
    await this.click(this.locators.dropdownOption(option.label), `Chọn Đơn vị quy đổi ${option.label}`);
  }

  /** Trả về Đơn vị tính đang chọn tại dòng quy đổi đầu tiên. */
  selectedFirstConversionUnit(label: string): Locator {
    return this.locators.selectedConversionUnit(label);
  }

  /** Trả về toàn bộ option đang render của dropdown Đơn vị tính quy đổi. */
  conversionUnitOptions(): Locator {
    return this.locators.enabledDropdownOptions();
  }

  /** Đọc style của option Đơn vị tính quy đổi theo nhãn. */
  async conversionUnitOptionStyle(label: string): Promise<Readonly<{ color: string; opacity: string }>> {
    return this.locators.dropdownOption(label).evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, opacity: style.opacity };
    });
  }

  /** Đọc nhãn option đang active khi điều hướng bàn phím trên dropdown quy đổi. */
  async activeConversionUnitLabel(): Promise<string> {
    return (await this.locators.mainUnitActiveOption().innerText()).trim();
  }

  /** Gửi phím điều hướng vào combogrid Đơn vị tính trên dòng quy đổi đầu tiên. */
  async pressFirstConversionUnitKey(key: 'Enter' | 'Escape' | 'ArrowDown' | 'ArrowUp'): Promise<void> {
    await this.conversionRowControls('combobox').first().press(key);
  }

  /** Xóa nhanh Đơn vị tính đã chọn trên dòng quy đổi đầu tiên. */
  async clearFirstConversionUnit(): Promise<void> {
    await this.conversionRowControls('combobox').first().hover();
    await this.click(this.locators.clearConversionUnitButton(), 'Xóa Đơn vị tính quy đổi đã chọn');
  }

  /** Trả về nút Thêm nhanh trong dropdown Đơn vị tính của dòng quy đổi. */
  conversionUnitQuickAddButton(): Locator {
    return this.locators.conversionUnitQuickAddButton();
  }

  /** Trả về thông báo validation của trường theo label và nội dung lỗi. */
  validationMessage(fieldLabel: string, message: string): Locator {
    return this.locators.validationMessage(fieldLabel, message);
  }

  /** Trả về validation thực tế dưới một trường form. */
  fieldValidation(fieldLabel: string): Locator {
    return this.locators.fieldValidation(fieldLabel);
  }

  /** Trả về thông báo hệ thống theo nội dung hiển thị chính xác. */
  notificationMessage(message: string): Locator {
    return this.locators.notificationMessage(message);
  }

  /** Rời trường đang nhập để kích hoạt validation hoặc chuẩn hóa dữ liệu. */
  async commitCurrentFormField(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  /** Đóng và loại bỏ dữ liệu trên form Thêm mới nếu form đang mở. */
  async discardMaterialFormIfOpen(): Promise<void> {
    if (!(await this.createMaterialDialog.isVisible())) return;
    await this.cancelCreatingMaterial();
    if (await this.closeConfirmationDialog.isVisible()) {
      await this.confirmClose();
    }
  }

  /** Trả về ô tìm kiếm trên danh sách Vật tư. */
  materialSearchInput(): Locator {
    return this.locators.materialSearchInput();
  }

  /** Lấy Mã vật tư đầu tiên đang tồn tại từ dữ liệu bảng UI thực tế. */
  async firstExistingMaterialCode(): Promise<string> {
    const codeButton = this.locators.firstExistingMaterialCode();
    await codeButton.waitFor({ state: 'visible' });
    return (await codeButton.innerText()).trim();
  }

  /** Tìm kiếm Vật tư theo mã hoặc từ khóa và chờ danh sách cập nhật. */
  async searchMaterial(query: string): Promise<void> {
    const searchInput = this.materialSearchInput();
    if (query.length > 0 && await searchInput.inputValue() === query) {
      const resetResponse = this.page.waitForResponse((response) =>
        this.isMaterialSearchResponse(response, ''),
      );
      await this.type(searchInput, '', 'Xóa điều kiện tìm kiếm vật tư');
      await resetResponse;
    }

    const searchResponse = this.page.waitForResponse((response) => {
      return this.isMaterialSearchResponse(response, query);
    });
    await this.type(searchInput, query, 'Tìm kiếm vật tư');
    await searchResponse;
  }

  /** Xác định response có phải kết quả tìm kiếm Vật tư của request hiện tại hay không. */
  private isMaterialSearchResponse(response: Response, query: string): boolean {
    const url = new URL(response.url());
    const search = url.searchParams.get('search') ?? '';
    return response.status() === 200
      && url.pathname === '/api/master-data/vat-tu'
      && search === query;
  }

  /** Trả về dòng Vật tư được xác định bằng mã unique. */
  materialRow(code: string): Locator {
    return this.locators.materialRow(code);
  }

  /** Cleanup đúng Vật tư theo mã; trả về true khi bản ghi đã được xóa. */
  async deleteMaterialIfPresent(code: string): Promise<boolean> {
    if (!code.startsWith('AUTO_')) {
      throw new Error(`Từ chối cleanup vật tư không thuộc automation: ${code}`);
    }

    await this.discardMaterialFormIfOpen();
    const details = this.materialDetails(code);
    if (await details.isVisible()) {
      await this.page.keyboard.press('Escape');
      await details.waitFor({ state: 'hidden' });
    }
    const searchInput = this.materialSearchInput();
    await searchInput.waitFor({ state: 'visible' });
    // Test nghiệp vụ thường vừa tìm đúng mã trước khi teardown. Tái sử dụng kết quả
    // đang hiển thị để tránh chờ request reset không được UI phát sinh.
    if (await searchInput.inputValue() !== code) await this.searchMaterial(code);
    if (!(await this.materialRow(code).isVisible())) return false;

    await this.click(
      this.locators.deleteMaterialButton(code),
      `Mở xác nhận xóa vật tư ${code}`,
    );
    const confirmation = this.locators.deleteConfirmation();
    await confirmation.waitFor({ state: 'visible' });
    const deleteResponse = this.page.waitForResponse((response) => {
      const request = response.request();
      const url = new URL(response.url());
      return request.method() === 'DELETE'
        && url.pathname.startsWith('/api/master-data/vat-tu/');
    });
    await this.click(
      this.locators.confirmDeleteButton(),
      `Xác nhận xóa vật tư ${code}`,
    );
    const response = await deleteResponse;
    await confirmation.waitFor({ state: 'hidden' });
    if (!response.ok()) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Cleanup ${code} bị backend từ chối (${response.status()}): ${detail}`);
    }
    const deletedRow = this.materialRow(code);
    await deletedRow.waitFor({ state: 'hidden' });
    if (await deletedRow.isVisible()) {
      throw new Error(`Cleanup ${code} thất bại: bản ghi vẫn hiển thị trên UI`);
    }
    return true;
  }

  /** Mở chi tiết Vật tư theo mã và chờ form chi tiết hiển thị. */
  async openMaterialDetails(code: string): Promise<void> {
    await this.click(
      this.locators.materialDetailsButton(code),
      `Mở chi tiết vật tư ${code}`,
    );
  }

  /** Trả về vùng chi tiết của Vật tư theo mã. */
  materialDetails(code: string): Locator {
    return this.locators.materialDetails(code);
  }

  /** Trả về vùng hiển thị một trường trong chi tiết Vật tư. */
  materialDetailField(code: string, label: string): Locator {
    return this.locators.materialDetailField(code, label);
  }

  /** Trả về control của một trường trong chi tiết Vật tư. */
  materialDetailControl(
    code: string,
    label: string,
    role: Parameters<Locator['getByRole']>[0],
  ): Locator {
    return this.locators.materialDetailControl(code, label, role);
  }

  /** Trả về giá trị được chọn của một trường trong chi tiết Vật tư. */
  materialDetailSelectedValue(
    code: string,
    label: string,
    value: string,
  ): Locator {
    return this.locators.materialDetailSelectedValue(code, label, value);
  }

  /** Trả về nội dung cần tìm trong chi tiết Vật tư. */
  materialDetailText(code: string, value: string): Locator {
    return this.locators.materialDetailText(code, value);
  }

  /** Trả về công tắc Trạng thái trong chi tiết Vật tư. */
  materialDetailStatusSwitch(code: string): Locator {
    return this.locators.materialDetailStatusSwitch(code);
  }

  /** Trả về ảnh đã lưu trong chi tiết Vật tư. */
  materialDetailImage(code: string): Locator {
    return this.locators.materialDetailImage(code);
  }

  /** Trả về tab trong chi tiết Vật tư theo tên. */
  materialDetailTab(code: string, tabName: string): Locator {
    return this.locators.materialDetailTab(code, tabName);
  }

  /** Mở một tab trong chi tiết Vật tư theo tên. */
  async openMaterialDetailTab(code: string, tabName: string): Promise<void> {
    await this.click(
      this.materialDetailTab(code, tabName),
      `Mở Tab ${tabName} trên chi tiết vật tư`,
    );
  }

  /** Trả về bảng Đơn vị quy đổi trên form. */
  conversionGrid(): Locator {
    return this.locators.conversionGrid();
  }

  /** Trả về nút thêm dòng Đơn vị quy đổi. */
  addConversionRowButton(): Locator {
    return this.locators.addConversionRowButton();
  }

  /** Thêm một dòng mới vào bảng Đơn vị quy đổi. */
  async addConversionRow(): Promise<void> {
    await this.click(this.addConversionRowButton(), 'Thêm dòng Đơn vị quy đổi');
  }

  /** Trả về tiêu đề cột của bảng Đơn vị quy đổi. */
  conversionColumnHeader(name: string): Locator {
    return this.locators.conversionColumnHeader(name);
  }

  /** Trả về toàn bộ tiêu đề cột theo thứ tự hiển thị của bảng Đơn vị quy đổi. */
  conversionColumnHeaders(): Locator {
    return this.locators.conversionColumnHeaders();
  }

  /** Trả về ô Phép tính đang hiển thị giá trị được chọn trên dòng quy đổi. */
  conversionOperationCell(value: string): Locator {
    return this.locators.conversionOperationCell(value);
  }

  /** Trả về các control theo role tại dòng quy đổi đầu tiên. */
  conversionRowControls(role: Parameters<Locator['getByRole']>[0]): Locator {
    return this.locators.conversionRowControls(role);
  }

  /** Trả về các thông báo validation trong bảng Đơn vị quy đổi. */
  conversionValidationMessages(): Locator {
    return this.locators.conversionValidationMessages();
  }

  /** Trả về thông báo nghiệp vụ tại lưới Đơn vị quy đổi. */
  conversionMessage(message: string): Locator {
    return this.locators.conversionMessage(message);
  }

  /** Chọn Đơn vị tính cho dòng quy đổi theo chỉ số bắt đầu từ 0. */
  async selectConversionUnit(rowIndex: number, option: CatalogueOption): Promise<void> {
    const input = this.conversionRowControls('combobox').nth(rowIndex * 2);
    await this.type(input, option.code, `Tìm Đơn vị tính dòng quy đổi ${rowIndex + 1}`);
    await input.press('Enter');
    await this.locators.selectedConversionUnit(option.label).nth(rowIndex).waitFor({ state: 'visible' });
  }

  /** Nhập tỷ lệ cho dòng quy đổi theo chỉ số bắt đầu từ 0. */
  async fillConversionRatio(rowIndex: number, value: string): Promise<void> {
    await this.type(this.conversionRowControls('spinbutton').nth(rowIndex), value, `Tỷ lệ dòng quy đổi ${rowIndex + 1}`);
  }

  /** Mở danh sách Phép tính của dòng quy đổi. */
  async openConversionOperation(rowIndex = 0): Promise<void> {
    await this.click(this.conversionRowControls('combobox').nth(rowIndex * 2 + 1), `Mở Phép tính dòng ${rowIndex + 1}`);
  }

  /** Chọn Phép tính của dòng quy đổi. */
  async selectConversionOperation(value: 'Nhân' | 'Chia', rowIndex = 0): Promise<void> {
    await this.openConversionOperation(rowIndex);
    await this.click(this.locators.visibleDropdownOption(value), `Chọn phép tính ${value}`);
  }

  /** Trả về Mô tả tự sinh của dòng quy đổi. */
  conversionDescription(rowIndex = 0): Locator {
    return this.conversionRowControls('textbox').nth(rowIndex);
  }

  /** Xóa ngay dòng quy đổi theo chỉ số bắt đầu từ 0. */
  async deleteConversionRow(rowIndex = 0): Promise<void> {
    await this.click(this.locators.deleteConversionRowButton().nth(rowIndex), `Xóa dòng quy đổi ${rowIndex + 1}`);
  }

  /** Nhập dòng quy đổi đầu tiên và trả về Đơn vị quy đổi cùng Phép tính đã chọn. */
  async fillFirstConversionRow(ratio: string, mainUnit: string): Promise<{
    readonly unit: string;
    readonly ratio: string;
    readonly operation: string;
    readonly description: string;
  }> {
    const comboboxes = this.conversionRowControls('combobox');
    await this.click(comboboxes.nth(0), 'Mở Đơn vị quy đổi');
    const unitOption = this.locators.conversionUnitOption(mainUnit);
    const unit = (await unitOption.innerText()).trim();
    await this.click(unitOption, 'Chọn Đơn vị quy đổi hợp lệ đầu tiên');
    await unitOption.waitFor({ state: 'hidden' });

    await this.type(
      this.conversionRowControls('spinbutton').first(),
      ratio,
      'Tỷ lệ quy đổi',
    );

    await this.click(comboboxes.nth(1), 'Mở Phép tính quy đổi');
    const operationOption = this.firstEnabledDropdownOption();
    const operation = (await operationOption.innerText()).trim();
    await this.click(operationOption, 'Chọn Phép tính hợp lệ đầu tiên');
    await operationOption.waitFor({ state: 'hidden' });
    const actualRatio = await this.conversionRowControls('spinbutton').first().inputValue();
    const description = await this.conversionDescription().inputValue();
    return { unit, ratio: actualRatio, operation, description };
  }

  /** Trả về một lựa chọn Tài khoản kế toán theo nhãn. */
  accountingAccountOption(label: string): Locator {
    return this.locators.accountingAccountOptionRow(label);
  }

  /** Trả về dòng dữ liệu của Tài khoản trong combogrid. */
  accountingAccountOptionRow(label: string): Locator {
    return this.locators.accountingAccountOptionRow(label);
  }

  /** Trả về nhãn các Tài khoản đang hiển thị trong combogrid theo đúng thứ tự UI. */
  async visibleAccountingAccountLabels(expectedCount?: number): Promise<readonly string[]> {
    const options = this.locators.accountingAccountOptions();
    await options.first().waitFor({ state: 'visible' });
    return collectVirtualDropdownItems({
      dropdown: this.locators.visibleDropdown,
      readVisibleItems: async () => Promise.all((await options.all()).map(async (row) => {
        const cells = await row.getByRole('cell').allTextContents();
        return `${cells[0]?.trim()} — ${cells[1]?.trim()}`;
      })),
      itemKey: (label) => label,
      expectedCount,
    });
  }

  /** Trả về màu chữ thực tế của một dòng Tài khoản trong combogrid. */
  async accountingAccountTextColor(label: string): Promise<string> {
    return this.accountingAccountOptionRow(label).evaluate((element) => getComputedStyle(element).color);
  }

  /** Đọc style từng cell để theo dõi vùng chọn bàn phím trên combogrid Tài khoản dạng table. */
  async accountingAccountRowVisualStates(): Promise<readonly string[]> {
    return this.locators.accountingAccountOptions().evaluateAll((rows) => rows.map((row) =>
      Array.from(row.querySelectorAll('[role="cell"], td')).map((cell) => {
        const style = getComputedStyle(cell);
        return [style.backgroundColor, style.color, style.outline, cell.className].join('|');
      }).join('||'),
    ));
  }

  /** Trả về popup xác nhận dùng Tài khoản đang Ngừng hoạt động. */
  accountConfirmationDialog(): Locator {
    return this.locators.accountConfirmationDialog();
  }

  /** Trả về nút thao tác trong popup xác nhận Tài khoản Ngừng hoạt động. */
  accountConfirmationButton(name: 'Xác nhận' | 'Hủy'): Locator {
    return this.locators.accountConfirmationButton(name);
  }

  /** Xác nhận hoặc hủy việc sử dụng Tài khoản đang Ngừng hoạt động. */
  async resolveInactiveAccount(useAccount: boolean): Promise<void> {
    await this.click(
      this.accountConfirmationButton(useAccount ? 'Xác nhận' : 'Hủy'),
      `${useAccount ? 'Xác nhận' : 'Hủy'} sử dụng Tài khoản Ngừng hoạt động`,
    );
  }

  /** Gửi phím điều hướng vào combogrid Tài khoản đang mở. */
  async pressAccountingAccountKey(fieldLabel: string, key: string): Promise<void> {
    await this.accountCombobox(fieldLabel).press(key);
  }

  /** Trả về nhãn dòng Tài khoản đang được keyboard focus. */
  async activeAccountingAccountLabel(): Promise<string> {
    return (await this.locators.accountingAccountActiveOption().innerText()).trim();
  }

  /** Xóa nhanh giá trị Tài khoản của trường được chỉ định. */
  async clearAccountingAccount(fieldLabel: string): Promise<void> {
    const field = this.accountFormItem(fieldLabel);
    await field.hover();
    await this.click(this.locators.accountClearButton(fieldLabel), `Xóa nhanh ${fieldLabel}`);
  }

  /** Mở combogrid Tài khoản của trường được xác định bằng label. */
  async openAccountingAccountDropdown(fieldLabel: string): Promise<void> {
    await this.click(
      this.accountCombobox(fieldLabel),
      `Mở combogrid ${fieldLabel}`,
    );
    await this.accountingAccountDropdown.waitFor({ state: 'visible' });
  }

  /** Tìm kiếm Tài khoản theo số hoặc tên trong trường được chỉ định. */
  async searchAccountingAccount(fieldLabel: string, query: string): Promise<void> {
    await this.type(
      this.accountCombobox(fieldLabel),
      query,
      `Tìm kiếm ${fieldLabel}`,
    );
  }

  /** Tìm và chọn Tài khoản kế toán theo dữ liệu thực tế. */
  async selectAccountingAccount(
    fieldLabel: string,
    option: AccountOption,
  ): Promise<void> {
    await this.searchAccountingAccount(fieldLabel, option.code);
    await this.click(
      this.accountingAccountOption(option.label),
      `Chọn ${fieldLabel} ${option.label}`,
    );
  }

  /** Trả về Tài khoản kế toán đang được chọn của một trường. */
  selectedAccountingAccount(fieldLabel: string, label: string): Locator {
    return this.locators.selectedAccountValue(fieldLabel, label);
  }

  /** Đóng dropdown đang mở bằng phím Escape. */
  async closeDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /** Trả về locator của account form item trong màn hình Vật tư. */
  private accountFormItem(fieldLabel: string): Locator {
    return this.formField(fieldLabel);
  }

  /** Trả về locator của account combobox trong màn hình Vật tư. */
  private accountCombobox(fieldLabel: string): Locator {
    return this.locators.accountCombobox(fieldLabel);
  }

}
