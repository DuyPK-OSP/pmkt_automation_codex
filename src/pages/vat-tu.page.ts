import type { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './base.page';
import type { Logger } from '@utils/logger';

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

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.addButton = page.getByRole('button', { name: 'Thêm mới', exact: true });
    this.materialTypeDialog = page.getByRole('dialog', {
      name: /Chọn tính chất hàng hóa dịch vụ/,
    });
    this.createMaterialDialog = page.getByRole('dialog', { name: /Thêm mới vật tư/ });
    this.changeMaterialTypeButton = this.createMaterialDialog.getByRole('button', {
      name: 'Thay đổi tính chất',
      exact: true,
    });
    this.closeConfirmationDialog = page
      .getByRole('dialog')
      .filter({ hasText: 'Xác nhận đóng' });
    this.groupCombobox = this.createMaterialDialog.getByRole('combobox', {
      name: 'Nhóm vật tư',
      exact: true,
    });
    this.mainUnitCombobox = this.createMaterialDialog.getByRole('combobox', {
      name: /^Đơn vị tính chính/,
    });
    this.defaultAccountingTab = this.createMaterialDialog.getByRole('tab', {
      name: 'Hạch toán ngầm định',
      exact: true,
    });
    this.accountingAccountDropdown = this.page.locator('.ant-select-dropdown:visible');
    this.accountingAccountColumnHeaders = this.accountingAccountDropdown.locator(
      '[role="columnheader"], th',
    );
  }

  async openFromDanhMuc(): Promise<void> {
    await this.navigate('/danh-muc');
    await this.click(
      this.page.getByRole('button', { name: 'Vật tư', exact: true }),
      'Truy cập menu Vật tư',
    );
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });
  }

  async openFromDanhMucAndCollectCatalogues(): Promise<VatTuCatalogues> {
    await this.navigate('/danh-muc');
    const groupResponsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/nhom-vat-tu'),
    );
    const unitResponsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/don-vi-tinh'),
    );

    await this.click(
      this.page.getByRole('button', { name: 'Vật tư', exact: true }),
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

  async openFromDanhMucAndCollectAccounts(): Promise<readonly AccountOption[]> {
    await this.navigate('/danh-muc');
    const accountResponsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/tai-khoan'),
    );

    await this.click(
      this.page.getByRole('button', { name: 'Vật tư', exact: true }),
      'Truy cập menu Vật tư',
    );
    const accountResponse = await accountResponsePromise;
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });

    return this.parseAccounts(accountResponse);
  }

  async openFromDanhMucAndCollectWarehouses(): Promise<readonly CatalogueOption[]> {
    await this.navigate('/danh-muc');
    const responsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/kho'),
    );
    await this.click(
      this.page.getByRole('button', { name: 'Vật tư', exact: true }),
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

  async openFromDanhMucAndCollectResourceTaxes(): Promise<readonly CatalogueOption[]> {
    await this.navigate('/danh-muc');
    const responsePromise = this.page.waitForResponse((response) =>
      this.isCatalogueResponse(response, '/api/master-data/thue-tai-nguyen'),
    );
    await this.click(this.page.getByRole('button', { name: 'Vật tư', exact: true }), 'Truy cập menu Vật tư');
    const response = await responsePromise;
    await this.page.waitForURL((url) => url.pathname === '/danh-muc/vat-tu');
    await this.addButton.waitFor({ state: 'visible' });
    return this.loadAllResourceTaxes(response);
  }

  async openMaterialTypePopup(): Promise<void> {
    await this.click(this.addButton, 'Nhấn Thêm mới');
    await this.materialTypeDialog.waitFor({ state: 'visible' });
  }

  materialTypeTitle(type: MaterialType): Locator {
    return this.materialTypeDialog.getByText(type, { exact: true });
  }

  async selectMaterialType(type: MaterialType): Promise<void> {
    await this.click(this.materialTypeTitle(type), `Chọn Loại vật tư ${type}`);
    await this.createMaterialDialog.waitFor({ state: 'visible' });
  }

  async changeMaterialType(): Promise<void> {
    await this.click(this.changeMaterialTypeButton, 'Thay đổi Loại vật tư');
    await this.materialTypeDialog.waitFor({ state: 'visible' });
  }

  cancelButton(): Locator {
    return this.createMaterialDialog.getByRole('button', {
      name: 'Hủy',
      exact: true,
    });
  }

  async cancelCreatingMaterial(): Promise<void> {
    await this.click(this.cancelButton(), 'Hủy tạo mới vật tư');
  }

  closeConfirmationMessage(): Locator {
    return this.closeConfirmationDialog.getByText(
      /Dữ liệu đã có thay đổi|Bạn có chắc chắn muốn hủy/,
    );
  }

  async dismissCloseConfirmation(): Promise<void> {
    await this.click(
      this.closeConfirmationDialog.getByRole('button', { name: 'Hủy', exact: true }),
      'Hủy thao tác đóng form',
    );
  }

  async confirmClose(): Promise<void> {
    await this.click(
      this.closeConfirmationDialog.getByRole('button', { name: 'Xác nhận', exact: true }),
      'Xác nhận đóng form',
    );
  }

  async openGroupDropdown(): Promise<void> {
    await this.click(this.groupCombobox, 'Mở dropdown Nhóm vật tư');
    await this.groupCombobox.waitFor({ state: 'visible' });
  }

  async searchGroup(query: string): Promise<void> {
    await this.type(this.groupCombobox, query, 'Tìm kiếm Nhóm vật tư');
  }

  groupOption(label: string): Locator {
    return this.page.getByRole('treeitem', { name: label, exact: true });
  }

  async selectGroup(option: CatalogueOption): Promise<void> {
    await this.searchGroup(option.code);
    await this.click(this.groupOption(option.label), `Chọn Nhóm vật tư ${option.label}`);
  }

  selectedGroup(label: string): Locator {
    return this.createMaterialDialog
      .locator('.ant-select-selection-item')
      .filter({ hasText: label });
  }

  async openMainUnitDropdown(): Promise<void> {
    await this.click(this.mainUnitCombobox, 'Mở dropdown Đơn vị tính chính');
  }

  async searchMainUnit(query: string): Promise<void> {
    await this.type(this.mainUnitCombobox, query, 'Tìm kiếm Đơn vị tính chính');
  }

  mainUnitOption(label: string): Locator {
    return this.page
      .locator('.ant-select-dropdown:visible')
      .getByText(label, { exact: true });
  }

  async selectMainUnit(option: CatalogueOption): Promise<void> {
    await this.click(this.mainUnitOption(option.label), `Chọn Đơn vị tính ${option.label}`);
  }

  selectedMainUnit(label: string): Locator {
    return this.createMaterialDialog.getByText(label, { exact: true }).last();
  }

  async openDefaultAccountingTab(): Promise<void> {
    await this.click(this.defaultAccountingTab, 'Chuyển sang Tab Hạch toán ngầm định');
  }

  formTab(name: string): Locator {
    return this.createMaterialDialog.getByRole('tab', { name, exact: true });
  }

  async openFormTab(name: string): Promise<void> {
    await this.click(this.formTab(name), `Chuyển sang Tab ${name}`);
  }

  formField(label: string): Locator {
    return this.createMaterialDialog
      .locator('.ant-form-item')
      .filter({ hasText: label });
  }

  formFieldControl(
    label: string,
    role: Parameters<Locator['getByRole']>[0],
  ): Locator {
    return this.formField(label).getByRole(role).first();
  }

  selectedFormValue(label: string): Locator {
    return this.formField(label).locator('.ant-select-selection-item').first();
  }

  firstEnabledDropdownOption(): Locator {
    return this.page
      .locator('.ant-select-dropdown:visible')
      .locator('.ant-select-item-option:not(.ant-select-item-option-disabled)')
      .first();
  }

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

  async ensureFirstFormOption(label: string): Promise<string> {
    const selected = this.selectedFormValue(label);
    if (await selected.count()) return (await selected.innerText()).trim();
    return this.selectFirstFormOption(label);
  }

  async fillFormField(label: string, value: string): Promise<void> {
    const field = this.formField(label);
    const textbox = field.getByRole('textbox').first();
    if (await textbox.count()) {
      await this.type(textbox, value, label);
      return;
    }
    await this.type(field.getByRole('spinbutton').first(), value, label);
  }

  async setCheckbox(name: string, checked: boolean): Promise<void> {
    const checkbox = this.createMaterialDialog.getByRole('checkbox', {
      name,
      exact: true,
    });
    if ((await checkbox.isChecked()) !== checked) {
      await this.click(checkbox, `${checked ? 'Bật' : 'Tắt'} ${name}`);
    }
  }

  async uploadMaterialImage(filePath: string): Promise<void> {
    const uploadCompleted = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/master-data/vat-tu/anh' &&
        response.ok(),
    );
    await this.createMaterialDialog
      .locator('input[type="file"]')
      .setInputFiles(filePath);
    await uploadCompleted;
  }

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

  async fillMaterialIdentity(code: string, name: string): Promise<void> {
    await this.type(this.materialCodeInput(), code, 'Mã vật tư');
    await this.type(this.materialNameInput(), name, 'Tên vật tư');
  }

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

  async fillFirstAlternativeUnit(mainUnit: string): Promise<string> {
    await this.openFormTab('Đơn vị tính khác');
    await this.addConversionRow();
    const combobox = this.createMaterialDialog
      .getByRole('tabpanel', { name: 'Đơn vị tính khác', exact: true })
      .getByRole('combobox')
      .first();
    await this.click(combobox, 'Mở Đơn vị tính khác');
    const option = this.page
      .locator('.ant-select-dropdown:visible')
      .locator('.ant-select-item-option:not(.ant-select-item-option-disabled)')
      .filter({ hasNotText: mainUnit })
      .first();
    const value = (await option.innerText()).trim();
    await this.click(option, 'Chọn Đơn vị tính khác hợp lệ đầu tiên');
    await option.waitFor({ state: 'hidden' });
    return value;
  }

  materialImagePreview(): Locator {
    return this.createMaterialDialog.getByRole('button', {
      name: 'Xóa',
      exact: true,
    });
  }

  materialImageSection(): Locator {
    return this.createMaterialDialog.getByText('Hình ảnh hàng hóa', { exact: true });
  }

  requiredFormField(label: string): Locator {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.createMaterialDialog.getByText(
      new RegExp(`^${escapedLabel}\\s*\\*$`),
    );
  }

  dialogControl(
    role: Parameters<Locator['getByRole']>[0],
    name: string,
  ): Locator {
    return this.createMaterialDialog.getByRole(role, { name, exact: true });
  }

  warrantyUnitCombobox(): Locator {
    return this.createMaterialDialog
      .getByText('Ngày', { exact: true })
      .locator('..')
      .getByRole('combobox');
  }

  warrantyUnitOption(name: string): Locator {
    return this.page.locator('.ant-select-dropdown:visible')
      .locator('.ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${name}$`) });
  }

  warrantyUnitOptions(): Locator {
    return this.page.locator('.ant-select-dropdown:visible')
      .locator('.ant-select-item-option:not(.ant-select-item-option-disabled)');
  }

  async openWarrantyUnitDropdown(): Promise<void> {
    await this.click(this.warrantyUnitCombobox(), 'Mở Đơn vị thời hạn bảo hành');
  }

  async selectWarrantyUnit(name: string): Promise<void> {
    if (!(await this.page.locator('.ant-select-dropdown:visible').count())) {
      await this.openWarrantyUnitDropdown();
    }
    await this.click(this.warrantyUnitOption(name), `Chọn Đơn vị bảo hành ${name}`);
  }

  selectedWarrantyUnit(name: string): Locator {
    return this.createMaterialDialog.getByTitle(name, { exact: true }).last();
  }

  specialGoodsTypeCombobox(): Locator {
    return this.formFieldControl('Loại hàng hóa đặc trưng', 'combobox');
  }

  async openSpecialGoodsTypeDropdown(): Promise<void> {
    await this.click(
      this.specialGoodsTypeCombobox(),
      'Mở dropdown Loại hàng hóa đặc trưng',
    );
  }

  specialGoodsTypeOption(name: string): Locator {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.page
      .locator('.ant-select-dropdown:visible')
      .locator('.ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${escapedName}$`) });
  }

  async selectSpecialGoodsType(name: string): Promise<void> {
    await this.click(
      this.specialGoodsTypeOption(name),
      `Chọn Loại hàng hóa đặc trưng ${name}`,
    );
  }

  selectedSpecialGoodsType(name: string): Locator {
    return this.formField('Loại hàng hóa đặc trưng').getByTitle(name, {
      exact: true,
    });
  }

  materialTypeValue(type: MaterialType): Locator {
    return this.createMaterialDialog.getByText(type, { exact: true }).first();
  }

  statusSwitch(): Locator {
    return this.createMaterialDialog.getByRole('switch');
  }

  async setMaterialStatus(active: boolean): Promise<void> {
    const statusSwitch = this.statusSwitch();
    if ((await statusSwitch.isChecked()) !== active) {
      await this.click(
        statusSwitch,
        `Chuyển Trạng thái sang ${active ? 'Hoạt động' : 'Ngừng hoạt động'}`,
      );
    }
  }

  materialCodeInput(): Locator {
    return this.formFieldControl('Mã vật tư', 'textbox');
  }

  materialNameInput(): Locator {
    return this.formFieldControl('Tên vật tư', 'textbox');
  }

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

  async fillRequiredInventoryMaterialFields(
    code: string,
    name: string,
    unit: CatalogueOption,
  ): Promise<string> {
    await this.fillRequiredMaterialFields(code, name, unit);
    await this.openFormTab('Thông tin kho');
    return this.ensureFirstFormOption('Phương pháp tính giá');
  }

  saveButton(): Locator {
    return this.createMaterialDialog.getByRole('button', {
      name: 'Lưu',
      exact: true,
    });
  }

  async saveMaterial(): Promise<void> {
    await this.click(this.saveButton(), 'Lưu vật tư');
  }

  saveAndAddButton(): Locator {
    return this.createMaterialDialog.getByRole('button', {
      name: 'Lưu và Thêm mới',
      exact: true,
    });
  }

  async saveAndAddMaterial(): Promise<void> {
    await this.click(this.saveAndAddButton(), 'Lưu vật tư và mở form thêm mới');
  }

  successNotification(): Locator {
    return this.page.getByRole('alert');
  }

  async waitForSuccessNotification(): Promise<string> {
    await this.successNotification().waitFor({ state: 'visible' });
    return (await this.successNotification().innerText()).trim();
  }

  pricingMethodCombobox(): Locator {
    return this.formFieldControl('Phương pháp tính giá', 'combobox');
  }

  pricingMethodOption(name: string): Locator {
    return this.page
      .locator('.ant-select-dropdown:visible')
      .locator('.ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${name}$`) });
  }

  selectedPricingMethod(name: string): Locator {
    return this.formField('Phương pháp tính giá').getByTitle(name, {
      exact: true,
    });
  }

  async selectPricingMethod(name: string): Promise<void> {
    await this.openFormTab('Thông tin kho');
    await this.click(this.pricingMethodCombobox(), 'Mở Phương pháp tính giá');
    await this.click(
      this.pricingMethodOption(name),
      `Chọn Phương pháp tính giá ${name}`,
    );
  }

  warehouseCombobox(): Locator {
    return this.formFieldControl('Kho mặc định', 'combobox');
  }

  warehouseDropdown(): Locator {
    return this.page.locator('.ant-select-dropdown:visible');
  }

  warehouseColumnHeaders(): Locator {
    return this.warehouseDropdown().locator('[role="columnheader"], th');
  }

  warehouseOption(label: string): Locator {
    return this.warehouseDropdown().getByText(label, { exact: true });
  }

  warehouseOptionRow(label: string): Locator {
    return this.warehouseDropdown().locator('.ant-select-item-option').filter({ hasText: label });
  }

  async openWarehouseDropdown(): Promise<void> {
    await this.openFormTab('Thông tin kho');
    await this.click(this.warehouseCombobox(), 'Mở combogrid Kho mặc định');
    await this.warehouseDropdown().waitFor({ state: 'visible' });
  }

  async searchWarehouse(query: string): Promise<void> {
    await this.type(this.warehouseCombobox(), query, 'Tìm kiếm Kho mặc định');
  }

  async selectWarehouse(option: CatalogueOption): Promise<void> {
    await this.searchWarehouse(option.code);
    await this.click(this.warehouseOption(option.label), `Chọn kho ${option.label}`);
  }

  selectedWarehouse(label: string): Locator {
    return this.formField('Kho mặc định').getByTitle(label, { exact: true });
  }

  async openTaxDropdown(label: string): Promise<void> {
    await this.openFormTab('Thông tin thuế');
    await this.click(this.formFieldControl(label, 'combobox'), `Mở ${label}`);
    await this.page.locator('.ant-select-dropdown:visible').waitFor({ state: 'visible' });
  }

  taxOption(label: string): Locator {
    return this.page.locator('.ant-select-dropdown:visible').getByText(label, { exact: true });
  }

  async searchTax(label: string, query: string): Promise<void> {
    await this.type(this.formFieldControl(label, 'combobox'), query, `Tìm kiếm ${label}`);
  }

  async selectTax(label: string, option: CatalogueOption): Promise<void> {
    await this.searchTax(label, option.code);
    await this.click(this.taxOption(option.label), `Chọn ${label} ${option.label}`);
  }

  selectedTax(label: string, value: string): Locator {
    return this.formField(label).getByTitle(value, { exact: true });
  }

  async openFirstConversionUnitDropdown(): Promise<void> {
    await this.click(this.conversionRowControls('combobox').first(), 'Mở Đơn vị tính quy đổi');
  }

  async searchFirstConversionUnit(query: string): Promise<void> {
    await this.type(this.conversionRowControls('combobox').first(), query, 'Tìm kiếm Đơn vị tính quy đổi');
  }

  async selectFirstConversionUnit(option: CatalogueOption): Promise<void> {
    await this.searchFirstConversionUnit(option.code);
    await this.click(this.page.locator('.ant-select-dropdown:visible').getByText(option.label, { exact: true }), `Chọn Đơn vị quy đổi ${option.label}`);
  }

  selectedFirstConversionUnit(label: string): Locator {
    return this.conversionGrid().getByTitle(label, { exact: true });
  }

  validationMessage(fieldLabel: string, message: string): Locator {
    return this.formField(fieldLabel).getByText(message, { exact: true });
  }

  async commitCurrentFormField(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  async discardMaterialFormIfOpen(): Promise<void> {
    if (!(await this.createMaterialDialog.isVisible())) return;
    await this.cancelCreatingMaterial();
    if (await this.closeConfirmationDialog.isVisible()) {
      await this.confirmClose();
    }
  }

  materialSearchInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Tìm kiếm...', exact: true });
  }

  async searchMaterial(query: string): Promise<void> {
    const searchResponse = this.page.waitForResponse((response) => {
      const url = new URL(response.url());
      return response.status() === 200
        && url.pathname === '/api/master-data/vat-tu'
        && url.searchParams.get('search') === query;
    });
    await this.type(this.materialSearchInput(), query, 'Tìm kiếm vật tư');
    await searchResponse;
  }

  materialRow(code: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('button', { name: code, exact: true }),
    });
  }

  async openMaterialDetails(code: string): Promise<void> {
    await this.click(
      this.materialRow(code).getByRole('button', {
        name: 'Xem chi tiết',
        exact: true,
      }),
      `Mở chi tiết vật tư ${code}`,
    );
  }

  materialDetails(code: string): Locator {
    return this.page.getByRole('dialog').filter({ hasText: code });
  }

  materialDetailField(code: string, label: string): Locator {
    return this.materialDetails(code)
      .locator('.ant-form-item')
      .filter({ hasText: label });
  }

  materialDetailControl(
    code: string,
    label: string,
    role: Parameters<Locator['getByRole']>[0],
  ): Locator {
    return this.materialDetailField(code, label).getByRole(role).first();
  }

  materialDetailSelectedValue(
    code: string,
    label: string,
    value: string,
  ): Locator {
    return this.materialDetailField(code, label).getByTitle(value, {
      exact: true,
    });
  }

  materialDetailText(code: string, value: string): Locator {
    return this.materialDetails(code).getByText(value, { exact: true });
  }

  materialDetailStatusSwitch(code: string): Locator {
    return this.materialDetails(code).getByRole('switch');
  }

  materialDetailImage(code: string): Locator {
    return this.materialDetails(code)
      .locator('.ant-upload-list-item-thumbnail img, .ant-image-img')
      .first();
  }

  materialDetailTab(code: string, tabName: string): Locator {
    return this.materialDetails(code).getByRole('tab', {
      name: tabName,
      exact: true,
    });
  }

  async openMaterialDetailTab(code: string, tabName: string): Promise<void> {
    await this.click(
      this.materialDetailTab(code, tabName),
      `Mở Tab ${tabName} trên chi tiết vật tư`,
    );
  }

  conversionGrid(): Locator {
    return this.createMaterialDialog.getByRole('tabpanel', {
      name: 'Đơn vị quy đổi',
      exact: true,
    }).getByRole('table');
  }

  addConversionRowButton(): Locator {
    return this.createMaterialDialog.getByRole('button', {
      name: 'Thêm dòng',
      exact: true,
    });
  }

  async addConversionRow(): Promise<void> {
    await this.click(this.addConversionRowButton(), 'Thêm dòng Đơn vị quy đổi');
  }

  conversionColumnHeader(name: string): Locator {
    return this.conversionGrid().getByRole('columnheader', { name, exact: true });
  }

  conversionRowControls(role: Parameters<Locator['getByRole']>[0]): Locator {
    return this.conversionGrid().getByRole(role);
  }

  conversionValidationMessages(): Locator {
    return this.conversionGrid().locator('.ant-form-item-explain-error');
  }

  async fillFirstConversionRow(ratio: string, mainUnit: string): Promise<{
    readonly unit: string;
    readonly operation: string;
  }> {
    const comboboxes = this.conversionRowControls('combobox');
    await this.click(comboboxes.nth(0), 'Mở Đơn vị quy đổi');
    const unitOption = this.page
      .locator('.ant-select-dropdown:visible')
      .locator('.ant-select-item-option:not(.ant-select-item-option-disabled)')
      .filter({ hasNotText: mainUnit })
      .first();
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

  accountingAccountOption(label: string): Locator {
    return this.accountingAccountDropdown.getByText(label, { exact: true });
  }

  accountingAccountOptionRow(label: string): Locator {
    return this.accountingAccountDropdown
      .locator('.ant-select-item-option')
      .filter({ hasText: label });
  }

  async openAccountingAccountDropdown(fieldLabel: string): Promise<void> {
    await this.click(
      this.accountCombobox(fieldLabel),
      `Mở combogrid ${fieldLabel}`,
    );
    await this.accountingAccountDropdown.waitFor({ state: 'visible' });
  }

  async searchAccountingAccount(fieldLabel: string, query: string): Promise<void> {
    await this.type(
      this.accountCombobox(fieldLabel),
      query,
      `Tìm kiếm ${fieldLabel}`,
    );
  }

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

  selectedAccountingAccount(fieldLabel: string, label: string): Locator {
    return this.accountFormItem(fieldLabel).getByTitle(label, { exact: true });
  }

  async closeDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  private accountFormItem(fieldLabel: string): Locator {
    return this.formField(fieldLabel);
  }

  private accountCombobox(fieldLabel: string): Locator {
    return this.accountFormItem(fieldLabel).getByRole('combobox');
  }

  private isCatalogueResponse(response: Response, pathname: string): boolean {
    const url = new URL(response.url());
    return response.status() === 200 && url.pathname === pathname;
  }

  private async parseGroups(response: Response): Promise<readonly CatalogueOption[]> {
    const payload = (await response.json()) as ListResponse<GroupResponseItem>;
    return (payload.data ?? []).map((item) => ({
      code: item.ma,
      name: item.ten,
      status: item.trangThai,
      label: `${item.ma} — ${item.ten}`,
    }));
  }

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
