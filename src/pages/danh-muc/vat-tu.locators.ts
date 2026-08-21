import type { Locator, Page } from '@playwright/test';

type AriaRole = Parameters<Locator['getByRole']>[0];

/** Ánh xạ các control có ID nghiệp vụ ổn định đã được xác minh trực tiếp trên DOM form Vật tư. */
const STABLE_FORM_CONTROL_IDS: Readonly<Record<string, string>> = {
  'Mã vật tư': 'ma',
  'Tên vật tư': 'ten',
  'Nhóm vật tư': 'nhomVatTuIds',
  'Thời hạn bảo hành': 'thoiHanBaoHanh',
  'Tên vật tư khi mua': 'tenMua',
  'Tên vật tư khi bán': 'tenBan',
  'Mô tả': 'moTa',
  'Phương pháp tính giá': 'phuongPhapTinhGia',
  'Tồn tối thiểu': 'tonToiThieu',
  'Tồn tối đa': 'tonToiDa',
  'Thuế suất GTGT mặc định': 'thueSuatGtgtMacDinh',
  'Giá trị thuế suất GTGT': 'giaTriThueSuatGtgt',
  'Thuế nhập khẩu': 'thueNhapKhau',
  'Thuế xuất khẩu': 'thueXuatKhau',
};

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
    // Combogrid hiện không có accessible name; scope theo form-item để phân biệt với các combobox khác.
    this.mainUnitCombobox = this.createMaterialDialog
      .locator('.ant-form-item')
      .filter({ hasText: 'Đơn vị tính chính' })
      .getByRole('combobox')
      .first();
    this.defaultAccountingTab = this.createMaterialDialog.getByRole('tab', {
      name: 'Hạch toán ngầm định',
      exact: true,
    });
    // Ant Design giữ portal cũ trong DOM khi chạy animation đóng; portal mở sau cùng mới thuộc control đang active.
    this.visibleDropdown = page.locator('.ant-select-dropdown:visible').last();
    this.accountingAccountColumnHeaders = this.visibleDropdown.locator('[role="columnheader"], th');
  }

  materialTypeTitle = (type: string): Locator => this.materialTypeDialog.getByText(type, { exact: true });
  materialTypeDescription = (description: string): Locator => this.materialTypeDialog.getByText(description, { exact: true });
  closeMaterialTypeButton = (): Locator => this.materialTypeDialog.getByRole('button', { name: 'Đóng', exact: true });
  closeCreateMaterialButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Đóng', exact: true });
  cancelButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Hủy', exact: true });
  closeConfirmationMessage = (): Locator => this.closeConfirmationDialog.getByText(/Dữ liệu đã có thay đổi|Bạn có chắc chắn muốn hủy/);
  dismissCloseConfirmationButton = (): Locator => this.closeConfirmationDialog.getByRole('button', { name: 'Hủy', exact: true });
  confirmCloseButton = (): Locator => this.closeConfirmationDialog.getByRole('button', { name: 'Xác nhận', exact: true });
  groupOption = (label: string): Locator => this.page.getByRole('treeitem', { name: label, exact: true });
  selectedGroup = (label: string): Locator => this.createMaterialDialog.locator('.ant-select-selection-item').filter({ hasText: label });
  removeSelectedGroupButton = (label: string): Locator => this.selectedGroup(label).locator('.ant-select-selection-item-remove');
  clearAllGroupsButton = (): Locator => this.formField('Nhóm vật tư').getByRole('img', { name: 'close-circle', exact: true });
  dropdownOption = (label: string): Locator => this.visibleDropdown.getByText(label, { exact: true });
  /** Trả về các dòng dữ liệu của combogrid, loại trừ dòng tiêu đề chỉ chứa columnheader. */
  dropdownDataRows = (): Locator => this.visibleDropdown
    .getByRole('row')
    .filter({ has: this.page.getByRole('cell') });
  /** Xác định dòng Đơn vị tính theo hai cell Mã và Tên lấy từ DB. */
  mainUnitOption = (label: string): Locator => {
    const [code, name] = label.split(' — ');
    const rows = this.visibleDropdown.getByRole('row');
    if (!code || !name) return rows.filter({ hasText: label });
    const escapePattern = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.visibleDropdown.getByRole('row', {
      name: new RegExp(
        `^${escapePattern(code)}\\s+${escapePattern(name)}(?:\\s+\\(Ngừng hoạt động\\))?\\s+(?:Hoạt động|Ngừng hoạt động)$`,
      ),
    });
  };
  mainUnitColumnHeader = (name: string): Locator => this.visibleDropdown.getByRole('columnheader', { name, exact: true });
  conversionUnitDropdownColumnHeaders = (): Locator => this.page
    .getByRole('columnheader')
    .filter({ hasText: /^(Mã đơn vị tính|Tên đơn vị tính|Trạng thái)$/u });
  mainUnitRows = (): Locator => this.dropdownDataRows();
  mainUnitStatusCells = (): Locator => this.visibleDropdown.getByRole('cell', { name: /^(Hoạt động|Ngừng hoạt động)$/ });
  mainUnitOptions = (): Locator => this.dropdownDataRows();
  mainUnitActiveOption = (): Locator => this.dropdownDataRows()
    .and(this.page.locator('[aria-selected="true"], .ant-table-row-selected'));
  clearMainUnitButton = (): Locator => this.formField('Đơn vị tính chính').locator('.ant-select-clear');
  mainUnitQuickAddButton = (): Locator => this.visibleDropdown.getByRole('button', { name: 'Thêm nhanh', exact: true });
  mainUnitQuickAddDialog = (): Locator => this.page.getByRole('dialog', { name: /Thêm nhanh đơn vị tính/i });
  mainUnitQuickAddCodeInput = (): Locator => this.mainUnitQuickAddDialog().locator('#maDonViTinh');
  mainUnitQuickAddNameInput = (): Locator => this.mainUnitQuickAddDialog().locator('#tenDonViTinh');
  mainUnitQuickAddStatusSwitch = (): Locator => this.mainUnitQuickAddDialog().getByRole('switch');
  mainUnitQuickAddAction = (name: 'Hủy' | 'Lưu'): Locator =>
    this.mainUnitQuickAddDialog().getByRole('button', { name, exact: true });
  mainUnitQuickAddValidation = (message: string): Locator =>
    this.mainUnitQuickAddDialog().getByText(message, { exact: true });
  mainUnitConfirmationDialog = (): Locator => this.page.getByRole('dialog').filter({ hasText: 'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?' });
  mainUnitConfirmationMessage = (): Locator => this.mainUnitConfirmationDialog().getByText('Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?', { exact: true });
  mainUnitConfirmationButton = (name: 'Xác nhận' | 'Hủy'): Locator => this.mainUnitConfirmationDialog().getByRole('button', { name, exact: true });
  selectedMainUnit = (label: string): Locator => {
    const [code, name] = label.split(' — ');
    const expectedText = code && name ? `${code} - ${name}` : label;
    return this.formField('Đơn vị tính chính').getByText(expectedText, { exact: false });
  };
  formTab = (name: string): Locator => this.createMaterialDialog.getByRole('tab', { name, exact: true });
  formField = (label: string): Locator => this.createMaterialDialog.locator('.ant-form-item').filter({ hasText: label });
  formFieldControl = (label: string, role: AriaRole): Locator => this.formField(label).getByRole(role).first();
  inventoryMaterialFormFieldControl = (label: string, role: AriaRole): Locator => {
    const stableId = STABLE_FORM_CONTROL_IDS[label];
    return stableId
      ? this.createMaterialDialog.locator(`#${stableId}`)
      : this.formField(label).getByRole(role).first();
  };
  textarea = (label: string): Locator => this.formField(label).locator('textarea');
  selectedFormValue = (label: string): Locator => this.formField(label).locator('.ant-select-selection-item').first();
  firstEnabledDropdownOption = (): Locator => this.dropdownDataRows()
    .or(this.enabledDropdownOptions())
    .first();
  checkbox = (name: string): Locator => this.createMaterialDialog.getByRole('checkbox', { name, exact: true });
  checkboxLabel = (name: string): Locator => this.createMaterialDialog.getByText(name, { exact: true });
  uploadInput = (): Locator => this.createMaterialDialog.locator('input[type="file"]');
  alternativeUnitCombobox = (): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị tính khác', exact: true }).getByRole('combobox').first();
  alternativeUnitComboboxes = (): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị tính khác', exact: true }).getByRole('combobox');
  alternativeUnitOption = (mainUnit: string): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)').filter({ hasNotText: mainUnit }).first();
  /** Lưới Đơn vị tính khác chỉ xuất hiện với loại Dịch vụ. */
  alternativeUnitGrid = (): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị tính khác', exact: true });
  /** Các dòng dữ liệu của lưới Đơn vị tính khác, loại trừ dòng tiêu đề. */
  alternativeUnitRows = (): Locator => this.alternativeUnitGrid().locator('.ant-form-list-item').filter({ has: this.page.getByRole('combobox') });
  /** Ô STT read-only trên từng dòng Đơn vị tính khác. */
  alternativeUnitOrderInputs = (): Locator => this.alternativeUnitRows().getByRole('textbox');
  /** Nút xóa gắn với từng dòng Đơn vị tính khác. */
  alternativeUnitDeleteButtons = (): Locator => this.alternativeUnitGrid().getByRole('button', { name: 'Xóa dòng', exact: true });
  /** Lỗi validation bắt buộc của lưới Đơn vị tính khác. */
  alternativeUnitValidation = (message: string): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị tính khác', exact: true }).getByText(message, { exact: true });
  materialImagePreview = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Xóa', exact: true });
  materialImageSection = (): Locator => this.createMaterialDialog.getByText('Ảnh', { exact: true });
  materialImageLabel = (): Locator => this.createMaterialDialog.getByText('Ảnh', { exact: true });
  materialImageSizeError = (): Locator => this.page.getByRole('alert').filter({ hasText: /dung lượng|2\s*MB/i });
  materialImageFormatError = (): Locator => this.page.getByRole('alert').filter({ hasText: /định dạng|JPG|PNG|WEBP/i });
  requiredFormField = (label: string): Locator => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.createMaterialDialog.getByText(new RegExp(`^${escapedLabel}\\s*\\*$`));
  };
  requiredIndicator = (label: string): Locator => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.formField(label)
      .getByText(new RegExp(`^${escapedLabel}\\s*\\*$`))
      .first();
  };
  statusRequiredLabel = (): Locator => this.createMaterialDialog.getByText(/^Trạng thái:\s*\*$/).last();
  dialogControl = (role: AriaRole, name: string): Locator => this.createMaterialDialog.getByRole(role, { name, exact: true });
  warrantyUnitCombobox = (): Locator => this.createMaterialDialog.locator('#donViThoiGian');
  inventoryWarrantyUnitCombobox = (): Locator => this.createMaterialDialog.locator('#donViThoiGian');
  namedDropdownOption = (name: string): Locator => this.visibleDropdown.locator('.ant-select-item-option-content').filter({ hasText: new RegExp(`^${name}$`) });
  defaultVatRateOption = (value: string): Locator => {
    const displayedValue = value === 'KHAC' ? 'KHÁC' : value;
    const escapedValue = displayedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.visibleDropdown.locator('.ant-select-item-option-content').filter({
      hasText: new RegExp(`^${escapedValue}(?:%|\\s+—)`),
    });
  };
  enabledDropdownOptions = (): Locator => this.visibleDropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)');
  selectedDialogValue = (name: string): Locator => this.createMaterialDialog.getByText(name, { exact: true }).last();
  inventorySelectedWarrantyUnit = (name: string): Locator => this.createMaterialDialog
    .locator('.ant-form-item:has(#donViThoiGian)')
    .getByTitle(name, { exact: true });
  selectedFieldValue = (field: string, value: string): Locator => this.formField(field).getByTitle(value, { exact: true });
  materialTypeValue = (type: string): Locator => this.createMaterialDialog.getByText(type, { exact: true }).first();
  /** Giá trị read-only riêng của CCDC; scope trong dialog để loại menu cùng tên ở thanh bên. */
  ccdcMaterialTypeField = (): Locator => this.createMaterialDialog
    .getByText('Công cụ dụng cụ', { exact: false })
    .first();
  /** Giá trị read-only của Thành phẩm; scope trong dialog để loại menu cùng tên ở thanh bên. */
  finishedProductMaterialTypeField = (): Locator => this.createMaterialDialog
    .getByText('Thành phẩm', { exact: true })
    .first();
  /** Giá trị read-only của Bán thành phẩm; scope trong dialog để loại menu cùng tên ở thanh bên. */
  semiFinishedProductMaterialTypeField = (): Locator => this.createMaterialDialog
    .getByText('Bán thành phẩm', { exact: true })
    .first();
  statusSwitch = (): Locator => this.createMaterialDialog.getByRole('switch');
  saveButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Lưu', exact: true });
  saveAndAddButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Lưu và Thêm mới', exact: true });
  successNotification = (): Locator => this.page.getByRole('alert');
  warehouseColumnHeaders = (): Locator => this.visibleDropdown.locator('[role="columnheader"], th');
  taxColumnHeaders = (): Locator => this.visibleDropdown.locator('[role="columnheader"], th');
  /** Xác định thuế theo cell Mã trong combogrid; giữ fallback cho màn hình còn dùng Select cũ. */
  taxOptionRow = (label: string): Locator => {
    const [code = ''] = label.split(' — ');
    const combogridRow = this.dropdownDataRows()
      .filter({ has: this.page.getByRole('cell', { name: code, exact: true }) });
    return combogridRow.or(this.dropdownOption(label));
  };
  taxOptions = (): Locator => this.dropdownDataRows().or(this.enabledDropdownOptions());
  taxActiveOption = (): Locator => this.dropdownDataRows()
    .and(this.page.locator('[aria-selected="true"], .ant-table-row-selected'))
    .or(this.visibleDropdown.locator('.ant-select-item-option-active'));
  clearTaxButton = (label: string): Locator => this.formField(label).locator('.ant-select-clear');
  taxConfirmationDialog = (): Locator => this.page.getByRole('dialog').filter({
    hasText: 'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
  });
  taxConfirmationButton = (name: 'Xác nhận' | 'Hủy'): Locator =>
    this.taxConfirmationDialog().getByRole('button', { name, exact: true });
  warehouseOptionRow = (label: string): Locator => {
    const [code = ''] = label.split(' — ');
    return this.warehouseOptions()
      .filter({ has: this.page.getByRole('cell', { name: code, exact: true }) });
  };
  warehouseOptions = (): Locator => this.dropdownDataRows();
  warehouseActiveOption = (): Locator =>
    this.visibleDropdown.locator('tr.ant-table-row[aria-selected="true"], tr.ant-table-row-selected');
  clearWarehouseButton = (): Locator => this.formField('Kho mặc định').locator('.ant-select-clear');
  clearPricingMethodButton = (): Locator => this.formField('Phương pháp tính giá').locator('.ant-select-clear');
  clearDefaultVatRateButton = (): Locator => this.formField('Thuế suất GTGT mặc định').locator('.ant-select-clear');
  warehouseQuickAddButton = (): Locator => this.visibleDropdown.getByRole('button', { name: 'Thêm nhanh', exact: true });
  warehouseQuickAddDialog = (): Locator => this.page.getByRole('dialog', { name: /Thêm mới kho/i });
  warehouseQuickAddTextbox = (name: 'Mã kho' | 'Tên kho'): Locator =>
    this.warehouseQuickAddDialog().getByRole('textbox', { name, exact: true });
  warehouseQuickAddStatus = (): Locator => this.warehouseQuickAddDialog().getByRole('switch');
  warehouseQuickAddAction = (name: 'Hủy' | 'Lưu'): Locator =>
    this.warehouseQuickAddDialog().getByRole('button', { name, exact: true });
  warehouseQuickAddField = (label: 'Mã kho' | 'Tên kho'): Locator =>
    this.warehouseQuickAddDialog().locator('.ant-form-item').filter({ hasText: label });
  warehouseQuickAddValidation = (label: 'Mã kho' | 'Tên kho'): Locator =>
    this.warehouseQuickAddField(label).locator('.ant-form-item-explain-error');
  validationMessage = (field: string, message: string): Locator => this.formField(field).getByText(message, { exact: true });
  fieldValidation = (field: string): Locator => this.formField(field).locator('.ant-form-item-explain-error');
  notificationMessage = (message: string): Locator => this.page.getByText(message, { exact: true });
  materialSearchInput = (): Locator => this.page.getByRole('textbox', { name: 'Tìm kiếm...', exact: true });
  materialSearchIcon = (): Locator => this.materialSearchInput().locator('..').locator('.ant-input-suffix > svg');
  materialSearchClearButton = (): Locator => this.materialSearchInput().locator('..').getByRole('img', { name: 'close-circle' }).locator('..');
  materialTable = (): Locator => this.page.getByRole('table');
  materialColumnHeaders = (): Locator => this.materialTable().getByRole('columnheader');
  materialColumnHeader = (name: string): Locator => this.materialTable().getByRole('columnheader', { name, exact: true });
  materialColumnFilterButton = (name: string): Locator => this.materialColumnHeader(name).getByRole('button');
  materialSelectAllCheckbox = (): Locator => this.materialTable().getByRole('checkbox', { name: 'Select all', exact: true }).first();
  materialEmptyState = (): Locator => this.materialTable().getByText(/Không (?:có|tìm thấy) dữ liệu(?: phù hợp)?/, { exact: true });
  materialListLoadError = (): Locator => this.page.getByText('Lỗi hệ thống khi tải dữ liệu', { exact: true });
  materialListRetryButton = (): Locator => this.page.getByRole('button', { name: 'Thử lại', exact: true });
  materialPageSizeCombobox = (): Locator => this.page.getByRole('combobox', { name: 'kích thước trang', exact: true });
  materialPageSizeSelectedValue = (): Locator => this.materialPageSizeCombobox().locator('..');
  materialPageSizeOption = (pageSize: number): Locator => this.page.getByRole('option', { name: `${pageSize} / trang`, exact: true });
  materialDataRows = (): Locator => this.materialTable().getByRole('row').filter({
    has: this.page.getByRole('checkbox', { name: /row \d+/i }),
  });
  materialRowCheckboxes = (): Locator => this.materialTable().getByRole('checkbox', { name: /row \d+/i });
  materialRowCheckbox = (rowNumber: number): Locator =>
    this.materialTable().getByRole('checkbox', { name: new RegExp(`row ${rowNumber}(?:\\s|$)`, 'i') });
  materialRowCheckboxByCode = (code: string): Locator => this.materialRow(code).getByRole('checkbox');
  materialGridScroller = (): Locator => this.page.locator('.ant-table-content');
  materialPagination = (): Locator => this.page.getByRole('main').getByRole('list').filter({ hasText: /trên\s+\d+/ });
  materialPaginationSummary = (): Locator => this.materialPagination().getByText(/\d+-\d+\s+trên\s+\d+/);
  materialPreviousPageButton = (): Locator => this.materialPagination().getByRole('listitem', { name: 'Trang Trước' }).getByRole('button');
  materialNextPageButton = (): Locator => this.materialPagination().getByRole('listitem', { name: 'Trang Kế' }).getByRole('button');
  materialPageButton = (pageNumber: number): Locator => this.materialPagination().getByRole('listitem', { name: String(pageNumber), exact: true });
  /** Nhãn theo Expected Result dùng để phát hiện sai lệch wording, không dùng để tiếp tục thao tác. */
  expectedMaterialBulkActionButton = (): Locator => this.page.getByRole('button', { name: 'Hành động hàng loạt', exact: true });
  expectedMaterialBulkDeleteItem = (): Locator => this.page.getByText('Xóa hàng loạt', { exact: true }).last();

  /** Control thực tế đã xác minh trên UI để testcase tiếp tục luồng sau khi ghi nhận mismatch nhãn. */
  materialBulkActionButton = (): Locator => this.page.getByRole('button', { name: 'Chức năng hàng loạt', exact: true });
  materialBulkDeleteItem = (): Locator => this.page.getByText('Xóa', { exact: true }).last();
  materialBulkDeleteDialog = (): Locator => this.page.getByRole('dialog').filter({ hasText: /muốn xóa \d+ vật tư đã chọn/i });
  expectedMaterialBulkConfirmButton = (): Locator => this.materialBulkDeleteDialog().getByRole('button', { name: 'Xác nhận', exact: true });
  materialBulkConfirmButton = (): Locator => this.materialBulkDeleteDialog().getByRole('button', { name: 'Xóa', exact: true });
  materialBulkResultSummary = (): Locator => this.page.getByText(/Thực hiện thành công \d+\/\d+ vật tư\. Thất bại \d+ vật tư\./i);
  firstExistingMaterialCode = (): Locator => this.page.getByRole('table').getByRole('button').first();
  materialRow = (code: string): Locator => this.page.getByRole('row').filter({ has: this.page.getByRole('button', { name: code, exact: true }) });
  visibleMaterialCodeButtons = (): Locator => this.page.getByRole('table').getByRole('row').locator('td').nth(2).getByRole('button');
  deleteMaterialButton = (code: string): Locator => this.materialRow(code).getByRole('button', { name: 'Xóa', exact: true });
  deleteConfirmation = (): Locator => this.page.getByRole('dialog').filter({ hasText: 'Bạn có chắc chắn muốn xóa vật tư' });
  deleteConfirmationButton = (name: string): Locator =>
    this.deleteConfirmation().getByRole('button', { name, exact: true });
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
  materialDetailTabs = (code: string): Locator => this.materialDetails(code).getByRole('tab');
  materialDetailTabPanel = (code: string, tabName: string): Locator =>
    this.materialDetails(code).getByRole('tabpanel', { name: tabName, exact: true });
  materialDetailGridRow = (code: string, tabName: 'Đơn vị quy đổi' | 'Đơn vị tính khác', value: string): Locator =>
    this.materialDetails(code).getByRole('tabpanel', { name: tabName, exact: true }).getByRole('row').filter({ hasText: value });
  materialDetailHeading = (code: string): Locator => this.materialDetails(code).getByText(`Chi tiết vật tư: ${code}`, { exact: true });
  materialDetailAction = (code: string, name: 'Chỉnh sửa' | 'Xóa' | 'Hủy'): Locator =>
    this.materialDetails(code).getByRole('button', { name, exact: true });
  materialDetailCloseButton = (code: string): Locator =>
    this.materialDetails(code).getByRole('button', { name: 'Đóng', exact: true });
  cancelDeleteButton = (): Locator =>
    this.deleteConfirmation().getByRole('button', { name: 'Hủy', exact: true });
  materialDetailControls = (code: string): Locator =>
    this.materialDetails(code).locator('input, textarea, button[role="switch"]');
  materialDetailControlById = (code: string, id: string): Locator =>
    this.materialDetails(code).locator(`[id="${id}"]`);
  materialEditHeading = (code: string): Locator => this.materialDetails(code).getByText(`Chỉnh sửa vật tư: ${code}`, { exact: true });
  materialEditField = (code: string, label: string): Locator =>
    this.materialDetails(code).locator('.ant-form-item').filter({ hasText: label });
  materialEditControl = (code: string, label: string, role: AriaRole): Locator =>
    this.materialEditField(code, label).getByRole(role).first();
  materialEditAction = (code: string, name: 'Lưu' | 'Hủy'): Locator =>
    this.materialDetails(code).getByRole('button', { name, exact: true });
  materialEditTab = (code: string, name: string): Locator =>
    this.materialDetails(code).getByRole('tab', { name, exact: true });
  materialEditConversionDeleteButtons = (code: string): Locator =>
    this.materialDetails(code).getByRole('tabpanel', { name: 'Đơn vị quy đổi', exact: true })
      .getByRole('button', { name: 'Xóa dòng', exact: true });
  conversionGrid = (): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị quy đổi', exact: true }).getByRole('table');
  addConversionRowButton = (): Locator => this.createMaterialDialog.getByRole('button', { name: 'Thêm dòng', exact: true });
  conversionColumnHeaders = (): Locator => this.conversionGrid().getByRole('columnheader');
  conversionColumnHeader = (name: string): Locator => this.conversionGrid().getByRole('columnheader', { name, exact: true });
  conversionOperationCell = (value: string): Locator => this.conversionGrid().getByRole('cell', { name: new RegExp(`^${value}\\b`) });
  conversionOperationOptions = (): Locator => this.visibleDropdown.getByRole('option');
  selectedConversionUnit = (label: string): Locator => {
    const [code = '', name = ''] = label.split(' — ');
    return this.selectedConversionUnitRow(code, name);
  };
  selectedConversionUnitRow = (code: string, name: string): Locator => this.conversionGrid()
    .getByRole('row')
    .filter({ hasText: code })
    .filter({ hasText: name });
  clearConversionUnitButton = (): Locator => this.conversionGrid().locator('.ant-select-clear').first();
  conversionUnitQuickAddButton = (): Locator => this.visibleDropdown.getByRole('button', { name: 'Thêm nhanh', exact: true });
  firstConversionUnitCombobox = (): Locator => this.conversionRowControls('combobox').first();
  conversionRowControls = (role: AriaRole): Locator => this.conversionGrid().getByRole(role);
  conversionValidationMessages = (): Locator => this.conversionGrid().locator('.ant-form-item-explain-error');
  conversionMessage = (message: string): Locator => this.createMaterialDialog.getByRole('tabpanel', { name: 'Đơn vị quy đổi', exact: true }).getByText(message, { exact: true });
  deleteConversionRowButton = (): Locator => this.conversionGrid().getByRole('button', { name: 'Xóa dòng', exact: true });
  /** Chọn dòng Đơn vị quy đổi Hoạt động đầu tiên, loại đúng Đơn vị tính chính theo cell Mã. */
  conversionUnitOption = (mainUnit: string): Locator => {
    const [mainUnitCode = ''] = mainUnit.split(' — ');
    return this.dropdownDataRows()
      .filter({ hasNot: this.page.getByRole('cell', { name: mainUnitCode, exact: true }) })
      .filter({ hasNotText: 'Ngừng hoạt động' })
      .first();
  };
  visibleDropdownOption = (label: string): Locator => this.namedDropdownOption(label);
  accountingAccountOptionRow = (label: string): Locator => {
    const [code = '', name = ''] = label.split(' — ');
    return this.accountingAccountOptions()
      .filter({ has: this.page.getByRole('cell', { name: code, exact: true }) })
      .filter({ has: this.page.getByRole('cell', { name, exact: true }) });
  };
  accountingAccountOptions = (): Locator => this.dropdownDataRows();
  accountingAccountActiveOption = (): Locator => this.dropdownDataRows()
    .and(this.page.locator('[aria-selected="true"], .ant-table-row-selected'));
  accountClearButton = (fieldLabel: string): Locator => this.formField(fieldLabel).locator('.ant-select-clear');
  accountConfirmationDialog = (): Locator => this.page.getByRole('dialog').filter({ hasText: 'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?' });
  accountConfirmationButton = (name: 'Xác nhận' | 'Hủy'): Locator => this.accountConfirmationDialog().getByRole('button', { name, exact: true });
  selectedAccountValue = (fieldLabel: string, label: string): Locator => {
    const [code = '', name = ''] = label.split(' — ');
    const selectedText = `${code} - ${name}`.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    return this.formField(fieldLabel).getByText(new RegExp(`^${selectedText}(?: \\(Ngừng hoạt động\\))?$`, 'u'));
  };
  accountCombobox = (fieldLabel: string): Locator => this.formField(fieldLabel).getByRole('combobox');
}
