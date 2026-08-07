import type { Locator, Page } from '@playwright/test';

type AriaRole = Parameters<Locator['getByRole']>[0];

/** Tập trung toàn bộ locator của màn hình Danh mục Vật tư. */
export class VatTuLocators {
  readonly catalogueButton: Locator;
  readonly addButton: Locator;
  readonly materialTypeDialog: Locator;
  readonly createMaterialDialog: Locator;
  readonly changeMaterialTypeButton: Locator;
  readonly closeConfirmationDialog: Locator;
  readonly groupCombobox: Locator;
  readonly mainUnitCombobox: Locator;
  readonly defaultAccountingTab: Locator;
  readonly visibleDropdown: Locator;
  readonly accountingAccountColumnHeaders: Locator;

  constructor(private readonly page: Page) {
    this.catalogueButton = page.getByRole('button', { name: 'Vật tư', exact: true });
    this.addButton = page.getByRole('button', { name: 'Thêm mới', exact: true });
    this.materialTypeDialog = page.getByRole('dialog', {
      name: /Chọn tính chất hàng hóa dịch vụ/,
    });
    this.createMaterialDialog = page.getByRole('dialog', { name: /Thêm mới vật tư/ });
    this.changeMaterialTypeButton = this.createMaterialDialog.getByRole('button', {
      name: 'Thay đổi tính chất',
      exact: true,
    });
    this.closeConfirmationDialog = page.getByRole('dialog').filter({ hasText: 'Xác nhận đóng' });
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
    this.visibleDropdown = page.locator('.ant-select-dropdown:visible');
    this.accountingAccountColumnHeaders = this.visibleDropdown.locator('[role="columnheader"], th');
  }

