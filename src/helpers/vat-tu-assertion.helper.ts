import { expect, test } from '@fixtures/base.fixture';
import type {
  FullGoodsMaterialInput,
  FullGoodsMaterialSelection,
  FullServiceMaterialInput,
  FullServiceMaterialSelection,
  MaterialType,
  VatTuPage,
} from '@pages/danh-muc/vat-tu.page';
import { accountingAccountCoverage } from '@utils/vat-tu-test.util';

export async function verifyAccountingAccountCombobox(
  vatTuPage: VatTuPage,
  fieldLabel: string,
  materialType: MaterialType = 'Hàng hóa',
): Promise<void> {
  const accounts = await vatTuPage.openFromDanhMucAndCollectAccounts();
  const coverage = accountingAccountCoverage(accounts);
  test.skip(
    coverage === undefined,
    'Thiếu precondition: Hệ thống tài khoản chưa có đồng thời tài khoản hoạt động được phép hạch toán và tài khoản ngừng hoạt động',
  );
  if (!coverage) return;

  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await vatTuPage.openDefaultAccountingTab();
  await vatTuPage.openAccountingAccountDropdown(fieldLabel);

  const columnHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
    .map((header) => header.trim())
    .filter(Boolean);
  await expect.soft(
    columnHeaders,
    `Combogrid ${fieldLabel} phải có đúng các cột theo BR5`,
  ).toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

  await vatTuPage.searchAccountingAccount(fieldLabel, coverage.activeAllowed.code);
  await expect(
    vatTuPage.accountingAccountOption(coverage.activeAllowed.label),
    'Tài khoản hoạt động, cho phép hạch toán phải tìm được theo số hiệu',
  ).toBeVisible();
  const activeRowText = await vatTuPage
    .accountingAccountOptionRow(coverage.activeAllowed.label)
    .innerText();
  await expect.soft(
    activeRowText,
    'Dòng tài khoản hoạt động phải hiển thị trạng thái Hoạt động',
  ).toContain('Hoạt động');

  await vatTuPage.searchAccountingAccount(fieldLabel, coverage.activeAllowed.name);
  await expect(
    vatTuPage.accountingAccountOption(coverage.activeAllowed.label),
    `${fieldLabel} phải tìm được theo tên tài khoản`,
  ).toBeVisible();
  await vatTuPage.selectAccountingAccount(fieldLabel, coverage.activeAllowed);
  await expect(
    vatTuPage.selectedAccountingAccount(fieldLabel, coverage.activeAllowed.label),
    'Phải chọn được tài khoản hoạt động có Cho phép hạch toán = Có',
  ).toBeVisible();

  await vatTuPage.openAccountingAccountDropdown(fieldLabel);
  await vatTuPage.searchAccountingAccount(fieldLabel, coverage.inactive.code);
  await expect(
    vatTuPage.accountingAccountOption(coverage.inactive.label),
    'Tài khoản ngừng hoạt động phải hiển thị',
  ).toBeVisible();
  const inactiveRowText = await vatTuPage
    .accountingAccountOptionRow(coverage.inactive.label)
    .innerText();
  await expect.soft(
    inactiveRowText,
    'Dòng tài khoản ngừng hoạt động phải hiển thị trạng thái Ngừng hoạt động',
  ).toContain('Ngừng hoạt động');
  await vatTuPage.selectAccountingAccount(fieldLabel, coverage.inactive);
  await expect(
    vatTuPage.selectedAccountingAccount(fieldLabel, coverage.inactive.label),
    'Phải chọn được tài khoản ngừng hoạt động',
  ).toBeVisible();

  await vatTuPage.openAccountingAccountDropdown(fieldLabel);
  await vatTuPage.selectAccountingAccount(fieldLabel, coverage.activeAllowed);
  await expect(
    vatTuPage.selectedAccountingAccount(fieldLabel, coverage.activeAllowed.label),
    `Phải chọn được một ${fieldLabel} hợp lệ`,
  ).toBeVisible();
}

