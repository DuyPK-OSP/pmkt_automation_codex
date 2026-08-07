import { test, expect } from '@fixtures/base.fixture';
import type { DatabaseContext } from '@database/database.context';
import type { AccountOption, CatalogueOption, VatTuPage } from '@pages/danh-muc/vat-tu.page';
import { openVatTuWithAccounts, openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import { expectedMaterialTypeCards } from '@test-data/vat-tu.data';
import { requireCredentials } from '@utils/env.config';
import { TestDataGenerator } from '@utils/test-data';
import { accountingAccountCoverage, statusPair } from '@utils/vat-tu-test.util';

/** Đối chiếu đầy đủ sáu thẻ tính chất và mô tả theo testcase mới. */
async function verifyMaterialTypeCards(vatTuPage: VatTuPage): Promise<void> {
  for (const card of expectedMaterialTypeCards) {
    await expect(vatTuPage.materialTypeTitle(card.type), `Phải hiển thị thẻ ${card.type}`).toBeVisible();
    await expect(
      vatTuPage.materialTypeDescription(card.description),
      `Mô tả thẻ ${card.type} phải đúng testcase`,
    ).toBeVisible();
  }
}

/** Sinh chuỗi ASCII unique, traceable và chuẩn hóa đúng độ dài boundary yêu cầu. */
function boundaryText(testCaseId: string, length: number): string {
  const seed = new TestDataGenerator().uniqueKeyword(testCaseId);
  return `${seed}_${'x'.repeat(length)}`.slice(0, length);
}

/** Mở form Hàng hóa tại tab Hạch toán và trả về danh mục Tài khoản từ DB. */
async function prepareGoodsAccounting(vatTuPage: VatTuPage): Promise<readonly AccountOption[]> {
  const accounts = await openVatTuWithAccounts(vatTuPage);
  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType('Hàng hóa');
  await vatTuPage.openDefaultAccountingTab();
  return accounts;
}

/** Mở form Hàng hóa tại combogrid Kho mặc định. */
async function openGoodsWarehouse(vatTuPage: VatTuPage): Promise<void> {
  await vatTuPage.openFromDanhMuc();
  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType('Hàng hóa');
  await vatTuPage.openWarehouseDropdown();
}

/** Lấy danh mục Kho từ DB đúng tenant mặc định rồi mở combogrid để đối chiếu UI. */
async function prepareGoodsWarehouses(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
): Promise<readonly CatalogueOption[]> {
  const credentials = requireCredentials();
  const records = await db.kho.listForDefaultTenant(credentials.username);
  await openGoodsWarehouse(vatTuPage);
  return records.map((record) => ({
    code: record.code,
    name: record.name,
    status: record.active ? 'HoatDong' : 'NgungHoatDong',
    label: `${record.code} — ${record.name}`,
  }));
}

test.describe('PMKT-U-00106 Part 1 - Tạo mới vật tư TC004-TC267', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('TC_PMKT-U-00106-004 - hiển thị popup chọn tính chất với đủ 6 loại vật tư', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();

    await expect(vatTuPage.materialTypeDialog).toBeVisible();
    await verifyMaterialTypeCards(vatTuPage);
  });

  test('TC_PMKT-U-00106-005 - đóng popup chọn tính chất bằng nút X', async ({ vatTuPage, page }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.closeMaterialTypePopup();

    await expect(vatTuPage.materialTypeDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
    await expect(page).toHaveURL(/\/danh-muc\/vat-tu$/);
  });

  test('TC_PMKT-U-00106-006 - chọn Hàng hóa và hiển thị đầy đủ form tạo mới', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.materialTypeDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialTypeValue('Hàng hóa')).toBeVisible();
    for (const tab of ['Hạch toán ngầm định', 'Thông tin kho', 'Thông tin thuế', 'Đơn vị quy đổi']) {
      await expect(vatTuPage.formTab(tab), `Phải hiển thị tab ${tab}`).toBeVisible();
    }
    for (const field of [
      { label: 'Mã vật tư', role: 'textbox' as const },
      { label: 'Tên vật tư', role: 'textbox' as const },
      { label: 'Nhóm vật tư', role: 'combobox' as const },
      { label: 'Đơn vị tính chính', role: 'combobox' as const },
      { label: 'Mô tả', role: 'textbox' as const },
      { label: 'Tên vật tư khi mua', role: 'textbox' as const },
      { label: 'Tên vật tư khi bán', role: 'textbox' as const },
    ]) {
      await expect(vatTuPage.formFieldControl(field.label, field.role), `Phải hiển thị trường ${field.label}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-007 - mở lại popup bằng Thay đổi tính chất', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.changeMaterialType();

    await expect(vatTuPage.materialTypeDialog).toBeVisible();
    await verifyMaterialTypeCards(vatTuPage);
  });

  test('TC_PMKT-U-00106-008 - đóng popup thay đổi và giữ nguyên loại cùng dữ liệu đang nhập', async ({ vatTuPage }) => {
    const materialName = new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-008');
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(materialName);
    await vatTuPage.changeMaterialType();
    await vatTuPage.closeMaterialTypePopup();

    await expect(vatTuPage.materialTypeDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialTypeValue('Hàng hóa')).toBeVisible();
    await expect(vatTuPage.materialNameInput()).toHaveValue(materialName);
  });

  test('TC_PMKT-U-00106-009 - thay đổi tính chất từ Hàng hóa sang Dịch vụ', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.materialTypeDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialTypeValue('Dịch vụ')).toBeVisible();
    await expect(vatTuPage.formTab('Thông tin kho')).toBeHidden();
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeHidden();
  });

  test('TC_PMKT-U-00106-010 - hiển thị TextBox Mã vật tư bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải là TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Mã vật tư'), 'Mã vật tư phải có dấu * bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-011 - nhập Mã vật tư dài 49 ký tự', async ({ vatTuPage }) => {
    const code = `A11${'1'.repeat(46)}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(code);

    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
  });

  test('TC_PMKT-U-00106-012 - nhập Mã vật tư dài tối đa 50 ký tự', async ({ vatTuPage }) => {
    const code = `A12${'2'.repeat(47)}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(code);

    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
  });

  test('TC_PMKT-U-00106-013 - chặn ký tự thứ 51 của Mã vật tư', async ({ vatTuPage }) => {
    const firstFiftyCharacters = `A13${'3'.repeat(47)}`;
    const fiftyOneCharacters = `${firstFiftyCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(fiftyOneCharacters);

    await expect(vatTuPage.materialCodeInput()).toHaveValue(firstFiftyCharacters);
  });

  test('TC_PMKT-U-00106-014 - validate bỏ trống Mã vật tư khi Lưu', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillRequiredInventoryMaterialFields('', new TestDataGenerator().uniqueKeyword('TC014'), mainUnit);
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Mã vật tư', 'Mã không được để trống'),
      'Phải hiển thị đúng lỗi bắt buộc của Mã vật tư',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-015 - validate trùng Mã vật tư đã tồn tại', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const existingCode = await vatTuPage.firstExistingMaterialCode();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillRequiredInventoryMaterialFields(
      existingCode,
      new TestDataGenerator().uniqueKeyword('TC015'),
      mainUnit,
    );
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu mã trùng').toBeVisible();
    await expect(
      vatTuPage.notificationMessage('Mã vật tư đã tồn tại'),
      'Phải hiển thị MSG_PMKT-U-00106_003',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-016 - hiển thị TextBox Tên vật tư bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải là TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư'), 'Tên vật tư phải có dấu * bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-017 - nhập Tên vật tư dài 254 ký tự', async ({ vatTuPage }) => {
    const name = boundaryText('TC_PMKT-U-00106-017', 254);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(name);

    await expect(vatTuPage.materialNameInput()).toHaveValue(name);
  });

  test('TC_PMKT-U-00106-018 - nhập Tên vật tư dài tối đa 255 ký tự', async ({ vatTuPage }) => {
    const name = boundaryText('TC_PMKT-U-00106-018', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(name);

    await expect(vatTuPage.materialNameInput()).toHaveValue(name);
  });

  test('TC_PMKT-U-00106-019 - chặn ký tự thứ 256 của Tên vật tư', async ({ vatTuPage }) => {
    const firstTwoHundredFiftyFiveCharacters = boundaryText('TC_PMKT-U-00106-019', 255);
    const twoHundredFiftySixCharacters = `${firstTwoHundredFiftyFiveCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(twoHundredFiftySixCharacters);

    await expect(vatTuPage.materialNameInput()).toHaveValue(firstTwoHundredFiftyFiveCharacters);
  });

  test('TC_PMKT-U-00106-020 - validate bỏ trống Tên vật tư khi Lưu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillRequiredInventoryMaterialFields(data.uniqueCode('TC020'), '', mainUnit);
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Tên vật tư', 'Tên không được để trống'),
      'Phải hiển thị đúng lỗi bắt buộc của Tên vật tư',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-021 - hiển thị Dropdown Nhóm vật tư không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.groupCombobox, 'Nhóm vật tư phải là Dropdown').toBeVisible();
    await expect(vatTuPage.requiredFormField('Nhóm vật tư'), 'Nhóm vật tư không được hiển thị dấu * bắt buộc').toBeHidden();
  });

  test('TC_PMKT-U-00106-022 - hiển thị đúng dữ liệu và thứ tự Dropdown Nhóm vật tư', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    test.skip(catalogues.groups.length === 0, 'Danh mục Nhóm vật tư không có dữ liệu');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openGroupDropdown();

    for (const group of catalogues.groups) {
      await vatTuPage.searchGroup(group.code);
      await expect(vatTuPage.groupOption(group.label), `Phải hiển thị nhóm ${group.label}`).toBeVisible();
    }
    const statuses = catalogues.groups.map((group) => group.status);
    const firstInactiveIndex = statuses.indexOf('NgungHoatDong');
    const lastActiveIndex = statuses.lastIndexOf('HoatDong');
    expect(firstInactiveIndex === -1 || lastActiveIndex < firstInactiveIndex, 'Nhóm Hoạt động phải xếp trước Nhóm Ngừng hoạt động').toBeTruthy();
  });

  test('TC_PMKT-U-00106-023 - Nhóm vật tư Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const pair = statusPair(catalogues.groups);
    test.skip(!pair, 'Thiếu đồng thời Nhóm vật tư Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openGroupDropdown();

    const activeStyle = await vatTuPage.groupOptionStyle(pair.active.label);
    const inactiveStyle = await vatTuPage.groupOptionStyle(pair.inactive.label);
    expect(inactiveStyle, 'Màu/độ mờ của Nhóm Ngừng hoạt động phải khác Nhóm Hoạt động').not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-024 - chọn một Nhóm vật tư', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const group = catalogues.groups[0];
    test.skip(!group, 'Danh mục Nhóm vật tư không có dữ liệu');
    if (!group) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(group);

    await expect(vatTuPage.selectedGroup(group.label), 'Nhóm đã chọn phải hiển thị dạng tag').toBeVisible();
  });

  test('TC_PMKT-U-00106-025 - chọn đồng thời hai Nhóm vật tư', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'Cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);

    await expect(vatTuPage.selectedGroup(firstGroup.label)).toBeVisible();
    await expect(vatTuPage.selectedGroup(secondGroup.label)).toBeVisible();
  });

  test('TC_PMKT-U-00106-026 - xóa riêng tag Nhóm vật tư thứ hai', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'Cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);
    await vatTuPage.removeSelectedGroup(secondGroup.label);

    await expect(vatTuPage.selectedGroup(secondGroup.label)).toBeHidden();
    await expect(vatTuPage.selectedGroup(firstGroup.label)).toBeVisible();
  });

  test('TC_PMKT-U-00106-027 - xóa nhanh toàn bộ Nhóm vật tư đã chọn', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'Cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);
    await vatTuPage.clearAllSelectedGroups();

    await expect(vatTuPage.selectedGroup(firstGroup.label)).toBeHidden();
    await expect(vatTuPage.selectedGroup(secondGroup.label)).toBeHidden();
    await expect(vatTuPage.groupCombobox).toHaveValue('');
  });

  test('TC_PMKT-U-00106-028 - hiển thị Select Loại hàng hóa đặc trưng không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(
      vatTuPage.specialGoodsTypeCombobox(),
      'Loại hàng hóa đặc trưng phải là Select',
    ).toBeVisible();
    await expect(
      vatTuPage.requiredFormField('Loại hàng hóa đặc trưng'),
      'Loại hàng hóa đặc trưng không được hiển thị dấu * bắt buộc',
    ).toBeHidden();
  });

  test('TC_PMKT-U-00106-029 - hiển thị các option Loại hàng hóa đặc trưng của Hàng hóa', async ({ vatTuPage }) => {
    const expectedOptions = ['Xe ô tô', 'Xe mô tô', 'Hàng hóa khác'];
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openSpecialGoodsTypeDropdown();

    await expect(vatTuPage.specialGoodsTypeCombobox(), 'Trường Loại hàng hóa đặc trưng phải hiển thị').toBeVisible();
    for (const option of expectedOptions) {
      await expect(
        vatTuPage.specialGoodsTypeOption(option),
        `Phải hiển thị option ${option}`,
      ).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-030 - hiển thị Combogrid Đơn vị tính chính bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải là Combogrid').toBeVisible();
    await expect(
      vatTuPage.requiredFormField('Đơn vị tính chính'),
      'Đơn vị tính chính phải hiển thị dấu * bắt buộc',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-031 - hiển thị đúng cột, dữ liệu và thứ tự Đơn vị tính chính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thu thập ENT_DonViTinh từ response thực tế để đối chiếu combogrid.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    test.skip(catalogues.units.length === 0, 'Danh mục Đơn vị tính không có dữ liệu');
    // Hành động: Mở form Hàng hóa > Mở combogrid Đơn vị tính chính.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();

    // Xác nhận UI/DB: Đúng ba cột, đủ dữ liệu ENT_DonViTinh và đúng thứ tự trạng thái.
    for (const header of ['Mã đơn vị tính', 'Tên đơn vị tính', 'Trạng thái']) {
      await expect.soft(vatTuPage.mainUnitColumnHeader(header), `Phải hiển thị cột ${header}`).toBeVisible();
    }
    for (const unit of catalogues.units) {
      await vatTuPage.searchMainUnit(unit.code);
      await expect(vatTuPage.mainUnitOption(unit.label), `Phải hiển thị Đơn vị tính ${unit.label}`).toBeVisible();
    }
    const statuses = catalogues.units.map((unit) => unit.status);
    const firstInactiveIndex = statuses.indexOf('NgungHoatDong');
    const lastActiveIndex = statuses.lastIndexOf('HoatDong');
    expect(firstInactiveIndex === -1 || lastActiveIndex < firstInactiveIndex, 'Đơn vị tính Hoạt động phải xếp trước Ngừng hoạt động').toBeTruthy();
  });

  test('TC_PMKT-U-00106-032 - Đơn vị tính Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn một cặp Đơn vị tính Hoạt động/Ngừng hoạt động từ ENT_DonViTinh.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const pair = statusPair(catalogues.units);
    test.skip(!pair, 'Thiếu đồng thời Đơn vị tính Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    // Hành động: Mở form Hàng hóa > Mở combogrid Đơn vị tính chính.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();

    // Xác nhận UI: Bản ghi Ngừng hoạt động có kiểu chữ khác bản ghi Hoạt động.
    await vatTuPage.searchMainUnit(pair.active.code);
    const activeStyle = await vatTuPage.mainUnitOptionStyle(pair.active.label);
    await vatTuPage.searchMainUnit(pair.inactive.code);
    const inactiveStyle = await vatTuPage.mainUnitOptionStyle(pair.inactive.label);
    expect(inactiveStyle, 'Màu/độ mờ của Đơn vị tính Ngừng hoạt động phải khác Đơn vị tính Hoạt động').not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-033 - xác nhận sử dụng Đơn vị tính Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Ngừng hoạt động thực tế từ ENT_DonViTinh.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const inactiveUnit = catalogues.units.find((unit) => unit.status === 'NgungHoatDong');
    test.skip(!inactiveUnit, 'Thiếu Đơn vị tính Ngừng hoạt động');
    if (!inactiveUnit) return;
    // Hành động: Mở combogrid > Chọn bản ghi Ngừng hoạt động.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(inactiveUnit.code);
    await vatTuPage.selectMainUnit(inactiveUnit);

    // Xác nhận UI: Popup có đúng nội dung và hai nút theo testcase.
    await expect.soft(vatTuPage.mainUnitConfirmationMessage()).toBeVisible();
    await expect.soft(vatTuPage.mainUnitConfirmationButton('Xác nhận')).toBeVisible();
    await expect.soft(vatTuPage.mainUnitConfirmationButton('Hủy')).toBeVisible();
    if (await vatTuPage.mainUnitConfirmationDialog().isVisible()) {
      await vatTuPage.confirmInactiveMainUnit();
      await expect(vatTuPage.mainUnitConfirmationDialog(), 'Popup phải đóng sau khi Xác nhận').toBeHidden();
      await expect(vatTuPage.selectedMainUnit(inactiveUnit.label), 'Đơn vị tính Ngừng hoạt động phải được chọn thành công').toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-034 - hủy sử dụng Đơn vị tính Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Ngừng hoạt động thực tế; trường ban đầu chưa chọn giá trị.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const inactiveUnit = catalogues.units.find((unit) => unit.status === 'NgungHoatDong');
    test.skip(!inactiveUnit, 'Thiếu Đơn vị tính Ngừng hoạt động');
    if (!inactiveUnit) return;
    // Hành động: Mở combogrid > Chọn bản ghi Ngừng hoạt động.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(inactiveUnit.code);
    await vatTuPage.selectMainUnit(inactiveUnit);

    // Xác nhận UI: Popup đúng nội dung/nút; sau khi Hủy, popup đóng và trường vẫn trống.
    await expect.soft(vatTuPage.mainUnitConfirmationMessage()).toBeVisible();
    if (await vatTuPage.mainUnitConfirmationDialog().isVisible()) {
      await expect(vatTuPage.mainUnitConfirmationButton('Xác nhận')).toBeVisible();
      await expect(vatTuPage.mainUnitConfirmationButton('Hủy')).toBeVisible();
      await vatTuPage.cancelInactiveMainUnit();
      await expect(vatTuPage.mainUnitConfirmationDialog(), 'Popup phải đóng sau khi Hủy').toBeHidden();
    }
    await expect(vatTuPage.selectedMainUnit(inactiveUnit.label), 'Bản ghi Ngừng hoạt động không được giữ lại sau thao tác Hủy').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải giữ trạng thái trống ban đầu').toHaveValue('');
  });

  test('TC_PMKT-U-00106-035 - chọn Đơn vị tính chính Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Hoạt động đầu tiên từ ENT_DonViTinh thực tế.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!activeUnit, 'Thiếu Đơn vị tính Hoạt động');
    if (!activeUnit) return;
    // Hành động: Mở combogrid > Chọn bản ghi Hoạt động.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(activeUnit.code);
    await vatTuPage.selectMainUnit(activeUnit);

    // Xác nhận UI: Giá trị được chọn thành công và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedMainUnit(activeUnit.label), 'Đơn vị tính Hoạt động phải được chọn thành công').toBeVisible();
    await expect(vatTuPage.mainUnitConfirmationDialog(), 'Không được hiển thị cảnh báo khi chọn Đơn vị tính Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-036 - tìm kiếm Đơn vị tính chính theo Mã đơn vị tính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy mã Đơn vị tính đầu tiên từ ENT_DonViTinh thực tế làm từ khóa toàn phần.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const target = catalogues.units[0];
    test.skip(!target, 'Danh mục Đơn vị tính không có dữ liệu');
    if (!target) return;
    // Hành động: Mở combogrid > Nhập Mã đơn vị tính.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(target.code);

    // Xác nhận UI/DB: Chỉ hiển thị đúng các bản ghi có mã chứa từ khóa.
    const actualLabels = await vatTuPage.visibleMainUnitLabels();
    const expectedLabels = catalogues.units
      .filter((unit) => unit.code.toLocaleLowerCase('vi').includes(target.code.toLocaleLowerCase('vi')))
      .map((unit) => unit.label);
    expect(actualLabels, 'Danh sách phải lọc theo Mã đơn vị tính').toEqual(expectedLabels);
  });

  test('TC_PMKT-U-00106-037 - tìm kiếm Đơn vị tính chính theo Tên đơn vị tính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy tên Đơn vị tính đầu tiên từ ENT_DonViTinh thực tế làm từ khóa toàn phần.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const target = catalogues.units[0];
    test.skip(!target, 'Danh mục Đơn vị tính không có dữ liệu');
    if (!target) return;
    // Hành động: Mở combogrid > Nhập Tên đơn vị tính.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(target.name);

    // Xác nhận UI/DB: Chỉ hiển thị đúng các bản ghi có tên chứa từ khóa.
    const actualLabels = await vatTuPage.visibleMainUnitLabels();
    const expectedLabels = catalogues.units
      .filter((unit) => unit.name.toLocaleLowerCase('vi').includes(target.name.toLocaleLowerCase('vi')))
      .map((unit) => unit.label);
    expect(actualLabels, 'Danh sách phải lọc theo Tên đơn vị tính').toEqual(expectedLabels);
  });

  test('TC_PMKT-U-00106-038 - tìm kiếm Đơn vị tính chính theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng trạng thái Hoạt động đang có trong ENT_DonViTinh.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const expectedLabels = catalogues.units.filter((unit) => unit.status === 'HoatDong').map((unit) => unit.label);
    test.skip(expectedLabels.length === 0, 'Danh mục Đơn vị tính không có bản ghi Hoạt động');
    // Hành động: Mở combogrid > Nhập từ khóa Trạng thái.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit('Hoạt động');

    // Xác nhận UI/DB: Danh sách chỉ còn các bản ghi có trạng thái chứa từ khóa.
    const actualLabels = await vatTuPage.visibleMainUnitLabels();
    expect(actualLabels, 'Danh sách phải lọc theo Trạng thái Hoạt động').toEqual(expectedLabels);
  });

  test('TC_PMKT-U-00106-039 - phím Enter chọn dòng Đơn vị tính đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ký tự đầu của mã thực tế để tìm nhiều kết quả, không hardcode option.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const keyword = catalogues.units[0]?.code.slice(0, 1) ?? '';
    const candidates = catalogues.units.filter((unit) => unit.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')));
    test.skip(!keyword || candidates.length < 2, 'Không có từ khóa thực tế trả về nhiều Đơn vị tính');
    // Hành động: Mở combogrid > Tìm kiếm > Nhấn Enter.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(keyword);
    const results = await vatTuPage.visibleMainUnitLabels();
    test.skip(results.length < 2, 'UI không trả về nhiều kết quả tìm kiếm');
    const firstResult = results[0];
    if (!firstResult) return;
    await vatTuPage.pressMainUnitKey('Enter');

    // Xác nhận UI: Dropdown đóng và dòng đầu tiên được chọn.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedMainUnit(firstResult), 'Enter phải chọn dòng kết quả đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-040 - phím Up và Down di chuyển từng dòng Đơn vị tính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Yêu cầu danh mục có ít nhất bốn dòng để kiểm tra nhiều lần Down và một lần Up.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    test.skip(catalogues.units.length < 4, 'Danh mục Đơn vị tính có ít hơn bốn bản ghi');
    // Hành động: Mở combogrid > nhấn Down ba lần > nhấn Up một lần.
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    const labels = await vatTuPage.visibleMainUnitLabels();
    await vatTuPage.pressMainUnitKey('ArrowDown');
    const afterFirstDown = await vatTuPage.activeMainUnitLabel();
    await vatTuPage.pressMainUnitKey('ArrowDown');
    const afterSecondDown = await vatTuPage.activeMainUnitLabel();
    await vatTuPage.pressMainUnitKey('ArrowDown');
    const afterThirdDown = await vatTuPage.activeMainUnitLabel();
    await vatTuPage.pressMainUnitKey('ArrowUp');
    const afterUp = await vatTuPage.activeMainUnitLabel();

    // Xác nhận UI: Active row di chuyển đúng một dòng và chưa làm thay đổi giá trị trường.
    expect(labels.indexOf(afterSecondDown), 'Down lần hai phải xuống đúng một dòng').toBe(labels.indexOf(afterFirstDown) + 1);
    expect(labels.indexOf(afterThirdDown), 'Down lần ba phải xuống đúng một dòng').toBe(labels.indexOf(afterSecondDown) + 1);
    expect(afterUp, 'Up phải quay lại đúng dòng liền trước').toBe(afterSecondDown);
    await expect(vatTuPage.mainUnitCombobox, 'Điều hướng Up/Down không được chọn giá trị').toHaveValue('');
  });

  test('TC_PMKT-U-00106-041 - phím ESC đóng dropdown Đơn vị tính chính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Trường Đơn vị tính chính đang trống trên form Hàng hóa mới mở.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const valueBefore = await vatTuPage.mainUnitCombobox.inputValue();
    // Hành động: Mở combogrid > Nhấn phím ESC.
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.pressMainUnitKey('Escape');

    // Xác nhận UI: Dropdown đóng ngay và không làm thay đổi giá trị hiện tại.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn ESC').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'ESC không được thay đổi giá trị Đơn vị tính chính').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-042 - icon X xóa nhanh Đơn vị tính chính đã chọn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Hoạt động đầu tiên từ ENT_DonViTinh để tránh cảnh báo bản ghi ngừng hoạt động.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!activeUnit, 'Danh mục Đơn vị tính không có bản ghi Hoạt động');
    if (!activeUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(activeUnit.code);
    await vatTuPage.selectMainUnit(activeUnit);
    await expect(vatTuPage.selectedMainUnit(activeUnit.label), 'Đơn vị tính phải được chọn trước khi xóa').toBeVisible();
    // Hành động: Hover trường > Click icon X xóa nhanh.
    await vatTuPage.clearMainUnit();

    // Xác nhận UI: Nhãn đã chọn biến mất và combogrid trở về trạng thái trống.
    await expect(vatTuPage.selectedMainUnit(activeUnit.label), 'Giá trị Đơn vị tính đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải trở về trạng thái trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-051 - validate bắt buộc Đơn vị tính chính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mã/Tên unique và giữ trống duy nhất Đơn vị tính chính.
    const data = new TestDataGenerator();
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillFormField('Mã vật tư', data.uniqueCode('TC051'));
    await vatTuPage.fillFormField('Tên vật tư', data.uniqueKeyword('TC051'));
    await vatTuPage.openFormTab('Thông tin kho');
    await vatTuPage.ensureFirstFormOption('Phương pháp tính giá');
    // Hành động: Nhấn Lưu khi Đơn vị tính chính đang trống.
    await vatTuPage.saveMaterial();

    // Xác nhận UI: Hệ thống chặn lưu và hiển thị đúng message testcase.
    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi thiếu Đơn vị tính chính').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Đơn vị tính chính', 'Đơn vị tính chính không được để trống'),
      'Phải hiển thị lỗi bắt buộc của Đơn vị tính chính',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-052 - hiển thị checkbox Giảm thuế theo quy định không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới loại Hàng hóa.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Xác nhận UI: Control là checkbox, đúng label và không có dấu bắt buộc.
    await expect(vatTuPage.checkbox('Giảm thuế theo quy định'), 'Phải hiển thị checkbox Giảm thuế theo quy định').toBeVisible();
    await expect(vatTuPage.requiredFormField('Giảm thuế theo quy định'), 'Checkbox không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-053 - checkbox Giảm thuế mặc định false và thay đổi được', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và lấy checkbox theo accessible name.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const checkbox = vatTuPage.checkbox('Giảm thuế theo quy định');

    // Xác nhận UI: Mặc định không tích.
    await expect(checkbox, 'Checkbox Giảm thuế phải mặc định false').not.toBeChecked();
    // Hành động và xác nhận: Tích chọn rồi bỏ tích thành công.
    await vatTuPage.setCheckbox('Giảm thuế theo quy định', true);
    await expect(checkbox, 'Checkbox phải chuyển sang trạng thái được tích').toBeChecked();
    await vatTuPage.setCheckbox('Giảm thuế theo quy định', false);
    await expect(checkbox, 'Checkbox phải trở lại trạng thái không tích').not.toBeChecked();
  });

  test('TC_PMKT-U-00106-054 - hiển thị Numeric Thời hạn bảo hành không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới loại Hàng hóa.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Xác nhận UI: Control là spinbutton Numeric, đúng label và không có dấu bắt buộc.
    await expect(vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Phải hiển thị Numeric Thời hạn bảo hành').toBeVisible();
    await expect(vatTuPage.requiredFormField('Thời hạn bảo hành'), 'Thời hạn bảo hành không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-055 - nhập thời hạn bảo hành nguyên dương và chọn Tháng', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới loại Hàng hóa.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    // Hành động: Nhập 12 và chọn đơn vị thời gian Tháng đúng testcase.
    await vatTuPage.fillFormField('Thời hạn bảo hành', '12');
    await vatTuPage.selectWarrantyUnit('Tháng');

    // Xác nhận UI: Numeric nhận đúng 12 và đơn vị Tháng được chọn.
    await expect(vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Numeric phải nhận số nguyên dương 12').toHaveValue('12');
    await expect(vatTuPage.selectedWarrantyUnit('Tháng'), 'Phải chọn thành công đơn vị thời gian Tháng').toBeVisible();
  });

  test('TC_PMKT-U-00106-056 - validate thời hạn bảo hành là số âm', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!activeUnit, 'Danh mục Đơn vị tính không có bản ghi Hoạt động');
    if (!activeUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillRequiredInventoryMaterialFields(data.uniqueCode('TC056'), data.uniqueKeyword('TC056'), activeUnit);

    await vatTuPage.fillFormField('Thời hạn bảo hành', '-5');
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu thời hạn bảo hành không hợp lệ').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Thời hạn bảo hành', 'Thời hạn bảo hành phải là số nguyên dương'),
      'Phải hiển thị đúng lỗi thời hạn bảo hành theo testcase',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-057 - ẩn thời hạn bảo hành khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.formField('Thời hạn bảo hành'), 'Form Dịch vụ phải ẩn hoàn toàn trường Thời hạn bảo hành').toBeHidden();
  });

  test('TC_PMKT-U-00106-058 - reset thời hạn bảo hành khi đổi sang Nguyên vật liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillFormField('Thời hạn bảo hành', '12');
    await expect(vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton')).toHaveValue('12');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');

    await expect(
      vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton'),
      'Form Nguyên vật liệu phải reset Numeric Thời hạn bảo hành về trống',
    ).toHaveValue('');
  });

  test('TC_PMKT-U-00106-059 - hiển thị TextArea Mô tả không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.textarea('Mô tả'), 'Phải hiển thị control TextArea Mô tả').toBeVisible();
    await expect(vatTuPage.requiredFormField('Mô tả'), 'Mô tả không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-060 - nhập Mô tả cận biên Max-1 499 ký tự', async ({ vatTuPage }) => {
    const description = boundaryText('TC_PMKT-U-00106-060', 499);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillFormField('Mô tả', description);

    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải nhận đủ 499 ký tự').toHaveValue(description);
  });

  test('TC_PMKT-U-00106-061 - nhập Mô tả cận biên Max 500 ký tự', async ({ vatTuPage }) => {
    const description = boundaryText('TC_PMKT-U-00106-061', 500);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillFormField('Mô tả', description);

    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải nhận đủ 500 ký tự').toHaveValue(description);
  });

  test('TC_PMKT-U-00106-062 - chặn ký tự thứ 501 của Mô tả', async ({ vatTuPage }) => {
    const firstFiveHundredCharacters = boundaryText('TC_PMKT-U-00106-062', 500);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillFormField('Mô tả', `${firstFiveHundredCharacters}x`);

    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả chỉ được giữ tối đa 500 ký tự').toHaveValue(firstFiveHundredCharacters);
  });

  test('TC_PMKT-U-00106-063 - hiển thị TextBox Tên vật tư khi mua không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới loại Hàng hóa theo precondition.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Xác nhận UI: Control là TextBox, đúng label và không có dấu bắt buộc.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Phải hiển thị TextBox Tên vật tư khi mua').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư khi mua'), 'Tên vật tư khi mua không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-064 - nhập Tên vật tư khi mua cận biên Max-1 254 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh chuỗi unique, traceable có đúng 254 ký tự.
    const purchaseName = boundaryText('TC_PMKT-U-00106-064', 254);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập chuỗi 254 ký tự vào Tên vật tư khi mua.
    await vatTuPage.fillFormField('Tên vật tư khi mua', purchaseName);

    // Xác nhận UI: Trường nhận đầy đủ chuỗi Max-1.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên vật tư khi mua phải nhận đủ 254 ký tự').toHaveValue(purchaseName);
  });

  test('TC_PMKT-U-00106-065 - nhập Tên vật tư khi mua cận biên Max 255 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh chuỗi unique, traceable có đúng 255 ký tự.
    const purchaseName = boundaryText('TC_PMKT-U-00106-065', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập chuỗi 255 ký tự vào Tên vật tư khi mua.
    await vatTuPage.fillFormField('Tên vật tư khi mua', purchaseName);

    // Xác nhận UI: Trường nhận đầy đủ chuỗi Max.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên vật tư khi mua phải nhận đủ 255 ký tự').toHaveValue(purchaseName);
  });

  test('TC_PMKT-U-00106-066 - chặn ký tự thứ 256 của Tên vật tư khi mua', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh 255 ký tự hợp lệ rồi thêm ký tự thứ 256 để kiểm tra chặn cứng.
    const firstTwoHundredFiftyFiveCharacters = boundaryText('TC_PMKT-U-00106-066', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập tổng cộng 256 ký tự vào Tên vật tư khi mua.
    await vatTuPage.fillFormField('Tên vật tư khi mua', `${firstTwoHundredFiftyFiveCharacters}x`);

    // Xác nhận UI: Trường chỉ giữ 255 ký tự đầu tiên.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên vật tư khi mua chỉ được giữ tối đa 255 ký tự').toHaveValue(firstTwoHundredFiftyFiveCharacters);
  });

  test('TC_PMKT-U-00106-067 - hiển thị TextBox Tên vật tư khi bán không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới loại Hàng hóa theo precondition.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Xác nhận UI: Control là TextBox, đúng label và không có dấu bắt buộc.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Phải hiển thị TextBox Tên vật tư khi bán').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư khi bán'), 'Tên vật tư khi bán không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-068 - nhập Tên vật tư khi bán cận biên Max-1 254 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh chuỗi unique, traceable có đúng 254 ký tự.
    const saleName = boundaryText('TC_PMKT-U-00106-068', 254);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập chuỗi 254 ký tự vào Tên vật tư khi bán.
    await vatTuPage.fillFormField('Tên vật tư khi bán', saleName);

    // Xác nhận UI: Trường nhận đầy đủ chuỗi Max-1.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên vật tư khi bán phải nhận đủ 254 ký tự').toHaveValue(saleName);
  });

  test('TC_PMKT-U-00106-069 - nhập Tên vật tư khi bán cận biên Max 255 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh chuỗi unique, traceable có đúng 255 ký tự.
    const saleName = boundaryText('TC_PMKT-U-00106-069', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập chuỗi 255 ký tự vào Tên vật tư khi bán.
    await vatTuPage.fillFormField('Tên vật tư khi bán', saleName);

    // Xác nhận UI: Trường nhận đầy đủ chuỗi Max.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên vật tư khi bán phải nhận đủ 255 ký tự').toHaveValue(saleName);
  });

  test('TC_PMKT-U-00106-070 - chặn ký tự thứ 256 của Tên vật tư khi bán', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh 255 ký tự hợp lệ rồi thêm ký tự thứ 256 để kiểm tra chặn cứng.
    const firstTwoHundredFiftyFiveCharacters = boundaryText('TC_PMKT-U-00106-070', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập tổng cộng 256 ký tự vào Tên vật tư khi bán.
    await vatTuPage.fillFormField('Tên vật tư khi bán', `${firstTwoHundredFiftyFiveCharacters}x`);

    // Xác nhận UI: Trường chỉ giữ 255 ký tự đầu tiên.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên vật tư khi bán chỉ được giữ tối đa 255 ký tự').toHaveValue(firstTwoHundredFiftyFiveCharacters);
  });

  test('TC_PMKT-U-00106-071 - Tên vật tư khi mua tự điền và cho phép sửa độc lập', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng đúng dữ liệu cố định được manual testcase chỉ định.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập Tên vật tư > kiểm tra tự điền > sửa riêng Tên vật tư khi mua.
    await vatTuPage.fillFormField('Tên vật tư', 'VT_TEST_001');
    const purchaseName = vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox');
    await expect(purchaseName, 'Tên vật tư khi mua phải tự động điền theo Tên vật tư').toHaveValue('VT_TEST_001');
    await vatTuPage.fillFormField('Tên vật tư khi mua', 'VT_TEST_001_MUA');

    // Xác nhận UI: Giá trị mua được sửa độc lập và không làm đổi Tên vật tư.
    await expect(purchaseName, 'Phải cho phép sửa độc lập Tên vật tư khi mua').toHaveValue('VT_TEST_001_MUA');
    await expect(vatTuPage.formFieldControl('Tên vật tư', 'textbox'), 'Tên vật tư gốc phải được giữ nguyên').toHaveValue('VT_TEST_001');
  });

  test('TC_PMKT-U-00106-072 - Tên vật tư khi bán tự điền và cho phép sửa độc lập', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng đúng dữ liệu cố định được manual testcase chỉ định.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Nhập Tên vật tư > kiểm tra tự điền > sửa riêng Tên vật tư khi bán.
    await vatTuPage.fillFormField('Tên vật tư', 'VT_TEST_001');
    const saleName = vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox');
    await expect(saleName, 'Tên vật tư khi bán phải tự động điền theo Tên vật tư').toHaveValue('VT_TEST_001');
    await vatTuPage.fillFormField('Tên vật tư khi bán', 'VT_TEST_001_BAN');

    // Xác nhận UI: Giá trị bán được sửa độc lập và không làm đổi Tên vật tư.
    await expect(saleName, 'Phải cho phép sửa độc lập Tên vật tư khi bán').toHaveValue('VT_TEST_001_BAN');
    await expect(vatTuPage.formFieldControl('Tên vật tư', 'textbox'), 'Tên vật tư gốc phải được giữ nguyên').toHaveValue('VT_TEST_001');
  });

  test('TC_PMKT-U-00106-073 - hiển thị control Ảnh không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới loại Hàng hóa theo precondition.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Xác nhận UI: Có control upload file, label Ảnh và không có dấu bắt buộc.
    await expect(vatTuPage.materialImageInput(), 'Phải tồn tại control tải file Ảnh').toBeAttached();
    await expect(vatTuPage.materialImageLabel(), 'Label phải hiển thị đúng là Ảnh').toBeVisible();
    await expect(vatTuPage.requiredFormField('Ảnh'), 'Ảnh không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-074 - tải ảnh JPG dung lượng 1.5MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng file JPG hợp lệ có dung lượng chính xác 1.5 MiB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Tải file JPG nhỏ hơn giới hạn 2MB.
    await vatTuPage.uploadMaterialImage('test-data/tc074-material-1_5mb.jpg');

    // Xác nhận UI: Ảnh tải thành công và hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh JPG 1.5MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-075 - tải ảnh JPG dung lượng đúng 2MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng file JPG hợp lệ có dung lượng chính xác 2 MiB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Tải file JPG tại đúng giới hạn 2MB.
    await vatTuPage.uploadMaterialImage('test-data/tc075-material-2mb.jpg');

    // Xác nhận UI: Ảnh tải thành công và hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh JPG đúng 2MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-076 - chặn ảnh JPG dung lượng 2.1MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng JPEG hợp lệ vượt giới hạn 2MB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Chọn file JPG dung lượng 2.1 MiB.
    await vatTuPage.chooseMaterialImage('test-data/tc076-material-2_1mb.jpg');

    // Xác nhận UI: Hệ thống chặn upload, không preview và cảnh báo dung lượng.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh JPG vượt 2MB không được hiển thị preview').toBeHidden();
    await expect(vatTuPage.materialImageSizeError(), 'Phải hiển thị cảnh báo dung lượng JPG vượt quá 2MB').toBeVisible();
  });

  test('TC_PMKT-U-00106-077 - tải ảnh PNG dung lượng 1.5MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng PNG hợp lệ nhỏ hơn 2MB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Tải file PNG dung lượng 1.5 MiB.
    await vatTuPage.uploadMaterialImage('test-data/tc077-material-1_5mb.png');

    // Xác nhận UI: Ảnh tải thành công và hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh PNG 1.5MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-078 - tải ảnh PNG dung lượng đúng 2MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng PNG hợp lệ đúng giới hạn 2MB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Tải file PNG dung lượng đúng 2 MiB.
    await vatTuPage.uploadMaterialImage('test-data/tc078-material-2mb.png');

    // Xác nhận UI: Ảnh tải thành công và hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh PNG đúng 2MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-079 - chặn ảnh PNG dung lượng 2.1MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng PNG hợp lệ vượt giới hạn 2MB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Chọn file PNG dung lượng 2.1 MiB.
    await vatTuPage.chooseMaterialImage('test-data/tc079-material-2_1mb.png');

    // Xác nhận UI: Hệ thống chặn upload, không preview và cảnh báo dung lượng.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh PNG vượt 2MB không được hiển thị preview').toBeHidden();
    await expect(vatTuPage.materialImageSizeError(), 'Phải hiển thị cảnh báo dung lượng PNG vượt quá 2MB').toBeVisible();
  });

  test('TC_PMKT-U-00106-080 - tải ảnh WEBP dung lượng 1.5MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng WEBP hợp lệ nhỏ hơn 2MB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Tải file WEBP dung lượng 1.5 MiB.
    await vatTuPage.uploadMaterialImage('test-data/tc080-material-1_5mb.webp');

    // Xác nhận UI: Ảnh tải thành công và hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh WEBP 1.5MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-081 - tải ảnh WEBP dung lượng đúng 2MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng WEBP hợp lệ đúng giới hạn 2MB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Tải file WEBP dung lượng đúng 2 MiB.
    await vatTuPage.uploadMaterialImage('test-data/tc081-material-2mb.webp');

    // Xác nhận UI: Ảnh tải thành công và hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh WEBP đúng 2MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-082 - chặn ảnh WEBP dung lượng 2.1MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng WEBP hợp lệ vượt giới hạn 2MB.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Chọn file WEBP dung lượng 2.1 MiB.
    await vatTuPage.chooseMaterialImage('test-data/tc082-material-2_1mb.webp');

    // Xác nhận UI: Hệ thống chặn upload, không preview và cảnh báo dung lượng.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh WEBP vượt 2MB không được hiển thị preview').toBeHidden();
    await expect(vatTuPage.materialImageSizeError(), 'Phải hiển thị cảnh báo dung lượng WEBP vượt quá 2MB').toBeVisible();
  });

  test('TC_PMKT-U-00106-083 - chặn file PDF không phải định dạng ảnh hợp lệ', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và dùng tài liệu PDF thay cho ảnh hợp lệ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Chọn file PDF tại control Ảnh.
    await vatTuPage.chooseMaterialImage('test-data/tc083-invalid-format.pdf');

    // Xác nhận UI: Hệ thống chặn file, không preview và cảnh báo sai định dạng.
    await expect(vatTuPage.materialImagePreview(), 'File PDF không được hiển thị preview ảnh').toBeHidden();
    await expect(vatTuPage.materialImageFormatError(), 'Phải hiển thị cảnh báo định dạng ảnh không hợp lệ').toBeVisible();
  });

  test('TC_PMKT-U-00106-084 - ẩn control Ảnh khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form tạo mới Hàng hóa.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Hành động: Thay đổi tính chất > chọn Dịch vụ.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Toàn bộ khu vực hình ảnh bị ẩn khỏi form Dịch vụ.
    await expect(vatTuPage.materialImageSection(), 'Form Dịch vụ phải ẩn hoàn toàn control Ảnh').toBeHidden();
  });

  test('TC_PMKT-U-00106-085 - reset ảnh khi đổi sang Nguyên vật liệu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và upload một ảnh hợp lệ có preview.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.uploadMaterialImage('test-data/tc074-material-1_5mb.jpg');
    await expect(vatTuPage.materialImagePreview(), 'Ảnh phải có preview trước khi đổi tính chất').toBeVisible();

    // Hành động: Thay đổi tính chất > chọn Nguyên vật liệu.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');

    // Xác nhận UI: Ảnh đã chọn được xóa và control trở về mặc định.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh phải được reset sau khi đổi sang Nguyên vật liệu').toBeHidden();
  });

  test('TC_PMKT-U-00106-086 - hiển thị Toggle Trạng thái bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới loại Hàng hóa theo precondition.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Xác nhận UI: Có Toggle Trạng thái, đúng label và có dấu bắt buộc.
    await expect(vatTuPage.statusSwitch(), 'Phải hiển thị Toggle Trạng thái').toBeVisible();
    await expect(vatTuPage.requiredFormField('Trạng thái'), 'Trạng thái phải hiển thị dấu * bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-087 - Toggle Trạng thái mặc định Hoạt động và đổi được', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và lấy Toggle Trạng thái.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const statusSwitch = vatTuPage.statusSwitch();

    // Xác nhận UI: Toggle mặc định là Hoạt động.
    await expect(statusSwitch, 'Trạng thái mặc định phải là Hoạt động').toBeChecked();

    // Hành động: Chuyển Toggle sang Ngừng hoạt động.
    await vatTuPage.setMaterialStatus(false);

    // Xác nhận UI: Toggle chuyển trạng thái thành công.
    await expect(statusSwitch, 'Trạng thái phải chuyển sang Ngừng hoạt động').not.toBeChecked();
  });

  test('TC_PMKT-U-00106-088 - tự điền 7 tài khoản ngầm định của Hàng hóa', async ({ vatTuPage }) => {
    const accountFields = ['Tài khoản vật tư', 'Tài khoản giá vốn', 'Tài khoản doanh thu', 'Tài khoản hàng bán trả lại', 'Tài khoản chi phí', 'Tài khoản chiết khấu', 'Tài khoản giảm giá'];
    // Chuẩn bị dữ liệu: Mở form Hàng hóa để hệ thống áp dụng Rule 5 của Loại vật tư.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    // Hành động: Chuyển sang tab Hạch toán ngầm định.
    await vatTuPage.openDefaultAccountingTab();
    // Xác nhận UI: Đủ 7 tài khoản được tự động điền từ cấu hình Loại vật tư.
    for (const field of accountFields) {
      await expect(vatTuPage.formFieldControl(field, 'combobox'), `Phải hiển thị ${field}`).toBeVisible();
      await expect(vatTuPage.formField(field), `${field} phải được tự động điền mã tài khoản`).toContainText(/\d{3,}/);
    }
  });

  test('TC_PMKT-U-00106-089 - hiển thị combogrid Tài khoản vật tư không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thêm mới Hàng hóa.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openDefaultAccountingTab();
    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản vật tư'), 'Phải hiển thị label Tài khoản vật tư').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox'), 'Tài khoản vật tư phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản vật tư'), 'Tài khoản vật tư không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-090 - hiển thị đúng cột và dữ liệu Tài khoản vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thu thập ENT_HeThongTaiKhoan thực tế từ DB.
    const accounts = await openVatTuWithAccounts(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    test.skip(allowedAccounts.length === 0, 'Không có Tài khoản cho phép hạch toán trong dữ liệu thực tế');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openDefaultAccountingTab();
    // Hành động: Mở combogrid Tài khoản vật tư.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Đúng ba cột, chỉ hiện tài khoản được phép hạch toán và Hoạt động đứng trước Ngừng hoạt động.
    await expect(vatTuPage.accountingAccountColumnHeaders, 'Combogrid phải có đúng ba cột').toHaveText(['Số hiệu TK', 'Tên TK', 'Trạng thái']);
    const actualAccounts = actualLabels.map((label) => allowedAccounts.find((account) => account.label === label));
    expect(actualAccounts.every(Boolean), 'Mọi dòng UI phải thuộc ENT_HeThongTaiKhoan có Cho phép hạch toán = Có').toBe(true);
    const statuses = actualAccounts.map((account) => account?.status);
    const firstInactiveIndex = statuses.findIndex((status) => status !== 'HoatDong');
    if (firstInactiveIndex >= 0) {
      expect(statuses.slice(firstInactiveIndex).every((status) => status !== 'HoatDong'), 'Tài khoản Hoạt động phải hiển thị trên tài khoản Ngừng hoạt động').toBe(true);
    }
  });

  test('TC_PMKT-U-00106-091 - Tài khoản Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Tài khoản Ngừng hoạt động được phép hạch toán từ DB thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const coverage = accountingAccountCoverage(accounts);
    test.skip(!coverage, 'Không đủ Tài khoản Hoạt động/Ngừng hoạt động theo precondition');
    if (!coverage) return;
    const inactiveAccount = coverage.inactive;
    // Hành động: Mở combogrid và tìm đúng bản ghi Ngừng hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', inactiveAccount.code);
    const textColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);
    // Xác nhận UI: Bản ghi Ngừng hoạt động dùng chữ màu xám.
    expect(textColor, 'Tài khoản Ngừng hoạt động phải có màu chữ xám').toMatch(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*0\.[0-6])?\s*\)/);
  });

  test('TC_PMKT-U-00106-092 - xác nhận sử dụng Tài khoản Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Tài khoản Ngừng hoạt động được phép hạch toán từ DB thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const coverage = accountingAccountCoverage(accounts);
    test.skip(!coverage, 'Không đủ Tài khoản Hoạt động/Ngừng hoạt động theo precondition');
    if (!coverage) return;
    const inactiveAccount = coverage.inactive;
    // Hành động: Mở combogrid > chọn bản ghi Ngừng hoạt động > Xác nhận.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.selectAccountingAccount('Tài khoản vật tư', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị popup cảnh báo bản ghi Ngừng hoạt động').toContainText('Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?');
    await expect(vatTuPage.accountConfirmationButton('Xác nhận'), 'Popup phải có nút Xác nhận').toBeVisible();
    await expect(vatTuPage.accountConfirmationButton('Hủy'), 'Popup phải có nút Hủy').toBeVisible();
    await vatTuPage.resolveInactiveAccount(true);
    // Xác nhận UI: Popup đóng và Tài khoản được chọn.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup phải đóng sau khi Xác nhận').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', inactiveAccount.label), 'Tài khoản Ngừng hoạt động phải được chọn').toBeVisible();
  });

  test('TC_PMKT-U-00106-093 - hủy sử dụng Tài khoản Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Ghi nhận giá trị ban đầu và lấy Tài khoản Ngừng hoạt động thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const coverage = accountingAccountCoverage(accounts);
    test.skip(!coverage, 'Không đủ Tài khoản Hoạt động/Ngừng hoạt động theo precondition');
    if (!coverage) return;
    const inactiveAccount = coverage.inactive;
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox').inputValue();
    // Hành động: Chọn bản ghi Ngừng hoạt động rồi nhấn Hủy.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.selectAccountingAccount('Tài khoản vật tư', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị popup cảnh báo bản ghi Ngừng hoạt động').toBeVisible();
    await vatTuPage.resolveInactiveAccount(false);
    // Xác nhận UI: Popup đóng, bản ghi không được chọn và giá trị cũ được giữ nguyên.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup phải đóng sau khi Hủy').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', inactiveAccount.label), 'Tài khoản Ngừng hoạt động không được chọn').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox'), 'Tài khoản vật tư phải giữ giá trị ban đầu').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-094 - chọn Tài khoản Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Tài khoản Hoạt động được phép hạch toán từ DB thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    // Hành động: Mở combogrid > chọn bản ghi Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.selectAccountingAccount('Tài khoản vật tư', activeAccount);
    // Xác nhận UI: Tài khoản được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Tài khoản Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-095 - tìm kiếm Tài khoản theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng một phần Số hiệu TK thực tế làm từ khóa.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = allowedAccounts[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'Không có Tài khoản được phép hạch toán');
    // Hành động: Mở combogrid > tìm theo Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', keyword);
    // Xác nhận UI/DB: Danh sách đúng các Tài khoản có Số hiệu chứa từ khóa.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    const expectedLabels = allowedAccounts.filter((account) => account.code.includes(keyword)).map((account) => account.label);
    expect(actualLabels.length, 'Tìm kiếm Số hiệu TK phải trả về kết quả').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng hiển thị phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-096 - tìm kiếm Tài khoản theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng một từ trong Tên TK thực tế làm từ khóa.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = allowedAccounts[0]?.name.split(/\s+/).find((word) => word.length >= 3) ?? '';
    test.skip(!keyword, 'Không có Tên TK phù hợp để tìm kiếm');
    // Hành động: Mở combogrid > tìm theo Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', keyword);
    // Xác nhận UI/DB: Danh sách đúng các Tài khoản có Tên chứa từ khóa.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    const expectedLabels = allowedAccounts.filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((account) => account.label);
    expect(actualLabels.length, 'Tìm kiếm Tên TK phải trả về kết quả').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng hiển thị phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-097 - tìm kiếm Tài khoản theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng trạng thái Hoạt động có trong danh mục thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const expectedLabels = accounts.filter((account) => account.allowed && account.status === 'HoatDong').map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'Không có Tài khoản Hoạt động được phép hạch toán');
    // Hành động: Mở combogrid > tìm theo Trạng thái.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', 'Hoạt động');
    // Xác nhận UI/DB: Danh sách đúng các Tài khoản có trạng thái Hoạt động.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    expect(actualLabels.length, 'Tìm kiếm Trạng thái phải trả về kết quả').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng hiển thị phải có Trạng thái Hoạt động và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-098 - Enter chọn dòng Tài khoản đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn từ khóa Số hiệu TK trả về nhiều kết quả thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = allowedAccounts.map((account) => account.code[0]).find((digit) => allowedAccounts.filter((account) => account.code.startsWith(digit ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'Không có từ khóa trả về nhiều Tài khoản');
    // Hành động: Mở combogrid > tìm kiếm > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'Không có kết quả Tài khoản để chọn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'Enter');
    // Xác nhận UI: Dropdown đóng và dòng đầu tiên được chọn.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau Enter').toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-099 - Up và Down di chuyển từng dòng Tài khoản', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở combogrid có ít nhất bốn Tài khoản.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    test.skip(accounts.filter((account) => account.allowed).length < 4, 'Có ít hơn bốn Tài khoản được phép hạch toán');
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox').inputValue();
    // Hành động: Nhấn Down ba lần rồi Up một lần.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowDown');
    const afterFirstDown = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowDown');
    const afterSecondDown = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowDown');
    const afterThirdDown = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowUp');
    const afterUp = await vatTuPage.activeAccountingAccountLabel();
    // Xác nhận UI: Focus di chuyển đúng từng dòng và chưa thay đổi giá trị trường.
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toBe(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toBe(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toBe(afterSecondDown);
    await expect(vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox'), 'Điều hướng không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-100 - ESC đóng dropdown Tài khoản không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Ghi nhận giá trị Tài khoản vật tư hiện tại.
    await prepareGoodsAccounting(vatTuPage);
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox').inputValue();
    // Hành động: Mở combogrid > nhấn ESC.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'Escape');
    // Xác nhận UI: Dropdown đóng và giá trị không đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox'), 'ESC không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-101 - icon X xóa nhanh Tài khoản vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn một Tài khoản Hoạt động thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.selectAccountingAccount('Tài khoản vật tư', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();
    // Hành động: Hover trường > click icon X.
    await vatTuPage.clearAccountingAccount('Tài khoản vật tư');
    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox'), 'Tài khoản vật tư phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-102 - hiển thị nút thêm nhanh Tài khoản theo quyền', async () => {
    // Chuẩn bị dữ liệu: Cần hai tài khoản đăng nhập có và không có quyền thêm mới Tài khoản; môi trường chưa cung cấp đủ precondition.
    test.skip(true, 'BLOCK: thiếu bộ credentials có/không quyền và combogrid không hiển thị nút (+) thêm nhanh Tài khoản');
  });

  test('TC_PMKT-U-00106-103 - giao diện form thêm nhanh Tài khoản rút gọn', async () => {
    // Chuẩn bị dữ liệu: Combogrid Tài khoản vật tư không hiển thị nút (+), không thể mở form thêm nhanh theo precondition.
    test.skip(true, 'BLOCK: combogrid Tài khoản vật tư không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-104 - validate bắt buộc form thêm nhanh Tài khoản', async () => {
    // Chuẩn bị dữ liệu: Combogrid Tài khoản vật tư không hiển thị nút (+), không thể mở form thêm nhanh theo precondition.
    test.skip(true, 'BLOCK: combogrid Tài khoản vật tư không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-105 - validate trùng mã form thêm nhanh Tài khoản', async () => {
    // Chuẩn bị dữ liệu: Combogrid Tài khoản vật tư không hiển thị nút (+), không thể mở form thêm nhanh theo precondition.
    test.skip(true, 'BLOCK: combogrid Tài khoản vật tư không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-106 - boundary Mã form thêm nhanh Tài khoản', async () => {
    // Chuẩn bị dữ liệu: Combogrid Tài khoản vật tư không hiển thị nút (+), không thể mở form thêm nhanh theo precondition.
    test.skip(true, 'BLOCK: combogrid Tài khoản vật tư không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-107 - boundary Tên form thêm nhanh Tài khoản', async () => {
    // Chuẩn bị dữ liệu: Combogrid Tài khoản vật tư không hiển thị nút (+), không thể mở form thêm nhanh theo precondition.
    test.skip(true, 'BLOCK: combogrid Tài khoản vật tư không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-108 - lưu form thêm nhanh và tự động điền Tài khoản', async () => {
    // Chuẩn bị dữ liệu: Combogrid Tài khoản vật tư không hiển thị nút (+), không thể mở form thêm nhanh theo precondition.
    test.skip(true, 'BLOCK: combogrid Tài khoản vật tư không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-109 - hủy form thêm nhanh Tài khoản', async () => {
    // Chuẩn bị dữ liệu: Combogrid Tài khoản vật tư không hiển thị nút (+), không thể mở form thêm nhanh theo precondition.
    test.skip(true, 'BLOCK: combogrid Tài khoản vật tư không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-110 - Rule 6 chỉ hiển thị Tài khoản được phép hạch toán', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thu thập ENT_HeThongTaiKhoan thực tế và chọn từ khóa Số hiệu/Tên của tài khoản hợp lệ.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const target = allowedAccounts[0];
    test.skip(!target, 'Không có Tài khoản bậc cuối được phép hạch toán');
    if (!target) return;
    // Hành động: Mở combogrid > kiểm tra danh sách > tìm theo Số hiệu > tìm theo Tên.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    const initialLabels = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', target.code);
    const codeResults = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', target.name);
    const nameResults = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Có dữ liệu và mọi dòng đều thuộc tập Tài khoản được phép hạch toán.
    expect(initialLabels.length, 'Combogrid phải hiển thị danh sách Tài khoản').toBeGreaterThan(0);
    expect(initialLabels.every((label) => allowedAccounts.some((account) => account.label === label)), 'Chỉ được hiển thị Tài khoản có Cho phép hạch toán = Có').toBe(true);
    expect(codeResults, 'Tìm kiếm theo Số hiệu TK phải trả đúng bản ghi').toContain(target.label);
    expect(nameResults, 'Tìm kiếm theo Tên TK phải trả đúng bản ghi').toContain(target.label);
  });

  test('TC_PMKT-U-00106-111 - ẩn Tài khoản vật tư khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa tại tab Hạch toán ngầm định.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openDefaultAccountingTab();
    // Hành động: Thay đổi tính chất > chọn Dịch vụ > mở Hạch toán ngầm định.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openDefaultAccountingTab();
    // Xác nhận UI: Trường Tài khoản vật tư bị ẩn hoàn toàn.
    await expect(vatTuPage.formField('Tài khoản vật tư'), 'Form Dịch vụ phải ẩn Tài khoản vật tư').toBeHidden();
  });

  test('TC_PMKT-U-00106-112 - reset Tài khoản vật tư khi đổi sang Nguyên vật liệu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa và xác nhận Tài khoản vật tư đang có dữ liệu hợp lệ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openDefaultAccountingTab();
    await expect(vatTuPage.formField('Tài khoản vật tư'), 'Tài khoản vật tư Hàng hóa phải có dữ liệu trước khi đổi').toContainText(/\d{3,}/);
    // Hành động: Thay đổi tính chất > chọn Nguyên vật liệu > mở Hạch toán ngầm định.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openDefaultAccountingTab();
    // Xác nhận UI: Trường Tài khoản vật tư được reset về trống theo testcase.
    await expect(vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox'), 'Tài khoản vật tư phải được xóa sạch').toHaveValue('');
    await expect(vatTuPage.formField('Tài khoản vật tư'), 'Không được giữ giá trị Tài khoản cũ').not.toContainText(/\d{3,}/);
  });

  test('TC_PMKT-U-00106-113 - hiển thị combogrid Tài khoản giá vốn không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage);
    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản giá vốn'), 'Phải hiển thị label Tài khoản giá vốn').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản giá vốn', 'combobox'), 'Tài khoản giá vốn phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản giá vốn'), 'Tài khoản giá vốn không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-114 - hiển thị đúng cột và dữ liệu Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thu thập Tài khoản thực tế và mở form Hàng hóa.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    // Hành động: Mở combogrid Tài khoản giá vốn.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Đúng ba cột và mọi dòng thuộc tập được phép hạch toán.
    await expect(vatTuPage.accountingAccountColumnHeaders, 'Combogrid phải có đúng ba cột').toHaveText(['Số hiệu TK', 'Tên TK', 'Trạng thái']);
    expect(actualLabels.every((label) => allowedAccounts.some((account) => account.label === label)), 'Chỉ hiển thị Tài khoản được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-115 - màu Tài khoản giá vốn Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: Combogrid không hiển thị Tài khoản Ngừng hoạt động nên thiếu precondition kiểm tra màu.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-116 - xác nhận dùng Tài khoản giá vốn Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: Combogrid không hiển thị Tài khoản Ngừng hoạt động nên không thể chọn và xác nhận.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-117 - hủy dùng Tài khoản giá vốn Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: Combogrid không hiển thị Tài khoản Ngừng hoạt động nên không thể chọn và hủy.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-118 - chọn Tài khoản giá vốn Hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Tài khoản Hoạt động được phép hạch toán từ DB.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    // Hành động: Mở combogrid > chọn Tài khoản Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.selectAccountingAccount('Tài khoản giá vốn', activeAccount);
    // Xác nhận UI: Giá trị được chọn và không có popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', activeAccount.label), 'Tài khoản giá vốn phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo với Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-119 - tìm Tài khoản giá vốn theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy một phần Số hiệu TK thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'Không có Tài khoản được phép hạch toán');
    // Hành động: Mở combogrid > tìm theo Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Mọi dòng khớp Số hiệu và được phép hạch toán.
    const expected = allowed.filter((account) => account.code.includes(keyword)).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Số hiệu TK').toBe(true);
  });

  test('TC_PMKT-U-00106-120 - tìm Tài khoản giá vốn theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy một từ trong Tên TK thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.name.split(/\s+/).find((word) => word.length >= 3) ?? '';
    test.skip(!keyword, 'Không có Tên TK phù hợp để tìm kiếm');
    // Hành động: Mở combogrid > tìm theo Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Mọi dòng khớp Tên và được phép hạch toán.
    const expected = allowed.filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Tên TK').toBe(true);
  });

  test('TC_PMKT-U-00106-121 - tìm Tài khoản giá vốn theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy tập Tài khoản Hoạt động thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const expected = accounts.filter((account) => account.allowed && account.status === 'HoatDong').map((account) => account.label);
    // Hành động: Mở combogrid > tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', 'Hoạt động');
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Mọi dòng có Trạng thái Hoạt động và được phép hạch toán.
    expect(actual.length, 'Tìm kiếm Trạng thái phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Trạng thái').toBe(true);
  });

  test('TC_PMKT-U-00106-122 - Enter chọn dòng Tài khoản giá vốn đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn từ khóa trả về nhiều Tài khoản thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed.map((account) => account.code[0]).find((digit) => allowed.filter((account) => account.code.startsWith(digit ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'Không có từ khóa trả về nhiều Tài khoản');
    // Hành động: Mở combogrid > tìm kiếm > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'Không có kết quả Tài khoản để chọn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'Enter');
    // Xác nhận UI: Dropdown đóng và dòng đầu tiên được chọn.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau Enter').toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-123 - Up và Down di chuyển Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở combogrid có nhiều Tài khoản và ghi nhận giá trị hiện tại.
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản giá vốn', 'combobox');
    const valueBefore = await control.inputValue();
    // Hành động: Nhấn Down ba lần rồi Up một lần.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowDown');
    const first = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowDown');
    const second = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowDown');
    const third = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowUp');
    // Xác nhận UI: Focus đổi từng dòng, Up quay lại và giá trị chưa đổi.
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeAccountingAccountLabel()).toBe(second);
    await expect(control, 'Điều hướng không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-124 - ESC đóng dropdown Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Ghi nhận giá trị hiện tại.
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản giá vốn', 'combobox');
    const valueBefore = await control.inputValue();
    // Hành động: Mở combogrid > nhấn ESC.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'Escape');
    // Xác nhận UI: Dropdown đóng và giá trị không đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau ESC').toBeHidden();
    await expect(control, 'ESC không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-125 - icon X xóa Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn một Tài khoản Hoạt động thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const active = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!active, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!active) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.selectAccountingAccount('Tài khoản giá vốn', active);
    // Hành động: Hover trường > click icon X.
    await vatTuPage.clearAccountingAccount('Tài khoản giá vốn');
    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', active.label), 'Giá trị đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản giá vốn', 'combobox'), 'Tài khoản giá vốn phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-126 - nút thêm nhanh Tài khoản giá vốn theo quyền', async () => {
    // Chuẩn bị dữ liệu: Thiếu credentials theo quyền và combogrid không hiển thị nút (+) thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh; chưa có đủ tài khoản có/không quyền');
  });

  test('TC_PMKT-U-00106-127 - UI form thêm nhanh Tài khoản giá vốn', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-128 - validate bắt buộc thêm nhanh Tài khoản giá vốn', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-129 - validate trùng mã thêm nhanh Tài khoản giá vốn', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-130 - boundary Mã thêm nhanh Tài khoản giá vốn', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-131 - boundary Tên thêm nhanh Tài khoản giá vốn', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-132 - lưu thêm nhanh và tự điền Tài khoản giá vốn', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-133 - hủy form thêm nhanh Tài khoản giá vốn', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản giá vốn không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-134 - Rule 6 lọc Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thu thập Tài khoản thực tế và chọn một bản ghi hợp lệ.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const target = allowed[0];
    test.skip(!target, 'Không có Tài khoản được phép hạch toán');
    if (!target) return;
    // Hành động: Mở combogrid > kiểm tra danh sách > tìm theo Số hiệu và Tên.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    const initial = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', target.code);
    const byCode = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', target.name);
    const byName = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Chỉ có Tài khoản được phép hạch toán và tìm kiếm hoạt động.
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.every((label) => allowed.some((account) => account.label === label))).toBe(true);
    expect(byCode).toContain(target.label);
    expect(byName).toContain(target.label);
  });

  test('TC_PMKT-U-00106-137 - hiển thị combogrid Tài khoản doanh thu không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage);
    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản doanh thu'), 'Phải hiển thị label Tài khoản doanh thu').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox'), 'Tài khoản doanh thu phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản doanh thu'), 'Tài khoản doanh thu không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-138 - hiển thị đúng cột và dữ liệu Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thu thập Tài khoản thực tế và mở form Hàng hóa.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    // Hành động: Mở combogrid Tài khoản doanh thu.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Đúng ba cột và mọi dòng thuộc tập được phép hạch toán.
    await expect(vatTuPage.accountingAccountColumnHeaders, 'Combogrid phải có đúng ba cột').toHaveText(['Số hiệu TK', 'Tên TK', 'Trạng thái']);
    expect(actualLabels.every((label) => allowedAccounts.some((account) => account.label === label)), 'Chỉ hiển thị Tài khoản được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-139 - màu Tài khoản doanh thu Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: Combogrid không hiển thị Tài khoản Ngừng hoạt động nên thiếu precondition kiểm tra màu.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-140 - xác nhận dùng Tài khoản doanh thu Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: Combogrid không hiển thị Tài khoản Ngừng hoạt động nên không thể chọn và xác nhận.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-141 - hủy dùng Tài khoản doanh thu Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: Combogrid không hiển thị Tài khoản Ngừng hoạt động nên không thể chọn và hủy.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-142 - chọn Tài khoản doanh thu Hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Tài khoản Hoạt động được phép hạch toán từ DB.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    // Hành động: Mở combogrid > chọn Tài khoản Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.selectAccountingAccount('Tài khoản doanh thu', activeAccount);
    // Xác nhận UI: Giá trị được chọn và không có popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', activeAccount.label), 'Tài khoản doanh thu phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo với Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-143 - tìm Tài khoản doanh thu theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy một phần Số hiệu TK thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'Không có Tài khoản được phép hạch toán');
    // Hành động: Mở combogrid > tìm theo Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Mọi dòng khớp Số hiệu và được phép hạch toán.
    const expected = allowed.filter((account) => account.code.includes(keyword)).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Số hiệu TK').toBe(true);
  });

  test('TC_PMKT-U-00106-144 - tìm Tài khoản doanh thu theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy một từ trong Tên TK thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.name.split(/\s+/).find((word) => word.length >= 3) ?? '';
    test.skip(!keyword, 'Không có Tên TK phù hợp để tìm kiếm');
    // Hành động: Mở combogrid > tìm theo Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Mọi dòng khớp Tên và được phép hạch toán.
    const expected = allowed.filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Tên TK').toBe(true);
  });

  test('TC_PMKT-U-00106-145 - tìm Tài khoản doanh thu theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy tập Tài khoản Hoạt động thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const expected = accounts.filter((account) => account.allowed && account.status === 'HoatDong').map((account) => account.label);
    // Hành động: Mở combogrid > tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', 'Hoạt động');
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Mọi dòng có Trạng thái Hoạt động và được phép hạch toán.
    expect(actual.length, 'Tìm kiếm Trạng thái phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Trạng thái').toBe(true);
  });

  test('TC_PMKT-U-00106-146 - Enter chọn dòng Tài khoản doanh thu đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn từ khóa trả về nhiều Tài khoản thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed.map((account) => account.code[0]).find((digit) => allowed.filter((account) => account.code.startsWith(digit ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'Không có từ khóa trả về nhiều Tài khoản');
    // Hành động: Mở combogrid > tìm kiếm > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'Không có kết quả Tài khoản để chọn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'Enter');
    // Xác nhận UI: Dropdown đóng và dòng đầu tiên được chọn.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau Enter').toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-147 - Up và Down di chuyển Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở combogrid có nhiều Tài khoản và ghi nhận giá trị hiện tại.
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox');
    const valueBefore = await control.inputValue();
    // Hành động: Nhấn Down ba lần rồi Up một lần.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowDown');
    const first = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowDown');
    const second = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowDown');
    const third = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowUp');
    // Xác nhận UI: Focus đổi từng dòng, Up quay lại và giá trị chưa đổi.
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeAccountingAccountLabel()).toBe(second);
    await expect(control, 'Điều hướng không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-148 - ESC đóng dropdown Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Ghi nhận giá trị hiện tại.
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox');
    const valueBefore = await control.inputValue();
    // Hành động: Mở combogrid > nhấn ESC.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'Escape');
    // Xác nhận UI: Dropdown đóng và giá trị không đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau ESC').toBeHidden();
    await expect(control, 'ESC không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-149 - icon X xóa Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn một Tài khoản Hoạt động thực tế.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const active = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!active, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!active) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.selectAccountingAccount('Tài khoản doanh thu', active);
    // Hành động: Hover trường > click icon X.
    await vatTuPage.clearAccountingAccount('Tài khoản doanh thu');
    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', active.label), 'Giá trị đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox'), 'Tài khoản doanh thu phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-150 - nút thêm nhanh Tài khoản doanh thu theo quyền', async () => {
    // Chuẩn bị dữ liệu: Thiếu credentials theo quyền và combogrid không hiển thị nút (+) thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh; chưa có đủ tài khoản có/không quyền');
  });

  test('TC_PMKT-U-00106-151 - UI form thêm nhanh Tài khoản doanh thu', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-152 - validate bắt buộc thêm nhanh Tài khoản doanh thu', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-153 - validate trùng mã thêm nhanh Tài khoản doanh thu', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-154 - boundary Mã thêm nhanh Tài khoản doanh thu', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-155 - boundary Tên thêm nhanh Tài khoản doanh thu', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-156 - lưu thêm nhanh và tự điền Tài khoản doanh thu', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-157 - hủy form thêm nhanh Tài khoản doanh thu', async () => {
    // Chuẩn bị dữ liệu: Không có nút (+) để mở form thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Tài khoản doanh thu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-158 - Rule 6 lọc Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thu thập Tài khoản thực tế và chọn một bản ghi hợp lệ.
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const target = allowed[0];
    test.skip(!target, 'Không có Tài khoản được phép hạch toán');
    if (!target) return;
    // Hành động: Mở combogrid > kiểm tra danh sách > tìm theo Số hiệu và Tên.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    const initial = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', target.code);
    const byCode = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', target.name);
    const byName = await vatTuPage.visibleAccountingAccountLabels();
    // Xác nhận UI/DB: Chỉ có Tài khoản được phép hạch toán và tìm kiếm hoạt động.
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.every((label) => allowed.some((account) => account.label === label))).toBe(true);
    expect(byCode).toContain(target.label);
    expect(byName).toContain(target.label);
  });


  test('TC_PMKT-U-00106-159 - hiển thị combogrid Tài khoản hàng bán trả lại không bắt buộc', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    await expect(vatTuPage.formField('Tài khoản hàng bán trả lại'), 'Phải hiển thị label Tài khoản hàng bán trả lại').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox'), 'Tài khoản hàng bán trả lại phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản hàng bán trả lại'), 'Tài khoản hàng bán trả lại không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-160 - hiển thị đúng cột và dữ liệu Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    await expect(vatTuPage.accountingAccountColumnHeaders, 'Combogrid phải có đúng ba cột').toHaveText(['Số hiệu TK', 'Tên TK', 'Trạng thái']);
    expect(actualLabels.every((label) => allowedAccounts.some((account) => account.label === label)), 'Chỉ hiển thị Tài khoản được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-161 - màu Tài khoản hàng bán trả lại Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-162 - xác nhận dùng Tài khoản hàng bán trả lại Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-163 - hủy dùng Tài khoản hàng bán trả lại Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-164 - chọn Tài khoản hàng bán trả lại Hoạt động', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.selectAccountingAccount('Tài khoản hàng bán trả lại', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', activeAccount.label), 'Tài khoản hàng bán trả lại phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo với Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-165 - tìm Tài khoản hàng bán trả lại theo Số hiệu TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'Không có Tài khoản được phép hạch toán');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.code.includes(keyword)).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Số hiệu TK').toBe(true);
  });

  test('TC_PMKT-U-00106-166 - tìm Tài khoản hàng bán trả lại theo Tên TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.name.split(/\s+/).find((word) => word.length >= 3) ?? '';
    test.skip(!keyword, 'Không có Tên TK phù hợp để tìm kiếm');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Tên TK').toBe(true);
  });

  test('TC_PMKT-U-00106-167 - tìm Tài khoản hàng bán trả lại theo Trạng thái', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const expected = accounts.filter((account) => account.allowed && account.status === 'HoatDong').map((account) => account.label);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', 'Hoạt động');
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    expect(actual.length, 'Tìm kiếm Trạng thái phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Trạng thái').toBe(true);
  });

  test('TC_PMKT-U-00106-168 - Enter chọn dòng Tài khoản hàng bán trả lại đầu tiên', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed.map((account) => account.code[0]).find((digit) => allowed.filter((account) => account.code.startsWith(digit ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'Không có từ khóa trả về nhiều Tài khoản');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'Không có kết quả Tài khoản để chọn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'Enter');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau Enter').toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-169 - Up và Down di chuyển Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowDown');
    const first = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowDown');
    const second = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowDown');
    const third = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowUp');
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeAccountingAccountLabel()).toBe(second);
    await expect(control, 'Điều hướng không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-170 - ESC đóng dropdown Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'Escape');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau ESC').toBeHidden();
    await expect(control, 'ESC không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-171 - icon X xóa Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const active = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!active, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!active) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.selectAccountingAccount('Tài khoản hàng bán trả lại', active);
    await vatTuPage.clearAccountingAccount('Tài khoản hàng bán trả lại');
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', active.label), 'Giá trị đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox'), 'Tài khoản hàng bán trả lại phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-172 - nút thêm nhanh Tài khoản hàng bán trả lại theo quyền', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh; chưa có đủ tài khoản có/không quyền');
  });

  test('TC_PMKT-U-00106-173 - UI form thêm nhanh Tài khoản hàng bán trả lại', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-174 - validate bắt buộc thêm nhanh Tài khoản hàng bán trả lại', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-175 - validate trùng mã thêm nhanh Tài khoản hàng bán trả lại', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-176 - boundary Mã thêm nhanh Tài khoản hàng bán trả lại', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-177 - boundary Tên thêm nhanh Tài khoản hàng bán trả lại', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-178 - lưu thêm nhanh và tự điền Tài khoản hàng bán trả lại', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-179 - hủy form thêm nhanh Tài khoản hàng bán trả lại', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản hàng bán trả lại không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-180 - Rule 6 lọc Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const target = allowed[0];
    test.skip(!target, 'Không có Tài khoản được phép hạch toán');
    if (!target) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    const initial = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', target.code);
    const byCode = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', target.name);
    const byName = await vatTuPage.visibleAccountingAccountLabels();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.every((label) => allowed.some((account) => account.label === label))).toBe(true);
    expect(byCode).toContain(target.label);
    expect(byName).toContain(target.label);
  });

  test('TC_PMKT-U-00106-181 - hiển thị combogrid Tài khoản chi phí không bắt buộc', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    await expect(vatTuPage.formField('Tài khoản chi phí'), 'Phải hiển thị label Tài khoản chi phí').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox'), 'Tài khoản chi phí phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản chi phí'), 'Tài khoản chi phí không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-182 - hiển thị đúng cột và dữ liệu Tài khoản chi phí', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    await expect(vatTuPage.accountingAccountColumnHeaders, 'Combogrid phải có đúng ba cột').toHaveText(['Số hiệu TK', 'Tên TK', 'Trạng thái']);
    expect(actualLabels.every((label) => allowedAccounts.some((account) => account.label === label)), 'Chỉ hiển thị Tài khoản được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-183 - màu Tài khoản chi phí Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-184 - xác nhận dùng Tài khoản chi phí Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-185 - hủy dùng Tài khoản chi phí Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-186 - chọn Tài khoản chi phí Hoạt động', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.selectAccountingAccount('Tài khoản chi phí', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', activeAccount.label), 'Tài khoản chi phí phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo với Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-187 - tìm Tài khoản chi phí theo Số hiệu TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'Không có Tài khoản được phép hạch toán');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.code.includes(keyword)).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Số hiệu TK').toBe(true);
  });

  test('TC_PMKT-U-00106-188 - tìm Tài khoản chi phí theo Tên TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.name.split(/\s+/).find((word) => word.length >= 3) ?? '';
    test.skip(!keyword, 'Không có Tên TK phù hợp để tìm kiếm');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Tên TK').toBe(true);
  });

  test('TC_PMKT-U-00106-189 - tìm Tài khoản chi phí theo Trạng thái', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const expected = accounts.filter((account) => account.allowed && account.status === 'HoatDong').map((account) => account.label);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', 'Hoạt động');
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    expect(actual.length, 'Tìm kiếm Trạng thái phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Trạng thái').toBe(true);
  });

  test('TC_PMKT-U-00106-190 - Enter chọn dòng Tài khoản chi phí đầu tiên', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed.map((account) => account.code[0]).find((digit) => allowed.filter((account) => account.code.startsWith(digit ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'Không có từ khóa trả về nhiều Tài khoản');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'Không có kết quả Tài khoản để chọn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'Enter');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau Enter').toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-191 - Up và Down di chuyển Tài khoản chi phí', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowDown');
    const first = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowDown');
    const second = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowDown');
    const third = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowUp');
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeAccountingAccountLabel()).toBe(second);
    await expect(control, 'Điều hướng không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-192 - ESC đóng dropdown Tài khoản chi phí', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'Escape');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau ESC').toBeHidden();
    await expect(control, 'ESC không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-193 - icon X xóa Tài khoản chi phí', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const active = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!active, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!active) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.selectAccountingAccount('Tài khoản chi phí', active);
    await vatTuPage.clearAccountingAccount('Tài khoản chi phí');
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', active.label), 'Giá trị đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox'), 'Tài khoản chi phí phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-194 - nút thêm nhanh Tài khoản chi phí theo quyền', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh; chưa có đủ tài khoản có/không quyền');
  });

  test('TC_PMKT-U-00106-195 - UI form thêm nhanh Tài khoản chi phí', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-196 - validate bắt buộc thêm nhanh Tài khoản chi phí', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-197 - validate trùng mã thêm nhanh Tài khoản chi phí', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-198 - boundary Mã thêm nhanh Tài khoản chi phí', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-199 - boundary Tên thêm nhanh Tài khoản chi phí', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-200 - lưu thêm nhanh và tự điền Tài khoản chi phí', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-201 - hủy form thêm nhanh Tài khoản chi phí', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chi phí không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-202 - Rule 6 lọc Tài khoản chi phí', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const target = allowed[0];
    test.skip(!target, 'Không có Tài khoản được phép hạch toán');
    if (!target) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    const initial = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', target.code);
    const byCode = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', target.name);
    const byName = await vatTuPage.visibleAccountingAccountLabels();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.every((label) => allowed.some((account) => account.label === label))).toBe(true);
    expect(byCode).toContain(target.label);
    expect(byName).toContain(target.label);
  });

  test('TC_PMKT-U-00106-203 - hiển thị combogrid Tài khoản chiết khấu không bắt buộc', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    await expect(vatTuPage.formField('Tài khoản chiết khấu'), 'Phải hiển thị label Tài khoản chiết khấu').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox'), 'Tài khoản chiết khấu phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản chiết khấu'), 'Tài khoản chiết khấu không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-204 - hiển thị đúng cột và dữ liệu Tài khoản chiết khấu', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    await expect(vatTuPage.accountingAccountColumnHeaders, 'Combogrid phải có đúng ba cột').toHaveText(['Số hiệu TK', 'Tên TK', 'Trạng thái']);
    expect(actualLabels.every((label) => allowedAccounts.some((account) => account.label === label)), 'Chỉ hiển thị Tài khoản được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-205 - màu Tài khoản chiết khấu Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-206 - xác nhận dùng Tài khoản chiết khấu Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-207 - hủy dùng Tài khoản chiết khấu Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-208 - chọn Tài khoản chiết khấu Hoạt động', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.selectAccountingAccount('Tài khoản chiết khấu', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', activeAccount.label), 'Tài khoản chiết khấu phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo với Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-209 - tìm Tài khoản chiết khấu theo Số hiệu TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'Không có Tài khoản được phép hạch toán');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.code.includes(keyword)).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Số hiệu TK').toBe(true);
  });

  test('TC_PMKT-U-00106-210 - tìm Tài khoản chiết khấu theo Tên TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.name.split(/\s+/).find((word) => word.length >= 3) ?? '';
    test.skip(!keyword, 'Không có Tên TK phù hợp để tìm kiếm');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Tên TK').toBe(true);
  });

  test('TC_PMKT-U-00106-211 - tìm Tài khoản chiết khấu theo Trạng thái', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const expected = accounts.filter((account) => account.allowed && account.status === 'HoatDong').map((account) => account.label);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', 'Hoạt động');
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    expect(actual.length, 'Tìm kiếm Trạng thái phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Trạng thái').toBe(true);
  });

  test('TC_PMKT-U-00106-212 - Enter chọn dòng Tài khoản chiết khấu đầu tiên', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed.map((account) => account.code[0]).find((digit) => allowed.filter((account) => account.code.startsWith(digit ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'Không có từ khóa trả về nhiều Tài khoản');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'Không có kết quả Tài khoản để chọn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'Enter');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau Enter').toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-213 - Up và Down di chuyển Tài khoản chiết khấu', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowDown');
    const first = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowDown');
    const second = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowDown');
    const third = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowUp');
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeAccountingAccountLabel()).toBe(second);
    await expect(control, 'Điều hướng không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-214 - ESC đóng dropdown Tài khoản chiết khấu', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'Escape');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau ESC').toBeHidden();
    await expect(control, 'ESC không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-215 - icon X xóa Tài khoản chiết khấu', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const active = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!active, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!active) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.selectAccountingAccount('Tài khoản chiết khấu', active);
    await vatTuPage.clearAccountingAccount('Tài khoản chiết khấu');
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', active.label), 'Giá trị đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox'), 'Tài khoản chiết khấu phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-216 - nút thêm nhanh Tài khoản chiết khấu theo quyền', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh; chưa có đủ tài khoản có/không quyền');
  });

  test('TC_PMKT-U-00106-217 - UI form thêm nhanh Tài khoản chiết khấu', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-218 - validate bắt buộc thêm nhanh Tài khoản chiết khấu', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-219 - validate trùng mã thêm nhanh Tài khoản chiết khấu', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-220 - boundary Mã thêm nhanh Tài khoản chiết khấu', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-221 - boundary Tên thêm nhanh Tài khoản chiết khấu', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-222 - lưu thêm nhanh và tự điền Tài khoản chiết khấu', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-223 - hủy form thêm nhanh Tài khoản chiết khấu', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản chiết khấu không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-224 - Rule 6 lọc Tài khoản chiết khấu', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const target = allowed[0];
    test.skip(!target, 'Không có Tài khoản được phép hạch toán');
    if (!target) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    const initial = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', target.code);
    const byCode = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', target.name);
    const byName = await vatTuPage.visibleAccountingAccountLabels();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.every((label) => allowed.some((account) => account.label === label))).toBe(true);
    expect(byCode).toContain(target.label);
    expect(byName).toContain(target.label);
  });

  test('TC_PMKT-U-00106-225 - hiển thị combogrid Tài khoản giảm giá không bắt buộc', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    await expect(vatTuPage.formField('Tài khoản giảm giá'), 'Phải hiển thị label Tài khoản giảm giá').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox'), 'Tài khoản giảm giá phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản giảm giá'), 'Tài khoản giảm giá không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-226 - hiển thị đúng cột và dữ liệu Tài khoản giảm giá', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowedAccounts = accounts.filter((account) => account.allowed);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();
    await expect(vatTuPage.accountingAccountColumnHeaders, 'Combogrid phải có đúng ba cột').toHaveText(['Số hiệu TK', 'Tên TK', 'Trạng thái']);
    expect(actualLabels.every((label) => allowedAccounts.some((account) => account.label === label)), 'Chỉ hiển thị Tài khoản được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-227 - màu Tài khoản giảm giá Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-228 - xác nhận dùng Tài khoản giảm giá Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-229 - hủy dùng Tài khoản giảm giá Ngừng hoạt động', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-230 - chọn Tài khoản giảm giá Hoạt động', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.selectAccountingAccount('Tài khoản giảm giá', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', activeAccount.label), 'Tài khoản giảm giá phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo với Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-231 - tìm Tài khoản giảm giá theo Số hiệu TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'Không có Tài khoản được phép hạch toán');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.code.includes(keyword)).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Số hiệu TK').toBe(true);
  });

  test('TC_PMKT-U-00106-232 - tìm Tài khoản giảm giá theo Tên TK', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed[0]?.name.split(/\s+/).find((word) => word.length >= 3) ?? '';
    test.skip(!keyword, 'Không có Tên TK phù hợp để tìm kiếm');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', keyword);
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    const expected = allowed.filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((account) => account.label);
    expect(actual.length, 'Tìm kiếm phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Tên TK').toBe(true);
  });

  test('TC_PMKT-U-00106-233 - tìm Tài khoản giảm giá theo Trạng thái', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const expected = accounts.filter((account) => account.allowed && account.status === 'HoatDong').map((account) => account.label);
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', 'Hoạt động');
    const actual = await vatTuPage.visibleAccountingAccountLabels();
    expect(actual.length, 'Tìm kiếm Trạng thái phải trả về kết quả').toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label)), 'Kết quả phải lọc đúng Trạng thái').toBe(true);
  });

  test('TC_PMKT-U-00106-234 - Enter chọn dòng Tài khoản giảm giá đầu tiên', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const keyword = allowed.map((account) => account.code[0]).find((digit) => allowed.filter((account) => account.code.startsWith(digit ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'Không có từ khóa trả về nhiều Tài khoản');
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'Không có kết quả Tài khoản để chọn');
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'Enter');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau Enter').toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-235 - Up và Down di chuyển Tài khoản giảm giá', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowDown');
    const first = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowDown');
    const second = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowDown');
    const third = await vatTuPage.activeAccountingAccountLabel();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowUp');
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeAccountingAccountLabel()).toBe(second);
    await expect(control, 'Điều hướng không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-236 - ESC đóng dropdown Tài khoản giảm giá', async ({ vatTuPage }) => {
    await prepareGoodsAccounting(vatTuPage);
    const control = vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox');
    const valueBefore = await control.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'Escape');
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau ESC').toBeHidden();
    await expect(control, 'ESC không được đổi giá trị').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-237 - icon X xóa Tài khoản giảm giá', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const active = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!active, 'Không có Tài khoản Hoạt động được phép hạch toán');
    if (!active) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.selectAccountingAccount('Tài khoản giảm giá', active);
    await vatTuPage.clearAccountingAccount('Tài khoản giảm giá');
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', active.label), 'Giá trị đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox'), 'Tài khoản giảm giá phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-238 - nút thêm nhanh Tài khoản giảm giá theo quyền', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh; chưa có đủ tài khoản có/không quyền');
  });

  test('TC_PMKT-U-00106-239 - UI form thêm nhanh Tài khoản giảm giá', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-240 - validate bắt buộc thêm nhanh Tài khoản giảm giá', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-241 - validate trùng mã thêm nhanh Tài khoản giảm giá', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-242 - boundary Mã thêm nhanh Tài khoản giảm giá', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-243 - boundary Tên thêm nhanh Tài khoản giảm giá', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-244 - lưu thêm nhanh và tự điền Tài khoản giảm giá', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-245 - hủy form thêm nhanh Tài khoản giảm giá', async () => {
    test.skip(true, 'BLOCK: combogrid Tài khoản giảm giá không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-246 - Rule 6 lọc Tài khoản giảm giá', async ({ vatTuPage }) => {
    const accounts = await prepareGoodsAccounting(vatTuPage);
    const allowed = accounts.filter((account) => account.allowed);
    const target = allowed[0];
    test.skip(!target, 'Không có Tài khoản được phép hạch toán');
    if (!target) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    const initial = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', target.code);
    const byCode = await vatTuPage.visibleAccountingAccountLabels();
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', target.name);
    const byName = await vatTuPage.visibleAccountingAccountLabels();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.every((label) => allowed.some((account) => account.label === label))).toBe(true);
    expect(byCode).toContain(target.label);
    expect(byName).toContain(target.label);
  });

  test('TC_PMKT-U-00106-247 - hiển thị combogrid Kho mặc định không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa tại tab Thông tin kho.
    await openGoodsWarehouse(vatTuPage);
    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Kho mặc định'), 'Phải hiển thị label Kho mặc định').toBeVisible();
    await expect(vatTuPage.warehouseCombobox(), 'Kho mặc định phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Kho mặc định'), 'Kho mặc định không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-248 - hiển thị đúng cột, dữ liệu và thứ tự Kho mặc định', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy ENT_Kho và mở combogrid Kho mặc định.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const expectedLabels = warehouses.map((warehouse) => warehouse.label);
    const activeLabels = warehouses.filter((warehouse) => warehouse.status === 'HoatDong').map((warehouse) => warehouse.label);
    const inactiveLabels = warehouses.filter((warehouse) => warehouse.status === 'NgungHoatDong').map((warehouse) => warehouse.label);
    // Xác nhận UI/DB: Đủ ba cột, dữ liệu đúng mst_kho và Hoạt động đứng trước Ngừng hoạt động.
    await expect.soft(vatTuPage.warehouseColumnHeaders(), 'Combogrid Kho phải có đúng ba cột').toHaveText(['Mã kho', 'Tên kho', 'Trạng thái']);
    const actualLabels = await vatTuPage.visibleWarehouseLabels();
    expect([...actualLabels].sort(), 'Danh sách Kho trên UI phải khớp toàn bộ Kho chưa xóa trong DB').toEqual([...expectedLabels].sort());
    const lastActiveIndex = Math.max(...activeLabels.map((label) => actualLabels.indexOf(label)));
    const firstInactiveIndex = Math.min(...inactiveLabels.map((label) => actualLabels.indexOf(label)));
    if (activeLabels.length > 0 && inactiveLabels.length > 0) {
      expect(lastActiveIndex, 'Mọi Kho Hoạt động phải đứng trước Kho Ngừng hoạt động').toBeLessThan(firstInactiveIndex);
    }
  });

  test('TC_PMKT-U-00106-249 - Kho Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Yêu cầu ENT_Kho có đủ bản ghi Hoạt động và Ngừng hoạt động.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const pair = statusPair(warehouses);
    test.skip(!pair, 'BLOCK: ENT_Kho chưa có đủ bản ghi Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    // Xác nhận UI: Style của dòng Ngừng hoạt động phải khác dòng Hoạt động.
    expect(await vatTuPage.warehouseOptionStyle(pair.inactive.label), 'Kho Ngừng hoạt động phải hiển thị khác màu').not.toEqual(
      await vatTuPage.warehouseOptionStyle(pair.active.label),
    );
  });

  test('TC_PMKT-U-00106-250 - xác nhận sử dụng Kho Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Chọn Kho Ngừng hoạt động từ ENT_Kho thực tế.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const pair = statusPair(warehouses);
    test.skip(!pair, 'BLOCK: ENT_Kho chưa có Kho Ngừng hoạt động để xác nhận sử dụng');
    if (!pair) return;
    // Hành động: Chọn Kho Ngừng hoạt động > xác nhận sử dụng.
    await vatTuPage.selectWarehouse(pair.inactive);
    // Xác nhận UI: Popup có đúng nội dung và hai nút nghiệp vụ.
    await expect(vatTuPage.warehouseConfirmationMessage()).toBeVisible();
    await expect(vatTuPage.mainUnitConfirmationButton('Xác nhận')).toBeVisible();
    await expect(vatTuPage.mainUnitConfirmationButton('Hủy')).toBeVisible();
    await vatTuPage.chooseInactiveWarehouse('Xác nhận');
    await expect(vatTuPage.warehouseConfirmationDialog()).toBeHidden();
    await expect(vatTuPage.selectedWarehouse(pair.inactive.label), 'Kho Ngừng hoạt động phải được chọn sau xác nhận').toBeVisible();
  });

  test('TC_PMKT-U-00106-251 - hủy sử dụng Kho Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Giữ giá trị Kho hiện tại và chọn một Kho Ngừng hoạt động.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const pair = statusPair(warehouses);
    test.skip(!pair, 'BLOCK: ENT_Kho chưa có Kho Ngừng hoạt động để hủy sử dụng');
    if (!pair) return;
    const valueBefore = await vatTuPage.warehouseCombobox().inputValue();
    // Hành động: Chọn Kho Ngừng hoạt động > hủy trên popup.
    await vatTuPage.selectWarehouse(pair.inactive);
    await expect(vatTuPage.warehouseConfirmationMessage()).toBeVisible();
    await vatTuPage.chooseInactiveWarehouse('Hủy');
    // Xác nhận UI: Popup đóng và giá trị trường không thay đổi.
    await expect(vatTuPage.warehouseConfirmationDialog()).toBeHidden();
    await expect(vatTuPage.warehouseCombobox()).toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-252 - chọn Kho Hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Chọn Kho Hoạt động đầu tiên từ ENT_Kho thực tế.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const active = warehouses.find((warehouse) => warehouse.status === 'HoatDong');
    test.skip(!active, 'BLOCK: ENT_Kho chưa có Kho Hoạt động');
    if (!active) return;
    // Hành động: Chọn Kho Hoạt động.
    await vatTuPage.selectWarehouse(active);
    // Xác nhận UI: Giá trị được chọn và không hiển thị cảnh báo.
    await expect(vatTuPage.selectedWarehouse(active.label)).toBeVisible();
    await expect(vatTuPage.warehouseConfirmationDialog()).toBeHidden();
  });

  test('TC_PMKT-U-00106-253 - tìm Kho mặc định theo Mã kho', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy một phần Mã kho thực tế làm từ khóa.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const keyword = warehouses[0]?.code.slice(0, 2) ?? '';
    test.skip(!keyword, 'BLOCK: ENT_Kho không có dữ liệu tìm kiếm theo Mã kho');
    // Hành động: Nhập từ khóa Mã kho.
    await vatTuPage.searchWarehouse(keyword);
    const actual = await vatTuPage.visibleWarehouseLabels();
    const expected = warehouses.filter((warehouse) => warehouse.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((warehouse) => warehouse.label);
    // Xác nhận UI/DB: Chỉ trả về Kho có Mã chứa từ khóa từ dữ liệu DB.
    expect(actual.length).toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label))).toBe(true);
  });

  test('TC_PMKT-U-00106-254 - tìm Kho mặc định theo Tên kho', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy từ có ý nghĩa trong Tên kho thực tế.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const keyword = warehouses.map((warehouse) => warehouse.name.split(/\s+/).find((word) => word.length >= 3)).find(Boolean) ?? '';
    test.skip(!keyword, 'BLOCK: ENT_Kho không có Tên kho phù hợp để tìm kiếm');
    // Hành động: Nhập từ khóa Tên kho.
    await vatTuPage.searchWarehouse(keyword);
    const actual = await vatTuPage.visibleWarehouseLabels();
    const expected = warehouses.filter((warehouse) => warehouse.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map((warehouse) => warehouse.label);
    // Xác nhận UI/DB: Chỉ trả về Kho có Tên chứa từ khóa từ dữ liệu DB.
    expect(actual.length).toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label))).toBe(true);
  });

  test('TC_PMKT-U-00106-255 - tìm Kho mặc định theo Trạng thái', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy tập Kho Hoạt động thực tế từ ENT_Kho.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const expected = warehouses.filter((warehouse) => warehouse.status === 'HoatDong').map((warehouse) => warehouse.label);
    test.skip(expected.length === 0, 'BLOCK: ENT_Kho chưa có Kho Hoạt động');
    // Hành động: Tìm kiếm theo Trạng thái Hoạt động.
    await vatTuPage.searchWarehouse('Hoạt động');
    // Xác nhận UI/DB: Kết quả đúng tập Kho Hoạt động trong DB.
    expect(await vatTuPage.visibleWarehouseLabels()).toEqual(expected);
  });

  test('TC_PMKT-U-00106-256 - Enter chọn dòng Kho đầu tiên', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Chọn từ khóa trả về nhiều Kho thực tế.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const keyword = warehouses.map((warehouse) => warehouse.code[0]).find((char) => warehouses.filter((warehouse) => warehouse.code.startsWith(char ?? '')).length > 1) ?? '';
    test.skip(!keyword, 'BLOCK: ENT_Kho không có từ khóa trả về nhiều kết quả');
    await vatTuPage.searchWarehouse(keyword);
    const firstLabel = (await vatTuPage.visibleWarehouseLabels())[0];
    test.skip(!firstLabel, 'BLOCK: Không có kết quả Kho để chọn bằng Enter');
    // Hành động: Nhấn Enter trên combogrid.
    await vatTuPage.pressWarehouseKey('Enter');
    // Xác nhận UI: Dropdown đóng và chọn dòng đầu tiên.
    await expect(vatTuPage.warehouseDropdown()).toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedWarehouse(firstLabel)).toBeVisible();
  });

  test('TC_PMKT-U-00106-257 - Up và Down di chuyển từng dòng Kho', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở combogrid và giữ nguyên giá trị ban đầu.
    await openGoodsWarehouse(vatTuPage);
    const valueBefore = await vatTuPage.warehouseCombobox().inputValue();
    // Hành động: Down ba lần > Up một lần.
    await vatTuPage.pressWarehouseKey('ArrowDown');
    const first = await vatTuPage.activeWarehouseLabel();
    await vatTuPage.pressWarehouseKey('ArrowDown');
    const second = await vatTuPage.activeWarehouseLabel();
    await vatTuPage.pressWarehouseKey('ArrowDown');
    const third = await vatTuPage.activeWarehouseLabel();
    await vatTuPage.pressWarehouseKey('ArrowUp');
    // Xác nhận UI: Di chuyển đúng từng dòng và chưa thay đổi giá trị trường.
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeWarehouseLabel()).toBe(second);
    await expect(vatTuPage.warehouseCombobox()).toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-258 - ESC đóng dropdown Kho mặc định', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở combogrid và ghi nhận giá trị hiện tại.
    await openGoodsWarehouse(vatTuPage);
    const valueBefore = await vatTuPage.warehouseCombobox().inputValue();
    // Hành động: Nhấn ESC.
    await vatTuPage.pressWarehouseKey('Escape');
    // Xác nhận UI: Dropdown đóng và giá trị không thay đổi.
    await expect(vatTuPage.warehouseDropdown()).toBeHidden();
    await expect(vatTuPage.warehouseCombobox()).toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-259 - icon X xóa Kho mặc định', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Chọn Kho Hoạt động thực tế.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db);
    const active = warehouses.find((warehouse) => warehouse.status === 'HoatDong');
    test.skip(!active, 'BLOCK: ENT_Kho chưa có Kho Hoạt động');
    if (!active) return;
    await vatTuPage.selectWarehouse(active);
    // Hành động: Click icon X để xóa nhanh.
    await vatTuPage.clearWarehouse();
    // Xác nhận UI: Giá trị bị xóa và combogrid trở về trống.
    await expect(vatTuPage.selectedWarehouse(active.label)).toBeHidden();
    await expect(vatTuPage.warehouseCombobox()).toHaveValue('');
  });

  test('TC_PMKT-U-00106-260 - nút thêm nhanh Kho theo quyền', async () => {
    // Chuẩn bị dữ liệu: DOM không có nút thêm nhanh và testcase yêu cầu hai tài khoản phân quyền.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh; chưa có đủ tài khoản có/không quyền');
  });

  test('TC_PMKT-U-00106-261 - UI form thêm nhanh Kho', async () => {
    // Chuẩn bị dữ liệu: DOM combogrid Kho mặc định không có nút thêm nhanh.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-262 - validate bắt buộc thêm nhanh Kho', async () => {
    // Chuẩn bị dữ liệu: Phụ thuộc form thêm nhanh Kho.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-263 - validate trùng mã thêm nhanh Kho', async () => {
    // Chuẩn bị dữ liệu: Phụ thuộc form thêm nhanh Kho và mã trùng theo testcase.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-264 - boundary Mã thêm nhanh Kho', async () => {
    // Chuẩn bị dữ liệu: Phụ thuộc form thêm nhanh Kho.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-265 - boundary Tên thêm nhanh Kho', async () => {
    // Chuẩn bị dữ liệu: Phụ thuộc form thêm nhanh Kho.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-266 - lưu thêm nhanh Kho và tự động điền', async () => {
    // Chuẩn bị dữ liệu: Phụ thuộc form thêm nhanh Kho và cleanup bản ghi được tạo.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh');
  });

  test('TC_PMKT-U-00106-267 - hủy form thêm nhanh Kho', async () => {
    // Chuẩn bị dữ liệu: Phụ thuộc form thêm nhanh Kho.
    test.skip(true, 'BLOCK: combogrid Kho mặc định không hiển thị nút (+) thêm nhanh');
  });

 test('TC_PMKT-U-00106-135 - ẩn Tài khoản giá vốn khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Hàng hóa tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage);
    // Hành động: Thay đổi tính chất > chọn Dịch vụ > mở Hạch toán ngầm định.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openDefaultAccountingTab();
    // Xác nhận UI: Tài khoản giá vốn bị ẩn hoàn toàn.
    await expect(vatTuPage.formField('Tài khoản giá vốn'), 'Form Dịch vụ phải ẩn Tài khoản giá vốn').toBeHidden();
  });

  test('TC_PMKT-U-00106-136 - reset Tài khoản giá vốn khi đổi sang Nguyên vật liệu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Hàng hóa và xác nhận Tài khoản giá vốn có dữ liệu.
    await prepareGoodsAccounting(vatTuPage);
    await expect(vatTuPage.formField('Tài khoản giá vốn'), 'Tài khoản giá vốn phải có dữ liệu trước khi đổi').toContainText(/\d{3,}/);
    // Hành động: Thay đổi tính chất > chọn Nguyên vật liệu > mở Hạch toán ngầm định.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openDefaultAccountingTab();
    // Xác nhận UI: Tài khoản giá vốn được reset về trống theo testcase.
    await expect(vatTuPage.formField('Tài khoản giá vốn'), 'Tài khoản giá vốn phải được xóa sạch').not.toContainText(/\d{3,}/);
  });
});
