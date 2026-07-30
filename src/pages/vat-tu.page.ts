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

  saveButton(): Locator {
    return this.createMaterialDialog.getByRole('button', {
      name: 'Lưu',
      exact: true,
    });
  }

  async saveMaterial(): Promise<void> {
    await this.click(this.saveButton(), 'Lưu vật tư');
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

  async selectPricingMethod(name: string): Promise<void> {
    await this.openFormTab('Thông tin kho');
    await this.click(this.pricingMethodCombobox(), 'Mở Phương pháp tính giá');
    await this.click(
      this.pricingMethodOption(name),
      `Chọn Phương pháp tính giá ${name}`,
    );
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

  materialDetailStatusSwitch(code: string): Locator {
    return this.materialDetails(code).getByRole('switch');
  }

  async openMaterialDetailTab(code: string, tabName: string): Promise<void> {
    await this.click(
      this.materialDetails(code).getByRole('tab', {
        name: tabName,
        exact: true,
      }),
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
}
