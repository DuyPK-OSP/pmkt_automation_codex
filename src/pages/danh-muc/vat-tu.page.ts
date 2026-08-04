import type { Locator, Page, Response } from '@playwright/test';
import { BasePage } from '@pages/common/base.page';
import type { Logger } from '@utils/logger';
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
  readonly warehouse: string;
  readonly pricingMethod: string;
  readonly vatRate: string;
  readonly exciseTax: string;
  readonly resourceTax: string;
  readonly conversion: Readonly<{ unit: string; operation: string }>;
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
  readonly resourceTax: string;
  readonly alternativeUnit: string;
}

interface GroupResponseItem {
  readonly ma: string;
  readonly ten: string;
  readonly trangThai: string;
}

interface UnitResponseItem {
  readonly maDonViTinh: string;
  readonly tenDonViTinh: string;
  readonly trangThai: string;
}

interface AccountResponseItem {
  readonly soTaiKhoan: string;
  readonly tenTaiKhoan: string;
  readonly trangThai: string;
  readonly choPhepHachToan: boolean;
}

interface WarehouseResponseItem {
  readonly maKho: string;
  readonly tenKho: string;
  readonly trangThai: string;
}

interface TaxResponseItem {
  readonly ma: string;
  readonly ten: string;
  readonly trangThai: string;
}

interface ListResponse<T> {
  readonly data?: readonly T[];
  readonly pagination?: {
    readonly totalPages?: number;
  };
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