export async function verifyAllowedAccountingAccountCombobox(
  vatTuPage: VatTuPage,
  fieldLabel: string,
  materialType: MaterialType,
): Promise<void> {
  const accounts = await vatTuPage.openFromDanhMucAndCollectAccounts();
  const allowed = accounts.find((account) => account.allowed);
  const disallowed = accounts.find((account) => !account.allowed);
  test.skip(!allowed, 'Thiếu precondition: Hệ thống tài khoản chưa có tài khoản được phép hạch toán');
  if (!allowed) return;

  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await vatTuPage.openDefaultAccountingTab();
  await vatTuPage.openAccountingAccountDropdown(fieldLabel);
  await vatTuPage.searchAccountingAccount(fieldLabel, allowed.code);
  await expect(vatTuPage.accountingAccountOption(allowed.label), 'Phải tìm được tài khoản theo số hiệu').toBeVisible();
  await vatTuPage.searchAccountingAccount(fieldLabel, allowed.name);
  await expect(vatTuPage.accountingAccountOption(allowed.label), 'Phải tìm được tài khoản theo tên').toBeVisible();
  await vatTuPage.selectAccountingAccount(fieldLabel, allowed);
  await expect(vatTuPage.selectedAccountingAccount(fieldLabel, allowed.label), 'Phải chọn được tài khoản cho phép hạch toán').toBeVisible();

  if (disallowed) {
    await vatTuPage.openAccountingAccountDropdown(fieldLabel);
    await vatTuPage.searchAccountingAccount(fieldLabel, disallowed.code);
    await expect(vatTuPage.accountingAccountOption(disallowed.label), 'Không được hiển thị tài khoản không cho phép hạch toán').toBeHidden();
  }
}

export async function verifyFullGoodsMaterialDetails(
  vatTuPage: VatTuPage,
  input: FullGoodsMaterialInput,
  selection: FullGoodsMaterialSelection,
): Promise<void> {
  await vatTuPage.searchMaterial(input.code);
  await expect(
    vatTuPage.materialRow(input.code),
    'Bản ghi vừa tạo phải hiển thị trên danh sách',
  ).toBeVisible();
  await vatTuPage.openMaterialDetails(input.code);

  await expect(vatTuPage.materialDetailControl(input.code, 'Mã vật tư', 'textbox')).toHaveValue(input.code);
  await expect(vatTuPage.materialDetailControl(input.code, 'Tên vật tư', 'textbox')).toHaveValue(input.name);
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Nhóm vật tư', input.group.label)).toBeVisible();
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Đơn vị tính chính', input.mainUnit.label)).toBeVisible();
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Loại hàng hóa đặc trưng', selection.specialGoodsType)).toBeVisible();
  await expect(vatTuPage.materialDetailControl(input.code, 'Thời hạn bảo hành', 'spinbutton')).toHaveValue('12');
  await expect(vatTuPage.materialDetailText(input.code, selection.warrantyUnit)).toBeVisible();
  await expect(vatTuPage.materialDetailControl(input.code, 'Tên vật tư khi mua', 'textbox')).toHaveValue(input.purchaseName);
  await expect(vatTuPage.materialDetailControl(input.code, 'Tên vật tư khi bán', 'textbox')).toHaveValue(input.saleName);
  await expect(vatTuPage.materialDetailControl(input.code, 'Mô tả', 'textbox')).toHaveValue(input.description);
  await expect(vatTuPage.materialDetailStatusSwitch(input.code)).toBeChecked();

  await vatTuPage.openMaterialDetailTab(input.code, 'Hạch toán ngầm định');
  for (const label of [
    'Tài khoản vật tư',
    'Tài khoản doanh thu',
    'Tài khoản giá vốn',
    'Tài khoản chiết khấu',
    'Tài khoản giảm giá',
    'Tài khoản hàng bán trả lại',
    'Tài khoản chi phí',
  ]) {
    await expect(
      vatTuPage.materialDetailControl(input.code, label, 'combobox'),
      `${label} phải hiển thị trong chi tiết`,
    ).toBeVisible();
  }
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Tài khoản chi phí', selection.expenseAccount)).toBeVisible();

  await vatTuPage.openMaterialDetailTab(input.code, 'Thông tin kho');
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Kho mặc định', selection.warehouse)).toBeVisible();
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Phương pháp tính giá', selection.pricingMethod)).toBeVisible();

  await vatTuPage.openMaterialDetailTab(input.code, 'Thông tin thuế');
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Thuế suất GTGT mặc định', selection.vatRate)).toBeVisible();
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Thuế tiêu thụ đặc biệt', selection.exciseTax)).toBeVisible();
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Thuế tài nguyên', selection.resourceTax)).toBeVisible();

  await vatTuPage.openMaterialDetailTab(input.code, 'Đơn vị quy đổi');
  await expect(vatTuPage.materialDetailText(input.code, selection.conversion.unit)).toBeVisible();
  await expect(vatTuPage.materialDetailText(input.code, selection.conversion.operation)).toBeVisible();
}