  materialTypeTitle = (type: string): Locator => this.materialTypeDialog.getByText(type, { exact: true });
  materialTypeDescription = (description: string): Locator => this.materialTypeDialog.getByText(description, { exact: true });
  closeMaterialTypeButton = (): Locator => this.materialTypeDialog.getByRole('button', { name: 'Close', exact: true });
  cancelButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Hủy', exact: true });
  closeConfirmationMessage = (): Locator => this.closeConfirmationDialog.getByText(/Dữ liệu đã có thay đổi|Bạn có chắc chắn muốn hủy/);
  dismissCloseConfirmationButton = (): Locator => this.closeConfirmationDialog.getByRole('button', { name: 'Hủy', exact: true });
  confirmCloseButton = (): Locator => this.closeConfirmationDialog.getByRole('button', { name: 'Xác nhận', exact: true });
  groupOption = (label: string): Locator => this.page.getByRole('treeitem', { name: label, exact: true });
  selectedGroup = (label: string): Locator => this.createMaterialDialog.locator('.ant-select-selection-item').filter({ hasText: label });
  removeSelectedGroupButton = (label: string): Locator => this.selectedGroup(label).locator('.ant-select-selection-item-remove');
  clearAllGroupsButton = (): Locator => this.formField('Nhóm vật tư').getByRole('img', { name: 'close-circle', exact: true });
  dropdownOption = (label: string): Locator => this.visibleDropdown.getByText(label, { exact: true });
  mainUnitColumnHeader = (name: string): Locator => this.visibleDropdown.getByRole('columnheader', { name, exact: true });
  mainUnitOptions = (): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)');
  mainUnitActiveOption = (): Locator => this.visibleDropdown.locator('.ant-select-item-option-active');
  clearMainUnitButton = (): Locator => this.formField('Đơn vị tính chính').locator('.ant-select-clear');
  mainUnitConfirmationDialog = (): Locator => this.page.getByRole('dialog').filter({ hasText: 'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?' });
  mainUnitConfirmationMessage = (): Locator => this.mainUnitConfirmationDialog().getByText('Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?', { exact: true });
  mainUnitConfirmationButton = (name: 'Xác nhận' | 'Hủy'): Locator => this.mainUnitConfirmationDialog().getByRole('button', { name, exact: true });
  selectedMainUnit = (label: string): Locator => this.createMaterialDialog.getByText(label, { exact: true }).last();
  formTab = (name: string): Locator => this.createMaterialDialog.getByRole('tab', { name, exact: true });
  formField = (label: string): Locator => this.createMaterialDialog.locator('.ant-form-item').filter({ hasText: label });
  formFieldControl = (label: string, role: AriaRole): Locator => this.formField(label).getByRole(role).first();
  textarea = (label: string): Locator => this.formField(label).locator('textarea');
  selectedFormValue = (label: string): Locator => this.formField(label).locator('.ant-select-selection-item').first();
  firstEnabledDropdownOption = (): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)').first();
  checkbox = (name: string): Locator => this.createMaterialDialog.getByRole('checkbox', { name, exact: true });
  uploadInput = (): Locator => this.createMaterialDialog.locator('input[type="file"]');
  alternativeUnitCombobox = (): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị tính khác', exact: true }).getByRole('combobox').first();
  alternativeUnitOption = (mainUnit: string): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)').filter({ hasNotText: mainUnit }).first();
  materialImagePreview = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Xóa', exact: true });
  materialImageSection = (): Locator => this.createMaterialDialog.getByText('Hình ảnh hàng hóa', { exact: true });
  materialImageLabel = (): Locator => this.createMaterialDialog.getByText('Ảnh', { exact: true });
  materialImageSizeError = (): Locator => this.page.getByRole('alert').filter({ hasText: /dung lượng|2\s*MB/i });
  materialImageFormatError = (): Locator => this.page.getByRole('alert').filter({ hasText: /định dạng|JPG|PNG|WEBP/i });
  requiredFormField = (label: string): Locator => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.createMaterialDialog.getByText(new RegExp(`^${escapedLabel}\\s*\\*$`));
  };
  dialogControl = (role: AriaRole, name: string): Locator => this.createMaterialDialog.getByRole(role, { name, exact: true });
  warrantyUnitCombobox = (): Locator => this.createMaterialDialog.getByText('Ngày', { exact: true }).locator('..').getByRole('combobox');
  namedDropdownOption = (name: string): Locator => this.visibleDropdown.locator('.ant-select-item-option-content').filter({ hasText: new RegExp(`^${name}$`) });
  enabledDropdownOptions = (): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)');
  selectedDialogValue = (name: string): Locator => this.createMaterialDialog.getByTitle(name, { exact: true }).last();
  selectedFieldValue = (field: string, value: string): Locator => this.formField(field).getByTitle(value, { exact: true });
  materialTypeValue = (type: string): Locator => this.createMaterialDialog.getByText(type, { exact: true }).first();
  statusSwitch = (): Locator => this.createMaterialDialog.getByRole('switch');
  saveButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Lưu', exact: true });
  saveAndAddButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Lưu và Thêm mới', exact: true });
  successNotification = (): Locator => this.page.getByRole('alert');
  warehouseColumnHeaders = (): Locator => this.visibleDropdown.locator('[role="columnheader"], th');
  warehouseOptionRow = (label: string): Locator => this.visibleDropdown.locator('.ant-select-item-option').filter({ hasText: label });
  warehouseOptions = (): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)');
  warehouseActiveOption = (): Locator => this.visibleDropdown.locator('.ant-select-item-option-active');
  clearWarehouseButton = (): Locator => this.formField('Kho mặc định').locator('.ant-select-clear');
  validationMessage = (field: string, message: string): Locator => this.formField(field).getByText(message, { exact: true });
  notificationMessage = (message: string): Locator => this.page.getByText(message, { exact: true });
  materialSearchInput = (): Locator => this.page.getByRole('textbox', { name: 'Tìm kiếm...', exact: true });
  firstExistingMaterialCode = (): Locator => this.page.getByRole('table').getByRole('button').first();
  materialRow = (code: string): Locator => this.page.getByRole('row').filter({ has: this.page.getByRole('button', { name: code, exact: true }) });
  deleteMaterialButton = (code: string): Locator => this.materialRow(code).getByRole('button', { name: 'Xóa', exact: true });
  deleteConfirmation = (): Locator => this.page.getByRole('dialog').filter({ hasText: 'Bạn có chắc chắn muốn xóa vật tư' });
  confirmDeleteButton = (): Locator => this.deleteConfirmation().getByRole('button', { name: 'Xóa', exact: true });
  materialDetailsButton = (code: string): Locator => this.materialRow(code).getByRole('button', { name: 'Xem chi tiết', exact: true });
  materialDetails = (code: string): Locator => this.page.getByRole('dialog').filter({ hasText: code });
  materialDetailField = (code: string, label: string): Locator => this.materialDetails(code).locator('.ant-form-item').filter({ hasText: label });
  materialDetailControl = (code: string, label: string, role: AriaRole): Locator => this.materialDetailField(code, label).getByRole(role).first();
  materialDetailSelectedValue = (code: string, label: string, value: string): Locator => this.materialDetailField(code, label).getByTitle(value, { exact: true });
  materialDetailText = (code: string, value: string): Locator => this.materialDetails(code).getByText(value, { exact: true });
  materialDetailStatusSwitch = (code: string): Locator => this.materialDetails(code).getByRole('switch');
  materialDetailImage = (code: string): Locator => this.materialDetails(code).locator('.ant-upload-list-item-thumbnail img, .ant-image-img').first();
  materialDetailTab = (code: string, tabName: string): Locator => this.materialDetails(code).getByRole('tab', { name: tabName, exact: true });
  conversionGrid = (): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị quy đổi', exact: true }).getByRole('table');
  addConversionRowButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Thêm dòng', exact: true });
  conversionColumnHeader = (name: string): Locator => this.conversionGrid().getByRole('columnheader', { name, exact: true });
  selectedConversionUnit = (label: string): Locator => this.conversionGrid().getByTitle(label, { exact: true });
  conversionRowControls = (role: AriaRole): Locator => this.conversionGrid().getByRole(role);
  conversionValidationMessages = (): Locator => this.conversionGrid().locator('.ant-form-item-explain-error');
  conversionUnitOption = (mainUnit: string): Locator => this.enabledDropdownOptions().filter({ hasNotText: mainUnit }).first();
  accountingAccountOptionRow = (label: string): Locator => this.visibleDropdown.locator('.ant-select-item-option').filter({ hasText: label });
  accountingAccountOptions = (): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)');
  accountingAccountActiveOption = (): Locator => this.visibleDropdown.locator('.ant-select-item-option-active');
  accountClearButton = (fieldLabel: string): Locator => this.formField(fieldLabel).locator('.ant-select-clear');
  accountConfirmationDialog = (): Locator => this.page.getByRole('dialog').filter({ hasText: 'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?' });
  accountConfirmationButton = (name: 'Xác nhận' | 'Hủy'): Locator => this.accountConfirmationDialog().getByRole('button', { name, exact: true });
  selectedAccountValue = (fieldLabel: string, label: string): Locator => this.formField(fieldLabel).getByTitle(label, { exact: true });
  accountCombobox = (fieldLabel: string): Locator => this.formField(fieldLabel).getByRole('combobox');
}
