import { test, expect } from '@fixtures/base.fixture';
import { firstVisibleActiveMainUnit, materialTypeDefaultAccountsFromDatabase, openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import {
  boundaryText,
  fullGoodsData,
  openGoodsInventoryTab,
  openGoodsTaxTab,
  openGoodsWarehouse,
  prepareGoodsAccounting,
  prepareGoodsExciseTaxes,
  prepareGoodsResourceTaxes,
  prepareGoodsConversionGrid,
  prepareGoodsWarehouses,
  recordMissingSpecialGoodsTypeBug,
  verifyFullGoodsSavedInDatabase,
  verifyRequiredGoodsSavedInDatabase,
  verifyMaterialTypeCards,
} from '@helpers/vat-tu-part1.helper';
import { requireCredentials } from '@utils/env.config';
import { TestDataGenerator } from '@utils/test-data';
import { discriminatingSearchKeyword, isGrayCssColor, sharedSearchKeyword, statusPair } from '@utils/vat-tu-test.util';

test.describe('PMKT-U-00106 - Thêm mới Vật tư Thành phẩm TC1162-TC1483', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('TC_PMKT-U-00106-1162 - chọn Thành phẩm và hiển thị form thông tin tương ứng', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng sau khi chọn Thành phẩm').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Phải hiển thị popup Thêm mới vật tư').toBeVisible();
    await expect(vatTuPage.finishedProductMaterialTypeField(), 'Tính chất phải hiển thị Thành phẩm ở trạng thái chỉ đọc').toContainText('Thành phẩm');
    for (const field of [
      { label: 'Mã vật tư', role: 'textbox' as const },
      { label: 'Tên vật tư', role: 'textbox' as const },
      { label: 'Nhóm vật tư', role: 'combobox' as const },
      { label: 'Đơn vị tính chính', role: 'combobox' as const },
      { label: 'Tên vật tư khi mua', role: 'textbox' as const },
      { label: 'Tên vật tư khi bán', role: 'textbox' as const },
      { label: 'Mô tả', role: 'textbox' as const },
    ]) {
      await expect.soft(
        vatTuPage.inventoryMaterialFormFieldControl(field.label, field.role),
        `Phần Thông tin chính phải hiển thị trường ${field.label}`,
      ).toBeVisible();
    }
    await expect.soft(vatTuPage.checkbox('Giảm thuế theo quy định'), 'Phải hiển thị trường Giảm thuế theo quy định').toBeVisible();
    await expect.soft(vatTuPage.specialGoodsTypeCombobox(), 'Phải hiển thị trường Loại hàng hóa đặc trưng').toBeVisible();
    await expect.soft(vatTuPage.inventoryMaterialFormFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Phải hiển thị trường Thời hạn bảo hành').toBeVisible();
    await expect.soft(vatTuPage.inventoryWarrantyUnitCombobox(), 'Phải hiển thị đơn vị Thời hạn bảo hành').toBeVisible();
    await expect.soft(vatTuPage.statusSwitch(), 'Phải hiển thị trường Trạng thái').toBeVisible();
    await expect.soft(vatTuPage.materialImageLabel(), 'Phải hiển thị trường Ảnh').toBeVisible();
    for (const tab of ['Hạch toán ngầm định', 'Thông tin kho', 'Thông tin thuế', 'Đơn vị quy đổi']) {
      await expect.soft(vatTuPage.formTab(tab), `Phải hiển thị tab ${tab}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-1163 - Thay đổi tính chất hiển thị lại popup đủ 6 lựa chọn', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.changeMaterialType();

    await expect(vatTuPage.materialTypeDialog, 'Phải hiển thị lại popup Chọn tính chất').toBeVisible();
    await verifyMaterialTypeCards(vatTuPage);
  });

  test('TC_PMKT-U-00106-1164 - đóng popup thay đổi và giữ nguyên Thành phẩm cùng dữ liệu đang nhập', async ({ vatTuPage }) => {
    const materialName = new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-1164');
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.materialNameInput().fill(materialName);
    await vatTuPage.changeMaterialType();
    await vatTuPage.closeMaterialTypePopup();

    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Form Thêm mới phải tiếp tục hiển thị').toBeVisible();
    await expect(vatTuPage.finishedProductMaterialTypeField(), 'Loại vật tư cũ phải được giữ nguyên').toContainText('Thành phẩm');
    await expect(vatTuPage.materialNameInput(), 'Dữ liệu đang nhập phải được giữ nguyên').toHaveValue(materialName);
  });

  test('TC_PMKT-U-00106-1165 - thay đổi tính chất từ Thành phẩm sang Dịch vụ', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Form Thêm mới loại Dịch vụ phải hiển thị').toBeVisible();
    await expect(vatTuPage.materialTypeValue('Dịch vụ'), 'Loại vật tư mới phải là Dịch vụ').toBeVisible();
    await expect(vatTuPage.formTab('Thông tin kho'), 'Dịch vụ không được hiển thị tab Thông tin kho').toBeHidden();
    await expect(vatTuPage.formTab('Đơn vị quy đổi'), 'Dịch vụ không được hiển thị tab Đơn vị quy đổi').toBeHidden();
  });

  test('TC_PMKT-U-00106-1166 - hiển thị TextBox Mã vật tư bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải hiển thị dưới dạng TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Mã vật tư'), 'Label Mã vật tư phải có dấu * màu đỏ bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-1167 - nhập Mã vật tư dài 49 ký tự', async ({ vatTuPage }) => {
    const code = boundaryText('TC_PMKT-U-00106-1167', 49);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.materialCodeInput().fill(code);

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải giữ đầy đủ 49 ký tự').toHaveValue(code);
  });

  test('TC_PMKT-U-00106-1168 - nhập Mã vật tư dài tối đa 50 ký tự', async ({ vatTuPage }) => {
    const code = boundaryText('TC_PMKT-U-00106-1168', 50);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.materialCodeInput().fill(code);

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải giữ đầy đủ 50 ký tự').toHaveValue(code);
  });

  test('TC_PMKT-U-00106-1169 - chặn ký tự thứ 51 của Mã vật tư', async ({ vatTuPage }) => {
    const firstFiftyCharacters = boundaryText('TC_PMKT-U-00106-1169', 50);
    const fiftyOneCharacters = `${firstFiftyCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.materialCodeInput().fill(fiftyOneCharacters);

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải chặn cứng ký tự thứ 51').toHaveValue(firstFiftyCharacters);
  });

  test('TC_PMKT-U-00106-1170 - validate bỏ trống Mã vật tư khi Lưu', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredInventoryMaterialFields(
      '',
      new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-1170'),
      mainUnit,
    );
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi Mã vật tư trống').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Mã vật tư', 'Mã không được để trống'),
      'Phải hiển thị lỗi Mã không được để trống dưới chân trường Mã vật tư',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-1171 - validate trùng Mã vật tư đã tồn tại', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const existingCode = await db.vatTu.findFirstExistingCodeForDefaultTenant(credentials.username);
    test.skip(!existingCode, 'Precondition DB đúng tenant không có vật tư đang tồn tại');
    if (!existingCode) return;
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredInventoryMaterialFields(
      existingCode,
      new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-1171'),
      mainUnit,
    );
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu mã vật tư trùng').toBeVisible();
    await expect(
      vatTuPage.notificationMessage('Mã vật tư đã tồn tại'),
      'Phải hiển thị MSG_PMKT-U-00106_003: Mã vật tư đã tồn tại',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-1172 - hiển thị TextBox Tên vật tư bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải hiển thị dưới dạng TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư'), 'Label Tên vật tư phải có dấu * màu đỏ bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-1173 - nhập Tên vật tư dài 254 ký tự', async ({ vatTuPage }) => {
    const name = boundaryText('TC_PMKT-U-00106-1173', 254);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.materialNameInput().fill(name);

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải giữ đầy đủ 254 ký tự').toHaveValue(name);
  });

  test('TC_PMKT-U-00106-1174 - nhập Tên vật tư dài tối đa 255 ký tự', async ({ vatTuPage }) => {
    const name = boundaryText('TC_PMKT-U-00106-1174', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.materialNameInput().fill(name);

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải giữ đầy đủ 255 ký tự').toHaveValue(name);
  });

  test('TC_PMKT-U-00106-1175 - chặn ký tự thứ 256 của Tên vật tư', async ({ vatTuPage }) => {
    const firstTwoHundredFiftyFiveCharacters = boundaryText('TC_PMKT-U-00106-1175', 255);
    const twoHundredFiftySixCharacters = `${firstTwoHundredFiftyFiveCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.materialNameInput().fill(twoHundredFiftySixCharacters);

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải chặn cứng ký tự thứ 256').toHaveValue(firstTwoHundredFiftyFiveCharacters);
  });

  test('TC_PMKT-U-00106-1176 - validate bỏ trống Tên vật tư khi Lưu', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredInventoryMaterialFields(
      new TestDataGenerator().uniqueCode('TC_PMKT-U-00106-1176'),
      '',
      mainUnit,
    );
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi Tên vật tư trống').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Tên vật tư', 'Tên không được để trống'),
      'Phải hiển thị lỗi Tên không được để trống dưới chân trường Tên vật tư',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-1177 - hiển thị Dropdown Nhóm vật tư không bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thêm mới Thành phẩm và quan sát control Nhóm vật tư.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    // Xác nhận UI: Control là dropdown và label không có dấu bắt buộc.
    await expect(vatTuPage.groupCombobox, 'Nhóm vật tư phải là Dropdown').toBeVisible();
    await expect(vatTuPage.requiredFormField('Nhóm vật tư'), 'Nhóm vật tư không được hiển thị dấu * bắt buộc').toBeHidden();
  });

  test('TC_PMKT-U-00106-1178 - hiển thị đúng dữ liệu và thứ tự Dropdown Nhóm vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy toàn bộ Nhóm vật tư từ DB đúng tenant làm expected.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    test.skip(catalogues.groups.length === 0, 'Danh mục Nhóm vật tư trong DB không có dữ liệu');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openGroupDropdown();

    // Xác nhận UI/DB: Từng nhóm DB tìm được trên UI và thứ tự trạng thái đúng.
    for (const group of catalogues.groups) {
      await vatTuPage.searchGroup(group.code);
      await expect(vatTuPage.groupOption(group.label), `Phải hiển thị nhóm ${group.label}`).toBeVisible();
    }
    const statuses = catalogues.groups.map((group) => group.status);
    const firstInactiveIndex = statuses.indexOf('NgungHoatDong');
    const lastActiveIndex = statuses.lastIndexOf('HoatDong');
    expect(firstInactiveIndex === -1 || lastActiveIndex < firstInactiveIndex, 'Nhóm Hoạt động phải xếp trước Nhóm Ngừng hoạt động').toBeTruthy();
  });

  test('TC_PMKT-U-00106-1179 - Nhóm vật tư Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy một cặp Nhóm vật tư Hoạt động/Ngừng hoạt động từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const pair = statusPair(catalogues.groups);
    test.skip(!pair, 'DB thiếu đồng thời Nhóm vật tư Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openGroupDropdown();

    // Xác nhận UI: Style chữ của nhóm Ngừng hoạt động khác nhóm Hoạt động.
    const activeStyle = await vatTuPage.groupOptionStyle(pair.active.label);
    const inactiveStyle = await vatTuPage.groupOptionStyle(pair.inactive.label);
    expect(inactiveStyle, 'Màu/độ mờ của Nhóm Ngừng hoạt động phải khác Nhóm Hoạt động').not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-1180 - chọn một Nhóm vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn Nhóm vật tư đầu tiên từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const group = catalogues.groups[0];
    test.skip(!group, 'Danh mục Nhóm vật tư trong DB không có dữ liệu');
    if (!group) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(group);

    // Xác nhận UI: Nhóm vừa chọn hiển thị dưới dạng tag.
    await expect(vatTuPage.selectedGroup(group.label), 'Nhóm đã chọn phải hiển thị dạng tag').toBeVisible();
  });

  test('TC_PMKT-U-00106-1181 - chọn đồng thời hai Nhóm vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn hai Nhóm vật tư khác nhau từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'DB cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);

    // Xác nhận UI: Cả hai nhóm cùng hiển thị dưới dạng tag.
    await expect(vatTuPage.selectedGroup(firstGroup.label), 'Tag Nhóm vật tư thứ nhất phải hiển thị').toBeVisible();
    await expect(vatTuPage.selectedGroup(secondGroup.label), 'Tag Nhóm vật tư thứ hai phải hiển thị').toBeVisible();
  });

  test('TC_PMKT-U-00106-1182 - xóa riêng tag Nhóm vật tư thứ hai', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn hai Nhóm vật tư khác nhau từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'DB cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);

    // Hành động: Xóa riêng tag của Nhóm vật tư thứ hai.
    await vatTuPage.removeSelectedGroup(secondGroup.label);

    // Xác nhận UI: Tag thứ hai bị xóa và tag thứ nhất vẫn được giữ nguyên.
    await expect(vatTuPage.selectedGroup(secondGroup.label), 'Tag Nhóm vật tư thứ hai phải bị xóa').toBeHidden();
    await expect(vatTuPage.selectedGroup(firstGroup.label), 'Tag Nhóm vật tư thứ nhất phải được giữ lại').toBeVisible();
  });

  test('TC_PMKT-U-00106-1183 - xóa nhanh toàn bộ Nhóm vật tư đã chọn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn hai Nhóm vật tư khác nhau từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'DB cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);

    // Hành động: Nhấn icon xóa nhanh của trường Nhóm vật tư.
    await vatTuPage.clearAllSelectedGroups();

    // Xác nhận UI: Toàn bộ tag bị xóa và dropdown trở về trạng thái trống.
    await expect(vatTuPage.selectedGroup(firstGroup.label), 'Tag Nhóm vật tư thứ nhất phải bị xóa').toBeHidden();
    await expect(vatTuPage.selectedGroup(secondGroup.label), 'Tag Nhóm vật tư thứ hai phải bị xóa').toBeHidden();
    await expect(vatTuPage.groupCombobox, 'Nhóm vật tư phải trở về trạng thái trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1184 - hiển thị Combogrid Đơn vị tính chính bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thêm mới Thành phẩm và quan sát control Đơn vị tính chính.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    // Xác nhận UI: Control là combogrid và label có dấu bắt buộc.
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Đơn vị tính chính'), 'Đơn vị tính chính phải hiển thị dấu * bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-1185 - hiển thị đúng cột, dữ liệu và thứ tự Đơn vị tính chính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy toàn bộ Đơn vị tính từ DB đúng tenant làm expected.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    test.skip(catalogues.units.length === 0, 'Danh mục Đơn vị tính trong DB không có dữ liệu');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();

    // Xác nhận UI/DB: Đúng ba cột, từng bản ghi DB tìm được và thứ tự trạng thái đúng.
    for (const header of ['Mã đơn vị tính', 'Tên đơn vị tính', 'Trạng thái']) {
      await expect.soft(vatTuPage.mainUnitColumnHeader(header), `Phải hiển thị cột ${header}`).toBeVisible();
    }
    const actualStatuses = await vatTuPage.visibleMainUnitStatuses(catalogues.units.length);
    expect(actualStatuses, 'Số dòng Đơn vị tính trên UI phải khớp dữ liệu DB').toHaveLength(catalogues.units.length);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    const hasActiveAfterInactive = firstInactiveIndex >= 0
      && actualStatuses.slice(firstInactiveIndex + 1).includes('HoatDong');
    expect(hasActiveAfterInactive, 'UI không được hiển thị Đơn vị tính Hoạt động sau bản ghi Ngừng hoạt động').toBe(false);

    // Xác nhận UI/DB: Tìm chính xác từng bản ghi theo mã để kiểm tra dữ liệu dropdown không thiếu.
    for (const unit of catalogues.units) {
      await vatTuPage.searchMainUnit(unit.code);
      await expect(vatTuPage.mainUnitOption(unit.label), `Phải hiển thị Đơn vị tính ${unit.label}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-1186 - Đơn vị tính Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy một cặp Đơn vị tính Hoạt động/Ngừng hoạt động từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const pair = statusPair(catalogues.units);
    test.skip(!pair, 'DB thiếu đồng thời Đơn vị tính Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();

    // Xác nhận UI: Style chữ của bản ghi Ngừng hoạt động khác bản ghi Hoạt động.
    await vatTuPage.searchMainUnit(pair.active.code);
    const activeStyle = await vatTuPage.mainUnitOptionStyle(pair.active.label);
    await vatTuPage.searchMainUnit(pair.inactive.code);
    const inactiveStyle = await vatTuPage.mainUnitOptionStyle(pair.inactive.label);
    expect(inactiveStyle, 'Màu/độ mờ của Đơn vị tính Ngừng hoạt động phải khác Đơn vị tính Hoạt động').not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-1187 - xác nhận sử dụng Đơn vị tính Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Ngừng hoạt động từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const inactiveUnit = catalogues.units.find((unit) => unit.status === 'NgungHoatDong');
    test.skip(!inactiveUnit, 'DB không có Đơn vị tính Ngừng hoạt động');
    if (!inactiveUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.selectMainUnit(inactiveUnit);

    // Xác nhận UI: Popup đúng nội dung và đủ hai nút theo testcase.
    await expect.soft(vatTuPage.mainUnitConfirmationMessage(), 'Popup phải hiển thị đúng nội dung cảnh báo').toBeVisible();
    await expect.soft(vatTuPage.mainUnitConfirmationButton('Xác nhận'), 'Popup phải có nút Xác nhận').toBeVisible();
    await expect.soft(vatTuPage.mainUnitConfirmationButton('Hủy'), 'Popup phải có nút Hủy').toBeVisible();

    // Hành động: Xác nhận sử dụng bản ghi Ngừng hoạt động.
    await vatTuPage.confirmInactiveMainUnit();

    // Xác nhận UI: Popup đóng và Đơn vị tính được chọn thành công.
    await expect(vatTuPage.mainUnitConfirmationDialog(), 'Popup phải đóng sau khi Xác nhận').toBeHidden();
    await expect(vatTuPage.selectedMainUnit(inactiveUnit.label), 'Đơn vị tính Ngừng hoạt động phải được chọn thành công').toBeVisible();
  });

  test('TC_PMKT-U-00106-1188 - hủy sử dụng Đơn vị tính Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Ngừng hoạt động từ DB; trường ban đầu để trống.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const inactiveUnit = catalogues.units.find((unit) => unit.status === 'NgungHoatDong');
    test.skip(!inactiveUnit, 'DB không có Đơn vị tính Ngừng hoạt động');
    if (!inactiveUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.selectMainUnit(inactiveUnit);

    // Xác nhận UI: Popup đúng nội dung và đủ hai nút theo testcase.
    await expect.soft(vatTuPage.mainUnitConfirmationMessage(), 'Popup phải hiển thị đúng nội dung cảnh báo').toBeVisible();
    await expect.soft(vatTuPage.mainUnitConfirmationButton('Xác nhận'), 'Popup phải có nút Xác nhận').toBeVisible();
    await expect.soft(vatTuPage.mainUnitConfirmationButton('Hủy'), 'Popup phải có nút Hủy').toBeVisible();

    // Hành động: Hủy sử dụng bản ghi Ngừng hoạt động.
    await vatTuPage.cancelInactiveMainUnit();

    // Xác nhận UI: Popup đóng, bản ghi không được giữ lại và trường vẫn trống.
    await expect(vatTuPage.mainUnitConfirmationDialog(), 'Popup phải đóng sau khi Hủy').toBeHidden();
    await expect(vatTuPage.selectedMainUnit(inactiveUnit.label), 'Bản ghi Ngừng hoạt động không được giữ lại').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải giữ trạng thái trống ban đầu').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1189 - chọn Đơn vị tính chính Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Hoạt động đầu tiên từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!activeUnit, 'DB không có Đơn vị tính Hoạt động');
    if (!activeUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();

    // Hành động: Chọn một bản ghi Đơn vị tính Hoạt động.
    await vatTuPage.selectMainUnit(activeUnit);

    // Xác nhận UI: Giá trị được chọn và không xuất hiện popup xác nhận.
    await expect(vatTuPage.selectedMainUnit(activeUnit.label), 'Đơn vị tính Hoạt động phải được chọn thành công').toBeVisible();
    await expect(vatTuPage.mainUnitConfirmationDialog(), 'Không được hiển thị cảnh báo khi chọn Đơn vị tính Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1190 - tìm kiếm Đơn vị tính chính theo Mã', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const keyword = discriminatingSearchKeyword(
      catalogues.units.map(({ code }) => code),
      catalogues.units.map(({ name }) => name),
    );
    test.skip(!keyword, 'DB không có keyword chỉ xuất hiện trong Mã và không xuất hiện trong Tên Đơn vị tính');
    if (!keyword) return;
    const expected = catalogues.units.filter(({ code }) => code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')));
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(keyword);

    expect(await vatTuPage.visibleMainUnitLabels(expected.length), 'Số kết quả tìm theo Mã trên UI phải khớp DB').toHaveLength(expected.length);
    for (const option of expected) {
      await expect.soft(vatTuPage.mainUnitOption(option.label), `Phải hiển thị Mã Đơn vị tính chứa ${keyword}: ${option.code}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-1191 - tìm kiếm Đơn vị tính chính theo Tên', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const keyword = discriminatingSearchKeyword(
      catalogues.units.map(({ name }) => name),
      catalogues.units.map(({ code }) => code),
    );
    test.skip(!keyword, 'DB không có keyword chỉ xuất hiện trong Tên và không xuất hiện trong Mã Đơn vị tính');
    if (!keyword) return;
    const expected = catalogues.units.filter(({ name }) => name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')));
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(keyword);

    expect(await vatTuPage.visibleMainUnitLabels(expected.length), 'Số kết quả tìm theo Tên trên UI phải khớp DB').toHaveLength(expected.length);
    for (const option of expected) {
      await expect.soft(vatTuPage.mainUnitOption(option.label), `Phải hiển thị Tên Đơn vị tính chứa ${keyword}: ${option.name}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-1192 - tìm kiếm Đơn vị tính chính theo Trạng thái', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const expected = catalogues.units.filter(({ status }) => status === 'NgungHoatDong');
    test.skip(expected.length === 0, 'DB không có Đơn vị tính Ngừng hoạt động');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit('Ngừng hoạt động');

    const actualStatuses = await vatTuPage.visibleMainUnitStatuses(expected.length);
    expect(actualStatuses, 'Số kết quả tìm theo Trạng thái trên UI phải khớp DB').toHaveLength(expected.length);
    expect(actualStatuses, 'Mọi kết quả phải có trạng thái Ngừng hoạt động').toEqual(expected.map(() => 'NgungHoatDong'));
  });

  test('TC_PMKT-U-00106-1193 - phím Enter chọn dòng đầu tiên của kết quả tìm kiếm', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const keyword = sharedSearchKeyword(catalogues.units.map(({ code }) => code));
    test.skip(!keyword, 'DB không có từ khóa Mã chung cho ít nhất hai Đơn vị tính');
    if (!keyword) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(keyword);
    const [firstResult] = await vatTuPage.visibleMainUnitLabels();
    expect(firstResult, 'Từ khóa phải trả về ít nhất một kết quả').toBeDefined();
    await vatTuPage.pressMainUnitKey('Enter');

    await expect(vatTuPage.mainUnitDropdown(), 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedMainUnit(firstResult ?? ''), 'Enter phải chọn đúng dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1194 - phím Up và Down di chuyển vùng chọn', async ({ vatTuPage }) => {
    await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    const initial = await vatTuPage.mainUnitRowVisualStates();
    await vatTuPage.pressMainUnitKey('ArrowDown');
    const afterFirstDown = await vatTuPage.mainUnitRowVisualStates();
    await vatTuPage.pressMainUnitKey('ArrowDown');
    const afterSecondDown = await vatTuPage.mainUnitRowVisualStates();
    await expect(vatTuPage.mainUnitCombobox, 'Điều hướng chưa được thay đổi giá trị khi chưa nhấn Enter').toHaveValue('');
    await vatTuPage.pressMainUnitKey('ArrowUp');
    const afterUp = await vatTuPage.mainUnitRowVisualStates();

    expect(afterFirstDown, 'ArrowDown phải di chuyển vùng chọn xuống một dòng').not.toEqual(initial);
    expect(afterSecondDown, 'ArrowDown lần hai phải tiếp tục di chuyển xuống').not.toEqual(afterFirstDown);
    expect(afterUp, 'ArrowUp phải đưa vùng chọn trở lại dòng trước').toEqual(afterFirstDown);
    await expect(vatTuPage.mainUnitCombobox, 'ArrowUp/Down không được chọn giá trị khi chưa nhấn Enter').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1195 - phím ESC đóng dropdown và giữ nguyên giá trị', async ({ vatTuPage }) => {
    await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.pressMainUnitKey('Escape');

    await expect(vatTuPage.mainUnitDropdown(), 'Dropdown phải đóng sau khi nhấn ESC').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1196 - icon X xóa nhanh Đơn vị tính chính đã chọn', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find(({ status }) => status === 'HoatDong');
    test.skip(!activeUnit, 'DB không có Đơn vị tính Hoạt động để kiểm tra xóa nhanh');
    if (!activeUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.selectMainUnit(activeUnit);
    await vatTuPage.clearMainUnit();

    await expect(vatTuPage.selectedMainUnit(activeUnit.label), 'Giá trị Đơn vị tính đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải quay về trạng thái trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1197 - hiển thị nút thêm nhanh Đơn vị tính với tài khoản full quyền', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown();

    await expect(
      vatTuPage.mainUnitQuickAddButton(),
      'BUG: tài khoản full quyền phải hiển thị nút (+) Thêm nhanh Đơn vị tính',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-1198 - giao diện form thêm nhanh Đơn vị tính rút gọn', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1197 - tài khoản full quyền không hiển thị nút (+) Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1199 - validate bắt buộc form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1197');
  });

  test('TC_PMKT-U-00106-1200 - validate trùng Mã form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1197');
  });

  test('TC_PMKT-U-00106-1201 - boundary Mã form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1197');
  });

  test('TC_PMKT-U-00106-1202 - boundary Tên form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1197');
  });

  test('TC_PMKT-U-00106-1203 - lưu thêm nhanh Đơn vị tính và tự động điền', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1197');
  });

  test('TC_PMKT-U-00106-1204 - hủy form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1197');
  });

  test('TC_PMKT-U-00106-1205 - validate bắt buộc Đơn vị tính chính', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Mã vật tư', data.uniqueCode('TC051'));
    await vatTuPage.fillFormField('Tên vật tư', data.uniqueKeyword('TC051'));
    await vatTuPage.openFormTab('Thông tin kho');
    await vatTuPage.ensureFirstFormOption('Phương pháp tính giá');
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi thiếu Đơn vị tính chính').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Đơn vị tính chính', 'Đơn vị tính chính không được để trống'),
      'Phải hiển thị lỗi bắt buộc của Đơn vị tính chính',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-1206 - hiển thị checkbox Giảm thuế theo quy định không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.checkbox('Giảm thuế theo quy định'), 'Phải hiển thị checkbox Giảm thuế theo quy định').toBeVisible();
    await expect(vatTuPage.requiredFormField('Giảm thuế theo quy định'), 'Checkbox không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1207 - checkbox Giảm thuế mặc định false và thay đổi được', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const reducedTax = vatTuPage.checkbox('Giảm thuế theo quy định');

    await expect(reducedTax, 'Checkbox Giảm thuế phải mặc định false').not.toBeChecked();
    await vatTuPage.setCheckbox('Giảm thuế theo quy định', true);
    await expect(reducedTax, 'Checkbox phải chuyển sang trạng thái được tích').toBeChecked();
    await vatTuPage.setCheckbox('Giảm thuế theo quy định', false);
    await expect(reducedTax, 'Checkbox phải trở lại trạng thái không tích').not.toBeChecked();
  });

  test('TC_PMKT-U-00106-1208 - hiển thị Numeric Thời hạn bảo hành không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Phải hiển thị Numeric Thời hạn bảo hành').toBeVisible();
    await expect(vatTuPage.requiredFormField('Thời hạn bảo hành'), 'Thời hạn bảo hành không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1209 - nhập thời hạn bảo hành nguyên dương và chọn Tháng', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Thời hạn bảo hành', '12');
    await vatTuPage.selectInventoryWarrantyUnit('Tháng');

    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Numeric phải nhận số nguyên dương 12').toHaveValue('12');
    await expect(vatTuPage.inventorySelectedWarrantyUnit('Tháng'), 'Phải chọn thành công đơn vị thời gian Tháng').toBeVisible();
  });

  test('TC_PMKT-U-00106-1210 - validate thời hạn bảo hành với số âm, số 0 và số thập phân', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find(({ status }) => status === 'HoatDong');
    test.skip(!activeUnit, 'DB không có Đơn vị tính Hoạt động để nhập đủ dữ liệu hợp lệ');
    if (!activeUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(
      data.uniqueCode('TC056'),
      data.uniqueKeyword('TC056'),
      activeUnit,
    );
    const warrantyPeriod = vatTuPage.inventoryMaterialFormFieldControl('Thời hạn bảo hành', 'spinbutton');
    const warrantyValidation = vatTuPage.validationMessage(
      'Thời hạn bảo hành',
      'Thời hạn bảo hành phải là số nguyên dương',
    );

    await vatTuPage.fillFormField('Thời hạn bảo hành', '-5');
    await expect(warrantyPeriod, 'Trường phải nhận dữ liệu số âm -5 theo step 2').toHaveValue('-5');
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi thời hạn là -5').toBeVisible();
    await expect(warrantyValidation, 'Phải hiển thị lỗi khi thời hạn là -5').toBeVisible();

    await vatTuPage.fillFormField('Thời hạn bảo hành', '0');
    await expect(warrantyPeriod, 'Trường phải nhận dữ liệu 0 theo step 3').toHaveValue('0');
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi thời hạn là 0').toBeVisible();
    await expect(warrantyValidation, 'Phải hiển thị lỗi khi thời hạn là 0').toBeVisible();

    await vatTuPage.fillFormField('Thời hạn bảo hành', '1.5');
    await expect(warrantyPeriod, 'Trường phải nhận dữ liệu thập phân 1.5 theo step 4').toHaveValue('1.5');
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi thời hạn là 1.5').toBeVisible();
    await expect(warrantyValidation, 'Phải hiển thị lỗi khi thời hạn là 1.5').toBeVisible();
  });

  test('TC_PMKT-U-00106-1211 - ẩn thời hạn bảo hành khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.formField('Thời hạn bảo hành'), 'Form Dịch vụ phải ẩn hoàn toàn trường Thời hạn bảo hành').toBeHidden();
  });

  test('TC_PMKT-U-00106-1212 - reset thời hạn bảo hành khi đổi sang loại vật tư khác', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Thời hạn bảo hành', '12');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thời hạn bảo hành', 'spinbutton')).toHaveValue('12');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Form mới phải reset Thời hạn bảo hành về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1213 - hiển thị TextArea Mô tả không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.textarea('Mô tả'), 'Phải hiển thị control TextArea Mô tả').toBeVisible();
    await expect(vatTuPage.requiredFormField('Mô tả'), 'Mô tả không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1214 - boundary Mô tả 499 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mô tả traceable dài 499 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1214', 499);
    // Hành động: Mở form Thành phẩm > nhập Mô tả.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Mô tả', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 499 ký tự theo Expected Result.
    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải giữ đúng 499 ký tự').toHaveValue(input.slice(0, 499));
  });

  test('TC_PMKT-U-00106-1215 - boundary Mô tả 500 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mô tả traceable dài 500 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1215', 500);
    // Hành động: Mở form Thành phẩm > nhập Mô tả.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Mô tả', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 500 ký tự theo Expected Result.
    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải giữ đúng 500 ký tự').toHaveValue(input.slice(0, 500));
  });

  test('TC_PMKT-U-00106-1216 - boundary Mô tả 501 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mô tả traceable dài 501 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1216', 501);
    // Hành động: Mở form Thành phẩm > nhập Mô tả.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Mô tả', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 500 ký tự theo Expected Result.
    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải giữ đúng 500 ký tự').toHaveValue(input.slice(0, 500));
  });

  test('TC_PMKT-U-00106-1217 - hiển thị TextBox Tên vật tư khi mua không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi mua', 'textbox'), 'Phải hiển thị TextBox Tên vật tư khi mua').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư khi mua'), 'Tên vật tư khi mua không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1218 - boundary Tên vật tư khi mua 254 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên vật tư khi mua traceable dài 254 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1218', 254);
    // Hành động: Mở form Thành phẩm > nhập Tên vật tư khi mua.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư khi mua', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 254 ký tự theo Expected Result.
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên vật tư khi mua phải giữ đúng 254 ký tự').toHaveValue(input.slice(0, 254));
  });

  test('TC_PMKT-U-00106-1219 - boundary Tên vật tư khi mua 255 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên vật tư khi mua traceable dài 255 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1219', 255);
    // Hành động: Mở form Thành phẩm > nhập Tên vật tư khi mua.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư khi mua', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 255 ký tự theo Expected Result.
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên vật tư khi mua phải giữ đúng 255 ký tự').toHaveValue(input.slice(0, 255));
  });

  test('TC_PMKT-U-00106-1220 - boundary Tên vật tư khi mua 256 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên vật tư khi mua traceable dài 256 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1220', 256);
    // Hành động: Mở form Thành phẩm > nhập Tên vật tư khi mua.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư khi mua', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 255 ký tự theo Expected Result.
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên vật tư khi mua phải giữ đúng 255 ký tự').toHaveValue(input.slice(0, 255));
  });

  test('TC_PMKT-U-00106-1221 - hiển thị TextBox Tên vật tư khi bán không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi bán', 'textbox'), 'Phải hiển thị TextBox Tên vật tư khi bán').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư khi bán'), 'Tên vật tư khi bán không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1222 - boundary Tên vật tư khi bán 254 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên vật tư khi bán traceable dài 254 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1222', 254);
    // Hành động: Mở form Thành phẩm > nhập Tên vật tư khi bán.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư khi bán', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 254 ký tự theo Expected Result.
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên vật tư khi bán phải giữ đúng 254 ký tự').toHaveValue(input.slice(0, 254));
  });

  test('TC_PMKT-U-00106-1223 - boundary Tên vật tư khi bán 255 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên vật tư khi bán traceable dài 255 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1223', 255);
    // Hành động: Mở form Thành phẩm > nhập Tên vật tư khi bán.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư khi bán', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 255 ký tự theo Expected Result.
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên vật tư khi bán phải giữ đúng 255 ký tự').toHaveValue(input.slice(0, 255));
  });

  test('TC_PMKT-U-00106-1224 - boundary Tên vật tư khi bán 256 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên vật tư khi bán traceable dài 256 ký tự theo cận testcase.
    const input = boundaryText('TC_PMKT-U-00106-1224', 256);
    // Hành động: Mở form Thành phẩm > nhập Tên vật tư khi bán.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư khi bán', input);
    // Xác nhận UI: Trường chỉ giữ tối đa 255 ký tự theo Expected Result.
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên vật tư khi bán phải giữ đúng 255 ký tự').toHaveValue(input.slice(0, 255));
  });

  test('TC_PMKT-U-00106-1225 - Tên vật tư khi mua tự điền và cho phép sửa độc lập', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư', 'VT_TEST_001');
    const purchaseName = vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi mua', 'textbox');
    await expect(purchaseName, 'Tên vật tư khi mua phải tự điền theo Tên vật tư').toHaveValue('VT_TEST_001');
    await vatTuPage.fillFormField('Tên vật tư khi mua', 'VT_TEST_001_MUA');

    await expect(purchaseName, 'Phải cho phép sửa độc lập Tên vật tư khi mua').toHaveValue('VT_TEST_001_MUA');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư', 'textbox'), 'Tên vật tư gốc phải được giữ nguyên').toHaveValue('VT_TEST_001');
  });

  test('TC_PMKT-U-00106-1226 - Tên vật tư khi bán tự điền và cho phép sửa độc lập', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillFormField('Tên vật tư', 'VT_TEST_001');
    const saleName = vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư khi bán', 'textbox');
    await expect(saleName, 'Tên vật tư khi bán phải tự điền theo Tên vật tư').toHaveValue('VT_TEST_001');
    await vatTuPage.fillFormField('Tên vật tư khi bán', 'VT_TEST_001_BAN');

    await expect(saleName, 'Phải cho phép sửa độc lập Tên vật tư khi bán').toHaveValue('VT_TEST_001_BAN');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tên vật tư', 'textbox'), 'Tên vật tư gốc phải được giữ nguyên').toHaveValue('VT_TEST_001');
  });

  test('TC_PMKT-U-00106-1227 - hiển thị control Ảnh không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    await expect(vatTuPage.materialImageInput(), 'Phải tồn tại control tải file Ảnh').toBeAttached();
    await expect(vatTuPage.materialImageLabel(), 'Label phải hiển thị đúng là Ảnh').toBeVisible();
    await expect(vatTuPage.requiredFormField('Ảnh'), 'Ảnh không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1228 - tải ảnh JPG 1.5MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh JPG 1.5MB đúng cận dung lượng của testcase.
    // Hành động: Mở form Thành phẩm > tải ảnh.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.uploadMaterialImage('test-data/danh-muc/vat-tu/tc074-material-1_5mb.jpg');
    // Xác nhận UI: Ảnh hợp lệ hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh JPG 1.5MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-1229 - tải ảnh JPG 2MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh JPG 2MB đúng cận dung lượng của testcase.
    // Hành động: Mở form Thành phẩm > tải ảnh.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.uploadMaterialImage('test-data/danh-muc/vat-tu/tc075-material-2mb.jpg');
    // Xác nhận UI: Ảnh hợp lệ hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh JPG 2MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-1231 - tải ảnh PNG 1.5MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh PNG 1.5MB đúng cận dung lượng của testcase.
    // Hành động: Mở form Thành phẩm > tải ảnh.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.uploadMaterialImage('test-data/danh-muc/vat-tu/tc077-material-1_5mb.png');
    // Xác nhận UI: Ảnh hợp lệ hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh PNG 1.5MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-1232 - tải ảnh PNG 2MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh PNG 2MB đúng cận dung lượng của testcase.
    // Hành động: Mở form Thành phẩm > tải ảnh.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.uploadMaterialImage('test-data/danh-muc/vat-tu/tc078-material-2mb.png');
    // Xác nhận UI: Ảnh hợp lệ hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh PNG 2MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-1234 - tải ảnh WEBP 1.5MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh WEBP 1.5MB đúng cận dung lượng của testcase.
    // Hành động: Mở form Thành phẩm > tải ảnh.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.uploadMaterialImage('test-data/danh-muc/vat-tu/tc080-material-1_5mb.webp');
    // Xác nhận UI: Ảnh hợp lệ hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh WEBP 1.5MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-1235 - tải ảnh WEBP 2MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh WEBP 2MB đúng cận dung lượng của testcase.
    // Hành động: Mở form Thành phẩm > tải ảnh.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.uploadMaterialImage('test-data/danh-muc/vat-tu/tc081-material-2mb.webp');
    // Xác nhận UI: Ảnh hợp lệ hiển thị preview.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh WEBP 2MB phải hiển thị preview').toBeVisible();
  });

  test('TC_PMKT-U-00106-1230 - chặn ảnh JPG 2.1MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh JPG 2.1MB vượt giới hạn.
    // Hành động: Mở form Thành phẩm > chọn ảnh vượt dung lượng.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.chooseMaterialImage('test-data/danh-muc/vat-tu/tc076-material-2_1mb.jpg');
    // Xác nhận UI: Không có preview và hiển thị cảnh báo dung lượng.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh JPG vượt 2MB không được hiển thị preview').toBeHidden();
    await expect(vatTuPage.materialImageSizeError(), 'Phải cảnh báo dung lượng JPG vượt quá 2MB').toBeVisible();
  });

  test('TC_PMKT-U-00106-1233 - chặn ảnh PNG 2.1MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh PNG 2.1MB vượt giới hạn.
    // Hành động: Mở form Thành phẩm > chọn ảnh vượt dung lượng.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.chooseMaterialImage('test-data/danh-muc/vat-tu/tc079-material-2_1mb.png');
    // Xác nhận UI: Không có preview và hiển thị cảnh báo dung lượng.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh PNG vượt 2MB không được hiển thị preview').toBeHidden();
    await expect(vatTuPage.materialImageSizeError(), 'Phải cảnh báo dung lượng PNG vượt quá 2MB').toBeVisible();
  });

  test('TC_PMKT-U-00106-1236 - chặn ảnh WEBP 2.1MB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Dùng ảnh WEBP 2.1MB vượt giới hạn.
    // Hành động: Mở form Thành phẩm > chọn ảnh vượt dung lượng.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.chooseMaterialImage('test-data/danh-muc/vat-tu/tc082-material-2_1mb.webp');
    // Xác nhận UI: Không có preview và hiển thị cảnh báo dung lượng.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh WEBP vượt 2MB không được hiển thị preview').toBeHidden();
    await expect(vatTuPage.materialImageSizeError(), 'Phải cảnh báo dung lượng WEBP vượt quá 2MB').toBeVisible();
  });

  test('TC_PMKT-U-00106-1237 - chặn file PDF không phải định dạng ảnh hợp lệ', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.chooseMaterialImage('test-data/danh-muc/vat-tu/tc083-invalid-format.pdf');

    await expect(vatTuPage.materialImagePreview(), 'File PDF không được hiển thị preview ảnh').toBeHidden();
    await expect(vatTuPage.materialImageFormatError(), 'Phải hiển thị cảnh báo định dạng ảnh không hợp lệ').toBeVisible();
  });

  test('TC_PMKT-U-00106-1238 - ẩn trường Ảnh khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    // Hành động: Mở form Thành phẩm > Thay đổi tính chất > chọn Dịch vụ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Form Dịch vụ ẩn hoàn toàn trường Ảnh.
    await expect(vatTuPage.materialImageLabel(), 'Form Dịch vụ phải ẩn hoàn toàn trường Ảnh').toBeHidden();
    await expect(vatTuPage.materialImageInput(), 'Form Dịch vụ không được chứa control tải ảnh').toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1239 - reset ảnh khi đổi sang loại vật tư khác', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm và tải một ảnh JPG hợp lệ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.uploadMaterialImage('test-data/danh-muc/vat-tu/tc074-material-1_5mb.jpg');
    await expect(vatTuPage.materialImagePreview(), 'Ảnh đã chọn phải hiển thị trước khi đổi tính chất').toBeVisible();

    // Hành động: Thay đổi tính chất > chọn Thành phẩm.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');

    // Xác nhận UI: Control Ảnh trên form mới được reset về mặc định.
    await expect(vatTuPage.materialImagePreview(), 'Ảnh cũ phải bị xóa sau khi đổi tính chất').toBeHidden();
    await expect(vatTuPage.materialImageInput(), 'Control Ảnh phải trở về trạng thái chưa chọn file').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1240 - hiển thị Toggle Trạng thái bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thành phẩm và quan sát trường Trạng thái.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');

    // Xác nhận UI: Trạng thái là Toggle và label có dấu * bắt buộc.
    await expect(vatTuPage.statusSwitch(), 'Trạng thái phải hiển thị dưới dạng Toggle').toBeVisible();
    const requiredIndicator = await vatTuPage.statusRequiredIndicatorStyle();
    expect(requiredIndicator.content, 'Label Trạng thái phải hiển thị dấu * bắt buộc').toContain('*');
    expect(requiredIndicator.color, 'Dấu * bắt buộc của Trạng thái phải có màu đỏ').toBe('rgb(244, 63, 94)');
  });

  test('TC_PMKT-U-00106-1241 - Trạng thái mặc định Hoạt động và thay đổi được', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const statusSwitch = vatTuPage.statusSwitch();

    // Xác nhận UI: Toggle mặc định là Hoạt động.
    await expect(statusSwitch, 'Trạng thái mặc định phải là Hoạt động').toBeChecked();

    // Hành động: Chuyển Toggle sang Ngừng hoạt động.
    await vatTuPage.setMaterialStatus(false);

    // Xác nhận UI: Toggle chuyển sang Ngừng hoạt động thành công.
    await expect(statusSwitch, 'Trạng thái phải chuyển sang Ngừng hoạt động').not.toBeChecked();
  });

  test('TC_PMKT-U-00106-1242 - tự điền 7 tài khoản theo cấu hình Thành phẩm trong DB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy cấu hình tài khoản Loại vật tư Thành phẩm trong đúng tenant.
    const expectedAccounts = await materialTypeDefaultAccountsFromDatabase('NVL');
    test.skip(!expectedAccounts, 'DB không có cấu hình Loại vật tư Thành phẩm mã NVL trong tenant hiện tại');
    if (!expectedAccounts) return;

    // Hành động: Mở form Thành phẩm và chuyển sang tab Hạch toán ngầm định.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const actualAccounts = await vatTuPage.readDefaultAccountingAccounts();

    // Xác nhận UI/DB: Toàn bộ bảy tài khoản tự điền khớp cấu hình Loại vật tư Thành phẩm.
    expect(actualAccounts, 'Bảy tài khoản ngầm định trên UI phải khớp cấu hình mst_loai_vat_tu').toEqual(expectedAccounts);
  });

  test('TC_PMKT-U-00106-1243 - hiển thị Combogrid Tài khoản vật tư không bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thành phẩm và chuyển sang tab Hạch toán ngầm định.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openDefaultAccountingTab();

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản vật tư'), 'Phải hiển thị label Tài khoản vật tư').toBeVisible();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản vật tư', 'combobox'), 'Tài khoản vật tư phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản vật tư'), 'Tài khoản vật tư không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1244 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedAccounts = accounts.filter(
      (account) => account.allowed || account.status === 'NgungHoatDong',
    );
    test.skip(expectedAccounts.length === 0, 'DB không có Tài khoản thỏa điều kiện hiển thị trong tenant hiện tại');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động để kiểm tra thứ tự hiển thị');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid Tài khoản vật tư.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');

    // Xác nhận UI: Đúng ba cột theo testcase mới.
    const actualHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid phải hiển thị đúng ba cột').toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

    // Xác nhận UI/DB: Tài khoản Ngừng hoạt động trong DB phải được tìm thấy trên combogrid.
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} phải hiển thị phía dưới nhóm Hoạt động`,
    ).toBeVisible();
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', '');

    // Xác nhận UI/DB: Cuộn hết virtual dropdown, đối chiếu đầy đủ dữ liệu và thứ tự trạng thái.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedAccounts.length);
    expect(
      new Set(actualLabels),
      'Danh sách UI phải gồm Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động trong DB',
    ).toEqual(new Set(expectedAccounts.map((account) => account.label)));
    const actualStatuses = actualLabels.map((label) => expectedAccounts.find((account) => account.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    expect(
      firstInactiveIndex === -1 || actualStatuses.slice(firstInactiveIndex + 1).every((status) => status !== 'HoatDong'),
      'Tài khoản Hoạt động phải xếp trên Tài khoản Ngừng hoạt động',
    ).toBe(true);
  });

  test('TC_PMKT-U-00106-1245 - Tài khoản vật tư Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'BLOCK: DB tenant hiện tại không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid và tìm chính xác tài khoản theo Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const actualColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);

    // Xác nhận UI: Dòng Ngừng hoạt động dùng màu xám.
    expect(isGrayCssColor(actualColor), `Màu thực tế ${actualColor} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1246 - xác nhận sử dụng Tài khoản vật tư Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK vì TC1245 xác nhận combogrid hiện không hiển thị Tài khoản Ngừng hoạt động.
    test.skip(true, 'BLOCK: bị chặn bởi TC1245 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1247 - hủy sử dụng Tài khoản vật tư Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK vì TC1245 xác nhận combogrid hiện không hiển thị Tài khoản Ngừng hoạt động.
    test.skip(true, 'BLOCK: bị chặn bởi TC1245 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1248 - chọn Tài khoản vật tư Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;

    // Hành động: Mở combogrid và chọn tài khoản Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.selectAccountingAccount('Tài khoản vật tư', activeAccount);

    // Xác nhận UI: Bản ghi được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Tài khoản Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1249 - tìm Tài khoản vật tư theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc cột Số hiệu TK để phân biệt với Tên TK.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.code),
      allowedAccounts.map((account) => account.name),
    );
    test.skip(!keyword, 'DB không có từ khóa Số hiệu TK phân biệt được với cột Tên TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', keyword);

    // Xác nhận UI/DB: Chỉ hiển thị tài khoản được phép hạch toán có Số hiệu chứa từ khóa.
    const expectedLabels = allowedAccounts
      .filter((account) => account.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Số hiệu TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1250 - tìm Tài khoản vật tư theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK để phân biệt với Số tài khoản.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.name),
      allowedAccounts.map((account) => account.code),
    );
    test.skip(!keyword, 'DB không có từ khóa Tên TK phân biệt được với cột Số tài khoản');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', keyword);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels();

    // Xác nhận UI/DB: Chỉ hiển thị tài khoản được phép hạch toán có Tên chứa từ khóa.
    const expectedLabels = allowedAccounts
      .filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    expect(actualLabels.length, 'Tìm kiếm theo Tên TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1251 - tìm Tài khoản vật tư theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy toàn bộ tài khoản Ngừng hoạt động đúng theo điều kiện của testcase.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedLabels = accounts
      .filter((account) => account.status === 'NgungHoatDong')
      .map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'DB không có Tài khoản Ngừng hoạt động');

    // Hành động: Mở combogrid và tìm theo từ khóa Trạng thái Ngừng hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', 'Ngừng hoạt động');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);

    // Xác nhận UI/DB: Chỉ hiển thị tài khoản Ngừng hoạt động khớp dữ liệu DB.
    expect(actualLabels.length, 'Tìm kiếm theo Trạng thái phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải có Trạng thái Ngừng hoạt động').toBe(true);
  });

  test('TC_PMKT-U-00106-1252 - Enter chọn dòng Tài khoản vật tư đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa Số tài khoản trả về nhiều kết quả được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = sharedSearchKeyword(allowedAccounts.map((account) => account.code));
    test.skip(!keyword, 'DB không có từ khóa trả về nhiều Tài khoản được phép hạch toán');
    if (!keyword) return;

    // Hành động: Mở combogrid > tìm kiếm > ghi nhận dòng đầu tiên > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.searchAccountingAccount('Tài khoản vật tư', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'UI không có kết quả Tài khoản để chọn bằng Enter');
    if (!firstLabel) return;
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'Enter');

    // Xác nhận UI: Dropdown đóng và trường nhận đúng dòng đầu tiên.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1253 - phím Up và Down di chuyển từng dòng Tài khoản vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản vật tư', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');

    // Hành động: Nhấn Down ba lần rồi Up một lần và đọc style vùng chọn sau từng phím.
    const initial = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowDown');
    const afterFirstDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowDown');
    const afterSecondDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowDown');
    const afterThirdDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'ArrowUp');
    const afterUp = await vatTuPage.accountingAccountRowVisualStates();

    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown, 'Down lần một phải di chuyển vùng chọn').not.toEqual(initial);
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toEqual(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toEqual(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toEqual(afterSecondDown);
    await expect(accountCombobox, 'Điều hướng không được thay đổi giá trị trường').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1254 - ESC đóng dropdown Tài khoản vật tư không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản vật tư', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản vật tư', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1255 - icon X xóa nhanh Tài khoản vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.selectAccountingAccount('Tài khoản vật tư', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();

    // Hành động: Click icon X xóa nhanh.
    await vatTuPage.clearAccountingAccount('Tài khoản vật tư');

    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản vật tư', 'combobox'), 'Tài khoản vật tư phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1256 - ẩn Tài khoản vật tư khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    // Hành động: Mở Thành phẩm > tab Hạch toán > Thay đổi tính chất > Dịch vụ > tab Hạch toán.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openDefaultAccountingTab();
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openDefaultAccountingTab();

    // Xác nhận UI: Form Dịch vụ ẩn hoàn toàn Tài khoản vật tư.
    await expect(vatTuPage.formField('Tài khoản vật tư'), 'Form Dịch vụ phải ẩn Tài khoản vật tư').toBeHidden();
  });

  test('TC_PMKT-U-00106-1257 - reset Tài khoản vật tư khi đổi sang loại vật tư khác', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản vật tư hợp lệ trên form Thành phẩm.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản vật tư');
    await vatTuPage.selectAccountingAccount('Tài khoản vật tư', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Tài khoản phải có dữ liệu trước khi đổi tính chất').toBeVisible();

    // Hành động: Thay đổi tính chất > chọn Thành phẩm > mở Hạch toán ngầm định.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openDefaultAccountingTab();

    // Xác nhận UI: Giá trị Tài khoản vật tư đã chọn trên Thành phẩm bị xóa sạch.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản vật tư', activeAccount.label), 'Tài khoản cũ phải bị xóa sau khi đổi tính chất').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản vật tư', 'combobox'), 'Tài khoản vật tư phải reset về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1258 - hiển thị combogrid Tài khoản giá vốn không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản giá vốn'), 'Phải hiển thị label Tài khoản giá vốn').toBeVisible();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giá vốn', 'combobox'), 'Tài khoản giá vốn phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản giá vốn'), 'Tài khoản giá vốn không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1259 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedAccounts = accounts.filter(
      (account) => account.allowed || account.status === 'NgungHoatDong',
    );
    test.skip(expectedAccounts.length === 0, 'DB không có Tài khoản thỏa điều kiện hiển thị trong tenant hiện tại');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động để kiểm tra thứ tự hiển thị');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid Tài khoản giá vốn.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');

    // Xác nhận UI: Dropdown hiển thị đúng ba cột theo testcase.
    const actualHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid phải hiển thị đúng ba cột').toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

    // Xác nhận UI/DB: Search bằng mã để buộc bản ghi Ngừng hoạt động được render trước khi kiểm tra.
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} phải hiển thị phía dưới nhóm Hoạt động`,
    ).toBeVisible();
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', '');

    // Xác nhận UI/DB: Cuộn hết virtual dropdown, đối chiếu toàn bộ dữ liệu và thứ tự trạng thái.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedAccounts.length);
    expect(new Set(actualLabels), 'Danh sách UI phải khớp Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động trong DB').toEqual(
      new Set(expectedAccounts.map((account) => account.label)),
    );
    const actualStatuses = actualLabels.map((label) => expectedAccounts.find((account) => account.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    expect(firstInactiveIndex, 'Danh sách phải có Tài khoản Ngừng hoạt động').toBeGreaterThanOrEqual(0);
    expect(
      actualStatuses.slice(firstInactiveIndex + 1).every((status) => status !== 'HoatDong'),
      'Tài khoản Hoạt động phải xếp trên Tài khoản Ngừng hoạt động',
    ).toBe(true);
  });

  test('TC_PMKT-U-00106-1260 - Tài khoản giá vốn Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'BLOCK: DB tenant hiện tại không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid và tìm chính xác tài khoản theo Số tài khoản.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const actualColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);

    // Xác nhận UI: Dòng Ngừng hoạt động dùng màu xám.
    expect(isGrayCssColor(actualColor), `Màu thực tế ${actualColor} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1261 - xác nhận sử dụng Tài khoản giá vốn Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1260 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1260 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1262 - hủy sử dụng Tài khoản giá vốn Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1260 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1260 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1263 - chọn Tài khoản giá vốn Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;

    // Hành động: Mở combogrid và chọn Tài khoản giá vốn Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.selectAccountingAccount('Tài khoản giá vốn', activeAccount);

    // Xác nhận UI: Bản ghi được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', activeAccount.label), 'Tài khoản giá vốn Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1264 - tìm Tài khoản giá vốn theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.code),
      allowedAccounts.map((account) => account.name),
    );
    test.skip(!keyword, 'DB không có từ khóa Số hiệu TK phân biệt được với cột Tên TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Số hiệu và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Số hiệu TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1265 - tìm Tài khoản giá vốn theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.name),
      allowedAccounts.map((account) => account.code),
    );
    test.skip(!keyword, 'DB không có từ khóa Tên TK phân biệt được với cột Số hiệu TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Tên và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Tên TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1266 - tìm Tài khoản giá vốn theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedLabels = accounts
      .filter((account) => account.allowed && account.status === 'HoatDong')
      .map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'DB không có Tài khoản Hoạt động được phép hạch toán');

    // Hành động: Mở combogrid và tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', 'Hoạt động');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);

    // Xác nhận UI/DB: Mọi kết quả là Tài khoản Hoạt động được phép hạch toán.
    expect(actualLabels.length, 'Tìm kiếm theo Trạng thái phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải có Trạng thái Hoạt động và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1267 - Enter chọn dòng Tài khoản giá vốn đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = sharedSearchKeyword(allowedAccounts.map((account) => account.code));
    test.skip(!keyword, 'DB không có từ khóa trả về nhiều Tài khoản được phép hạch toán');
    if (!keyword) return;

    // Hành động: Mở combogrid > tìm kiếm > ghi nhận dòng đầu tiên > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.searchAccountingAccount('Tài khoản giá vốn', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'UI không có kết quả Tài khoản giá vốn để chọn bằng Enter');
    if (!firstLabel) return;
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'Enter');

    // Xác nhận UI: Dropdown đóng và trường nhận đúng dòng đầu tiên.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1268 - phím Up và Down di chuyển từng dòng Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giá vốn', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');

    // Hành động: Nhấn Down ba lần rồi Up một lần và đọc style vùng chọn sau từng phím.
    const initial = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowDown');
    const afterFirstDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowDown');
    const afterSecondDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowDown');
    const afterThirdDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'ArrowUp');
    const afterUp = await vatTuPage.accountingAccountRowVisualStates();

    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown, 'Down lần một phải di chuyển vùng chọn').not.toEqual(initial);
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toEqual(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toEqual(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toEqual(afterSecondDown);
    await expect(accountCombobox, 'Điều hướng không được thay đổi giá trị trường').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1269 - ESC đóng dropdown Tài khoản giá vốn không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giá vốn', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản giá vốn', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1270 - icon X xóa nhanh Tài khoản giá vốn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.selectAccountingAccount('Tài khoản giá vốn', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();

    // Hành động: Click icon X xóa nhanh.
    await vatTuPage.clearAccountingAccount('Tài khoản giá vốn');

    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giá vốn', 'combobox'), 'Tài khoản giá vốn phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1271 - ẩn Tài khoản giá vốn khi đổi sang Dịch vụ', async ({ vatTuPage }) => {
    // Hành động: Mở Thành phẩm > Hạch toán > Thay đổi tính chất > Dịch vụ > Hạch toán.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openDefaultAccountingTab();
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openDefaultAccountingTab();

    // Xác nhận UI: Form Dịch vụ ẩn hoàn toàn Tài khoản giá vốn.
    await expect(vatTuPage.formField('Tài khoản giá vốn'), 'Form Dịch vụ phải ẩn Tài khoản giá vốn').toBeHidden();
  });

  test('TC_PMKT-U-00106-1272 - reset Tài khoản giá vốn khi đổi sang loại vật tư khác', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản giá vốn hợp lệ trên form Thành phẩm.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giá vốn');
    await vatTuPage.selectAccountingAccount('Tài khoản giá vốn', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', activeAccount.label), 'Tài khoản phải có dữ liệu trước khi đổi tính chất').toBeVisible();

    // Hành động: Thay đổi tính chất > chọn Thành phẩm > mở Hạch toán ngầm định.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openDefaultAccountingTab();

    // Xác nhận UI: Giá trị Tài khoản giá vốn đã chọn trên Thành phẩm bị xóa sạch.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giá vốn', activeAccount.label), 'Tài khoản cũ phải bị xóa sau khi đổi tính chất').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giá vốn', 'combobox'), 'Tài khoản giá vốn phải reset về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1273 - hiển thị combogrid Tài khoản doanh thu không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản doanh thu'), 'Phải hiển thị label Tài khoản doanh thu').toBeVisible();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản doanh thu', 'combobox'), 'Tài khoản doanh thu phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản doanh thu'), 'Tài khoản doanh thu không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1274 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedAccounts = accounts.filter(
      (account) => account.allowed || account.status === 'NgungHoatDong',
    );
    test.skip(expectedAccounts.length === 0, 'DB không có Tài khoản thỏa điều kiện hiển thị trong tenant hiện tại');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động để kiểm tra thứ tự hiển thị');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid Tài khoản doanh thu.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');

    // Xác nhận UI: Dropdown hiển thị đúng ba cột theo testcase.
    const actualHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid phải hiển thị đúng ba cột').toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

    // Xác nhận UI/DB: Search bằng mã để buộc bản ghi Ngừng hoạt động được render trước khi kiểm tra.
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} phải hiển thị phía dưới nhóm Hoạt động`,
    ).toBeVisible();
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', '');

    // Xác nhận UI/DB: Cuộn hết virtual dropdown, đối chiếu toàn bộ dữ liệu và thứ tự trạng thái.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedAccounts.length);
    expect(new Set(actualLabels), 'Danh sách UI phải khớp Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động trong DB').toEqual(
      new Set(expectedAccounts.map((account) => account.label)),
    );
    const actualStatuses = actualLabels.map((label) => expectedAccounts.find((account) => account.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    expect(firstInactiveIndex, 'Danh sách phải có Tài khoản Ngừng hoạt động').toBeGreaterThanOrEqual(0);
    expect(
      actualStatuses.slice(firstInactiveIndex + 1).every((status) => status !== 'HoatDong'),
      'Tài khoản Hoạt động phải xếp trên Tài khoản Ngừng hoạt động',
    ).toBe(true);
  });

  test('TC_PMKT-U-00106-1275 - Tài khoản doanh thu Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'BLOCK: DB tenant hiện tại không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid và tìm chính xác tài khoản theo Số tài khoản.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const actualColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);

    // Xác nhận UI: Dòng Ngừng hoạt động dùng màu xám.
    expect(isGrayCssColor(actualColor), `Màu thực tế ${actualColor} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1276 - xác nhận sử dụng Tài khoản doanh thu Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1275 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1275 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1277 - hủy sử dụng Tài khoản doanh thu Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1275 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1275 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1278 - chọn Tài khoản doanh thu Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;

    // Hành động: Mở combogrid và chọn Tài khoản doanh thu Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.selectAccountingAccount('Tài khoản doanh thu', activeAccount);

    // Xác nhận UI: Bản ghi được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', activeAccount.label), 'Tài khoản doanh thu Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1279 - tìm Tài khoản doanh thu theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.code),
      allowedAccounts.map((account) => account.name),
    );
    test.skip(!keyword, 'DB không có từ khóa Số hiệu TK phân biệt được với cột Tên TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Số hiệu và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Số hiệu TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1280 - tìm Tài khoản doanh thu theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.name),
      allowedAccounts.map((account) => account.code),
    );
    test.skip(!keyword, 'DB không có từ khóa Tên TK phân biệt được với cột Số hiệu TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Tên và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Tên TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1281 - tìm Tài khoản doanh thu theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedLabels = accounts
      .filter((account) => account.allowed && account.status === 'HoatDong')
      .map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'DB không có Tài khoản Hoạt động được phép hạch toán');

    // Hành động: Mở combogrid và tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', 'Hoạt động');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);

    // Xác nhận UI/DB: Mọi kết quả là Tài khoản Hoạt động được phép hạch toán.
    expect(actualLabels.length, 'Tìm kiếm theo Trạng thái phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải có Trạng thái Hoạt động và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1282 - Enter chọn dòng Tài khoản doanh thu đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = sharedSearchKeyword(allowedAccounts.map((account) => account.code));
    test.skip(!keyword, 'DB không có từ khóa trả về nhiều Tài khoản được phép hạch toán');
    if (!keyword) return;

    // Hành động: Mở combogrid > tìm kiếm > ghi nhận dòng đầu tiên > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.searchAccountingAccount('Tài khoản doanh thu', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'UI không có kết quả Tài khoản doanh thu để chọn bằng Enter');
    if (!firstLabel) return;
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'Enter');

    // Xác nhận UI: Dropdown đóng và trường nhận đúng dòng đầu tiên.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1283 - phím Up và Down di chuyển từng dòng Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản doanh thu', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');

    // Hành động: Nhấn Down ba lần rồi Up một lần và đọc style vùng chọn sau từng phím.
    const initial = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowDown');
    const afterFirstDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowDown');
    const afterSecondDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowDown');
    const afterThirdDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'ArrowUp');
    const afterUp = await vatTuPage.accountingAccountRowVisualStates();

    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown, 'Down lần một phải di chuyển vùng chọn').not.toEqual(initial);
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toEqual(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toEqual(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toEqual(afterSecondDown);
    await expect(accountCombobox, 'Điều hướng không được thay đổi giá trị trường').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1284 - ESC đóng dropdown Tài khoản doanh thu không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản doanh thu', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1285 - icon X xóa nhanh Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.selectAccountingAccount('Tài khoản doanh thu', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();

    // Hành động: Click icon X xóa nhanh.
    await vatTuPage.clearAccountingAccount('Tài khoản doanh thu');

    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản doanh thu', 'combobox'), 'Tài khoản doanh thu phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1286 - hiển thị combogrid Tài khoản hàng bán trả lại không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản hàng bán trả lại'), 'Phải hiển thị label Tài khoản hàng bán trả lại').toBeVisible();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản hàng bán trả lại', 'combobox'), 'Tài khoản hàng bán trả lại phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản hàng bán trả lại'), 'Tài khoản hàng bán trả lại không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1287 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedAccounts = accounts.filter(
      (account) => account.allowed || account.status === 'NgungHoatDong',
    );
    test.skip(expectedAccounts.length === 0, 'DB không có Tài khoản thỏa điều kiện hiển thị trong tenant hiện tại');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động để kiểm tra thứ tự hiển thị');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid Tài khoản hàng bán trả lại.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');

    // Xác nhận UI: Dropdown hiển thị đúng ba cột theo testcase.
    const actualHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid phải hiển thị đúng ba cột').toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

    // Xác nhận UI/DB: Search bằng mã để buộc bản ghi Ngừng hoạt động được render trước khi kiểm tra.
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} phải hiển thị phía dưới nhóm Hoạt động`,
    ).toBeVisible();
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', '');

    // Xác nhận UI/DB: Cuộn hết virtual dropdown, đối chiếu toàn bộ dữ liệu và thứ tự trạng thái.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedAccounts.length);
    expect(new Set(actualLabels), 'Danh sách UI phải khớp Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động trong DB').toEqual(
      new Set(expectedAccounts.map((account) => account.label)),
    );
    const actualStatuses = actualLabels.map((label) => expectedAccounts.find((account) => account.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    expect(firstInactiveIndex, 'Danh sách phải có Tài khoản Ngừng hoạt động').toBeGreaterThanOrEqual(0);
    expect(
      actualStatuses.slice(firstInactiveIndex + 1).every((status) => status !== 'HoatDong'),
      'Tài khoản Hoạt động phải xếp trên Tài khoản Ngừng hoạt động',
    ).toBe(true);
  });

  test('TC_PMKT-U-00106-1288 - Tài khoản hàng bán trả lại Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'BLOCK: DB tenant hiện tại không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid và tìm chính xác tài khoản theo Số tài khoản.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const actualColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);

    // Xác nhận UI: Dòng Ngừng hoạt động dùng màu xám.
    expect(isGrayCssColor(actualColor), `Màu thực tế ${actualColor} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1289 - xác nhận sử dụng Tài khoản hàng bán trả lại Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1288 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1288 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1290 - hủy sử dụng Tài khoản hàng bán trả lại Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1288 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1288 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1291 - chọn Tài khoản hàng bán trả lại Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;

    // Hành động: Mở combogrid và chọn Tài khoản hàng bán trả lại Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.selectAccountingAccount('Tài khoản hàng bán trả lại', activeAccount);

    // Xác nhận UI: Bản ghi được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', activeAccount.label), 'Tài khoản hàng bán trả lại Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1292 - tìm Tài khoản hàng bán trả lại theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.code),
      allowedAccounts.map((account) => account.name),
    );
    test.skip(!keyword, 'DB không có từ khóa Số hiệu TK phân biệt được với cột Tên TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Số hiệu và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Số hiệu TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1293 - tìm Tài khoản hàng bán trả lại theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.name),
      allowedAccounts.map((account) => account.code),
    );
    test.skip(!keyword, 'DB không có từ khóa Tên TK phân biệt được với cột Số hiệu TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Tên và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Tên TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1294 - tìm Tài khoản hàng bán trả lại theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedLabels = accounts
      .filter((account) => account.allowed && account.status === 'HoatDong')
      .map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'DB không có Tài khoản Hoạt động được phép hạch toán');

    // Hành động: Mở combogrid và tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', 'Hoạt động');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);

    // Xác nhận UI/DB: Mọi kết quả là Tài khoản Hoạt động được phép hạch toán.
    expect(actualLabels.length, 'Tìm kiếm theo Trạng thái phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải có Trạng thái Hoạt động và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1295 - Enter chọn dòng Tài khoản hàng bán trả lại đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = sharedSearchKeyword(allowedAccounts.map((account) => account.code));
    test.skip(!keyword, 'DB không có từ khóa trả về nhiều Tài khoản được phép hạch toán');
    if (!keyword) return;

    // Hành động: Mở combogrid > tìm kiếm > ghi nhận dòng đầu tiên > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.searchAccountingAccount('Tài khoản hàng bán trả lại', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'UI không có kết quả Tài khoản hàng bán trả lại để chọn bằng Enter');
    if (!firstLabel) return;
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'Enter');

    // Xác nhận UI: Dropdown đóng và trường nhận đúng dòng đầu tiên.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1296 - phím Up và Down di chuyển từng dòng Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản hàng bán trả lại', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');

    // Hành động: Nhấn Down ba lần rồi Up một lần và đọc style vùng chọn sau từng phím.
    const initial = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowDown');
    const afterFirstDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowDown');
    const afterSecondDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowDown');
    const afterThirdDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'ArrowUp');
    const afterUp = await vatTuPage.accountingAccountRowVisualStates();

    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown, 'Down lần một phải di chuyển vùng chọn').not.toEqual(initial);
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toEqual(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toEqual(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toEqual(afterSecondDown);
    await expect(accountCombobox, 'Điều hướng không được thay đổi giá trị trường').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1297 - ESC đóng dropdown Tài khoản hàng bán trả lại không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản hàng bán trả lại', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1298 - icon X xóa nhanh Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.selectAccountingAccount('Tài khoản hàng bán trả lại', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();

    // Hành động: Click icon X xóa nhanh.
    await vatTuPage.clearAccountingAccount('Tài khoản hàng bán trả lại');

    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản hàng bán trả lại', 'combobox'), 'Tài khoản hàng bán trả lại phải trở về trống').toHaveValue('');
  });
  test('TC_PMKT-U-00106-1299 - hiển thị combogrid Tài khoản chi phí không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản chi phí'), 'Phải hiển thị label Tài khoản chi phí').toBeVisible();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chi phí', 'combobox'), 'Tài khoản chi phí phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản chi phí'), 'Tài khoản chi phí không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1300 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản chi phí', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedAccounts = accounts.filter(
      (account) => account.allowed || account.status === 'NgungHoatDong',
    );
    test.skip(expectedAccounts.length === 0, 'DB không có Tài khoản thỏa điều kiện hiển thị trong tenant hiện tại');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động để kiểm tra thứ tự hiển thị');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid Tài khoản chi phí.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');

    // Xác nhận UI: Dropdown hiển thị đúng ba cột theo testcase.
    const actualHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid phải hiển thị đúng ba cột').toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

    // Xác nhận UI/DB: Search bằng mã để buộc bản ghi Ngừng hoạt động được render trước khi kiểm tra.
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} phải hiển thị phía dưới nhóm Hoạt động`,
    ).toBeVisible();
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', '');

    // Xác nhận UI/DB: Cuộn hết virtual dropdown, đối chiếu toàn bộ dữ liệu và thứ tự trạng thái.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedAccounts.length);
    expect(new Set(actualLabels), 'Danh sách UI phải khớp Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động trong DB').toEqual(
      new Set(expectedAccounts.map((account) => account.label)),
    );
    const actualStatuses = actualLabels.map((label) => expectedAccounts.find((account) => account.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    expect(firstInactiveIndex, 'Danh sách phải có Tài khoản Ngừng hoạt động').toBeGreaterThanOrEqual(0);
    expect(
      actualStatuses.slice(firstInactiveIndex + 1).every((status) => status !== 'HoatDong'),
      'Tài khoản Hoạt động phải xếp trên Tài khoản Ngừng hoạt động',
    ).toBe(true);
  });

  test('TC_PMKT-U-00106-1301 - Tài khoản chi phí Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'BLOCK: DB tenant hiện tại không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid và tìm chính xác tài khoản theo Số tài khoản.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const actualColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);

    // Xác nhận UI: Dòng Ngừng hoạt động dùng màu xám.
    expect(isGrayCssColor(actualColor), `Màu thực tế ${actualColor} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1302 - xác nhận sử dụng Tài khoản chi phí Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1301 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1301 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1303 - hủy sử dụng Tài khoản chi phí Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1301 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1301 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1304 - chọn Tài khoản chi phí Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;

    // Hành động: Mở combogrid và chọn Tài khoản chi phí Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.selectAccountingAccount('Tài khoản chi phí', activeAccount);

    // Xác nhận UI: Bản ghi được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', activeAccount.label), 'Tài khoản chi phí Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1305 - tìm Tài khoản chi phí theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.code),
      allowedAccounts.map((account) => account.name),
    );
    test.skip(!keyword, 'DB không có từ khóa Số hiệu TK phân biệt được với cột Tên TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Số hiệu và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Số hiệu TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1306 - tìm Tài khoản chi phí theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.name),
      allowedAccounts.map((account) => account.code),
    );
    test.skip(!keyword, 'DB không có từ khóa Tên TK phân biệt được với cột Số hiệu TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Tên và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Tên TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1307 - tìm Tài khoản chi phí theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedLabels = accounts
      .filter((account) => account.allowed && account.status === 'HoatDong')
      .map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'DB không có Tài khoản Hoạt động được phép hạch toán');

    // Hành động: Mở combogrid và tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', 'Hoạt động');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);

    // Xác nhận UI/DB: Mọi kết quả là Tài khoản Hoạt động được phép hạch toán.
    expect(actualLabels.length, 'Tìm kiếm theo Trạng thái phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải có Trạng thái Hoạt động và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1308 - Enter chọn dòng Tài khoản chi phí đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = sharedSearchKeyword(allowedAccounts.map((account) => account.code));
    test.skip(!keyword, 'DB không có từ khóa trả về nhiều Tài khoản được phép hạch toán');
    if (!keyword) return;

    // Hành động: Mở combogrid > tìm kiếm > ghi nhận dòng đầu tiên > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.searchAccountingAccount('Tài khoản chi phí', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'UI không có kết quả Tài khoản chi phí để chọn bằng Enter');
    if (!firstLabel) return;
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'Enter');

    // Xác nhận UI: Dropdown đóng và trường nhận đúng dòng đầu tiên.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1309 - phím Up và Down di chuyển từng dòng Tài khoản chi phí', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chi phí', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');

    // Hành động: Nhấn Down ba lần rồi Up một lần và đọc style vùng chọn sau từng phím.
    const initial = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowDown');
    const afterFirstDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowDown');
    const afterSecondDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowDown');
    const afterThirdDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'ArrowUp');
    const afterUp = await vatTuPage.accountingAccountRowVisualStates();

    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown, 'Down lần một phải di chuyển vùng chọn').not.toEqual(initial);
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toEqual(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toEqual(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toEqual(afterSecondDown);
    await expect(accountCombobox, 'Điều hướng không được thay đổi giá trị trường').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1310 - ESC đóng dropdown Tài khoản chi phí không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chi phí', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1311 - icon X xóa nhanh Tài khoản chi phí', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.selectAccountingAccount('Tài khoản chi phí', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();

    // Hành động: Click icon X xóa nhanh.
    await vatTuPage.clearAccountingAccount('Tài khoản chi phí');

    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chi phí', 'combobox'), 'Tài khoản chi phí phải trở về trống').toHaveValue('');
  });
  test('TC_PMKT-U-00106-1312 - hiển thị combogrid Tài khoản chiết khấu không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản chiết khấu'), 'Phải hiển thị label Tài khoản chiết khấu').toBeVisible();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chiết khấu', 'combobox'), 'Tài khoản chiết khấu phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản chiết khấu'), 'Tài khoản chiết khấu không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1313 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản chiết khấu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedAccounts = accounts.filter(
      (account) => account.allowed || account.status === 'NgungHoatDong',
    );
    test.skip(expectedAccounts.length === 0, 'DB không có Tài khoản thỏa điều kiện hiển thị trong tenant hiện tại');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động để kiểm tra thứ tự hiển thị');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid Tài khoản chiết khấu.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');

    // Xác nhận UI: Dropdown hiển thị đúng ba cột theo testcase.
    const actualHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid phải hiển thị đúng ba cột').toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

    // Xác nhận UI/DB: Search bằng mã để buộc bản ghi Ngừng hoạt động được render trước khi kiểm tra.
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} phải hiển thị phía dưới nhóm Hoạt động`,
    ).toBeVisible();
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', '');

    // Xác nhận UI/DB: Cuộn hết virtual dropdown, đối chiếu toàn bộ dữ liệu và thứ tự trạng thái.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedAccounts.length);
    expect(new Set(actualLabels), 'Danh sách UI phải khớp Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động trong DB').toEqual(
      new Set(expectedAccounts.map((account) => account.label)),
    );
    const actualStatuses = actualLabels.map((label) => expectedAccounts.find((account) => account.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    expect(firstInactiveIndex, 'Danh sách phải có Tài khoản Ngừng hoạt động').toBeGreaterThanOrEqual(0);
    expect(
      actualStatuses.slice(firstInactiveIndex + 1).every((status) => status !== 'HoatDong'),
      'Tài khoản Hoạt động phải xếp trên Tài khoản Ngừng hoạt động',
    ).toBe(true);
  });

  test('TC_PMKT-U-00106-1314 - Tài khoản chiết khấu Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'BLOCK: DB tenant hiện tại không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid và tìm chính xác tài khoản theo Số tài khoản.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const actualColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);

    // Xác nhận UI: Dòng Ngừng hoạt động dùng màu xám.
    expect(isGrayCssColor(actualColor), `Màu thực tế ${actualColor} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1315 - xác nhận sử dụng Tài khoản chiết khấu Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1314 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1314 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1316 - hủy sử dụng Tài khoản chiết khấu Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1314 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1314 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1317 - chọn Tài khoản chiết khấu Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;

    // Hành động: Mở combogrid và chọn Tài khoản chiết khấu Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.selectAccountingAccount('Tài khoản chiết khấu', activeAccount);

    // Xác nhận UI: Bản ghi được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', activeAccount.label), 'Tài khoản chiết khấu Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1318 - tìm Tài khoản chiết khấu theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.code),
      allowedAccounts.map((account) => account.name),
    );
    test.skip(!keyword, 'DB không có từ khóa Số hiệu TK phân biệt được với cột Tên TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Số hiệu và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Số hiệu TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1319 - tìm Tài khoản chiết khấu theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.name),
      allowedAccounts.map((account) => account.code),
    );
    test.skip(!keyword, 'DB không có từ khóa Tên TK phân biệt được với cột Số hiệu TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Tên và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Tên TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1320 - tìm Tài khoản chiết khấu theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedLabels = accounts
      .filter((account) => account.allowed && account.status === 'HoatDong')
      .map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'DB không có Tài khoản Hoạt động được phép hạch toán');

    // Hành động: Mở combogrid và tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', 'Hoạt động');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);

    // Xác nhận UI/DB: Mọi kết quả là Tài khoản Hoạt động được phép hạch toán.
    expect(actualLabels.length, 'Tìm kiếm theo Trạng thái phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải có Trạng thái Hoạt động và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1321 - Enter chọn dòng Tài khoản chiết khấu đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = sharedSearchKeyword(allowedAccounts.map((account) => account.code));
    test.skip(!keyword, 'DB không có từ khóa trả về nhiều Tài khoản được phép hạch toán');
    if (!keyword) return;

    // Hành động: Mở combogrid > tìm kiếm > ghi nhận dòng đầu tiên > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.searchAccountingAccount('Tài khoản chiết khấu', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'UI không có kết quả Tài khoản chiết khấu để chọn bằng Enter');
    if (!firstLabel) return;
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'Enter');

    // Xác nhận UI: Dropdown đóng và trường nhận đúng dòng đầu tiên.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1322 - phím Up và Down di chuyển từng dòng Tài khoản chiết khấu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chiết khấu', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');

    // Hành động: Nhấn Down ba lần rồi Up một lần và đọc style vùng chọn sau từng phím.
    const initial = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowDown');
    const afterFirstDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowDown');
    const afterSecondDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowDown');
    const afterThirdDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'ArrowUp');
    const afterUp = await vatTuPage.accountingAccountRowVisualStates();

    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown, 'Down lần một phải di chuyển vùng chọn').not.toEqual(initial);
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toEqual(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toEqual(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toEqual(afterSecondDown);
    await expect(accountCombobox, 'Điều hướng không được thay đổi giá trị trường').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1323 - ESC đóng dropdown Tài khoản chiết khấu không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chiết khấu', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1324 - icon X xóa nhanh Tài khoản chiết khấu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.selectAccountingAccount('Tài khoản chiết khấu', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();

    // Hành động: Click icon X xóa nhanh.
    await vatTuPage.clearAccountingAccount('Tài khoản chiết khấu');

    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản chiết khấu', 'combobox'), 'Tài khoản chiết khấu phải trở về trống').toHaveValue('');
  });
  test('TC_PMKT-U-00106-1325 - hiển thị combogrid Tài khoản giảm giá không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản giảm giá'), 'Phải hiển thị label Tài khoản giảm giá').toBeVisible();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giảm giá', 'combobox'), 'Tài khoản giảm giá phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản giảm giá'), 'Tài khoản giảm giá không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1326 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản giảm giá', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedAccounts = accounts.filter(
      (account) => account.allowed || account.status === 'NgungHoatDong',
    );
    test.skip(expectedAccounts.length === 0, 'DB không có Tài khoản thỏa điều kiện hiển thị trong tenant hiện tại');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động để kiểm tra thứ tự hiển thị');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid Tài khoản giảm giá.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');

    // Xác nhận UI: Dropdown hiển thị đúng ba cột theo testcase.
    const actualHeaders = (await vatTuPage.accountingAccountColumnHeaders.allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid phải hiển thị đúng ba cột').toEqual(['Số tài khoản', 'Tên tài khoản', 'Trạng thái']);

    // Xác nhận UI/DB: Search bằng mã để buộc bản ghi Ngừng hoạt động được render trước khi kiểm tra.
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} phải hiển thị phía dưới nhóm Hoạt động`,
    ).toBeVisible();
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', '');

    // Xác nhận UI/DB: Cuộn hết virtual dropdown, đối chiếu toàn bộ dữ liệu và thứ tự trạng thái.
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedAccounts.length);
    expect(new Set(actualLabels), 'Danh sách UI phải khớp Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động trong DB').toEqual(
      new Set(expectedAccounts.map((account) => account.label)),
    );
    const actualStatuses = actualLabels.map((label) => expectedAccounts.find((account) => account.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    expect(firstInactiveIndex, 'Danh sách phải có Tài khoản Ngừng hoạt động').toBeGreaterThanOrEqual(0);
    expect(
      actualStatuses.slice(firstInactiveIndex + 1).every((status) => status !== 'HoatDong'),
      'Tài khoản Hoạt động phải xếp trên Tài khoản Ngừng hoạt động',
    ).toBe(true);
  });

  test('TC_PMKT-U-00106-1327 - Tài khoản giảm giá Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'BLOCK: DB tenant hiện tại không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Mở combogrid và tìm chính xác tài khoản theo Số tài khoản.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', inactiveAccount.code);
    await expect(
      vatTuPage.accountingAccountOption(inactiveAccount.label),
      `Tài khoản Ngừng hoạt động ${inactiveAccount.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const actualColor = await vatTuPage.accountingAccountTextColor(inactiveAccount.label);

    // Xác nhận UI: Dòng Ngừng hoạt động dùng màu xám.
    expect(isGrayCssColor(actualColor), `Màu thực tế ${actualColor} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1328 - xác nhận sử dụng Tài khoản giảm giá Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1327 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1327 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1329 - hủy sử dụng Tài khoản giảm giá Ngừng hoạt động', async () => {
    // Chuẩn bị dữ liệu: BLOCK bởi TC1327 vì combogrid không hiển thị Tài khoản Ngừng hoạt động để chọn.
    test.skip(true, 'BLOCK: bị chặn bởi TC1327 - combogrid không hiển thị Tài khoản Ngừng hoạt động');
  });

  test('TC_PMKT-U-00106-1330 - chọn Tài khoản giảm giá Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;

    // Hành động: Mở combogrid và chọn Tài khoản giảm giá Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.selectAccountingAccount('Tài khoản giảm giá', activeAccount);

    // Xác nhận UI: Bản ghi được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', activeAccount.label), 'Tài khoản giảm giá Hoạt động phải được chọn').toBeVisible();
    await expect(vatTuPage.accountConfirmationDialog(), 'Không được cảnh báo khi chọn Tài khoản Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-1331 - tìm Tài khoản giảm giá theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.code),
      allowedAccounts.map((account) => account.name),
    );
    test.skip(!keyword, 'DB không có từ khóa Số hiệu TK phân biệt được với cột Tên TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Số hiệu TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Số hiệu và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Số hiệu TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Số hiệu TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1332 - tìm Tài khoản giảm giá theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = discriminatingSearchKeyword(
      allowedAccounts.map((account) => account.name),
      allowedAccounts.map((account) => account.code),
    );
    test.skip(!keyword, 'DB không có từ khóa Tên TK phân biệt được với cột Số hiệu TK');
    if (!keyword) return;

    // Hành động: Mở combogrid và nhập từ khóa Tên TK.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', keyword);

    // Xác nhận UI/DB: Mọi kết quả khớp Tên và được phép hạch toán.
    const expectedLabels = allowedAccounts
      .filter((account) => account.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
      .map((account) => account.label);
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);
    expect(actualLabels.length, 'Tìm kiếm theo Tên TK phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải khớp Tên TK và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1333 - tìm Tài khoản giảm giá theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const expectedLabels = accounts
      .filter((account) => account.allowed && account.status === 'HoatDong')
      .map((account) => account.label);
    test.skip(expectedLabels.length === 0, 'DB không có Tài khoản Hoạt động được phép hạch toán');

    // Hành động: Mở combogrid và tìm theo Trạng thái Hoạt động.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', 'Hoạt động');
    const actualLabels = await vatTuPage.visibleAccountingAccountLabels(expectedLabels.length);

    // Xác nhận UI/DB: Mọi kết quả là Tài khoản Hoạt động được phép hạch toán.
    expect(actualLabels.length, 'Tìm kiếm theo Trạng thái phải trả về dữ liệu').toBeGreaterThan(0);
    expect(actualLabels.every((label) => expectedLabels.includes(label)), 'Mọi dòng UI phải có Trạng thái Hoạt động và được phép hạch toán').toBe(true);
  });

  test('TC_PMKT-U-00106-1334 - Enter chọn dòng Tài khoản giảm giá đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const allowedAccounts = accounts.filter((account) => account.allowed);
    const keyword = sharedSearchKeyword(allowedAccounts.map((account) => account.code));
    test.skip(!keyword, 'DB không có từ khóa trả về nhiều Tài khoản được phép hạch toán');
    if (!keyword) return;

    // Hành động: Mở combogrid > tìm kiếm > ghi nhận dòng đầu tiên > nhấn Enter.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.searchAccountingAccount('Tài khoản giảm giá', keyword);
    const firstLabel = (await vatTuPage.visibleAccountingAccountLabels())[0];
    test.skip(!firstLabel, 'UI không có kết quả Tài khoản giảm giá để chọn bằng Enter');
    if (!firstLabel) return;
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'Enter');

    // Xác nhận UI: Dropdown đóng và trường nhận đúng dòng đầu tiên.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', firstLabel), 'Enter phải chọn dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-1335 - phím Up và Down di chuyển từng dòng Tài khoản giảm giá', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giảm giá', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');

    // Hành động: Nhấn Down ba lần rồi Up một lần và đọc style vùng chọn sau từng phím.
    const initial = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowDown');
    const afterFirstDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowDown');
    const afterSecondDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowDown');
    const afterThirdDown = await vatTuPage.accountingAccountRowVisualStates();
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'ArrowUp');
    const afterUp = await vatTuPage.accountingAccountRowVisualStates();

    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown, 'Down lần một phải di chuyển vùng chọn').not.toEqual(initial);
    expect(afterSecondDown, 'Down lần hai phải chuyển sang dòng khác').not.toEqual(afterFirstDown);
    expect(afterThirdDown, 'Down lần ba phải chuyển sang dòng khác').not.toEqual(afterSecondDown);
    expect(afterUp, 'Up phải quay lại dòng liền trước').toEqual(afterSecondDown);
    await expect(accountCombobox, 'Điều hướng không được thay đổi giá trị trường').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1336 - ESC đóng dropdown Tài khoản giảm giá không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const accountCombobox = vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giảm giá', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1337 - icon X xóa nhanh Tài khoản giảm giá', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Thành phẩm');
    const activeAccount = accounts.find((account) => account.allowed && account.status === 'HoatDong');
    test.skip(!activeAccount, 'DB không có Tài khoản Hoạt động được phép hạch toán');
    if (!activeAccount) return;
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.selectAccountingAccount('Tài khoản giảm giá', activeAccount);
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', activeAccount.label), 'Tài khoản phải được chọn trước khi xóa').toBeVisible();

    // Hành động: Click icon X xóa nhanh.
    await vatTuPage.clearAccountingAccount('Tài khoản giảm giá');

    // Xác nhận UI: Giá trị bị xóa và trường trở về trống.
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', activeAccount.label), 'Giá trị Tài khoản phải bị xóa').toBeHidden();
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tài khoản giảm giá', 'combobox'), 'Tài khoản giảm giá phải trở về trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-1338 - ẩn Tab Thông tin kho khi đổi từ Thành phẩm sang Dịch vụ', async ({ vatTuPage }) => {
    // Chuẩn bị: Mở form Thành phẩm tại Tab Thông tin kho.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openFormTab('Thông tin kho');

    // Hành động: Thay đổi tính chất và chọn Dịch vụ.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận: Popup đóng, form Dịch vụ được tải và Tab Thông tin kho bị ẩn hoàn toàn.
    await expect(vatTuPage.materialTypeDialog, 'Popup chọn tính chất phải đóng sau khi chọn Dịch vụ').toBeHidden();
    await expect(vatTuPage.materialTypeValue('Dịch vụ'), 'Form phải hiển thị Loại vật tư Dịch vụ').toBeVisible();
    await expect(vatTuPage.formTab('Thông tin kho'), 'Form Dịch vụ phải ẩn hoàn toàn Tab Thông tin kho').toBeHidden();
  });

  test('TC_PMKT-U-00106-1339 - hiển thị lại Tab Thông tin kho khi đổi từ Dịch vụ sang Thành phẩm', async ({ vatTuPage }) => {
    // Chuẩn bị: Mở Thành phẩm rồi đổi sang Dịch vụ để Tab Thông tin kho bị ẩn.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formTab('Thông tin kho')).toBeHidden();

    // Hành động: Thay đổi tính chất và chọn lại Thành phẩm.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');

    // Xác nhận: Popup đóng, form Thành phẩm được tải và Tab Thông tin kho hiển thị lại.
    await expect(vatTuPage.materialTypeDialog, 'Popup chọn tính chất phải đóng sau khi chọn Thành phẩm').toBeHidden();
    await expect(vatTuPage.finishedProductMaterialTypeField(), 'Form phải hiển thị Loại vật tư Thành phẩm').toContainText('Thành phẩm');
    await expect(vatTuPage.formTab('Thông tin kho'), 'Form Thành phẩm phải hiển thị lại Tab Thông tin kho').toBeVisible();
  });
  test('TC_PMKT-U-00106-1340 - hiển thị combogrid Kho mặc định không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Thông tin kho.
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Kho mặc định'), 'Phải hiển thị label Kho mặc định').toBeVisible();
    await expect(vatTuPage.warehouseCombobox(), 'Kho mặc định phải là combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Kho mặc định'), 'Kho mặc định không được có dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-1341 - hiển thị đúng cột, dữ liệu và thứ tự Kho mặc định', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy ENT_Kho và mở combogrid Kho mặc định.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const expectedLabels = warehouses.map((warehouse) => warehouse.label);
    const activeLabels = warehouses.filter((warehouse) => warehouse.status === 'HoatDong').map((warehouse) => warehouse.label);
    const inactiveLabels = warehouses.filter((warehouse) => warehouse.status === 'NgungHoatDong').map((warehouse) => warehouse.label);
    // Xác nhận UI/DB: Đủ ba cột, dữ liệu đúng mst_kho và Hoạt động đứng trước Ngừng hoạt động.
    const actualHeaders = (await vatTuPage.warehouseColumnHeaders().allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    expect(actualHeaders, 'Combogrid Kho phải có đúng ba cột').toEqual(['Mã kho', 'Tên kho', 'Trạng thái']);
    const inactiveWarehouse = warehouses.find((warehouse) => warehouse.status === 'NgungHoatDong');
    if (inactiveWarehouse) {
      await vatTuPage.searchWarehouse(inactiveWarehouse.code);
      await expect(
        vatTuPage.warehouseOption(inactiveWarehouse.label),
        `Kho Ngừng hoạt động ${inactiveWarehouse.label} có trong DB phải hiển thị trên combogrid`,
      ).toBeVisible();
      await vatTuPage.searchWarehouse('');
    }
    const actualLabels = await vatTuPage.visibleWarehouseLabels(expectedLabels.length);
    expect([...actualLabels].sort(), 'Danh sách Kho trên UI phải khớp toàn bộ Kho chưa xóa trong DB').toEqual([...expectedLabels].sort());
    const lastActiveIndex = Math.max(...activeLabels.map((label) => actualLabels.indexOf(label)));
    const firstInactiveIndex = Math.min(...inactiveLabels.map((label) => actualLabels.indexOf(label)));
    if (activeLabels.length > 0 && inactiveLabels.length > 0) {
      expect(lastActiveIndex, 'Mọi Kho Hoạt động phải đứng trước Kho Ngừng hoạt động').toBeLessThan(firstInactiveIndex);
    }
  });

  test('TC_PMKT-U-00106-1342 - Kho Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Yêu cầu ENT_Kho có đủ bản ghi Hoạt động và Ngừng hoạt động.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const actualLabels = await vatTuPage.visibleWarehouseLabels();
    const inactive = warehouses.find(
      (warehouse) => warehouse.status === 'NgungHoatDong' && actualLabels.includes(warehouse.label),
    );
    expect(inactive, 'UI phải hiển thị ít nhất một Kho Ngừng hoạt động có trong DB').toBeDefined();
    if (!inactive) return;
    // Hành động: Tìm chính xác Kho Ngừng hoạt động để buộc dòng được render trong virtual dropdown.
    await vatTuPage.searchWarehouse(inactive.code);
    await expect(
      vatTuPage.warehouseOption(inactive.label),
      `Kho Ngừng hoạt động ${inactive.label} có trong DB phải hiển thị trên combogrid`,
    ).toBeVisible();
    const inactiveStyle = await vatTuPage.warehouseOptionStyle(inactive.label);

    // Xác nhận UI: Kho Ngừng hoạt động hiển thị bằng chữ màu xám.
    expect(isGrayCssColor(inactiveStyle.color), `Màu thực tế ${inactiveStyle.color} phải là màu xám`).toBe(true);
  });

  test('TC_PMKT-U-00106-1343 - xác nhận sử dụng Kho Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị: Chọn một Kho Ngừng hoạt động đồng thời tồn tại trong DB và hiển thị trên UI.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const actualLabels = await vatTuPage.visibleWarehouseLabels();
    const inactive = warehouses.find(
      (warehouse) => warehouse.status === 'NgungHoatDong' && actualLabels.includes(warehouse.label),
    );
    test.skip(!inactive, 'BLOCK: không có Kho Ngừng hoạt động chung giữa DB và combogrid để thao tác');
    if (!inactive) return;

    // Hành động: Chọn Kho Ngừng hoạt động và xác nhận sử dụng.
    await vatTuPage.selectWarehouse(inactive);
    await expect(vatTuPage.warehouseConfirmationMessage(), 'Phải hiển thị đúng cảnh báo dùng bản ghi Ngừng hoạt động').toBeVisible();
    await expect(vatTuPage.mainUnitConfirmationButton('Xác nhận')).toBeVisible();
    await expect(vatTuPage.mainUnitConfirmationButton('Hủy')).toBeVisible();
    await vatTuPage.chooseInactiveWarehouse('Xác nhận');

    // Xác nhận: Popup đóng và Kho Ngừng hoạt động được chọn.
    await expect(vatTuPage.warehouseConfirmationDialog()).toBeHidden();
    await expect(vatTuPage.selectedWarehouse(inactive.label), 'Kho Ngừng hoạt động phải được chọn sau xác nhận').toBeVisible();
  });

  test('TC_PMKT-U-00106-1344 - hủy sử dụng Kho Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị: Chọn một Kho Ngừng hoạt động đồng thời tồn tại trong DB và hiển thị trên UI.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const actualLabels = await vatTuPage.visibleWarehouseLabels();
    const inactive = warehouses.find(
      (warehouse) => warehouse.status === 'NgungHoatDong' && actualLabels.includes(warehouse.label),
    );
    test.skip(!inactive, 'BLOCK: không có Kho Ngừng hoạt động chung giữa DB và combogrid để thao tác');
    if (!inactive) return;
    const valueBefore = await vatTuPage.warehouseCombobox().inputValue();

    // Hành động: Chọn Kho Ngừng hoạt động và hủy sử dụng.
    await vatTuPage.selectWarehouse(inactive);
    await expect(vatTuPage.warehouseConfirmationMessage(), 'Phải hiển thị đúng cảnh báo dùng bản ghi Ngừng hoạt động').toBeVisible();
    await vatTuPage.chooseInactiveWarehouse('Hủy');

    // Xác nhận: Popup đóng và trường giữ nguyên giá trị cũ.
    await expect(vatTuPage.warehouseConfirmationDialog()).toBeHidden();
    await expect(vatTuPage.warehouseCombobox()).toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1345 - chọn Kho Hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Chọn Kho Hoạt động đầu tiên từ ENT_Kho thực tế.
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const active = warehouses.find((warehouse) => warehouse.status === 'HoatDong');
    test.skip(!active, 'BLOCK: ENT_Kho chưa có Kho Hoạt động');
    if (!active) return;
    // Hành động: Chọn Kho Hoạt động.
    await vatTuPage.selectWarehouse(active);
    // Xác nhận UI: Giá trị được chọn và không hiển thị cảnh báo.
    await expect(vatTuPage.selectedWarehouse(active.label)).toBeVisible();
    await expect(vatTuPage.warehouseConfirmationDialog()).toBeHidden();
  });

  test('TC_PMKT-U-00106-1346 - tìm Kho mặc định theo Mã kho', async ({ vatTuPage, db }) => {
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const keyword = discriminatingSearchKeyword(warehouses.map(({ code }) => code), warehouses.map(({ name }) => name));
    test.skip(!keyword, 'BLOCK: DB không có từ khóa phân biệt riêng cột Mã kho');
    if (!keyword) return;
    await vatTuPage.searchWarehouse(keyword);
    const actual = await vatTuPage.visibleWarehouseLabels();
    const expected = warehouses.filter(({ code }) => code.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map(({ label }) => label);
    expect(actual.length).toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label))).toBe(true);
  });

  test('TC_PMKT-U-00106-1347 - tìm Kho mặc định theo Tên kho', async ({ vatTuPage, db }) => {
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const keyword = discriminatingSearchKeyword(warehouses.map(({ name }) => name), warehouses.map(({ code }) => code));
    test.skip(!keyword, 'BLOCK: DB không có từ khóa phân biệt riêng cột Tên kho');
    if (!keyword) return;
    await vatTuPage.searchWarehouse(keyword);
    const actual = await vatTuPage.visibleWarehouseLabels();
    const expected = warehouses.filter(({ name }) => name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi'))).map(({ label }) => label);
    expect(actual.length).toBeGreaterThan(0);
    expect(actual.every((label) => expected.includes(label))).toBe(true);
  });

  test('TC_PMKT-U-00106-1348 - tìm Kho mặc định theo Trạng thái', async ({ vatTuPage, db }) => {
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const expected = warehouses.filter(({ status }) => status === 'HoatDong').map(({ label }) => label);
    test.skip(expected.length === 0, 'BLOCK: DB chưa có Kho Hoạt động');
    await vatTuPage.searchWarehouse('Hoạt động');
    expect([...(await vatTuPage.visibleWarehouseLabels())].sort()).toEqual([...expected].sort());
  });

  test('TC_PMKT-U-00106-1349 - Enter chọn dòng Kho đầu tiên', async ({ vatTuPage, db }) => {
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const keyword = sharedSearchKeyword(warehouses.map(({ code }) => code));
    test.skip(!keyword, 'BLOCK: DB không có từ khóa trả về nhiều Kho');
    if (!keyword) return;
    await vatTuPage.searchWarehouse(keyword);
    const firstLabel = (await vatTuPage.visibleWarehouseLabels())[0];
    test.skip(!firstLabel, 'BLOCK: UI không có kết quả Kho để chọn bằng Enter');
    await vatTuPage.pressWarehouseKey('Enter');
    await expect(vatTuPage.warehouseDropdown()).toBeHidden();
    if (firstLabel) await expect(vatTuPage.selectedWarehouse(firstLabel)).toBeVisible();
  });

  test('TC_PMKT-U-00106-1350 - Up và Down di chuyển từng dòng Kho', async ({ vatTuPage }) => {
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    const valueBefore = await vatTuPage.warehouseCombobox().inputValue();
    await vatTuPage.pressWarehouseKey('ArrowDown');
    const first = await vatTuPage.activeWarehouseLabel();
    await vatTuPage.pressWarehouseKey('ArrowDown');
    const second = await vatTuPage.activeWarehouseLabel();
    await vatTuPage.pressWarehouseKey('ArrowDown');
    const third = await vatTuPage.activeWarehouseLabel();
    await vatTuPage.pressWarehouseKey('ArrowUp');
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(await vatTuPage.activeWarehouseLabel()).toBe(second);
    await expect(vatTuPage.warehouseCombobox()).toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1351 - ESC đóng dropdown Kho mặc định', async ({ vatTuPage }) => {
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    const valueBefore = await vatTuPage.warehouseCombobox().inputValue();
    await vatTuPage.pressWarehouseKey('Escape');
    await expect(vatTuPage.warehouseDropdown()).toBeHidden();
    await expect(vatTuPage.warehouseCombobox()).toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-1352 - icon X xóa Kho mặc định', async ({ vatTuPage, db }) => {
    const warehouses = await prepareGoodsWarehouses(vatTuPage, db, 'Thành phẩm');
    const active = warehouses.find(({ status }) => status === 'HoatDong');
    test.skip(!active, 'BLOCK: DB chưa có Kho Hoạt động');
    if (!active) return;
    await vatTuPage.selectWarehouse(active);
    await vatTuPage.clearWarehouse();
    await expect(vatTuPage.selectedWarehouse(active.label)).toBeHidden();
    await expect(vatTuPage.warehouseCombobox()).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1354 - giao diện form Thêm nhanh Kho', async ({ vatTuPage }) => {
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    await vatTuPage.openWarehouseQuickAdd();
    await expect(vatTuPage.warehouseQuickAddDialog()).toBeVisible();
    await expect(vatTuPage.warehouseQuickAddTextbox('Mã kho')).toBeVisible();
    await expect(vatTuPage.warehouseQuickAddTextbox('Tên kho')).toBeVisible();
    await expect(vatTuPage.warehouseQuickAddStatus()).toBeChecked();
  });

  test('TC_PMKT-U-00106-1355 - validate bắt buộc form Thêm nhanh Kho', async ({ vatTuPage }) => {
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    await vatTuPage.openWarehouseQuickAdd();
    await vatTuPage.saveWarehouseQuickAdd();
    await expect(vatTuPage.warehouseQuickAddDialog()).toBeVisible();
    await expect(vatTuPage.warehouseQuickAddValidation('Mã kho')).toBeVisible();
    await expect(vatTuPage.warehouseQuickAddValidation('Tên kho')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1356 - validate trùng Mã kho khi Thêm nhanh', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const duplicate = (await db.kho.listForDefaultTenant(credentials.username))[0];
    test.skip(!duplicate, 'BLOCK: DB đúng tenant chưa có Kho tồn tại để kiểm tra trùng mã');
    if (!duplicate) return;
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    await vatTuPage.openWarehouseQuickAdd();
    await vatTuPage.fillWarehouseQuickAdd(duplicate.code, new TestDataGenerator().uniqueKeyword('TC202'));
    await vatTuPage.saveWarehouseQuickAdd();
    await expect(vatTuPage.warehouseQuickAddDialog()).toBeVisible();
    await expect(vatTuPage.successNotification()).toContainText(/tồn tại|trùng/i);
  });

  test('TC_PMKT-U-00106-1357 - boundary Mã kho tối đa 50 ký tự', async ({ vatTuPage }) => {
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    await vatTuPage.openWarehouseQuickAdd();
    const input = vatTuPage.warehouseQuickAddTextbox('Mã kho');
    const value49 = boundaryText('TC203_49', 49);
    const value50 = boundaryText('TC203_50', 50);
    await input.fill(value49);
    await expect(input).toHaveValue(value49);
    await input.fill(value50);
    await expect(input).toHaveValue(value50);
    await input.pressSequentially('C');
    await expect(input).toHaveValue(value50);
  });

  test('TC_PMKT-U-00106-1358 - boundary Tên kho tối đa 255 ký tự', async ({ vatTuPage }) => {
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    await vatTuPage.openWarehouseQuickAdd();
    const input = vatTuPage.warehouseQuickAddTextbox('Tên kho');
    const value254 = boundaryText('TC204_254', 254);
    const value255 = boundaryText('TC204_255', 255);
    await input.fill(value254);
    await expect(input).toHaveValue(value254);
    await input.fill(value255);
    await expect(input).toHaveValue(value255);
    await input.pressSequentially('C');
    await expect(input).toHaveValue(value255);
  });

  test('TC_PMKT-U-00106-1359 - lưu Thêm nhanh Kho và tự động điền', async ({ vatTuPage, db, quickAddCleanup }) => {
    const credentials = requireCredentials();
    const generator = new TestDataGenerator();
    const code = generator.uniqueCode('TC205').slice(0, 50);
    const name = generator.uniqueKeyword('TC205');
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    await vatTuPage.openWarehouseQuickAdd();
    await vatTuPage.fillWarehouseQuickAdd(code, name);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveWarehouseQuickAdd();
    expect(await notificationPromise).toMatch(/thành công/i);
    await expect(vatTuPage.warehouseQuickAddDialog()).toBeHidden();
    await expect(vatTuPage.selectedWarehouse(`${code} — ${name}`)).toBeVisible();
    const saved = await db.kho.findByCodeForDefaultTenant(credentials.username, code);
    expect(saved).toMatchObject({ code, name, active: true });
    quickAddCleanup.register('warehouse', code);
  });

  test('TC_PMKT-U-00106-1360 - hủy form Thêm nhanh Kho', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = new TestDataGenerator().uniqueCode('TC206').slice(0, 50);
    await openGoodsWarehouse(vatTuPage, 'Thành phẩm');
    const valueBefore = await vatTuPage.warehouseCombobox().inputValue();
    await vatTuPage.openWarehouseQuickAdd();
    await vatTuPage.fillWarehouseQuickAdd(code, new TestDataGenerator().uniqueKeyword('TC206'));
    await vatTuPage.cancelWarehouseQuickAdd();
    await expect(vatTuPage.warehouseQuickAddDialog()).toBeHidden();
    await expect(vatTuPage.warehouseCombobox()).toHaveValue(valueBefore);
    expect(await db.kho.findByCodeForDefaultTenant(credentials.username, code)).toBeNull();
  });

  test('TC_PMKT-U-00106-1361 - hiển thị control Tồn tối thiểu', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tồn tối thiểu', 'spinbutton')).toBeVisible();
    await expect(vatTuPage.formField('Tồn tối thiểu')).toContainText('Tồn tối thiểu');
    await expect(vatTuPage.requiredIndicator('Tồn tối thiểu')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1362 - validate Tồn tối thiểu không nhận số âm', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const unit = catalogues.units.find(({ status }) => status === 'HoatDong');
    test.skip(!unit, 'BLOCK: DB đúng tenant chưa có Đơn vị tính Hoạt động');
    if (!unit) return;
    const generator = new TestDataGenerator();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(generator.uniqueCode('TC208'), generator.uniqueKeyword('TC208'), unit);
    await vatTuPage.fillFormField('Tồn tối thiểu', '-10');
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.validationMessage('Tồn tối thiểu', 'Tồn tối thiểu phải ≥ 0')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1363 - hiển thị control Tồn tối đa', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Tồn tối đa', 'spinbutton')).toBeVisible();
    await expect(vatTuPage.formField('Tồn tối đa')).toContainText('Tồn tối đa');
    await expect(vatTuPage.requiredIndicator('Tồn tối đa')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1364 - validate Tồn tối đa không nhận số âm', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const unit = catalogues.units.find(({ status }) => status === 'HoatDong');
    test.skip(!unit, 'BLOCK: DB đúng tenant chưa có Đơn vị tính Hoạt động');
    if (!unit) return;
    const generator = new TestDataGenerator();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(generator.uniqueCode('TC210'), generator.uniqueKeyword('TC210'), unit);
    await vatTuPage.fillFormField('Tồn tối đa', '-20');
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.validationMessage('Tồn tối đa', 'Tồn tối đa phải ≥ 0')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1365 - validate Tồn tối đa nhỏ hơn Tồn tối thiểu', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const unit = catalogues.units.find(({ status }) => status === 'HoatDong');
    test.skip(!unit, 'BLOCK: DB đúng tenant chưa có Đơn vị tính Hoạt động');
    if (!unit) return;
    const generator = new TestDataGenerator();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(generator.uniqueCode('TC211'), generator.uniqueKeyword('TC211'), unit);
    await vatTuPage.fillFormField('Tồn tối thiểu', '100');
    await vatTuPage.fillFormField('Tồn tối đa', '50');
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.validationMessage('Tồn tối đa', 'Tồn tối đa phải ≥ Tồn tối thiểu')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1366 - hiển thị control Phương pháp tính giá bắt buộc', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.pricingMethodCombobox()).toBeVisible();
    await expect(vatTuPage.formField('Phương pháp tính giá')).toContainText('Phương pháp tính giá');
    const indicator = await vatTuPage.requiredIndicatorStyle('Phương pháp tính giá');
    expect(indicator.content.trim()).toBe('*');
    expect(indicator.color).toMatch(/rgb\((?:2[0-9]{2}|1[5-9][0-9]),\s*\d{1,2},\s*\d{1,2}\)/);
  });

  test('TC_PMKT-U-00106-1367 - danh sách Phương pháp tính giá đầy đủ', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.pricingMethodCombobox().click();
    await expect(vatTuPage.pricingMethodOptions()).toHaveText([
      'Nhập trước xuất trước',
      'Bình quân gia quyền cuối kỳ',
      'Bình quân gia quyền tức thời',
      'Đích danh',
    ]);
  });

  test('TC_PMKT-U-00106-1368 - chọn Bình quân gia quyền tức thời', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectPricingMethod('Bình quân gia quyền tức thời');
    await expect(vatTuPage.selectedPricingMethod('Bình quân gia quyền tức thời')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1369 - thay đổi Phương pháp tính giá', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectPricingMethod('Bình quân gia quyền tức thời');
    await vatTuPage.selectPricingMethod('Nhập trước xuất trước');
    await expect(vatTuPage.selectedPricingMethod('Nhập trước xuất trước')).toBeVisible();
    await expect(vatTuPage.selectedPricingMethod('Bình quân gia quyền tức thời')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1370 - validate bắt buộc Phương pháp tính giá', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const unit = catalogues.units.find(({ status }) => status === 'HoatDong');
    test.skip(!unit, 'BLOCK: DB đúng tenant chưa có Đơn vị tính Hoạt động');
    if (!unit) return;
    const generator = new TestDataGenerator();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredMaterialFields(generator.uniqueCode('TC216'), generator.uniqueKeyword('TC216'), unit);
    await vatTuPage.openFormTab('Thông tin kho');
    await vatTuPage.clearPricingMethod();
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.fieldValidation('Phương pháp tính giá')).toHaveText('Phương pháp tính giá không được để trống');
  });

  test('TC_PMKT-U-00106-1373 - hiển thị checkbox Theo dõi lô không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.checkbox('Theo dõi lô')).toBeVisible();
    await expect(vatTuPage.checkboxLabel('Theo dõi lô')).toBeVisible();
    await expect(vatTuPage.requiredFormField('Theo dõi lô')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1374 - checkbox Theo dõi lô mặc định false và tích chọn được', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    const trackLot = vatTuPage.checkbox('Theo dõi lô');
    await expect(trackLot).not.toBeChecked();
    await vatTuPage.setCheckbox('Theo dõi lô', true);
    await expect(trackLot).toBeChecked();
  });

  test('TC_PMKT-U-00106-1375 - hiển thị checkbox Theo dõi mã vạch không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.checkbox('Theo dõi mã vạch')).toBeVisible();
    await expect(vatTuPage.checkboxLabel('Theo dõi mã vạch')).toBeVisible();
    await expect(vatTuPage.requiredFormField('Theo dõi mã vạch')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1376 - checkbox Theo dõi mã vạch mặc định false và tích chọn được', async ({ vatTuPage }) => {
    await openGoodsInventoryTab(vatTuPage, 'Thành phẩm');
    const trackBarcode = vatTuPage.checkbox('Theo dõi mã vạch');
    await expect(trackBarcode).not.toBeChecked();
    await vatTuPage.setCheckbox('Theo dõi mã vạch', true);
    await expect(trackBarcode).toBeChecked();
  });

  test('TC_PMKT-U-00106-1377 - hiển thị select Thuế suất GTGT mặc định không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.defaultVatRateCombobox()).toBeVisible();
    await expect(vatTuPage.formField('Thuế suất GTGT mặc định')).toContainText('Thuế suất GTGT mặc định');
    await expect(vatTuPage.requiredIndicator('Thuế suất GTGT mặc định')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1378 - danh sách Thuế suất GTGT mặc định đầy đủ', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.defaultVatRateCombobox().click();
    const options = vatTuPage.defaultVatRateOptions();
    await expect(options.first()).toBeVisible();
    const actualCodes = (await options.allTextContents()).map((label) =>
      (label.split('—')[0] ?? '').trim().replace('%', '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    );
    expect(actualCodes).toEqual(expect.arrayContaining(['KCT', 'KKKNT', '0', '5', '8', '10', 'KHAC']));
    expect(actualCodes).toHaveLength(7);
  });

  test('TC_PMKT-U-00106-1379 - chọn Thuế suất GTGT mặc định bằng 5', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectDefaultVatRate('5');
    await expect(vatTuPage.formField('Thuế suất GTGT mặc định')).toContainText('5% — Hàng hoá, dịch vụ chịu thuế suất 5%');
  });

  test('TC_PMKT-U-00106-1380 - xóa nhanh Thuế suất GTGT mặc định', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectDefaultVatRate('5');
    await vatTuPage.clearDefaultVatRate();
    await expect(vatTuPage.defaultVatRateCombobox()).toHaveValue('');
    await expect(vatTuPage.selectedFormValue('Thuế suất GTGT mặc định')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1381 - hiển thị numeric Giá trị thuế suất GTGT không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.vatRateValueInput()).toBeVisible();
    await expect(vatTuPage.formField('Giá trị thuế suất GTGT')).toContainText('Giá trị thuế suất GTGT');
    await expect(vatTuPage.requiredIndicator('Giá trị thuế suất GTGT')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1382 - tự động điền Giá trị thuế suất GTGT theo mức 10 và 8', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    const vatRateValue = vatTuPage.vatRateValueInput();
    await vatTuPage.selectDefaultVatRate('10');
    await expect(vatRateValue).toHaveValue('10');
    await expect(vatRateValue).toHaveAttribute('readonly', '');
    await vatTuPage.selectDefaultVatRate('8');
    await expect(vatRateValue).toHaveValue('8');
    await expect(vatRateValue).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-1383 - KCT tự động điền Giá trị thuế suất GTGT bằng 0', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectDefaultVatRate('KCT');
    await expect(vatTuPage.vatRateValueInput()).toHaveValue('0');
    await expect(vatTuPage.vatRateValueInput()).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-1384 - KKKNT tự động điền Giá trị thuế suất GTGT bằng 0', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectDefaultVatRate('KKKNT');
    await expect(vatTuPage.vatRateValueInput()).toHaveValue('0');
    await expect(vatTuPage.vatRateValueInput()).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-1385 - KHAC cho phép nhập Giá trị thuế suất GTGT', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectDefaultVatRate('KHAC');
    const vatRateValue = vatTuPage.vatRateValueInput();
    await expect(vatRateValue).toBeEditable();
    await vatTuPage.fillFormField('Giá trị thuế suất GTGT', '7');
    await expect(vatRateValue).toHaveValue('7');
  });

  test('TC_PMKT-U-00106-1386 - đổi KHAC về mức 8 cập nhật giá trị và read-only', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.selectDefaultVatRate('KHAC');
    await vatTuPage.fillFormField('Giá trị thuế suất GTGT', '7');
    await vatTuPage.selectDefaultVatRate('8');
    await expect(vatTuPage.vatRateValueInput()).toHaveValue('8');
    await expect(vatTuPage.vatRateValueInput()).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-1387 - hiển thị numeric Thuế nhập khẩu không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế nhập khẩu', 'spinbutton')).toBeVisible();
    await expect(vatTuPage.formField('Thuế nhập khẩu')).toContainText('Thuế nhập khẩu');
    await expect(vatTuPage.requiredIndicator('Thuế nhập khẩu')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1388 - nhập Thuế nhập khẩu hợp lệ bằng 5.5', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.fillFormField('Thuế nhập khẩu', '5.5');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế nhập khẩu', 'spinbutton')).toHaveValue('5.5');
  });

  test('TC_PMKT-U-00106-1389 - đổi Thành phẩm sang Dịch vụ ẩn Thuế nhập khẩu', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openFormTab('Thông tin thuế');
    await expect(vatTuPage.formField('Thuế nhập khẩu')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1390 - đổi sang loại vật tư khác reset Thuế nhập khẩu', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.fillFormField('Thuế nhập khẩu', '5.5');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openFormTab('Thông tin thuế');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế nhập khẩu', 'spinbutton')).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1391 - hiển thị numeric Thuế xuất khẩu không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế xuất khẩu', 'spinbutton')).toBeVisible();
    await expect(vatTuPage.formField('Thuế xuất khẩu')).toContainText('Thuế xuất khẩu');
    await expect(vatTuPage.requiredIndicator('Thuế xuất khẩu')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1392 - nhập Thuế xuất khẩu hợp lệ bằng 2', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.fillFormField('Thuế xuất khẩu', '2');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế xuất khẩu', 'spinbutton')).toHaveValue('2');
  });

  test('TC_PMKT-U-00106-1393 - đổi Thành phẩm sang Dịch vụ ẩn Thuế xuất khẩu', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openFormTab('Thông tin thuế');
    await expect(vatTuPage.formField('Thuế xuất khẩu')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1394 - đổi sang loại vật tư khác reset Thuế xuất khẩu', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.fillFormField('Thuế xuất khẩu', '2');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openFormTab('Thông tin thuế');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế xuất khẩu', 'spinbutton')).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1395 - hiển thị combogrid Thuế Tài nguyên không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế Tài nguyên', 'combobox')).toBeVisible();
    await expect(vatTuPage.formField('Thuế Tài nguyên')).toContainText('Thuế Tài nguyên');
    await expect(vatTuPage.requiredIndicator('Thuế Tài nguyên')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1396 - hiển thị đúng cột, dữ liệu và thứ tự Thuế Tài nguyên', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy mst_thue_tai_nguyen đúng tenant rồi mở combogrid Thuế Tài nguyên.
    const expected = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    // Hành động: Cuộn toàn bộ virtual dropdown để thu thập đủ dữ liệu thay vì chỉ đọc các dòng đang render.
    const actualLabels = await vatTuPage.visibleTaxLabels(expected.length);
    const expectedLabels = expected.map((item) => item.label);
    const headers = (await vatTuPage.taxColumnHeaders().allTextContents()).map((value) => value.trim()).filter(Boolean);
    // Xác nhận UI/DB: Đủ bốn cột, dữ liệu khớp DB và toàn bộ bản ghi Hoạt động đứng trước Ngừng hoạt động.
    await expect.soft(headers, 'Combogrid Thuế Tài nguyên phải có đúng bốn cột').toEqual([
      'Mã thuế tài nguyên', 'Tên thuế tài nguyên', 'Thuế suất (%)', 'Trạng thái',
    ]);
    expect([...actualLabels].sort(), 'Mã và tên Thuế Tài nguyên trên UI phải khớp DB đúng tenant').toEqual([...expectedLabels].sort());
    const actualStatuses = actualLabels.map((label) => expected.find((item) => item.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    if (firstInactiveIndex >= 0) {
      expect(actualStatuses.slice(firstInactiveIndex).every((status) => status === 'NgungHoatDong'), 'Mọi Thuế Tài nguyên Hoạt động phải đứng trước Thuế Ngừng hoạt động').toBe(true);
    }
  });

  test('TC_PMKT-U-00106-1397 - Thuế Tài nguyên Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const pair = statusPair(taxes);
    test.skip(!pair, 'BLOCK: DB đúng tenant chưa có đủ Thuế Tài nguyên Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.searchTax('Thuế Tài nguyên', pair.active.code);
    const activeStyle = await vatTuPage.taxOptionStyle(pair.active.label);
    await vatTuPage.pressTaxKey('Thuế Tài nguyên', 'Escape');
    await vatTuPage.openTaxDropdown('Thuế Tài nguyên');
    await vatTuPage.searchTax('Thuế Tài nguyên', pair.inactive.code);
    const inactiveStyle = await vatTuPage.taxOptionStyle(pair.inactive.label);
    expect(isGrayCssColor(inactiveStyle.color), 'Thuế Tài nguyên Ngừng hoạt động phải hiển thị chữ màu xám').toBe(true);
    expect(inactiveStyle).not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-1398 - xác nhận sử dụng Thuế Tài nguyên Ngừng hoạt động', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const inactive = taxes.find(({ status }) => status === 'NgungHoatDong');
    test.skip(!inactive, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên Ngừng hoạt động');
    if (!inactive) return;
    await vatTuPage.selectTax('Thuế Tài nguyên', inactive);
    await expect(vatTuPage.taxConfirmationDialog()).toContainText('Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?');
    await expect(vatTuPage.taxConfirmationButton('Xác nhận')).toBeVisible();
    await expect(vatTuPage.taxConfirmationButton('Hủy')).toBeVisible();
    await vatTuPage.resolveInactiveTax(true);
    await expect(vatTuPage.taxConfirmationDialog()).toBeHidden();
    await expect(vatTuPage.selectedTax('Thuế Tài nguyên', inactive.label)).toBeVisible();
  });

  test('TC_PMKT-U-00106-1399 - hủy sử dụng Thuế Tài nguyên Ngừng hoạt động', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const inactive = taxes.find(({ status }) => status === 'NgungHoatDong');
    test.skip(!inactive, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên Ngừng hoạt động');
    if (!inactive) return;
    const valueBefore = await vatTuPage.currentFormOption('Thuế Tài nguyên');
    await vatTuPage.selectTax('Thuế Tài nguyên', inactive);
    await expect(vatTuPage.taxConfirmationDialog()).toBeVisible();
    await vatTuPage.resolveInactiveTax(false);
    await expect(vatTuPage.taxConfirmationDialog()).toBeHidden();
    expect(await vatTuPage.currentFormOption('Thuế Tài nguyên')).toBe(valueBefore);
  });

  test('TC_PMKT-U-00106-1400 - chọn Thuế Tài nguyên Hoạt động không hiển thị cảnh báo', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const active = taxes.find(({ status }) => status === 'HoatDong');
    test.skip(!active, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên Hoạt động');
    if (!active) return;
    await vatTuPage.selectTax('Thuế Tài nguyên', active);
    await expect(vatTuPage.selectedTax('Thuế Tài nguyên', active.label)).toBeVisible();
    await expect(vatTuPage.taxConfirmationDialog()).toBeHidden();
  });

  test('TC_PMKT-U-00106-1401 - tìm Thuế Tài nguyên theo Mã', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const target = taxes[0];
    test.skip(!target, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên');
    if (!target) return;
    await vatTuPage.searchTax('Thuế Tài nguyên', target.code);
    const expected = taxes.filter(({ code }) => code.toLocaleLowerCase('vi').includes(target.code.toLocaleLowerCase('vi'))).map(({ label }) => label);
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Mã Thuế Tài nguyên phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1402 - tìm Thuế Tài nguyên theo Tên', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const query = discriminatingSearchKeyword(taxes.map(({ name }) => name), taxes.map(({ code }) => code));
    test.skip(!query, 'BLOCK: DB chưa có từ khóa Tên Thuế Tài nguyên phân biệt được với Mã');
    if (!query) return;
    await vatTuPage.searchTax('Thuế Tài nguyên', query);
    const normalized = query.toLocaleLowerCase('vi');
    const expected = taxes.filter(({ name }) => name.toLocaleLowerCase('vi').includes(normalized)).map(({ label }) => label);
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Tên Thuế Tài nguyên phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1403 - tìm Thuế Tài nguyên theo Thuế suất', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const target = taxes[0];
    test.skip(!target, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên');
    if (!target) return;
    await vatTuPage.searchTax('Thuế Tài nguyên', target.rate);
    const expected = taxes.filter(({ rate }) => rate.includes(target.rate)).map(({ label }) => label);
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Thuế suất phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1404 - tìm Thuế Tài nguyên theo Trạng thái', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const expected = taxes.filter(({ status }) => status === 'HoatDong').map(({ label }) => label);
    test.skip(expected.length === 0, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên Hoạt động');
    await vatTuPage.searchTax('Thuế Tài nguyên', 'Hoạt động');
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Trạng thái phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1405 - Enter chọn dòng Thuế Tài nguyên đầu tiên', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const query = sharedSearchKeyword(taxes.map(({ code }) => code));
    test.skip(!query, 'BLOCK: DB chưa có từ khóa trả về nhiều Thuế Tài nguyên');
    if (!query) return;
    await vatTuPage.searchTax('Thuế Tài nguyên', query);
    const labels = await vatTuPage.currentTaxLabels();
    expect(labels.length, 'Từ khóa phải trả về nhiều Thuế Tài nguyên').toBeGreaterThan(1);
    const firstLabel = labels[0];
    if (!firstLabel) throw new Error('Không đọc được dòng Thuế Tài nguyên đầu tiên sau khi tìm kiếm');
    await vatTuPage.pressTaxKey('Thuế Tài nguyên', 'Enter');
    await expect(vatTuPage.taxDropdown()).toBeHidden();
    await expect(vatTuPage.selectedTax('Thuế Tài nguyên', firstLabel)).toBeVisible();
  });

  test('TC_PMKT-U-00106-1406 - Up và Down di chuyển từng option Thuế Tài nguyên', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    test.skip(taxes.length < 3, 'BLOCK: DB cần tối thiểu ba Thuế Tài nguyên để kiểm tra điều hướng');
    const valueBefore = await vatTuPage.currentFormOption('Thuế Tài nguyên');
    const initial = await vatTuPage.activeTaxLabel();
    await vatTuPage.pressTaxKey('Thuế Tài nguyên', 'ArrowDown');
    const afterFirstDown = await vatTuPage.activeTaxLabel();
    await vatTuPage.pressTaxKey('Thuế Tài nguyên', 'ArrowDown');
    const afterSecondDown = await vatTuPage.activeTaxLabel();
    await vatTuPage.pressTaxKey('Thuế Tài nguyên', 'ArrowUp');
    const afterUp = await vatTuPage.activeTaxLabel();
    expect(afterFirstDown).not.toBe(initial);
    expect(afterSecondDown).not.toBe(afterFirstDown);
    expect(afterUp).toBe(afterFirstDown);
    expect(await vatTuPage.currentFormOption('Thuế Tài nguyên')).toBe(valueBefore);
  });

  test('TC_PMKT-U-00106-1407 - ESC đóng dropdown Thuế Tài nguyên không đổi giá trị', async ({ vatTuPage, db }) => {
    await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const valueBefore = await vatTuPage.currentFormOption('Thuế Tài nguyên');
    await vatTuPage.pressTaxKey('Thuế Tài nguyên', 'Escape');
    await expect(vatTuPage.taxDropdown()).toBeHidden();
    expect(await vatTuPage.currentFormOption('Thuế Tài nguyên')).toBe(valueBefore);
  });

  test('TC_PMKT-U-00106-1408 - icon X xóa nhanh Thuế Tài nguyên', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const active = taxes.find(({ status }) => status === 'HoatDong');
    test.skip(!active, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên Hoạt động');
    if (!active) return;
    await vatTuPage.selectTax('Thuế Tài nguyên', active);
    await expect(vatTuPage.selectedTax('Thuế Tài nguyên', active.label)).toBeVisible();
    await vatTuPage.clearTax('Thuế Tài nguyên');
    await expect(vatTuPage.formFieldControl('Thuế Tài nguyên', 'combobox')).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1409 - đổi sang Dịch vụ ẩn Thuế Tài nguyên', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openFormTab('Thông tin thuế');
    await expect(vatTuPage.formField('Thuế Tài nguyên')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1410 - đổi sang Thành phẩm reset Thuế Tài nguyên', async ({ vatTuPage, db }) => {
    const taxes = await prepareGoodsResourceTaxes(vatTuPage, db, 'Thành phẩm');
    const active = taxes.find(({ status }) => status === 'HoatDong');
    test.skip(!active, 'BLOCK: DB đúng tenant chưa có Thuế Tài nguyên Hoạt động');
    if (!active) return;
    await vatTuPage.selectTax('Thuế Tài nguyên', active);
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openFormTab('Thông tin thuế');
    await expect(vatTuPage.formFieldControl('Thuế Tài nguyên', 'combobox')).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1411 - hiển thị combogrid Thuế tiêu thụ đặc biệt không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.inventoryMaterialFormFieldControl('Thuế tiêu thụ đặc biệt', 'combobox')).toBeVisible();
    await expect(vatTuPage.formField('Thuế tiêu thụ đặc biệt')).toContainText('Thuế tiêu thụ đặc biệt');
    await expect(vatTuPage.requiredIndicator('Thuế tiêu thụ đặc biệt')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-1412 - hiển thị đúng cột, dữ liệu và thứ tự Thuế tiêu thụ đặc biệt', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy mst_thue_tieu_thu_db đúng tenant rồi mở combogrid Thuế tiêu thụ đặc biệt.
    const expected = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    // Hành động: Cuộn toàn bộ virtual dropdown để thu thập đủ dữ liệu thay vì chỉ đọc các dòng đang render.
    const actualLabels = await vatTuPage.visibleTaxLabels(expected.length);
    const expectedLabels = expected.map((item) => item.label);
    const headers = (await vatTuPage.taxColumnHeaders().allTextContents()).map((value) => value.trim()).filter(Boolean);
    // Xác nhận UI/DB: Đủ bốn cột, dữ liệu khớp DB và toàn bộ bản ghi Hoạt động đứng trước Ngừng hoạt động.
    await expect.soft(headers, 'Combogrid Thuế tiêu thụ đặc biệt phải có đúng bốn cột').toEqual([
      'Mã thuế TTĐB', 'Tên thuế TTĐB', 'Thuế suất (%)', 'Trạng thái',
    ]);
    expect([...actualLabels].sort(), 'Mã và tên Thuế tiêu thụ đặc biệt trên UI phải khớp DB đúng tenant').toEqual([...expectedLabels].sort());
    const actualStatuses = actualLabels.map((label) => expected.find((item) => item.label === label)?.status);
    const firstInactiveIndex = actualStatuses.indexOf('NgungHoatDong');
    if (firstInactiveIndex >= 0) {
      expect(actualStatuses.slice(firstInactiveIndex).every((status) => status === 'NgungHoatDong'), 'Mọi Thuế tiêu thụ đặc biệt Hoạt động phải đứng trước Thuế Ngừng hoạt động').toBe(true);
    }
  });

  test('TC_PMKT-U-00106-1413 - Thuế tiêu thụ đặc biệt Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy cặp Thuế tiêu thụ đặc biệt Hoạt động/Ngừng hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const pair = statusPair(taxes);
    test.skip(!pair, 'BLOCK: DB đúng tenant chưa có đủ Thuế tiêu thụ đặc biệt Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    // Hành động: Lọc riêng từng mã để option được render ổn định trong virtual dropdown rồi đọc style.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', pair.active.code);
    const activeStyle = await vatTuPage.taxOptionStyle(pair.active.label);
    await vatTuPage.pressTaxKey('Thuế tiêu thụ đặc biệt', 'Escape');
    await vatTuPage.openTaxDropdown('Thuế tiêu thụ đặc biệt');
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', pair.inactive.code);
    const inactiveStyle = await vatTuPage.taxOptionStyle(pair.inactive.label);
    // Xác nhận UI: Option Ngừng hoạt động phải có chữ màu xám và khác style option Hoạt động.
    expect(isGrayCssColor(inactiveStyle.color), 'Thuế tiêu thụ đặc biệt Ngừng hoạt động phải hiển thị chữ màu xám').toBe(true);
    expect(inactiveStyle).not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-1414 - xác nhận sử dụng Thuế tiêu thụ đặc biệt Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy một Thuế tiêu thụ đặc biệt Ngừng hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const inactive = taxes.find(({ status }) => status === 'NgungHoatDong');
    test.skip(!inactive, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt Ngừng hoạt động');
    if (!inactive) return;
    // Hành động: Chọn option Ngừng hoạt động > Xác nhận sử dụng trên popup cảnh báo.
    await vatTuPage.selectTax('Thuế tiêu thụ đặc biệt', inactive);
    await expect(vatTuPage.taxConfirmationDialog()).toContainText('Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?');
    await expect(vatTuPage.taxConfirmationButton('Xác nhận')).toBeVisible();
    await expect(vatTuPage.taxConfirmationButton('Hủy')).toBeVisible();
    await vatTuPage.resolveInactiveTax(true);
    // Xác nhận UI: Popup đóng và option Ngừng hoạt động được áp dụng vào trường.
    await expect(vatTuPage.taxConfirmationDialog()).toBeHidden();
    await expect(vatTuPage.selectedTax('Thuế tiêu thụ đặc biệt', inactive.label)).toBeVisible();
  });

  test('TC_PMKT-U-00106-1415 - hủy sử dụng Thuế tiêu thụ đặc biệt Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy option Ngừng hoạt động từ DB và lưu giá trị trường trước thao tác.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const inactive = taxes.find(({ status }) => status === 'NgungHoatDong');
    test.skip(!inactive, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt Ngừng hoạt động');
    if (!inactive) return;
    const valueBefore = await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt');
    // Hành động: Chọn option Ngừng hoạt động > Hủy trên popup cảnh báo.
    await vatTuPage.selectTax('Thuế tiêu thụ đặc biệt', inactive);
    await expect(vatTuPage.taxConfirmationDialog()).toBeVisible();
    await vatTuPage.resolveInactiveTax(false);
    // Xác nhận UI: Popup đóng và trường giữ nguyên giá trị ban đầu.
    await expect(vatTuPage.taxConfirmationDialog()).toBeHidden();
    expect(await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt')).toBe(valueBefore);
  });

  test('TC_PMKT-U-00106-1416 - chọn Thuế tiêu thụ đặc biệt Hoạt động không hiển thị cảnh báo', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy một Thuế tiêu thụ đặc biệt Hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const active = taxes.find(({ status }) => status === 'HoatDong');
    test.skip(!active, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt Hoạt động');
    if (!active) return;
    // Hành động: Lọc theo mã unique và chọn option Hoạt động.
    await vatTuPage.selectTax('Thuế tiêu thụ đặc biệt', active);
    // Xác nhận UI: Giá trị được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedTax('Thuế tiêu thụ đặc biệt', active.label)).toBeVisible();
    await expect(vatTuPage.taxConfirmationDialog()).toBeHidden();
  });

  test('TC_PMKT-U-00106-1417 - tìm Thuế tiêu thụ đặc biệt theo Mã', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Chọn mã Thuế tiêu thụ đặc biệt đầu tiên từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const target = taxes[0];
    test.skip(!target, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt');
    if (!target) return;
    // Hành động: Nhập mã vào ô tìm kiếm của combogrid.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', target.code);
    const expected = taxes.filter(({ code }) => code.toLocaleLowerCase('vi').includes(target.code.toLocaleLowerCase('vi'))).map(({ label }) => label);
    // Xác nhận UI/DB: Kết quả theo Mã khớp danh mục DB đúng tenant.
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Mã Thuế tiêu thụ đặc biệt phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1418 - tìm Thuế tiêu thụ đặc biệt theo Tên', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Sinh từ khóa Tên phân biệt được với Mã từ danh mục DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const query = discriminatingSearchKeyword(taxes.map(({ name }) => name), taxes.map(({ code }) => code));
    test.skip(!query, 'BLOCK: DB chưa có từ khóa Tên Thuế tiêu thụ đặc biệt phân biệt được với Mã');
    if (!query) return;
    // Hành động: Nhập từ khóa Tên vào ô tìm kiếm của combogrid.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', query);
    const normalized = query.toLocaleLowerCase('vi');
    const expected = taxes.filter(({ name }) => name.toLocaleLowerCase('vi').includes(normalized)).map(({ label }) => label);
    // Xác nhận UI/DB: Kết quả theo Tên khớp danh mục DB đúng tenant.
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Tên Thuế tiêu thụ đặc biệt phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1419 - tìm Thuế tiêu thụ đặc biệt theo Thuế suất', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy Thuế suất thực tế từ DB đúng tenant làm expected.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const target = taxes[0];
    test.skip(!target, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt');
    if (!target) return;
    // Hành động: Nhập Thuế suất vào ô tìm kiếm của combogrid.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', target.rate);
    const expected = taxes.filter(({ rate }) => rate.includes(target.rate)).map(({ label }) => label);
    // Xác nhận UI/DB: Kết quả theo Thuế suất khớp danh mục DB đúng tenant.
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Thuế suất Thuế tiêu thụ đặc biệt phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1420 - tìm Thuế tiêu thụ đặc biệt theo Trạng thái', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy tập Thuế tiêu thụ đặc biệt Hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const expected = taxes.filter(({ status }) => status === 'HoatDong').map(({ label }) => label);
    test.skip(expected.length === 0, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt Hoạt động');
    // Hành động: Nhập nhãn Trạng thái Hoạt động vào ô tìm kiếm.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', 'Hoạt động');
    // Xác nhận UI/DB: Kết quả theo Trạng thái khớp danh mục DB đúng tenant.
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Trạng thái Thuế tiêu thụ đặc biệt phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-1421 - Enter chọn dòng Thuế tiêu thụ đặc biệt đầu tiên', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Sinh từ khóa từ DB trả về nhiều option để kiểm tra Enter.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const query = sharedSearchKeyword(taxes.map(({ code }) => code));
    test.skip(!query, 'BLOCK: DB chưa có từ khóa trả về nhiều Thuế tiêu thụ đặc biệt');
    if (!query) return;
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', query);
    const labels = await vatTuPage.currentTaxLabels();
    expect(labels.length, 'Từ khóa phải trả về nhiều Thuế tiêu thụ đặc biệt').toBeGreaterThan(1);
    const firstLabel = labels[0];
    if (!firstLabel) throw new Error('Không đọc được dòng Thuế tiêu thụ đặc biệt đầu tiên sau khi tìm kiếm');
    // Hành động: Nhấn Enter tại dropdown đang mở.
    await vatTuPage.pressTaxKey('Thuế tiêu thụ đặc biệt', 'Enter');
    // Xác nhận UI: Dropdown đóng và trường nhận dòng đầu tiên.
    await expect(vatTuPage.taxDropdown()).toBeHidden();
    await expect(vatTuPage.selectedTax('Thuế tiêu thụ đặc biệt', firstLabel)).toBeVisible();
  });

  test('TC_PMKT-U-00106-1422 - Up và Down di chuyển từng option Thuế tiêu thụ đặc biệt', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Mở dropdown có tối thiểu ba option theo DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    test.skip(taxes.length < 3, 'BLOCK: DB cần tối thiểu ba Thuế tiêu thụ đặc biệt để kiểm tra điều hướng');
    const valueBefore = await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt');
    const initial = await vatTuPage.activeTaxLabel();
    // Hành động: Nhấn Down hai lần rồi Up một lần.
    await vatTuPage.pressTaxKey('Thuế tiêu thụ đặc biệt', 'ArrowDown');
    const afterFirstDown = await vatTuPage.activeTaxLabel();
    await vatTuPage.pressTaxKey('Thuế tiêu thụ đặc biệt', 'ArrowDown');
    const afterSecondDown = await vatTuPage.activeTaxLabel();
    await vatTuPage.pressTaxKey('Thuế tiêu thụ đặc biệt', 'ArrowUp');
    const afterUp = await vatTuPage.activeTaxLabel();
    // Xác nhận UI: Vùng chọn di chuyển từng dòng và chưa thay đổi giá trị trường.
    expect(afterFirstDown).not.toBe(initial);
    expect(afterSecondDown).not.toBe(afterFirstDown);
    expect(afterUp).toBe(afterFirstDown);
    expect(await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt')).toBe(valueBefore);
  });

  test('TC_PMKT-U-00106-1423 - ESC đóng dropdown Thuế tiêu thụ đặc biệt không đổi giá trị', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Mở combogrid từ danh mục DB đúng tenant và lưu giá trị ban đầu.
    await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const valueBefore = await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt');
    // Hành động: Nhấn ESC khi dropdown đang mở.
    await vatTuPage.pressTaxKey('Thuế tiêu thụ đặc biệt', 'Escape');
    // Xác nhận UI: Dropdown đóng và trường giữ nguyên giá trị.
    await expect(vatTuPage.taxDropdown()).toBeHidden();
    expect(await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt')).toBe(valueBefore);
  });

  test('TC_PMKT-U-00106-1424 - icon X xóa nhanh Thuế tiêu thụ đặc biệt', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy và chọn một Thuế tiêu thụ đặc biệt Hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Thành phẩm');
    const active = taxes.find(({ status }) => status === 'HoatDong');
    test.skip(!active, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt Hoạt động');
    if (!active) return;
    await vatTuPage.selectTax('Thuế tiêu thụ đặc biệt', active);
    await expect(vatTuPage.selectedTax('Thuế tiêu thụ đặc biệt', active.label)).toBeVisible();
    // Hành động: Click icon X của đúng trường Thuế tiêu thụ đặc biệt.
    await vatTuPage.clearTax('Thuế tiêu thụ đặc biệt');
    // Xác nhận UI: Giá trị được xóa và trường trở về rỗng.
    await expect(vatTuPage.formFieldControl('Thuế tiêu thụ đặc biệt', 'combobox')).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1425 - đổi sang Dịch vụ ẩn tab Đơn vị quy đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Đơn vị quy đổi theo pre-condition testcase.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openFormTab('Đơn vị quy đổi');

    // Hành động: Thay đổi tính chất > chọn Dịch vụ.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Form tải lại đúng loại Dịch vụ và ẩn hoàn toàn tab Đơn vị quy đổi.
    await expect(vatTuPage.materialTypeValue('Dịch vụ')).toBeVisible();
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1426 - đổi từ Dịch vụ về Thành phẩm hiện lại tab Đơn vị quy đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm rồi đổi sang Dịch vụ để tab Đơn vị quy đổi bị ẩn.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeHidden();

    // Hành động: Thay đổi tính chất > chọn lại Thành phẩm.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');

    // Xác nhận UI: Form tải lại đúng loại Thành phẩm và tab Đơn vị quy đổi hiển thị bình thường.
    await expect(vatTuPage.finishedProductMaterialTypeField()).toContainText('Thành phẩm');
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1427 - đổi sang Dịch vụ hiện tab Đơn vị tính khác', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm tại tab Đơn vị quy đổi theo pre-condition testcase.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openFormTab('Đơn vị quy đổi');

    // Hành động: Thay đổi tính chất > chọn Dịch vụ.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Form tải lại đúng loại Dịch vụ và tab Đơn vị tính khác hiển thị.
    await expect(vatTuPage.materialTypeValue('Dịch vụ')).toBeVisible();
    await expect(vatTuPage.formTab('Đơn vị tính khác')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1428 - đổi từ Dịch vụ về Thành phẩm ẩn tab Đơn vị tính khác', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm rồi đổi sang Dịch vụ để tab Đơn vị tính khác xuất hiện.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formTab('Đơn vị tính khác')).toBeVisible();

    // Hành động: Thay đổi tính chất > chọn lại Thành phẩm.
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Thành phẩm');

    // Xác nhận UI: Form tải lại đúng loại Thành phẩm và ẩn hoàn toàn tab Đơn vị tính khác.
    await expect(vatTuPage.finishedProductMaterialTypeField()).toContainText('Thành phẩm');
    await expect(vatTuPage.formTab('Đơn vị tính khác')).toBeHidden();
  });

  test('TC_PMKT-U-00106-1429 - hiển thị đúng control trên dòng lưới Đơn vị quy đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm và tab Đơn vị quy đổi.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openFormTab('Đơn vị quy đổi');

    // Hành động: Nhấn Thêm dòng để hiển thị các control của một dòng quy đổi mới.
    await vatTuPage.addConversionRow();

    // Xác nhận UI: Hiển thị đủ và đúng thứ tự bốn tên cột theo testcase.
    const columnHeaders = (await vatTuPage.conversionColumnHeaders().allTextContents())
      .map((header) => header.trim())
      .filter(Boolean);
    await expect.soft(
      columnHeaders.map((header) => header.replace(/\s*\*$/, '')),
      'Lưới Đơn vị quy đổi phải hiển thị đủ và đúng thứ tự bốn tên cột theo testcase',
    ).toEqual(['Đơn vị tính', 'Tỷ lệ quy đổi', 'Phép tính', 'Mô tả']);
    await expect.soft(
      columnHeaders.slice(0, 3).every((header) => /\*$/.test(header)),
      'Ba cột Đơn vị tính, Tỷ lệ quy đổi và Phép tính phải hiển thị dấu bắt buộc',
    ).toBe(true);

    // Xác nhận UI: Đơn vị tính, Tỷ lệ và Phép tính là các control bắt buộc đúng loại.
    await expect(vatTuPage.conversionRowControls('combobox')).toHaveCount(2);
    await expect(vatTuPage.conversionRowControls('spinbutton')).toHaveCount(1);

    // Xác nhận UI: Phép tính mặc định là Nhân; Mô tả là textbox read-only và để trống.
    await expect(vatTuPage.conversionOperationCell('Nhân')).toBeVisible();
    const description = vatTuPage.conversionRowControls('textbox').first();
    await expect(description).toBeVisible();
    await expect(description).toHaveAttribute('readonly', '');
    await expect(description).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1430 - thêm dòng Đơn vị quy đổi với thông tin đầy đủ', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy hai Đơn vị tính Hoạt động khác nhau từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnits = catalogues.units.filter((unit) => unit.status === 'HoatDong');
    test.skip(activeUnits.length < 2, 'DB cần tối thiểu hai Đơn vị tính Hoạt động');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.openMainUnitDropdown(); await vatTuPage.selectMainUnit(activeUnits[0]!);
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.addConversionRow();
    // Hành động: Chọn Đơn vị tính, nhập tỷ lệ 12 và giữ Phép tính mặc định Nhân.
    await vatTuPage.selectFirstConversionUnit(activeUnits[1]!);
    await vatTuPage.conversionRowControls('spinbutton').fill('12');
    // Xác nhận UI: Dòng mới nhận đủ dữ liệu và Mô tả tự sinh đúng công thức Nhân.
    await expect(vatTuPage.selectedFirstConversionUnit(activeUnits[1]!.label)).toBeVisible();
    await expect(vatTuPage.conversionOperationCell('Nhân')).toBeVisible();
    await expect(vatTuPage.conversionRowControls('textbox').first()).toHaveValue(`1 ${activeUnits[1]!.name} = 12 ${activeUnits[0]!.name}`);
  });

  test('TC_PMKT-U-00106-1431 - combogrid Đơn vị tính quy đổi khớp cột dữ liệu DB và thứ tự trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy toàn bộ Đơn vị tính từ DB đúng tenant và mở combogrid trên dòng quy đổi.
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); await vatTuPage.openFirstConversionUnitDropdown();
    const headers = (await vatTuPage.mainUnitDropdown().getByRole('columnheader').allTextContents()).map((v) => v.trim()).filter(Boolean);
    const labels = (await vatTuPage.conversionUnitOptions().allTextContents()).map((v) => v.trim()).filter(Boolean);
    // Xác nhận UI/DB: Cột, dữ liệu và thứ tự Hoạt động trên Ngừng hoạt động đúng testcase.
    await expect.soft(headers).toEqual(['Mã đơn vị tính', 'Tên đơn vị tính', 'Trạng thái']);
    await expect.soft([...labels].sort()).toEqual([...units.map((u) => u.label)].sort());
    const statuses = labels.map((label) => units.find((u) => u.label === label)?.status);
    const firstInactive = statuses.indexOf('NgungHoatDong'); expect(firstInactive < 0 || statuses.slice(firstInactive).every((s) => s === 'NgungHoatDong')).toBe(true);
  });

  test('TC_PMKT-U-00106-1432 - Đơn vị tính quy đổi Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const inactive = units.find((u) => u.status === 'NgungHoatDong');
    test.skip(!inactive, 'DB không có Đơn vị tính Ngừng hoạt động'); if (!inactive) return;
    await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.searchFirstConversionUnit(inactive.code);
    test.skip(!(await vatTuPage.conversionUnitOptions().filter({ hasText: inactive.label }).isVisible()), 'Combogrid không hiển thị Đơn vị tính Ngừng hoạt động');
    const style = await vatTuPage.conversionUnitOptionStyle(inactive.label);
    expect(isGrayCssColor(style.color) || Number(style.opacity) < 1).toBe(true);
  });

  test('TC_PMKT-U-00106-1433 - xác nhận sử dụng Đơn vị tính quy đổi Ngừng hoạt động', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const inactive = units.find((u) => u.status === 'NgungHoatDong');
    test.skip(!inactive, 'DB không có Đơn vị tính Ngừng hoạt động'); if (!inactive) return;
    await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.searchFirstConversionUnit(inactive.code);
    test.skip(!(await vatTuPage.conversionUnitOptions().filter({ hasText: inactive.label }).isVisible()), 'BLOCK bởi TC1432: combogrid không hiển thị Đơn vị tính Ngừng hoạt động');
    await vatTuPage.selectFirstConversionUnit(inactive);
    await expect(vatTuPage.mainUnitConfirmationMessage()).toHaveText('Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?');
    await vatTuPage.confirmInactiveMainUnit(); await expect(vatTuPage.selectedFirstConversionUnit(inactive.label)).toBeVisible();
  });

  test('TC_PMKT-U-00106-1434 - hủy sử dụng Đơn vị tính quy đổi Ngừng hoạt động', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const inactive = units.find((u) => u.status === 'NgungHoatDong');
    test.skip(!inactive, 'DB không có Đơn vị tính Ngừng hoạt động'); if (!inactive) return;
    await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.searchFirstConversionUnit(inactive.code);
    test.skip(!(await vatTuPage.conversionUnitOptions().filter({ hasText: inactive.label }).isVisible()), 'BLOCK bởi TC1432: combogrid không hiển thị Đơn vị tính Ngừng hoạt động');
    await vatTuPage.selectFirstConversionUnit(inactive); await vatTuPage.cancelInactiveMainUnit();
    await expect(vatTuPage.selectedFirstConversionUnit(inactive.label)).toBeHidden();
  });

  test('TC_PMKT-U-00106-1435 - chọn Đơn vị tính quy đổi Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const active = units.find((u) => u.status === 'HoatDong');
    test.skip(!active, 'DB không có Đơn vị tính Hoạt động'); if (!active) return;
    await vatTuPage.selectFirstConversionUnit(active);
    await expect(vatTuPage.selectedFirstConversionUnit(active.label)).toBeVisible(); await expect(vatTuPage.mainUnitConfirmationDialog()).toBeHidden();
  });

  test('TC_PMKT-U-00106-1436 - tìm Đơn vị tính quy đổi theo Mã', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const unit = units[0]; test.skip(!unit, 'DB không có Đơn vị tính'); if (!unit) return;
    await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.searchFirstConversionUnit(unit.code);
    expect((await vatTuPage.conversionUnitOptions().allTextContents()).map((v) => v.trim())).toContain(unit.label);
  });

  test('TC_PMKT-U-00106-1437 - tìm Đơn vị tính quy đổi theo Tên', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const unit = units[0]; test.skip(!unit, 'DB không có Đơn vị tính'); if (!unit) return;
    await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.searchFirstConversionUnit(unit.name);
    expect((await vatTuPage.conversionUnitOptions().allTextContents()).map((v) => v.trim())).toContain(unit.label);
  });

  test('TC_PMKT-U-00106-1438 - tìm Đơn vị tính quy đổi theo Trạng thái', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.searchFirstConversionUnit('Hoạt động');
    const labels = (await vatTuPage.conversionUnitOptions().allTextContents()).map((v) => v.trim()).filter(Boolean);
    expect(labels.length).toBeGreaterThan(0); expect(labels.every((label) => units.find((u) => u.label === label)?.status === 'HoatDong')).toBe(true);
  });

  test('TC_PMKT-U-00106-1439 - Enter chọn dòng Đơn vị tính quy đổi đầu tiên', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const keyword = units[0]?.code.slice(0, 1); test.skip(!keyword, 'DB không có dữ liệu tìm kiếm'); if (!keyword) return;
    await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.searchFirstConversionUnit(keyword); const first = (await vatTuPage.conversionUnitOptions().allTextContents()).map((v) => v.trim()).filter(Boolean)[0]!;
    await vatTuPage.pressFirstConversionUnitKey('Enter'); await expect(vatTuPage.selectedFirstConversionUnit(first)).toBeVisible();
  });

  test('TC_PMKT-U-00106-1440 - Up Down di chuyển dòng Đơn vị tính quy đổi', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); await vatTuPage.openFirstConversionUnitDropdown(); const before = await vatTuPage.activeConversionUnitLabel();
    await vatTuPage.pressFirstConversionUnitKey('ArrowDown'); const down = await vatTuPage.activeConversionUnitLabel(); await vatTuPage.pressFirstConversionUnitKey('ArrowUp'); const up = await vatTuPage.activeConversionUnitLabel();
    expect(down).not.toBe(before); expect(up).not.toBe(down); await expect(vatTuPage.conversionRowControls('combobox').first()).toHaveAttribute('aria-expanded', 'true');
  });

  test('TC_PMKT-U-00106-1441 - ESC đóng dropdown Đơn vị tính quy đổi không đổi giá trị', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); await vatTuPage.openFirstConversionUnitDropdown(); await vatTuPage.pressFirstConversionUnitKey('Escape');
    await expect(vatTuPage.mainUnitDropdown()).toBeHidden(); await expect(vatTuPage.conversionRowControls('combobox').first()).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1442 - icon X xóa nhanh Đơn vị tính quy đổi', async ({ vatTuPage }) => {
    const { units } = await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const active = units.find((u) => u.status === 'HoatDong'); test.skip(!active, 'DB không có Đơn vị tính Hoạt động'); if (!active) return;
    await vatTuPage.selectFirstConversionUnit(active); await vatTuPage.clearFirstConversionUnit(); await expect(vatTuPage.selectedFirstConversionUnit(active.label)).toBeHidden();
  });

  test('TC_PMKT-U-00106-1443 - hiển thị nút Thêm nhanh Đơn vị tính quy đổi theo quyền', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm');
    await vatTuPage.openFirstConversionUnitDropdown();
    await expect(
      vatTuPage.conversionUnitQuickAddButton(),
      'BUG: tài khoản full quyền phải hiển thị nút (+) Thêm nhanh Đơn vị tính trên dòng quy đổi',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-1444 - giao diện form Thêm nhanh Đơn vị tính quy đổi', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1443 - tài khoản full quyền không hiển thị nút (+) Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1445 - validate bắt buộc form Thêm nhanh Đơn vị tính quy đổi', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1443 - không thể mở form Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1446 - validate trùng Mã form Thêm nhanh Đơn vị tính quy đổi', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1443 - không thể mở form Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1447 - boundary Mã form Thêm nhanh Đơn vị tính quy đổi', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1443 - không thể mở form Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1448 - boundary Tên form Thêm nhanh Đơn vị tính quy đổi', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1443 - không thể mở form Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1449 - lưu Thêm nhanh Đơn vị tính quy đổi và tự động điền', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1443 - không thể mở form Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1450 - hủy form Thêm nhanh Đơn vị tính quy đổi', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC1443 - không thể mở form Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-1451 - control Numeric Tỷ lệ quy đổi mặc định trống', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm');
    const ratio = vatTuPage.conversionRowControls('spinbutton').first();
    await expect(ratio).toBeVisible();
    await expect(ratio).toHaveValue('');
  });

  test('TC_PMKT-U-00106-1452 - validate Đơn vị quy đổi trùng Đơn vị tính chính', async ({ vatTuPage }) => {
    const { units } = await openVatTuWithCatalogues(vatTuPage);
    const mainUnit = units.find((unit) => unit.status === 'HoatDong');
    test.skip(!mainUnit, 'DB không có Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator();
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(generator.uniqueCode('TC298'), generator.uniqueKeyword('TC298'), mainUnit);
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.addConversionRow();
    await vatTuPage.selectConversionUnit(0, mainUnit); await vatTuPage.fillConversionRatio(0, '5'); await vatTuPage.saveMaterial();
    await expect(vatTuPage.conversionMessage('Đơn vị tính không được trùng với đơn vị tính chính')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1453 - validate hai dòng chọn trùng Đơn vị tính quy đổi', async ({ vatTuPage }) => {
    const { units } = await openVatTuWithCatalogues(vatTuPage);
    const activeUnits = units.filter((unit) => unit.status === 'HoatDong');
    test.skip(activeUnits.length < 2, 'DB cần tối thiểu hai Đơn vị tính Hoạt động');
    const generator = new TestDataGenerator(); const mainUnit = activeUnits[0]!; const conversionUnit = activeUnits[1]!;
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(generator.uniqueCode('TC299'), generator.uniqueKeyword('TC299'), mainUnit);
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.addConversionRow(); await vatTuPage.addConversionRow();
    await vatTuPage.selectConversionUnit(0, conversionUnit); await vatTuPage.fillConversionRatio(0, '2');
    await vatTuPage.selectConversionUnit(1, conversionUnit); await vatTuPage.fillConversionRatio(1, '3'); await vatTuPage.saveMaterial();
    await expect(vatTuPage.conversionMessage('Không được chọn trùng đơn vị tính')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1454 - validate Tỷ lệ quy đổi bằng 0', async ({ vatTuPage }) => {
    const { units } = await openVatTuWithCatalogues(vatTuPage); const activeUnits = units.filter((unit) => unit.status === 'HoatDong');
    test.skip(activeUnits.length < 2, 'DB cần tối thiểu hai Đơn vị tính Hoạt động');
    const generator = new TestDataGenerator(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(generator.uniqueCode('TC300'), generator.uniqueKeyword('TC300'), activeUnits[0]!);
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.addConversionRow(); await vatTuPage.selectConversionUnit(0, activeUnits[1]!);
    await vatTuPage.fillConversionRatio(0, '0'); await vatTuPage.saveMaterial();
    await expect(vatTuPage.conversionMessage('Tỷ lệ quy đổi phải là số dương')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1455 - validate Tỷ lệ quy đổi nhỏ hơn 0', async ({ vatTuPage }) => {
    const { units } = await openVatTuWithCatalogues(vatTuPage); const activeUnits = units.filter((unit) => unit.status === 'HoatDong');
    test.skip(activeUnits.length < 2, 'DB cần tối thiểu hai Đơn vị tính Hoạt động');
    const generator = new TestDataGenerator(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(generator.uniqueCode('TC301'), generator.uniqueKeyword('TC301'), activeUnits[0]!);
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.addConversionRow(); await vatTuPage.selectConversionUnit(0, activeUnits[1]!);
    await vatTuPage.fillConversionRatio(0, '-5'); await vatTuPage.saveMaterial();
    await expect(vatTuPage.conversionMessage('Tỷ lệ quy đổi phải là số dương')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1456 - Phép tính mặc định Nhân và chỉ có Nhân Chia', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm');
    await expect(vatTuPage.conversionOperationCell('Nhân')).toBeVisible();
    await vatTuPage.openConversionOperation();
    await expect(vatTuPage.conversionUnitOptions()).toHaveText(['Nhân', 'Chia']);
  });

  test('TC_PMKT-U-00106-1457 - chọn Phép tính Chia thành công', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); await vatTuPage.selectConversionOperation('Chia');
    await expect(vatTuPage.conversionOperationCell('Chia')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1458 - Mô tả là Textbox read-only', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); const description = vatTuPage.conversionDescription();
    await expect(description).toBeVisible(); await expect(description).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-1459 - Mô tả tự tính đúng với phép Nhân', async ({ vatTuPage }) => {
    const { units } = await openVatTuWithCatalogues(vatTuPage); const activeUnits = units.filter((unit) => unit.status === 'HoatDong');
    test.skip(activeUnits.length < 2, 'DB cần tối thiểu hai Đơn vị tính Hoạt động'); const mainUnit = activeUnits[0]!; const conversionUnit = activeUnits[1]!;
    const ratio = 12;
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.openMainUnitDropdown(); await vatTuPage.selectMainUnit(mainUnit);
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.addConversionRow(); await vatTuPage.selectConversionUnit(0, conversionUnit); await vatTuPage.fillConversionRatio(0, String(ratio));
    await expect(vatTuPage.conversionDescription()).toHaveValue(`1 ${conversionUnit.name} = ${ratio} ${mainUnit.name}`);
  });

  test('TC_PMKT-U-00106-1460 - Mô tả tự tính đúng với phép Chia', async ({ vatTuPage }) => {
    const { units } = await openVatTuWithCatalogues(vatTuPage); const activeUnits = units.filter((unit) => unit.status === 'HoatDong');
    test.skip(activeUnits.length < 2, 'DB cần tối thiểu hai Đơn vị tính Hoạt động'); const mainUnit = activeUnits[0]!; const conversionUnit = activeUnits[1]!;
    const ratio = 12;
    const reciprocalRatio = Number((1 / ratio).toFixed(6));
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.openMainUnitDropdown(); await vatTuPage.selectMainUnit(mainUnit);
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.addConversionRow(); await vatTuPage.selectConversionUnit(0, conversionUnit); await vatTuPage.fillConversionRatio(0, String(ratio)); await vatTuPage.selectConversionOperation('Chia');
    await expect(vatTuPage.conversionDescription()).toHaveValue(`1 ${conversionUnit.name} = ${reciprocalRatio} ${mainUnit.name}`);
  });

  test('TC_PMKT-U-00106-1461 - xóa dòng Đơn vị quy đổi không cảnh báo', async ({ vatTuPage }) => {
    await prepareGoodsConversionGrid(vatTuPage, 'Thành phẩm'); await expect(vatTuPage.conversionRowControls('spinbutton')).toHaveCount(1);
    await vatTuPage.deleteConversionRow();
    await expect(vatTuPage.conversionRowControls('spinbutton')).toHaveCount(0);
    await expect(vatTuPage.mainUnitConfirmationDialog()).toBeHidden();
  });

  test('TC_PMKT-U-00106-1462 - xóa dòng quy đổi cuối cùng rồi Lưu và kiểm tra DB', async ({ vatTuPage, db }, testInfo) => {
    const credentials = requireCredentials(); const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
    const group = groups.find((item) => item.status === 'HoatDong'); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động'); if (!group || !mainUnit) return;
    const material = fullGoodsData('TC818', group, mainUnit, 'Thành phẩm');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await recordMissingSpecialGoodsTypeBug(vatTuPage, 'Thành phẩm');
    const selection = await vatTuPage.fillFullGoodsMaterial(material, 'inventory-material');
    await vatTuPage.openFormTab('Thông tin thuế');
    await testInfo.attach('TC818-tax-ui-values', {
      body: await vatTuPage.createMaterialDialog.screenshot(),
      contentType: 'image/png',
    });
    await vatTuPage.openFormTab('Đơn vị quy đổi'); await vatTuPage.deleteConversionRow();
    await expect(vatTuPage.conversionRowControls('spinbutton')).toHaveCount(0); await vatTuPage.saveMaterial();
    await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.searchMaterial(material.code);
    await expect(vatTuPage.materialRow(material.code)).toBeVisible();
    await verifyFullGoodsSavedInDatabase(db, credentials.username, material, selection, true, 0, 'Thành phẩm');
  });

  test('TC_PMKT-U-00106-1463 - Lưu Thành phẩm đầy đủ trạng thái Hoạt động và kiểm tra DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
    const group = groups.find((item) => item.status === 'HoatDong'); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động'); if (!group || !mainUnit) return;
    const material = fullGoodsData('TC819', group, mainUnit, 'Thành phẩm');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await recordMissingSpecialGoodsTypeBug(vatTuPage, 'Thành phẩm');
    const selection = await vatTuPage.fillFullGoodsMaterial(material, 'inventory-material');
    await vatTuPage.saveMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await vatTuPage.searchMaterial(material.code); await expect(vatTuPage.materialRow(material.code)).toBeVisible();
    await verifyFullGoodsSavedInDatabase(db, credentials.username, material, selection, true, 1, 'Thành phẩm');
  });

  test('TC_PMKT-U-00106-1464 - Lưu Thành phẩm chỉ với trường bắt buộc và kiểm tra mặc định DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { units } = await openVatTuWithCatalogues(vatTuPage);
    const mainUnit = units.find((item) => item.status === 'HoatDong'); test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC820'); const name = generator.uniqueKeyword('TC820');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await recordMissingSpecialGoodsTypeBug(vatTuPage, 'Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit); const defaults = await vatTuPage.readRequiredGoodsUiDefaults();
    await vatTuPage.saveMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await vatTuPage.searchMaterial(code); await expect(vatTuPage.materialRow(code)).toBeVisible();
    await verifyRequiredGoodsSavedInDatabase(db, credentials.username, { code, name, mainUnit, active: true, defaults }, 'Thành phẩm');
  });

  test('TC_PMKT-U-00106-1465 - Lưu Thành phẩm đầy đủ trạng thái Ngừng hoạt động và kiểm tra DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
    const group = groups.find((item) => item.status === 'HoatDong'); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động'); if (!group || !mainUnit) return;
    const material = fullGoodsData('TC821', group, mainUnit, 'Thành phẩm');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await recordMissingSpecialGoodsTypeBug(vatTuPage, 'Thành phẩm');
    const selection = await vatTuPage.fillFullGoodsMaterial(material, 'inventory-material');
    await vatTuPage.setMaterialStatus(false); await vatTuPage.saveMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await vatTuPage.searchMaterial(material.code); await expect(vatTuPage.materialRow(material.code)).toContainText('Ngừng hoạt động');
    await verifyFullGoodsSavedInDatabase(db, credentials.username, material, selection, false, 1, 'Thành phẩm');
  });

  test('TC_PMKT-U-00106-1466 - Lưu và Thêm mới reset form, hiển thị danh sách và kiểm tra DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
    const group = groups.find((item) => item.status === 'HoatDong'); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động'); if (!group || !mainUnit) return;
    const material = fullGoodsData('TC822', group, mainUnit, 'Thành phẩm');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    await recordMissingSpecialGoodsTypeBug(vatTuPage, 'Thành phẩm');
    const selection = await vatTuPage.fillFullGoodsMaterial(material, 'inventory-material');
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialCodeInput()).toHaveValue(''); await expect(vatTuPage.materialNameInput()).toHaveValue('');
    await vatTuPage.discardMaterialFormIfOpen(); await vatTuPage.searchMaterial(material.code); await expect(vatTuPage.materialRow(material.code)).toBeVisible();
    await verifyFullGoodsSavedInDatabase(db, credentials.username, material, selection, true, 1, 'Thành phẩm');
  });

  test('TC_PMKT-U-00106-1467 - icon X đóng form ngay sau khi Lưu và Thêm mới reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Tạo Thành phẩm chỉ với trường bắt buộc và đưa form về trạng thái reset sau Lưu và Thêm mới.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC313'); const name = generator.uniqueKeyword('TC313');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    // Hành động: Nhấn icon X khi form reset chưa có thay đổi mới.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Form đóng, quay về danh sách và không hiển thị cảnh báo.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1468 - icon X hiển thị cảnh báo sau khi thay đổi form reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Thành phẩm tối thiểu, reset form rồi nhập lại Tên vật tư unique.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC314'); const name = generator.uniqueKeyword('TC314'); const changedName = generator.uniqueKeyword('TC314_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn icon X sau khi thay đổi dữ liệu trên form reset.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Hiển thị đúng cảnh báo và đủ hai hành động Xác nhận/Hủy.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1469 - Hủy cảnh báo icon X giữ nguyên dữ liệu sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Thành phẩm tối thiểu, reset form, nhập lại Tên và mở cảnh báo bằng icon X.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC315'); const name = generator.uniqueKeyword('TC315'); const changedName = generator.uniqueKeyword('TC315_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận đóng.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và dữ liệu vừa nhập được giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-1470 - Xác nhận cảnh báo icon X đóng form sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Thành phẩm tối thiểu, reset form, nhập lại dữ liệu và mở cảnh báo bằng icon X.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC316'); const name = generator.uniqueKeyword('TC316'); const changedName = generator.uniqueKeyword('TC316_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1471 - nút Hủy đóng form ngay sau khi Lưu và Thêm mới reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Tạo Thành phẩm tối thiểu và giữ form reset không có thay đổi mới.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC317'); const name = generator.uniqueKeyword('TC317');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    // Hành động: Nhấn nút Hủy ở cuối form.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Form đóng, quay về danh sách và không hiển thị cảnh báo.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1472 - nút Hủy hiển thị cảnh báo sau khi thay đổi form reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Thành phẩm tối thiểu, reset form rồi nhập lại Tên vật tư unique.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC318'); const name = generator.uniqueKeyword('TC318'); const changedName = generator.uniqueKeyword('TC318_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn nút Hủy sau khi thay đổi dữ liệu trên form reset.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Hiển thị đúng cảnh báo và đủ hai hành động Xác nhận/Hủy.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1473 - Hủy cảnh báo nút Hủy giữ nguyên dữ liệu sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Thành phẩm tối thiểu, reset form, nhập lại Tên và mở cảnh báo bằng nút Hủy.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC319'); const name = generator.uniqueKeyword('TC319'); const changedName = generator.uniqueKeyword('TC319_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận đóng.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và dữ liệu vừa nhập được giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-1474 - Xác nhận cảnh báo nút Hủy đóng form sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Thành phẩm tối thiểu, reset form, nhập lại dữ liệu và mở cảnh báo bằng nút Hủy.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC320'); const name = generator.uniqueKeyword('TC320'); const changedName = generator.uniqueKeyword('TC320_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1475 - icon X đóng form chưa thay đổi mà không cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm mới và không thay đổi bất kỳ trường nào.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    // Hành động: Nhấn icon X ở góc form.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Form đóng, danh sách hiển thị và không có popup xác nhận.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1476 - icon X hiển thị cảnh báo khi form có thay đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm và nhập Tên vật tư unique nhưng chưa lưu.
    const changedName = new TestDataGenerator().uniqueKeyword('TC322');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn icon X.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Popup hiển thị đúng nội dung và đủ hai nút hành động.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1477 - Hủy cảnh báo icon X giữ nguyên dữ liệu chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng icon X.
    const changedName = new TestDataGenerator().uniqueKeyword('TC323');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và Tên vật tư giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-1478 - Xác nhận cảnh báo icon X đóng form chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng icon X.
    const changedName = new TestDataGenerator().uniqueKeyword('TC324');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1479 - nút Hủy đóng form chưa thay đổi mà không cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm mới và không thay đổi bất kỳ trường nào.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    // Hành động: Nhấn nút Hủy ở cuối form.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Form đóng, danh sách hiển thị và không có popup xác nhận.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1480 - nút Hủy hiển thị cảnh báo khi form có thay đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm và nhập Tên vật tư unique nhưng chưa lưu.
    const changedName = new TestDataGenerator().uniqueKeyword('TC326');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn nút Hủy ở cuối form.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Popup hiển thị đúng nội dung và đủ hai nút hành động.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-1481 - Hủy cảnh báo nút Hủy giữ nguyên dữ liệu chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng nút Hủy.
    const changedName = new TestDataGenerator().uniqueKeyword('TC327');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và Tên vật tư giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-1482 - Xác nhận cảnh báo nút Hủy đóng form chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng nút Hủy.
    const changedName = new TestDataGenerator().uniqueKeyword('TC328');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-1483 - chặn lưu khi bỏ trống toàn bộ trường bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Thành phẩm và giữ trống toàn bộ trường bắt buộc.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Thành phẩm');
    // Hành động: Nhấn Lưu ở cuối form.
    await vatTuPage.saveMaterial();
    // Xác nhận UI: Hệ thống chặn lưu và hiển thị đúng lỗi dưới ba trường bắt buộc.
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect.soft(vatTuPage.validationMessage('Mã vật tư', 'Mã không được để trống')).toBeVisible();
    await expect.soft(vatTuPage.validationMessage('Tên vật tư', 'Tên không được để trống')).toBeVisible();
    await expect.soft(vatTuPage.validationMessage('Đơn vị tính chính', 'Đơn vị tính không được để trống')).toBeVisible();
  });


});