export async function verifyFullServiceMaterialDetails(
  vatTuPage: VatTuPage,
  input: FullServiceMaterialInput,
  selection: FullServiceMaterialSelection,
): Promise<void> {
  await vatTuPage.searchMaterial(input.code);
  await expect(vatTuPage.materialRow(input.code)).toBeVisible();
  await vatTuPage.openMaterialDetails(input.code);

  await expect(vatTuPage.materialDetailControl(input.code, 'Mã vật tư', 'textbox')).toHaveValue(input.code);
  await expect(vatTuPage.materialDetailControl(input.code, 'Tên vật tư', 'textbox')).toHaveValue(input.name);
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Nhóm vật tư', input.group.label)).toBeVisible();
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Đơn vị tính chính', input.mainUnit.label)).toBeVisible();
  await expect(vatTuPage.materialDetailControl(input.code, 'Tên vật tư khi mua', 'textbox')).toHaveValue(input.purchaseName);
  await expect(vatTuPage.materialDetailControl(input.code, 'Tên vật tư khi bán', 'textbox')).toHaveValue(input.saleName);
  await expect(vatTuPage.materialDetailControl(input.code, 'Mô tả', 'textbox')).toHaveValue(input.description);
  await expect(vatTuPage.materialDetailStatusSwitch(input.code)).toBeChecked();
  await expect(vatTuPage.materialDetailText(input.code, 'Thời hạn bảo hành')).toBeHidden();
  await expect(vatTuPage.materialDetailText(input.code, 'Hình ảnh hàng hóa')).toBeHidden();
  await expect(vatTuPage.materialDetailTab(input.code, 'Thông tin kho')).toBeHidden();
  await expect(vatTuPage.materialDetailTab(input.code, 'Đơn vị quy đổi')).toBeHidden();

  await vatTuPage.openMaterialDetailTab(input.code, 'Hạch toán ngầm định');
  for (const [label, value] of Object.entries(selection.accounts)) {
    await expect(vatTuPage.materialDetailSelectedValue(input.code, label, value)).toBeVisible();
  }

  await vatTuPage.openMaterialDetailTab(input.code, 'Thông tin thuế');
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Thuế suất GTGT mặc định', selection.vatRate)).toBeVisible();
  await expect(vatTuPage.materialDetailSelectedValue(input.code, 'Thuế tiêu thụ đặc biệt', selection.exciseTax)).toBeVisible();
  await expect.soft(
    vatTuPage.materialDetailSelectedValue(input.code, 'Thuế tài nguyên', selection.resourceTax),
    'Thuế tài nguyên phải được lưu và hiển thị đúng như khi thêm mới',
  ).toBeVisible();

  await vatTuPage.openMaterialDetailTab(input.code, 'Đơn vị tính khác');
  await expect(vatTuPage.materialDetailText(input.code, selection.alternativeUnit)).toBeVisible();
}

export async function verifyBasicMaterialDetails(
  vatTuPage: VatTuPage,
  code: string,
  name: string,
  active: boolean,
): Promise<void> {
  await vatTuPage.searchMaterial(code);
  await expect(vatTuPage.materialRow(code), 'Bản ghi vừa tạo phải hiển thị trên danh sách').toBeVisible();
  await vatTuPage.openMaterialDetails(code);
  await expect(vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox')).toHaveValue(code);
  await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(name);
  if (active) {
    await expect(vatTuPage.materialDetailStatusSwitch(code)).toBeChecked();
  } else {
    await expect(vatTuPage.materialDetailStatusSwitch(code)).not.toBeChecked();
  }
}