  /** Mở Danh mục Vật tư, đồng thời thu thập Nhóm vật tư và Đơn vị tính thực tế từ API. */
  async openFromDanhMucAndCollectCatalogues(): Promise<VatTuCatalogues> {
    await this.navigate('/danh-muc');
    const groupResponsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/nhom-vat-tu'),
    );
    const unitResponsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/don-vi-tinh'),
    );

    await this.click(
      this.locators.catalogueButton,
      'Truy cập menu Vật tư',
    );
    const [groupResponse, unitResponse] = await Promise.all([
      groupResponsePromise,
      unitResponsePromise,
    ]);
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });

    return {
      groups: await this.parseGroups(groupResponse),
      units: await this.loadAllUnits(unitResponse),
    };
  }

  /** Mở Danh mục Vật tư và trả về danh sách Tài khoản kế toán thực tế từ API. */
  async openFromDanhMucAndCollectAccounts(): Promise<readonly AccountOption[]> {
    await this.navigate('/danh-muc');
    const accountResponsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/tai-khoan'),
    );

    await this.click(
      this.locators.catalogueButton,
      'Truy cập menu Vật tư',
    );
    const accountResponse = await accountResponsePromise;
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });

    return this.parseAccounts(accountResponse);
  }

  /** Mở Danh mục Vật tư và trả về danh sách Kho thực tế từ API. */
  async openFromDanhMucAndCollectWarehouses(): Promise<readonly CatalogueOption[]> {
    await this.navigate('/danh-muc');
    const responsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/kho'),
    );
    await this.click(
      this.locators.catalogueButton,
      'Truy cập menu Vật tư',
    );
    const response = await responsePromise;
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });
    const payload = (await response.json()) as ListResponse<WarehouseResponseItem>;
    return (payload.data ?? []).map((item) => ({
      code: item.maKho,
      name: item.tenKho,
      status: item.trangThai,
      label: `${item.maKho} — ${item.tenKho}`,
    }));
  }

  /** Mở Danh mục Vật tư và trả về danh sách Thuế tài nguyên thực tế từ API. */
  async openFromDanhMucAndCollectResourceTaxes(): Promise<readonly CatalogueOption[]> {
    await this.navigate('/danh-muc');
    const responsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/thue-tai-nguyen'),
    );
    await this.click(this.locators.catalogueButton, 'Truy cập menu Vật tư');
    const response = await responsePromise;
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });
    return this.loadAllResourceTaxes(response);
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

  /** Trả về nội dung cảnh báo khi đóng form có dữ liệu chưa lưu. */
  closeConfirmationMessage(): Locator {
    return this.locators.closeConfirmationMessage();
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

  /** Tìm và chọn Nhóm vật tư theo dữ liệu danh mục thực tế. */
  async selectGroup(option: CatalogueOption): Promise<void> {
    await this.searchGroup(option.code);
    await this.click(this.groupOption(option.label), `Chọn Nhóm vật tư ${option.label}`);
  }

  /** Trả về locator của Nhóm vật tư đang được chọn. */
  selectedGroup(label: string): Locator {
    return this.locators.selectedGroup(label);
  }

  /** Mở danh sách Đơn vị tính chính. */
  async openMainUnitDropdown(): Promise<void> {
    await this.click(this.mainUnitCombobox, 'Mở dropdown Đơn vị tính chính');
  }

  /** Tìm kiếm Đơn vị tính chính theo mã hoặc tên. */
  async searchMainUnit(query: string): Promise<void> {
    await this.type(this.mainUnitCombobox, query, 'Tìm kiếm Đơn vị tính chính');
  }

  /** Trả về locator của một lựa chọn Đơn vị tính chính. */
  mainUnitOption(label: string): Locator {
    return this.locators.dropdownOption(label);
  }

  /** Chọn Đơn vị tính chính theo dữ liệu danh mục thực tế. */
  async selectMainUnit(option: CatalogueOption): Promise<void> {
    await this.click(this.mainUnitOption(option.label), `Chọn Đơn vị tính ${option.label}`);
  }

  /** Trả về locator của Đơn vị tính chính đang được chọn. */
  selectedMainUnit(label: string): Locator {
    return this.locators.selectedMainUnit(label);
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
    await this.fillFormField('Tên vật tư khi mua', input.purchaseName);
    await this.fillFormField('Tên vật tư khi bán', input.saleName);
    await this.fillFormField('Mô tả', input.description);
    await this.uploadMaterialImage(input.imagePath);
    await this.setMaterialStatus(true);

    await this.openDefaultAccountingTab();
    const expenseAccount = await this.selectFirstFormOption('Tài khoản chi phí');

    await this.openFormTab('Thông tin kho');
    const warehouse = await this.ensureFirstFormOption('Kho mặc định');
    const pricingMethod = await this.selectFirstFormOption('Phương pháp tính giá');
    await this.fillFormField('Tồn tối thiểu', '10');
    await this.fillFormField('Tồn tối đa', '1000');
    await this.setCheckbox('Theo dõi lô', true);
    await this.setCheckbox('Theo dõi mã vạch', true);

    await this.openFormTab('Thông tin thuế');
    const vatRate = await this.selectFirstFormOption('Thuế suất GTGT mặc định');
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
      warehouse,
      pricingMethod,
      vatRate,
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
    await this.fillFormField('Thuế xuất khẩu', '0');
    await this.fillFormField('Thuế nhập khẩu', '0');
    const exciseTax = await this.selectFirstFormOption('Thuế tiêu thụ đặc biệt');
    const resourceTax = await this.selectFirstFormOption('Thuế tài nguyên');

    const alternativeUnit = await this.fillFirstAlternativeUnit(input.mainUnit.label);
    return { accounts, vatRate, exciseTax, resourceTax, alternativeUnit };
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
    await this.click(this.warrantyUnitOption(name), `Chọn Đơn vị bảo hành ${name}`);
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
    return this.locators.dropdownOption(label);
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

  /** Tìm kiếm Kho theo mã hoặc tên. */
  async searchWarehouse(query: string): Promise<void> {
    await this.type(this.warehouseCombobox(), query, 'Tìm kiếm Kho mặc định');
  }

  /** Tìm và chọn Kho theo dữ liệu danh mục thực tế. */
  async selectWarehouse(option: CatalogueOption): Promise<void> {
    await this.searchWarehouse(option.code);
    await this.click(this.warehouseOption(option.label), `Chọn kho ${option.label}`);
  }

  /** Trả về Kho đang được chọn. */
  selectedWarehouse(label: string): Locator {
    return this.locators.selectedFieldValue('Kho mặc định', label);
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

  /** Trả về thông báo validation của trường theo label và nội dung lỗi. */
  validationMessage(fieldLabel: string, message: string): Locator {
    return this.locators.validationMessage(fieldLabel, message);
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
    await this.materialSearchInput().waitFor({ state: 'visible' });
    await this.searchMaterial(code);
    if (!(await this.materialRow(code).isVisible())) return false;

    await this.click(
      this.locators.deleteMaterialButton(code),
      `Mở xác nhận xóa vật tư ${code}`,
    );
    const confirmation = this.locators.deleteConfirmation();
    await confirmation.waitFor({ state: 'visible' });
    await this.click(
      this.locators.confirmDeleteButton(),
      `Xác nhận xóa vật tư ${code}`,
    );
    await confirmation.waitFor({ state: 'hidden' });
    await this.searchMaterial(code);
    if (await this.materialRow(code).isVisible()) {
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

  /** Trả về các control theo role tại dòng quy đổi đầu tiên. */
  conversionRowControls(role: Parameters<Locator['getByRole']>[0]): Locator {
    return this.locators.conversionRowControls(role);
  }

  /** Trả về các thông báo validation trong bảng Đơn vị quy đổi. */
  conversionValidationMessages(): Locator {
    return this.locators.conversionValidationMessages();
  }

  /** Nhập dòng quy đổi đầu tiên và trả về Đơn vị quy đổi cùng Phép tính đã chọn. */
  async fillFirstConversionRow(ratio: string, mainUnit: string): Promise<{
    readonly unit: string;
    readonly operation: string;
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
    return { unit, operation };
  }

  /** Trả về một lựa chọn Tài khoản kế toán theo nhãn. */
  accountingAccountOption(label: string): Locator {
    return this.locators.dropdownOption(label);
  }

  /** Trả về dòng dữ liệu của Tài khoản trong combogrid. */
  accountingAccountOptionRow(label: string): Locator {
    return this.locators.accountingAccountOptionRow(label);
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
    return this.locators.selectedFieldValue(fieldLabel, label);
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

  /** Xác định response có thuộc API danh mục cần thu thập hay không. */
  private isCatalogueResponse(response: Response, pathname: string): boolean {
    const url = new URL(response.url());
    return response.status() === 200 && url.pathname === pathname;
  }

  /** Chuyển response Nhóm vật tư thành danh sách lựa chọn dùng chung cho testcase. */
  private async parseGroups(response: Response): Promise<readonly CatalogueOption[]> {
    const payload = (await response.json()) as ListResponse<GroupResponseItem>;
    return (payload.data ?? []).map((item) => ({
      code: item.ma,
      name: item.ten,
      status: item.trangThai,
      label: `${item.ma} — ${item.ten}`,
    }));
  }

  /** Chuyển response Tài khoản thành danh sách lựa chọn và giữ thông tin cho phép hạch toán. */
  private async parseAccounts(response: Response): Promise<readonly AccountOption[]> {
    const payload = (await response.json()) as readonly AccountResponseItem[];
    return payload.map((item) => ({
      code: item.soTaiKhoan,
      name: item.tenTaiKhoan,
      status: item.trangThai,
      allowed: item.choPhepHachToan,
      label: `${item.soTaiKhoan} — ${item.tenTaiKhoan}`,
    }));
  }

  /** Tải và gộp toàn bộ các trang Đơn vị tính thành một danh sách lựa chọn. */
  private async loadAllUnits(sourceResponse: Response): Promise<readonly CatalogueOption[]> {
    const authorization = sourceResponse.request().headers()['authorization'];
    if (!authorization) {
      throw new Error('Không lấy được quyền đọc danh mục Đơn vị tính từ request của UI.');
    }

    const firstPage = (await sourceResponse.json()) as ListResponse<UnitResponseItem>;
    const totalPages = firstPage.pagination?.totalPages ?? 1;
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(totalPages - 1, 0) }, async (_, index) => {
        const page = index + 2;
        const url = new URL(`/api/master-data/don-vi-tinh?pageSize=200&page=${page}`, sourceResponse.url());
        const response = await this.page.context().request.get(url.toString(), {
          headers: { authorization },
        });
        if (!response.ok()) {
          throw new Error(`Không đọc được trang ${page} danh mục Đơn vị tính: HTTP ${response.status()}.`);
        }
        return (await response.json()) as ListResponse<UnitResponseItem>;
      }),
    );

    const items = [
      ...(firstPage.data ?? []),
      ...remainingPages.flatMap((payload) => payload.data ?? []),
    ];
    return items.map((item) => ({
      code: item.maDonViTinh,
      name: item.tenDonViTinh,
      status: item.trangThai,
      label: `${item.maDonViTinh} — ${item.tenDonViTinh}`,
    }));
  }

  /** Tải và gộp toàn bộ các trang Thuế tài nguyên thành một danh sách lựa chọn. */
  private async loadAllResourceTaxes(sourceResponse: Response): Promise<readonly CatalogueOption[]> {
    const authorization = sourceResponse.request().headers()['authorization'];
    if (!authorization) throw new Error('Không lấy được quyền đọc danh mục Thuế tài nguyên từ request UI.');
    const firstPage = (await sourceResponse.json()) as ListResponse<TaxResponseItem>;
    const totalPages = firstPage.pagination?.totalPages ?? 1;
    const remainingPages = await Promise.all(Array.from({ length: Math.max(totalPages - 1, 0) }, async (_, index) => {
      const url = new URL(`/api/master-data/thue-tai-nguyen?pageSize=200&page=${index + 2}`, sourceResponse.url());
      const response = await this.page.context().request.get(url.toString(), { headers: { authorization } });
      if (!response.ok()) throw new Error(`Không đọc được danh mục Thuế tài nguyên: HTTP ${response.status()}.`);
      return (await response.json()) as ListResponse<TaxResponseItem>;
    }));
    return [...(firstPage.data ?? []), ...remainingPages.flatMap((page) => page.data ?? [])].map((item) => ({
      code: item.ma,
      name: item.ten,
      status: item.trangThai,
      label: `${item.ma} — ${item.ten}`,
    }));
  }
}
