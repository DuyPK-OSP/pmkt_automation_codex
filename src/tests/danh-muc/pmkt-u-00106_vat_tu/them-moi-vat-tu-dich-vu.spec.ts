import { test, expect } from '@fixtures/base.fixture';
import { firstVisibleActiveMainUnit, materialTypeDefaultAccountsFromDatabase, openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import {
  boundaryText,
  fullServiceData,
  openGoodsTaxTab,
  prepareGoodsAccounting,
  prepareGoodsExciseTaxes,
  verifyFullServiceSavedInDatabase,
  verifyRequiredGoodsSavedInDatabase,
  verifyMaterialTypeCards,
} from '@helpers/vat-tu-part1.helper';
import { requireCredentials } from '@utils/env.config';
import { TestDataGenerator } from '@utils/test-data';
import { discriminatingSearchKeyword, isGrayCssColor, sharedSearchKeyword, statusPair } from '@utils/vat-tu-test.util';

const normalizeSearchText = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi');

test.describe('PMKT-U-00106 - Thêm mới Vật tư Dịch vụ TC330-TC517', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('TC_PMKT-U-00106-330 - chọn Dịch vụ và hiển thị form thông tin tương ứng', async ({ vatTuPage }) => {
    // Hành động: Mở popup chọn tính chất và chọn card Dịch vụ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Form Dịch vụ hiển thị, đúng các trường/tab ẩn hiện theo ma trận.
    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng sau khi chọn Dịch vụ').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Phải hiển thị popup Thêm mới vật tư').toBeVisible();
    await expect(vatTuPage.materialTypeValue('Dịch vụ'), 'Tính chất phải hiển thị Dịch vụ ở trạng thái chỉ đọc').toBeVisible();
    await expect.soft(vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Dịch vụ phải ẩn Thời hạn bảo hành').toBeHidden();
    await expect.soft(vatTuPage.materialImageLabel(), 'Dịch vụ phải ẩn trường Ảnh').toBeHidden();
    await expect.soft(vatTuPage.formFieldControl('Tài khoản vật tư', 'combobox'), 'Dịch vụ phải ẩn Tài khoản vật tư').toBeHidden();
    await expect.soft(vatTuPage.formFieldControl('Tài khoản giá vốn', 'combobox'), 'Dịch vụ phải ẩn Tài khoản giá vốn').toBeHidden();
    await expect.soft(vatTuPage.formTab('Thông tin kho'), 'Dịch vụ phải ẩn tab Thông tin kho').toBeHidden();
    await expect.soft(vatTuPage.formFieldControl('Thuế nhập khẩu', 'spinbutton'), 'Dịch vụ phải ẩn Thuế nhập khẩu').toBeHidden();
    await expect.soft(vatTuPage.formFieldControl('Thuế xuất khẩu', 'spinbutton'), 'Dịch vụ phải ẩn Thuế xuất khẩu').toBeHidden();
    await expect.soft(vatTuPage.formFieldControl('Thuế tài nguyên', 'combobox'), 'Dịch vụ phải ẩn Thuế tài nguyên').toBeHidden();
    await expect.soft(vatTuPage.formTab('Đơn vị quy đổi'), 'Dịch vụ phải ẩn tab Đơn vị quy đổi').toBeHidden();
    await expect.soft(vatTuPage.formTab('Đơn vị tính khác'), 'Dịch vụ phải hiển thị tab Đơn vị tính khác').toBeVisible();
  });

  test('TC_PMKT-U-00106-331 - thay đổi tính chất hiển thị lại popup đủ 6 lựa chọn', async ({ vatTuPage }) => {
    // Hành động: Mở form Dịch vụ rồi nhấn Thay đổi tính chất.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.changeMaterialType();

    // Xác nhận UI: Popup chọn tính chất hiển thị đầy đủ sáu card.
    await expect(vatTuPage.materialTypeDialog, 'Phải hiển thị lại popup Chọn tính chất').toBeVisible();
    await verifyMaterialTypeCards(vatTuPage);
  });

  test('TC_PMKT-U-00106-332 - đóng popup thay đổi và giữ nguyên Dịch vụ cùng dữ liệu đang nhập', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên vật tư unique để xác minh dữ liệu nhập dở.
    const materialName = new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-332');
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.materialNameInput().fill(materialName);

    // Hành động: Mở lại popup tính chất rồi đóng bằng icon X.
    await vatTuPage.changeMaterialType();
    await vatTuPage.closeMaterialTypePopup();

    // Xác nhận UI: Form vẫn là Dịch vụ và giữ nguyên Tên đã nhập.
    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Form Thêm mới phải tiếp tục hiển thị').toBeVisible();
    await expect(vatTuPage.materialTypeValue('Dịch vụ'), 'Loại vật tư cũ phải được giữ nguyên').toBeVisible();
    await expect(vatTuPage.materialNameInput(), 'Dữ liệu đang nhập phải được giữ nguyên').toHaveValue(materialName);
  });

  test('TC_PMKT-U-00106-333 - thay đổi tính chất từ Dịch vụ sang Hàng hóa', async ({ vatTuPage }) => {
    // Hành động: Mở form Dịch vụ và thay đổi tính chất sang Hàng hóa.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Hàng hóa');

    // Xác nhận UI: Form chuyển sang Hàng hóa và tab Đơn vị tính khác bị ẩn.
    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Form Thêm mới loại Hàng hóa phải hiển thị').toBeVisible();
    await expect(vatTuPage.materialTypeValue('Hàng hóa'), 'Loại vật tư mới phải là Hàng hóa').toBeVisible();
    await expect(vatTuPage.formTab('Đơn vị tính khác'), 'Hàng hóa không được hiển thị tab Đơn vị tính khác').toBeHidden();
  });

  test('TC_PMKT-U-00106-334 - hiển thị TextBox Mã vật tư bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thêm mới Dịch vụ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Mã vật tư là TextBox và có dấu bắt buộc.
    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải hiển thị dưới dạng TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Mã vật tư'), 'Label Mã vật tư phải có dấu * màu đỏ bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-335 - nhập Mã vật tư dài 49 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mã đúng 49 ký tự.
    const code = boundaryText('TC_PMKT-U-00106-335', 49);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Hành động: Nhập Mã vật tư.
    await vatTuPage.materialCodeInput().fill(code);

    // Xác nhận UI: Trường giữ đủ 49 ký tự.
    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải giữ đầy đủ 49 ký tự').toHaveValue(code);
  });

  test('TC_PMKT-U-00106-336 - nhập Mã vật tư dài tối đa 50 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mã đúng 50 ký tự.
    const code = boundaryText('TC_PMKT-U-00106-336', 50);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.materialCodeInput().fill(code);

    // Xác nhận UI: Trường giữ đủ 50 ký tự.
    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải giữ đầy đủ 50 ký tự').toHaveValue(code);
  });

  test('TC_PMKT-U-00106-337 - chặn ký tự thứ 51 của Mã vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mã 50 ký tự và thêm ký tự thứ 51.
    const firstFiftyCharacters = boundaryText('TC_PMKT-U-00106-337', 50);
    const fiftyOneCharacters = `${firstFiftyCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.materialCodeInput().fill(fiftyOneCharacters);

    // Xác nhận UI: Trường chỉ giữ tối đa 50 ký tự.
    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải chặn cứng ký tự thứ 51').toHaveValue(firstFiftyCharacters);
  });

  test('TC_PMKT-U-00106-338 - validate bỏ trống Mã vật tư khi Lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Hoạt động từ DB/UI và nhập đủ trường bắt buộc còn lại.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredMaterialFields('', new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-338'), mainUnit);

    // Hành động: Nhấn Lưu khi Mã vật tư trống.
    await vatTuPage.saveMaterial();

    // Xác nhận UI: Hệ thống chặn lưu và hiển thị đúng message theo testcase.
    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi Mã vật tư trống').toBeVisible();
    await expect(vatTuPage.validationMessage('Mã vật tư', 'Mã không được để trống'), 'Phải hiển thị lỗi Mã không được để trống').toBeVisible();
  });

  test('TC_PMKT-U-00106-339 - validate trùng Mã vật tư đã tồn tại', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy Mã vật tư tồn tại và Đơn vị tính Hoạt động từ DB đúng tenant.
    const credentials = requireCredentials();
    const existingCode = await db.vatTu.findFirstExistingCodeForDefaultTenant(credentials.username);
    test.skip(!existingCode, 'Precondition DB đúng tenant không có vật tư đang tồn tại');
    if (!existingCode) return;
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredMaterialFields(existingCode, new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-339'), mainUnit);

    // Hành động: Nhấn Lưu với Mã đã tồn tại.
    await vatTuPage.saveMaterial();

    // Xác nhận UI: Hệ thống chặn lưu và thông báo trùng mã.
    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu mã vật tư trùng').toBeVisible();
    await expect(vatTuPage.notificationMessage('Mã vật tư đã tồn tại'), 'Phải hiển thị MSG_PMKT-U-00106_003').toBeVisible();
  });

  test('TC_PMKT-U-00106-340 - hiển thị TextBox Tên vật tư bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thêm mới Dịch vụ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Tên vật tư là TextBox và có dấu bắt buộc.
    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải hiển thị dưới dạng TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư'), 'Label Tên vật tư phải có dấu * màu đỏ bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-341 - nhập Tên vật tư dài 254 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên đúng 254 ký tự.
    const name = boundaryText('TC_PMKT-U-00106-341', 254);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.materialNameInput().fill(name);

    // Xác nhận UI: Trường giữ đủ 254 ký tự.
    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải giữ đầy đủ 254 ký tự').toHaveValue(name);
  });

  test('TC_PMKT-U-00106-342 - nhập Tên vật tư dài tối đa 255 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên đúng 255 ký tự.
    const name = boundaryText('TC_PMKT-U-00106-342', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.materialNameInput().fill(name);

    // Xác nhận UI: Trường giữ đủ 255 ký tự.
    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải giữ đầy đủ 255 ký tự').toHaveValue(name);
  });

  test('TC_PMKT-U-00106-343 - chặn ký tự thứ 256 của Tên vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên 255 ký tự và thêm ký tự thứ 256.
    const firstTwoHundredFiftyFiveCharacters = boundaryText('TC_PMKT-U-00106-343', 255);
    const twoHundredFiftySixCharacters = `${firstTwoHundredFiftyFiveCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.materialNameInput().fill(twoHundredFiftySixCharacters);

    // Xác nhận UI: Trường chỉ giữ tối đa 255 ký tự.
    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải chặn cứng ký tự thứ 256').toHaveValue(firstTwoHundredFiftyFiveCharacters);
  });

  test('TC_PMKT-U-00106-344 - validate bỏ trống Tên vật tư khi Lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Hoạt động từ DB/UI và nhập đủ trường bắt buộc còn lại.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredMaterialFields(new TestDataGenerator().uniqueCode('TC_PMKT-U-00106-344'), '', mainUnit);

    // Hành động: Nhấn Lưu khi Tên vật tư trống.
    await vatTuPage.saveMaterial();

    // Xác nhận UI: Hệ thống chặn lưu và hiển thị đúng message theo testcase.
    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi Tên vật tư trống').toBeVisible();
    await expect(vatTuPage.validationMessage('Tên vật tư', 'Tên không được để trống'), 'Phải hiển thị lỗi Tên không được để trống').toBeVisible();
  });

  test('TC_PMKT-U-00106-345 - hiển thị Dropdown Nhóm vật tư không bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thêm mới Dịch vụ và quan sát Nhóm vật tư.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Control là dropdown và label không có dấu bắt buộc.
    await expect(vatTuPage.groupCombobox, 'Nhóm vật tư phải là Dropdown').toBeVisible();
    await expect(vatTuPage.requiredFormField('Nhóm vật tư'), 'Nhóm vật tư không được hiển thị dấu * bắt buộc').toBeHidden();
  });

  test('TC_PMKT-U-00106-346 - hiển thị đúng dữ liệu và thứ tự Dropdown Nhóm vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy toàn bộ Nhóm vật tư từ DB đúng tenant làm expected.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    test.skip(catalogues.groups.length === 0, 'Danh mục Nhóm vật tư trong DB không có dữ liệu');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
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

  test('TC_PMKT-U-00106-347 - Nhóm vật tư Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy cặp Nhóm vật tư Hoạt động/Ngừng hoạt động từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const pair = statusPair(catalogues.groups);
    test.skip(!pair, 'DB thiếu đồng thời Nhóm vật tư Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openGroupDropdown();

    // Xác nhận UI: Style chữ của nhóm Ngừng hoạt động khác nhóm Hoạt động.
    const activeStyle = await vatTuPage.groupOptionStyle(pair.active.label);
    const inactiveStyle = await vatTuPage.groupOptionStyle(pair.inactive.label);
    expect(inactiveStyle, 'Màu/độ mờ của Nhóm Ngừng hoạt động phải khác Nhóm Hoạt động').not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-348 - chọn một Nhóm vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn Nhóm vật tư đầu tiên từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const group = catalogues.groups[0];
    test.skip(!group, 'Danh mục Nhóm vật tư trong DB không có dữ liệu');
    if (!group) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openGroupDropdown();

    // Hành động: Chọn một Nhóm vật tư.
    await vatTuPage.selectGroup(group);

    // Xác nhận UI: Nhóm vừa chọn hiển thị dưới dạng tag.
    await expect(vatTuPage.selectedGroup(group.label), 'Nhóm đã chọn phải hiển thị dạng tag').toBeVisible();
  });

  test('TC_PMKT-U-00106-349 - chọn đồng thời hai Nhóm vật tư', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn hai Nhóm vật tư khác nhau từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'DB cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openGroupDropdown();

    // Hành động: Chọn lần lượt hai Nhóm vật tư.
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);

    // Xác nhận UI: Cả hai nhóm cùng hiển thị dưới dạng tag.
    await expect(vatTuPage.selectedGroup(firstGroup.label), 'Tag Nhóm vật tư thứ nhất phải hiển thị').toBeVisible();
    await expect(vatTuPage.selectedGroup(secondGroup.label), 'Tag Nhóm vật tư thứ hai phải hiển thị').toBeVisible();
  });

  test('TC_PMKT-U-00106-350 - xóa riêng tag Nhóm vật tư thứ hai', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn hai Nhóm vật tư khác nhau từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'DB cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(firstGroup);
    await vatTuPage.selectGroup(secondGroup);

    // Hành động: Xóa riêng tag thứ hai.
    await vatTuPage.removeSelectedGroup(secondGroup.label);

    // Xác nhận UI: Tag thứ hai bị xóa và tag thứ nhất vẫn được giữ lại.
    await expect(vatTuPage.selectedGroup(secondGroup.label), 'Tag Nhóm vật tư thứ hai phải bị xóa').toBeHidden();
    await expect(vatTuPage.selectedGroup(firstGroup.label), 'Tag Nhóm vật tư thứ nhất phải được giữ lại').toBeVisible();
  });

  test('TC_PMKT-U-00106-351 - xóa nhanh toàn bộ Nhóm vật tư đã chọn', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Chọn hai Nhóm vật tư khác nhau từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const [firstGroup, secondGroup] = catalogues.groups;
    test.skip(!firstGroup || !secondGroup, 'DB cần tối thiểu hai Nhóm vật tư');
    if (!firstGroup || !secondGroup) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
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
  test('TC_PMKT-U-00106-352 - hiển thị Select Loại dịch vụ đặc trưng không bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thêm mới Dịch vụ và quan sát control Loại dịch vụ đặc trưng.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Control là Select và label không có dấu bắt buộc.
    await expect(vatTuPage.specialGoodsTypeCombobox(), 'Loại dịch vụ đặc trưng phải là Select').toBeVisible();
    await expect(
      vatTuPage.requiredFormField('Loại dịch vụ đặc trưng'),
      'Loại dịch vụ đặc trưng không được hiển thị dấu * bắt buộc',
    ).toBeHidden();
  });

  test('TC_PMKT-U-00106-353 - hiển thị các option Loại dịch vụ đặc trưng của Dịch vụ', async ({ vatTuPage }) => {
    // Hành động: Mở form Dịch vụ và mở Select Loại dịch vụ đặc trưng.
    const expectedOptions = ['Dịch vụ vận chuyển', 'Dịch vụ vận chuyển trên nền tảng số'];
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openSpecialGoodsTypeDropdown();

    // Xác nhận UI: Select hiển thị đủ hai option đúng testcase.
    await expect(vatTuPage.specialGoodsTypeCombobox(), 'Trường Loại dịch vụ đặc trưng phải hiển thị').toBeVisible();
    for (const option of expectedOptions) {
      await expect(vatTuPage.specialGoodsTypeOption(option), `Phải hiển thị option ${option}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-354 - hiển thị Combogrid Đơn vị tính chính không bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Thêm mới Dịch vụ và quan sát control Đơn vị tính chính.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Control là combogrid và label không có dấu bắt buộc.
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Đơn vị tính chính'), 'Đơn vị tính chính không được hiển thị dấu * bắt buộc').toBeHidden();
  });

  test('TC_PMKT-U-00106-355 - hiển thị đúng cột, dữ liệu và thứ tự Đơn vị tính chính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy toàn bộ Đơn vị tính từ DB đúng tenant làm expected.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    test.skip(catalogues.units.length === 0, 'Danh mục Đơn vị tính trong DB không có dữ liệu');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
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

  test('TC_PMKT-U-00106-356 - Đơn vị tính Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy một cặp Đơn vị tính Hoạt động/Ngừng hoạt động từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const pair = statusPair(catalogues.units);
    test.skip(!pair, 'DB thiếu đồng thời Đơn vị tính Hoạt động và Ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();

    // Xác nhận UI: Style chữ của bản ghi Ngừng hoạt động khác bản ghi Hoạt động.
    await vatTuPage.searchMainUnit(pair.active.code);
    const activeStyle = await vatTuPage.mainUnitOptionStyle(pair.active.label);
    await vatTuPage.searchMainUnit(pair.inactive.code);
    const inactiveStyle = await vatTuPage.mainUnitOptionStyle(pair.inactive.label);
    expect(inactiveStyle, 'Màu/độ mờ của Đơn vị tính Ngừng hoạt động phải khác Đơn vị tính Hoạt động').not.toEqual(activeStyle);
  });

  test('TC_PMKT-U-00106-357 - xác nhận sử dụng Đơn vị tính Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Ngừng hoạt động từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const inactiveUnit = catalogues.units.find((unit) => unit.status === 'NgungHoatDong');
    test.skip(!inactiveUnit, 'DB không có Đơn vị tính Ngừng hoạt động');
    if (!inactiveUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
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

  test('TC_PMKT-U-00106-358 - hủy sử dụng Đơn vị tính Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Ngừng hoạt động từ DB; trường ban đầu để trống.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const inactiveUnit = catalogues.units.find((unit) => unit.status === 'NgungHoatDong');
    test.skip(!inactiveUnit, 'DB không có Đơn vị tính Ngừng hoạt động');
    if (!inactiveUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
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

  test('TC_PMKT-U-00106-359 - chọn Đơn vị tính chính Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lấy Đơn vị tính Hoạt động đầu tiên từ DB đúng tenant.
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!activeUnit, 'DB không có Đơn vị tính Hoạt động');
    if (!activeUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();

    // Hành động: Chọn một bản ghi Đơn vị tính Hoạt động.
    await vatTuPage.selectMainUnit(activeUnit);

    // Xác nhận UI: Giá trị được chọn và không xuất hiện popup xác nhận.
    await expect(vatTuPage.selectedMainUnit(activeUnit.label), 'Đơn vị tính Hoạt động phải được chọn thành công').toBeVisible();
    await expect(vatTuPage.mainUnitConfirmationDialog(), 'Không được hiển thị cảnh báo khi chọn Đơn vị tính Hoạt động').toBeHidden();
  });

  test('TC_PMKT-U-00106-360 - tìm kiếm Đơn vị tính chính theo Mã', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const keyword = discriminatingSearchKeyword(
      catalogues.units.map(({ code }) => normalizeSearchText(code)),
      catalogues.units.map(({ name }) => normalizeSearchText(name)),
    );
    test.skip(!keyword, 'DB không có keyword chỉ xuất hiện trong Mã và không xuất hiện trong Tên Đơn vị tính');
    if (!keyword) return;
    const expected = catalogues.units.filter(({ code }) => normalizeSearchText(code).includes(normalizeSearchText(keyword)));
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(keyword);

    expect(await vatTuPage.visibleMainUnitLabels(expected.length), 'Số kết quả tìm theo Mã trên UI phải khớp DB').toHaveLength(expected.length);
    for (const option of expected) {
      await expect.soft(vatTuPage.mainUnitOption(option.label), `Phải hiển thị Mã Đơn vị tính chứa ${keyword}: ${option.code}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-361 - tìm kiếm Đơn vị tính chính theo Tên', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const keyword = discriminatingSearchKeyword(
      catalogues.units.map(({ name }) => normalizeSearchText(name)),
      catalogues.units.map(({ code }) => normalizeSearchText(code)),
    );
    test.skip(!keyword, 'DB không có keyword chỉ xuất hiện trong Tên và không xuất hiện trong Mã Đơn vị tính');
    if (!keyword) return;
    const expected = catalogues.units.filter(({ name }) => normalizeSearchText(name).includes(normalizeSearchText(keyword)));
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(keyword);

    expect(await vatTuPage.visibleMainUnitLabels(expected.length), 'Số kết quả tìm theo Tên trên UI phải khớp DB').toHaveLength(expected.length);
    for (const option of expected) {
      await expect.soft(vatTuPage.mainUnitOption(option.label), `Phải hiển thị Tên Đơn vị tính chứa ${keyword}: ${option.name}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-362 - tìm kiếm Đơn vị tính chính theo Trạng thái', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const expected = catalogues.units.filter(({ status }) => status === 'NgungHoatDong');
    test.skip(expected.length === 0, 'DB không có Đơn vị tính Ngừng hoạt động');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit('Ngừng hoạt động');

    const actualStatuses = await vatTuPage.visibleMainUnitStatuses(expected.length);
    expect(actualStatuses, 'Số kết quả tìm theo Trạng thái trên UI phải khớp DB').toHaveLength(expected.length);
    expect(actualStatuses, 'Mọi kết quả phải có trạng thái Ngừng hoạt động').toEqual(expected.map(() => 'NgungHoatDong'));
  });


  test('TC_PMKT-U-00106-363 - phím Enter chọn dòng đầu tiên của kết quả tìm kiếm', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const keyword = sharedSearchKeyword(catalogues.units.map(({ code }) => code));
    test.skip(!keyword, 'DB không có từ khóa Mã chung cho ít nhất hai Đơn vị tính');
    if (!keyword) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(keyword);
    const [firstResult] = await vatTuPage.visibleMainUnitLabels();
    expect(firstResult, 'Từ khóa phải trả về ít nhất một kết quả').toBeDefined();
    await vatTuPage.pressMainUnitKey('Enter');

    await expect(vatTuPage.mainUnitDropdown(), 'Dropdown phải đóng sau khi nhấn Enter').toBeHidden();
    await expect(vatTuPage.selectedMainUnit(firstResult ?? ''), 'Enter phải chọn đúng dòng đầu tiên').toBeVisible();
  });

  test('TC_PMKT-U-00106-364 - phím Up và Down di chuyển vùng chọn', async ({ vatTuPage }) => {
    await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
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

  test('TC_PMKT-U-00106-365 - phím ESC đóng dropdown và giữ nguyên giá trị', async ({ vatTuPage }) => {
    await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.pressMainUnitKey('Escape');

    await expect(vatTuPage.mainUnitDropdown(), 'Dropdown phải đóng sau khi nhấn ESC').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue('');
  });

  test('TC_PMKT-U-00106-366 - icon X xóa nhanh Đơn vị tính chính đã chọn', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    const activeUnit = catalogues.units.find(({ status }) => status === 'HoatDong');
    test.skip(!activeUnit, 'DB không có Đơn vị tính Hoạt động để kiểm tra xóa nhanh');
    if (!activeUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.selectMainUnit(activeUnit);
    await vatTuPage.clearMainUnit();

    await expect(vatTuPage.selectedMainUnit(activeUnit.label), 'Giá trị Đơn vị tính đã chọn phải bị xóa').toBeHidden();
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải quay về trạng thái trống').toHaveValue('');
  });

  test('TC_PMKT-U-00106-367 - hiển thị nút thêm nhanh Đơn vị tính với tài khoản full quyền', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openMainUnitDropdown();

    await expect(
      vatTuPage.mainUnitQuickAddButton(),
      'BUG: tài khoản full quyền phải hiển thị nút (+) Thêm nhanh Đơn vị tính',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-368 - giao diện form thêm nhanh Đơn vị tính rút gọn', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC367 - tài khoản full quyền không hiển thị nút (+) Thêm nhanh Đơn vị tính');
  });

  test('TC_PMKT-U-00106-369 - validate bắt buộc form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC367');
  });

  test('TC_PMKT-U-00106-370 - validate trùng Mã form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC367');
  });

  test('TC_PMKT-U-00106-371 - boundary Mã form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC367');
  });

  test('TC_PMKT-U-00106-372 - boundary Tên form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC367');
  });

  test('TC_PMKT-U-00106-373 - lưu thêm nhanh Đơn vị tính và tự động điền', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC367');
  });

  test('TC_PMKT-U-00106-374 - hủy form thêm nhanh Đơn vị tính', async () => {
    test.skip(true, 'BLOCK: bị chặn bởi TC367');
  });

  test('TC_PMKT-U-00106-375 - cho phép lưu Dịch vụ không có Đơn vị tính chính', async ({ vatTuPage, db }) => {
    const data = new TestDataGenerator();
    const credentials = requireCredentials();
    const code = data.uniqueCode('TC375');
    const name = data.uniqueKeyword('TC375');
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Mã vật tư', code);
    await vatTuPage.fillFormField('Tên vật tư', name);
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính phải được để trống').toHaveValue('');
    await vatTuPage.saveMaterial();

    await expect.soft(vatTuPage.successNotification(), 'Phải thông báo thêm mới thành công').toContainText('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog, 'Form phải đóng sau khi lưu thành công').toBeHidden();
    await expect.poll(
      async () => (await db.vatTu.findByCodeForDefaultTenant(credentials.username, code)).length,
      { message: `DB đúng tenant phải có đúng một Dịch vụ ${code}` },
    ).toBe(1);
    const [actual] = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
    expect(actual?.code).toBe(code);
    expect(actual?.name).toBe(name);
    expect(actual?.materialType).toBe('Dịch vụ');
    expect(
      (actual?.mainUnit ?? '').replace(/[\s—-]/g, ''),
      'DB phải không lưu mã/tên Đơn vị tính chính khi UI để trống',
    ).toBe('');
  });
  test('TC_PMKT-U-00106-376 - hiển thị checkbox Giảm thuế theo quy định không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.checkbox('Giảm thuế theo quy định'), 'Phải hiển thị checkbox Giảm thuế theo quy định').toBeVisible();
    await expect(vatTuPage.requiredFormField('Giảm thuế theo quy định'), 'Checkbox không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-377 - checkbox Giảm thuế mặc định false và thay đổi được', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    const reducedTax = vatTuPage.checkbox('Giảm thuế theo quy định');

    await expect(reducedTax, 'Checkbox Giảm thuế phải mặc định false').not.toBeChecked();
    await vatTuPage.setCheckbox('Giảm thuế theo quy định', true);
    await expect(reducedTax, 'Checkbox phải chuyển sang trạng thái được tích').toBeChecked();
    await vatTuPage.setCheckbox('Giảm thuế theo quy định', false);
    await expect(reducedTax, 'Checkbox phải trở lại trạng thái không tích').not.toBeChecked();
  });


  test('TC_PMKT-U-00106-378 - hiển thị TextArea Mô tả không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.textarea('Mô tả'), 'Phải hiển thị control TextArea Mô tả').toBeVisible();
    await expect(vatTuPage.requiredFormField('Mô tả'), 'Mô tả không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-379 - boundary Mô tả 499 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mô tả traceable dài 499 ký tự tại cận Max-1.
    const input = boundaryText('TC_PMKT-U-00106-379', 499);
    // Hành động: Mở form Dịch vụ > nhập Mô tả.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Mô tả', input);
    // Xác nhận UI: Trường giữ đầy đủ 499 ký tự.
    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải giữ đúng 499 ký tự').toHaveValue(input);
  });

  test('TC_PMKT-U-00106-380 - boundary Mô tả 500 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mô tả traceable dài đúng 500 ký tự tại Max.
    const input = boundaryText('TC_PMKT-U-00106-380', 500);
    // Hành động: Mở form Dịch vụ > nhập Mô tả.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Mô tả', input);
    // Xác nhận UI: Trường giữ đầy đủ 500 ký tự.
    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải giữ đúng 500 ký tự').toHaveValue(input);
  });

  test('TC_PMKT-U-00106-381 - boundary Mô tả 501 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Mô tả traceable dài 501 ký tự tại cận Max+1.
    const input = boundaryText('TC_PMKT-U-00106-381', 501);
    // Hành động: Mở form Dịch vụ > nhập Mô tả vượt giới hạn.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Mô tả', input);
    // Xác nhận UI: Trường chặn ký tự thứ 501 và chỉ giữ 500 ký tự.
    await expect(vatTuPage.textarea('Mô tả'), 'Mô tả phải chỉ giữ tối đa 500 ký tự').toHaveValue(input.slice(0, 500));
  });

  test('TC_PMKT-U-00106-382 - hiển thị TextBox Tên vật tư khi mua không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Phải hiển thị TextBox Tên vật tư khi mua').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư khi mua'), 'Tên vật tư khi mua không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-383 - boundary Tên vật tư khi mua 254 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên mua traceable dài 254 ký tự tại cận Max-1.
    const input = boundaryText('TC_PMKT-U-00106-383', 254);
    // Hành động: Mở form Dịch vụ > nhập Tên vật tư khi mua.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư khi mua', input);
    // Xác nhận UI: Trường giữ đầy đủ 254 ký tự.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên mua phải giữ đúng 254 ký tự').toHaveValue(input);
  });

  test('TC_PMKT-U-00106-384 - boundary Tên vật tư khi mua 255 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên mua traceable dài đúng 255 ký tự tại Max.
    const input = boundaryText('TC_PMKT-U-00106-384', 255);
    // Hành động: Mở form Dịch vụ > nhập Tên vật tư khi mua.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư khi mua', input);
    // Xác nhận UI: Trường giữ đầy đủ 255 ký tự.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên mua phải giữ đúng 255 ký tự').toHaveValue(input);
  });

  test('TC_PMKT-U-00106-385 - boundary Tên vật tư khi mua 256 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên mua traceable dài 256 ký tự tại cận Max+1.
    const input = boundaryText('TC_PMKT-U-00106-385', 256);
    // Hành động: Mở form Dịch vụ > nhập Tên vật tư khi mua vượt giới hạn.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư khi mua', input);
    // Xác nhận UI: Trường chặn ký tự thứ 256 và chỉ giữ 255 ký tự.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), 'Tên mua phải chỉ giữ tối đa 255 ký tự').toHaveValue(input.slice(0, 255));
  });

  test('TC_PMKT-U-00106-386 - hiển thị TextBox Tên vật tư khi bán không bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Phải hiển thị TextBox Tên vật tư khi bán').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư khi bán'), 'Tên vật tư khi bán không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-387 - boundary Tên vật tư khi bán 254 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên bán traceable dài 254 ký tự tại cận Max-1.
    const input = boundaryText('TC_PMKT-U-00106-387', 254);
    // Hành động: Mở form Dịch vụ > nhập Tên vật tư khi bán.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư khi bán', input);
    // Xác nhận UI: Trường giữ đầy đủ 254 ký tự.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên bán phải giữ đúng 254 ký tự').toHaveValue(input);
  });

  test('TC_PMKT-U-00106-388 - boundary Tên vật tư khi bán 255 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên bán traceable dài đúng 255 ký tự tại Max.
    const input = boundaryText('TC_PMKT-U-00106-388', 255);
    // Hành động: Mở form Dịch vụ > nhập Tên vật tư khi bán.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư khi bán', input);
    // Xác nhận UI: Trường giữ đầy đủ 255 ký tự.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên bán phải giữ đúng 255 ký tự').toHaveValue(input);
  });

  test('TC_PMKT-U-00106-389 - boundary Tên vật tư khi bán 256 ký tự', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Sinh Tên bán traceable dài 256 ký tự tại cận Max+1.
    const input = boundaryText('TC_PMKT-U-00106-389', 256);
    // Hành động: Mở form Dịch vụ > nhập Tên vật tư khi bán vượt giới hạn.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư khi bán', input);
    // Xác nhận UI: Trường chặn ký tự thứ 256 và chỉ giữ 255 ký tự.
    await expect(vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), 'Tên bán phải chỉ giữ tối đa 255 ký tự').toHaveValue(input.slice(0, 255));
  });

  test('TC_PMKT-U-00106-390 - Tên vật tư khi mua tự điền và cho phép sửa độc lập', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư', 'VT_TEST_001');
    const purchaseName = vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox');
    await expect(purchaseName, 'Tên vật tư khi mua phải tự điền theo Tên vật tư').toHaveValue('VT_TEST_001');
    await vatTuPage.fillFormField('Tên vật tư khi mua', 'VT_TEST_001_MUA');

    await expect(purchaseName, 'Phải cho phép sửa độc lập Tên vật tư khi mua').toHaveValue('VT_TEST_001_MUA');
    await expect(vatTuPage.formFieldControl('Tên vật tư', 'textbox'), 'Tên vật tư gốc phải được giữ nguyên').toHaveValue('VT_TEST_001');
  });

  test('TC_PMKT-U-00106-391 - Tên vật tư khi bán tự điền và cho phép sửa độc lập', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillFormField('Tên vật tư', 'VT_TEST_001');
    const saleName = vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox');
    await expect(saleName, 'Tên vật tư khi bán phải tự điền theo Tên vật tư').toHaveValue('VT_TEST_001');
    await vatTuPage.fillFormField('Tên vật tư khi bán', 'VT_TEST_001_BAN');

    await expect(saleName, 'Phải cho phép sửa độc lập Tên vật tư khi bán').toHaveValue('VT_TEST_001_BAN');
    await expect(vatTuPage.formFieldControl('Tên vật tư', 'textbox'), 'Tên vật tư gốc phải được giữ nguyên').toHaveValue('VT_TEST_001');
  });


  test('TC_PMKT-U-00106-392 - hiển thị Toggle Trạng thái bắt buộc', async ({ vatTuPage }) => {
    // Hành động: Mở form Dịch vụ và quan sát trường Trạng thái.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');

    // Xác nhận UI: Trạng thái là Toggle và label có dấu * bắt buộc.
    await expect(vatTuPage.statusSwitch(), 'Trạng thái phải hiển thị dưới dạng Toggle').toBeVisible();
    const requiredIndicator = await vatTuPage.statusRequiredIndicatorStyle();
    expect(requiredIndicator.content, 'Label Trạng thái phải hiển thị dấu * bắt buộc').toContain('*');
    expect(requiredIndicator.color, 'Dấu * bắt buộc của Trạng thái phải có màu đỏ').toBe('rgb(244, 63, 94)');
  });

  test('TC_PMKT-U-00106-393 - Trạng thái mặc định Hoạt động và thay đổi được', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    const statusSwitch = vatTuPage.statusSwitch();

    // Xác nhận UI: Toggle mặc định là Hoạt động.
    await expect(statusSwitch, 'Trạng thái mặc định phải là Hoạt động').toBeChecked();

    // Hành động: Chuyển Toggle sang Ngừng hoạt động.
    await vatTuPage.setMaterialStatus(false);

    // Xác nhận UI: Toggle chuyển sang Ngừng hoạt động thành công.
    await expect(statusSwitch, 'Trạng thái phải chuyển sang Ngừng hoạt động').not.toBeChecked();
  });

  test('TC_PMKT-U-00106-394 - tự điền 5 tài khoản theo cấu hình Dịch vụ trong DB', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy cấu hình tài khoản Loại vật tư Dịch vụ trong đúng tenant.
    const expectedAccounts = await materialTypeDefaultAccountsFromDatabase('DV');
    test.skip(!expectedAccounts, 'DB không có cấu hình Loại vật tư Dịch vụ mã DV trong tenant hiện tại');
    if (!expectedAccounts) return;

    // Hành động: Mở form Dịch vụ và đọc các tài khoản tại tab Hạch toán ngầm định.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openDefaultAccountingTab();

    // Xác nhận UI/DB: Năm tài khoản hiển thị khớp cấu hình và hai tài khoản kho bị ẩn.
    for (const label of [
      'Tài khoản doanh thu',
      'Tài khoản hàng bán trả lại',
      'Tài khoản chi phí',
      'Tài khoản chiết khấu',
      'Tài khoản giảm giá',
    ]) {
      expect(
        await vatTuPage.currentFormOption(label),
        `${label} trên UI phải khớp cấu hình mst_loai_vat_tu`,
      ).toBe(expectedAccounts[label]);
    }
    await expect(vatTuPage.formField('Tài khoản vật tư'), 'Dịch vụ phải ẩn Tài khoản vật tư').toBeHidden();
    await expect(vatTuPage.formField('Tài khoản giá vốn'), 'Dịch vụ phải ẩn Tài khoản giá vốn').toBeHidden();
  });

  test('TC_PMKT-U-00106-395 - hiển thị combogrid Tài khoản doanh thu không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản doanh thu'), 'Phải hiển thị label Tài khoản doanh thu').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox'), 'Tài khoản doanh thu phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản doanh thu'), 'Tài khoản doanh thu không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-396 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-397 - Tài khoản doanh thu Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-398 - xác nhận sử dụng Tài khoản doanh thu Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Chọn tài khoản Ngừng hoạt động và xác nhận sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.selectAccountingAccount('Tài khoản doanh thu', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(true);

    // Xác nhận UI: Popup đóng và tài khoản được chọn.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Xác nhận').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản doanh thu', inactiveAccount.label), 'Tài khoản Ngừng hoạt động phải được chọn').toBeVisible();
  });

  test('TC_PMKT-U-00106-399 - hủy sử dụng Tài khoản doanh thu Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox').inputValue();

    // Hành động: Chọn tài khoản Ngừng hoạt động và hủy sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');
    await vatTuPage.selectAccountingAccount('Tài khoản doanh thu', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(false);

    // Xác nhận UI: Popup đóng và giá trị cũ được giữ nguyên.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Hủy').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox'), 'Hủy phải giữ nguyên giá trị tài khoản cũ').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-400 - chọn Tài khoản doanh thu Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-401 - tìm Tài khoản doanh thu theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-402 - tìm Tài khoản doanh thu theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-403 - tìm Tài khoản doanh thu theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-404 - Enter chọn dòng Tài khoản doanh thu đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-405 - phím Up và Down di chuyển từng dòng Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox');
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

  test('TC_PMKT-U-00106-406 - ESC đóng dropdown Tài khoản doanh thu không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản doanh thu');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản doanh thu', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-407 - icon X xóa nhanh Tài khoản doanh thu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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
    await expect(vatTuPage.formFieldControl('Tài khoản doanh thu', 'combobox'), 'Tài khoản doanh thu phải trở về trống').toHaveValue('');
  });


  test('TC_PMKT-U-00106-408 - hiển thị combogrid Tài khoản hàng bán trả lại không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản hàng bán trả lại'), 'Phải hiển thị label Tài khoản hàng bán trả lại').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox'), 'Tài khoản hàng bán trả lại phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản hàng bán trả lại'), 'Tài khoản hàng bán trả lại không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-409 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-410 - Tài khoản hàng bán trả lại Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-411 - xác nhận sử dụng Tài khoản hàng bán trả lại Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Chọn tài khoản Ngừng hoạt động và xác nhận sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.selectAccountingAccount('Tài khoản hàng bán trả lại', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(true);

    // Xác nhận UI: Popup đóng và tài khoản được chọn.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Xác nhận').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản hàng bán trả lại', inactiveAccount.label), 'Tài khoản Ngừng hoạt động phải được chọn').toBeVisible();
  });

  test('TC_PMKT-U-00106-412 - hủy sử dụng Tài khoản hàng bán trả lại Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox').inputValue();

    // Hành động: Chọn tài khoản Ngừng hoạt động và hủy sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');
    await vatTuPage.selectAccountingAccount('Tài khoản hàng bán trả lại', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(false);

    // Xác nhận UI: Popup đóng và giá trị cũ được giữ nguyên.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Hủy').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox'), 'Hủy phải giữ nguyên giá trị tài khoản cũ').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-413 - chọn Tài khoản hàng bán trả lại Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-414 - tìm Tài khoản hàng bán trả lại theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-415 - tìm Tài khoản hàng bán trả lại theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-416 - tìm Tài khoản hàng bán trả lại theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-417 - Enter chọn dòng Tài khoản hàng bán trả lại đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-418 - phím Up và Down di chuyển từng dòng Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox');
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

  test('TC_PMKT-U-00106-419 - ESC đóng dropdown Tài khoản hàng bán trả lại không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản hàng bán trả lại');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản hàng bán trả lại', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-420 - icon X xóa nhanh Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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
    await expect(vatTuPage.formFieldControl('Tài khoản hàng bán trả lại', 'combobox'), 'Tài khoản hàng bán trả lại phải trở về trống').toHaveValue('');
  });


  test('TC_PMKT-U-00106-421 - hiển thị combogrid Tài khoản chi phí không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản chi phí'), 'Phải hiển thị label Tài khoản chi phí').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox'), 'Tài khoản chi phí phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản chi phí'), 'Tài khoản chi phí không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-422 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản chi phí', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-423 - Tài khoản chi phí Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-424 - xác nhận sử dụng Tài khoản chi phí Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Chọn tài khoản Ngừng hoạt động và xác nhận sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.selectAccountingAccount('Tài khoản chi phí', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(true);

    // Xác nhận UI: Popup đóng và tài khoản được chọn.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Xác nhận').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chi phí', inactiveAccount.label), 'Tài khoản Ngừng hoạt động phải được chọn').toBeVisible();
  });

  test('TC_PMKT-U-00106-425 - hủy sử dụng Tài khoản chi phí Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox').inputValue();

    // Hành động: Chọn tài khoản Ngừng hoạt động và hủy sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');
    await vatTuPage.selectAccountingAccount('Tài khoản chi phí', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(false);

    // Xác nhận UI: Popup đóng và giá trị cũ được giữ nguyên.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Hủy').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox'), 'Hủy phải giữ nguyên giá trị tài khoản cũ').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-426 - chọn Tài khoản chi phí Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-427 - tìm Tài khoản chi phí theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-428 - tìm Tài khoản chi phí theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-429 - tìm Tài khoản chi phí theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-430 - Enter chọn dòng Tài khoản chi phí đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-431 - phím Up và Down di chuyển từng dòng Tài khoản chi phí', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox');
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

  test('TC_PMKT-U-00106-432 - ESC đóng dropdown Tài khoản chi phí không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chi phí');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản chi phí', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-433 - icon X xóa nhanh Tài khoản chi phí', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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
    await expect(vatTuPage.formFieldControl('Tài khoản chi phí', 'combobox'), 'Tài khoản chi phí phải trở về trống').toHaveValue('');
  });


  test('TC_PMKT-U-00106-434 - hiển thị combogrid Tài khoản chiết khấu không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản chiết khấu'), 'Phải hiển thị label Tài khoản chiết khấu').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox'), 'Tài khoản chiết khấu phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản chiết khấu'), 'Tài khoản chiết khấu không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-435 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản chiết khấu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-436 - Tài khoản chiết khấu Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-437 - xác nhận sử dụng Tài khoản chiết khấu Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Chọn tài khoản Ngừng hoạt động và xác nhận sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.selectAccountingAccount('Tài khoản chiết khấu', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(true);

    // Xác nhận UI: Popup đóng và tài khoản được chọn.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Xác nhận').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản chiết khấu', inactiveAccount.label), 'Tài khoản Ngừng hoạt động phải được chọn').toBeVisible();
  });

  test('TC_PMKT-U-00106-438 - hủy sử dụng Tài khoản chiết khấu Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox').inputValue();

    // Hành động: Chọn tài khoản Ngừng hoạt động và hủy sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');
    await vatTuPage.selectAccountingAccount('Tài khoản chiết khấu', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(false);

    // Xác nhận UI: Popup đóng và giá trị cũ được giữ nguyên.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Hủy').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox'), 'Hủy phải giữ nguyên giá trị tài khoản cũ').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-439 - chọn Tài khoản chiết khấu Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-440 - tìm Tài khoản chiết khấu theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-441 - tìm Tài khoản chiết khấu theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-442 - tìm Tài khoản chiết khấu theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-443 - Enter chọn dòng Tài khoản chiết khấu đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-444 - phím Up và Down di chuyển từng dòng Tài khoản chiết khấu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox');
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

  test('TC_PMKT-U-00106-445 - ESC đóng dropdown Tài khoản chiết khấu không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản chiết khấu');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản chiết khấu', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-446 - icon X xóa nhanh Tài khoản chiết khấu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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
    await expect(vatTuPage.formFieldControl('Tài khoản chiết khấu', 'combobox'), 'Tài khoản chiết khấu phải trở về trống').toHaveValue('');
  });


  test('TC_PMKT-U-00106-447 - hiển thị combogrid Tài khoản giảm giá không bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ tại tab Hạch toán ngầm định.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');

    // Xác nhận UI: Đúng label, control combogrid và không có dấu bắt buộc.
    await expect(vatTuPage.formField('Tài khoản giảm giá'), 'Phải hiển thị label Tài khoản giảm giá').toBeVisible();
    await expect(vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox'), 'Tài khoản giảm giá phải là Combogrid').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tài khoản giảm giá'), 'Tài khoản giảm giá không được hiển thị dấu *').toBeHidden();
  });

  test('TC_PMKT-U-00106-448 - hiển thị đúng cột, dữ liệu và thứ tự Tài khoản giảm giá', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán và toàn bộ Tài khoản Ngừng hoạt động.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-449 - Tài khoản giảm giá Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động, không ràng buộc Cho phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-450 - xác nhận sử dụng Tài khoản giảm giá Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;

    // Hành động: Chọn tài khoản Ngừng hoạt động và xác nhận sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.selectAccountingAccount('Tài khoản giảm giá', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(true);

    // Xác nhận UI: Popup đóng và tài khoản được chọn.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Xác nhận').toBeHidden();
    await expect(vatTuPage.selectedAccountingAccount('Tài khoản giảm giá', inactiveAccount.label), 'Tài khoản Ngừng hoạt động phải được chọn').toBeVisible();
  });

  test('TC_PMKT-U-00106-451 - hủy sử dụng Tài khoản giảm giá Ngừng hoạt động', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Ngừng hoạt động đúng tenant.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const inactiveAccount = accounts.find((account) => account.status === 'NgungHoatDong');
    test.skip(!inactiveAccount, 'DB không có Tài khoản Ngừng hoạt động');
    if (!inactiveAccount) return;
    const valueBefore = await vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox').inputValue();

    // Hành động: Chọn tài khoản Ngừng hoạt động và hủy sử dụng.
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');
    await vatTuPage.selectAccountingAccount('Tài khoản giảm giá', inactiveAccount);
    await expect(vatTuPage.accountConfirmationDialog(), 'Phải hiển thị cảnh báo Tài khoản Ngừng hoạt động').toContainText(
      'Bản ghi đang ở trạng thái Ngừng hoạt động. Bạn có chắc chắn muốn sử dụng?',
    );
    await vatTuPage.resolveInactiveAccount(false);

    // Xác nhận UI: Popup đóng và giá trị cũ được giữ nguyên.
    await expect(vatTuPage.accountConfirmationDialog(), 'Popup cảnh báo phải đóng sau khi Hủy').toBeHidden();
    await expect(vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox'), 'Hủy phải giữ nguyên giá trị tài khoản cũ').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-452 - chọn Tài khoản giảm giá Hoạt động không hiển thị cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn một tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-453 - tìm Tài khoản giảm giá theo Số hiệu TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Số hiệu TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-454 - tìm Tài khoản giảm giá theo Tên TK', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa chỉ thuộc Tên TK trong tập được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-455 - tìm Tài khoản giảm giá theo Trạng thái', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Lấy Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-456 - Enter chọn dòng Tài khoản giảm giá đầu tiên', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB: Chọn từ khóa trả về nhiều Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-457 - phím Up và Down di chuyển từng dòng Tài khoản giảm giá', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Mở combogrid có tối thiểu ba Tài khoản được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    test.skip(accounts.filter((account) => account.allowed).length < 3, 'DB có ít hơn ba Tài khoản được phép hạch toán');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox');
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

  test('TC_PMKT-U-00106-458 - ESC đóng dropdown Tài khoản giảm giá không đổi giá trị', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu UI: Ghi nhận giá trị hiện tại rồi mở combogrid.
    await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
    const accountCombobox = vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox');
    const valueBefore = await accountCombobox.inputValue();
    await vatTuPage.openAccountingAccountDropdown('Tài khoản giảm giá');

    // Hành động: Nhấn ESC.
    await vatTuPage.pressAccountingAccountKey('Tài khoản giảm giá', 'Escape');

    // Xác nhận UI: Dropdown đóng ngay và giá trị không thay đổi.
    await expect(vatTuPage.accountingAccountDropdown, 'Dropdown phải đóng ngay sau ESC').toBeHidden();
    await expect(accountCombobox, 'ESC không được thay đổi giá trị hiện tại').toHaveValue(valueBefore);
  });

  test('TC_PMKT-U-00106-459 - icon X xóa nhanh Tài khoản giảm giá', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn một Tài khoản Hoạt động được phép hạch toán.
    const accounts = await prepareGoodsAccounting(vatTuPage, 'Dịch vụ');
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
    await expect(vatTuPage.formFieldControl('Tài khoản giảm giá', 'combobox'), 'Tài khoản giảm giá phải trở về trống').toHaveValue('');
  });


  test('TC_PMKT-U-00106-460 - hiển thị select Thuế suất GTGT mặc định không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await expect(vatTuPage.defaultVatRateCombobox()).toBeVisible();
    await expect(vatTuPage.formField('Thuế suất GTGT mặc định')).toContainText('Thuế suất GTGT mặc định');
    await expect(vatTuPage.requiredIndicator('Thuế suất GTGT mặc định')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-461 - danh sách Thuế suất GTGT mặc định đầy đủ', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await vatTuPage.defaultVatRateCombobox().click();
    const options = vatTuPage.defaultVatRateOptions();
    await expect(options.first()).toBeVisible();
    const actualCodes = (await options.allTextContents()).map((label) =>
      (label.split('—')[0] ?? '').trim().replace('%', '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    );
    expect(actualCodes).toEqual(expect.arrayContaining(['KCT', 'KKKNT', '0', '5', '8', '10', 'KHAC']));
    expect(actualCodes).toHaveLength(7);
  });

  test('TC_PMKT-U-00106-462 - chọn Thuế suất GTGT mặc định bằng 5', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await vatTuPage.selectDefaultVatRate('5');
    await expect(vatTuPage.formField('Thuế suất GTGT mặc định')).toContainText('5% — Hàng hoá, dịch vụ chịu thuế suất 5%');
  });

  test('TC_PMKT-U-00106-463 - xóa nhanh Thuế suất GTGT mặc định', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await vatTuPage.selectDefaultVatRate('5');
    await vatTuPage.clearDefaultVatRate();
    await expect(vatTuPage.defaultVatRateCombobox()).toHaveValue('');
    await expect(vatTuPage.selectedFormValue('Thuế suất GTGT mặc định')).toBeHidden();
  });

  test('TC_PMKT-U-00106-464 - hiển thị numeric Giá trị thuế suất GTGT không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await expect(vatTuPage.vatRateValueInput()).toBeVisible();
    await expect(vatTuPage.formField('Giá trị thuế suất GTGT')).toContainText('Giá trị thuế suất GTGT');
    await expect(vatTuPage.requiredIndicator('Giá trị thuế suất GTGT')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-465 - tự động điền Giá trị thuế suất GTGT theo mức 10 và 8', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    const vatRateValue = vatTuPage.vatRateValueInput();
    await vatTuPage.selectDefaultVatRate('10');
    await expect(vatRateValue).toHaveValue('10');
    await expect(vatRateValue).toHaveAttribute('readonly', '');
    await vatTuPage.selectDefaultVatRate('8');
    await expect(vatRateValue).toHaveValue('8');
    await expect(vatRateValue).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-466 - KCT tự động điền Giá trị thuế suất GTGT bằng 0', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await vatTuPage.selectDefaultVatRate('KCT');
    await expect(vatTuPage.vatRateValueInput()).toHaveValue('0');
    await expect(vatTuPage.vatRateValueInput()).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-467 - KKKNT tự động điền Giá trị thuế suất GTGT bằng 0', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await vatTuPage.selectDefaultVatRate('KKKNT');
    await expect(vatTuPage.vatRateValueInput()).toHaveValue('0');
    await expect(vatTuPage.vatRateValueInput()).toHaveAttribute('readonly', '');
  });

  test('TC_PMKT-U-00106-468 - KHAC cho phép nhập Giá trị thuế suất GTGT', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await vatTuPage.selectDefaultVatRate('KHAC');
    const vatRateValue = vatTuPage.vatRateValueInput();
    await expect(vatRateValue).toBeEditable();
    await vatTuPage.fillFormField('Giá trị thuế suất GTGT', '7');
    await expect(vatRateValue).toHaveValue('7');
  });

  test('TC_PMKT-U-00106-469 - đổi KHAC về mức 8 cập nhật giá trị và read-only', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await vatTuPage.selectDefaultVatRate('KHAC');
    await vatTuPage.fillFormField('Giá trị thuế suất GTGT', '7');
    await vatTuPage.selectDefaultVatRate('8');
    await expect(vatTuPage.vatRateValueInput()).toHaveValue('8');
    await expect(vatTuPage.vatRateValueInput()).toHaveAttribute('readonly', '');
  });


  test('TC_PMKT-U-00106-470 - hiển thị combogrid Thuế tiêu thụ đặc biệt không bắt buộc', async ({ vatTuPage }) => {
    await openGoodsTaxTab(vatTuPage, 'Dịch vụ');
    await expect(vatTuPage.formFieldControl('Thuế tiêu thụ đặc biệt', 'combobox')).toBeVisible();
    await expect(vatTuPage.formField('Thuế tiêu thụ đặc biệt')).toContainText('Thuế tiêu thụ đặc biệt');
    await expect(vatTuPage.requiredIndicator('Thuế tiêu thụ đặc biệt')).toHaveCount(0);
  });

  test('TC_PMKT-U-00106-471 - hiển thị đúng cột, dữ liệu và thứ tự Thuế tiêu thụ đặc biệt', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy mst_thue_tieu_thu_db đúng tenant rồi mở combogrid Thuế tiêu thụ đặc biệt.
    const expected = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-472 - Thuế tiêu thụ đặc biệt Ngừng hoạt động hiển thị chữ màu xám', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy cặp Thuế tiêu thụ đặc biệt Hoạt động/Ngừng hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-473 - xác nhận sử dụng Thuế tiêu thụ đặc biệt Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy một Thuế tiêu thụ đặc biệt Ngừng hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-474 - hủy sử dụng Thuế tiêu thụ đặc biệt Ngừng hoạt động', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy option Ngừng hoạt động từ DB và lưu giá trị trường trước thao tác.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-475 - chọn Thuế tiêu thụ đặc biệt Hoạt động không hiển thị cảnh báo', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy một Thuế tiêu thụ đặc biệt Hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
    const active = taxes.find(({ status }) => status === 'HoatDong');
    test.skip(!active, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt Hoạt động');
    if (!active) return;
    // Hành động: Lọc theo mã unique và chọn option Hoạt động.
    await vatTuPage.selectTax('Thuế tiêu thụ đặc biệt', active);
    // Xác nhận UI: Giá trị được chọn và không xuất hiện popup cảnh báo.
    await expect(vatTuPage.selectedTax('Thuế tiêu thụ đặc biệt', active.label)).toBeVisible();
    await expect(vatTuPage.taxConfirmationDialog()).toBeHidden();
  });

  test('TC_PMKT-U-00106-476 - tìm Thuế tiêu thụ đặc biệt theo Mã', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Chọn mã Thuế tiêu thụ đặc biệt đầu tiên từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
    const target = taxes[0];
    test.skip(!target, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt');
    if (!target) return;
    // Hành động: Nhập mã vào ô tìm kiếm của combogrid.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', target.code);
    const expected = taxes.filter(({ code }) => code.toLocaleLowerCase('vi').includes(target.code.toLocaleLowerCase('vi'))).map(({ label }) => label);
    // Xác nhận UI/DB: Kết quả theo Mã khớp danh mục DB đúng tenant.
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Mã Thuế tiêu thụ đặc biệt phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-477 - tìm Thuế tiêu thụ đặc biệt theo Tên', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Sinh từ khóa Tên phân biệt được với Mã từ danh mục DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-478 - tìm Thuế tiêu thụ đặc biệt theo Thuế suất', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy Thuế suất thực tế từ DB đúng tenant làm expected.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
    const target = taxes[0];
    test.skip(!target, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt');
    if (!target) return;
    // Hành động: Nhập Thuế suất vào ô tìm kiếm của combogrid.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', target.rate);
    const expected = taxes.filter(({ rate }) => rate.includes(target.rate)).map(({ label }) => label);
    // Xác nhận UI/DB: Kết quả theo Thuế suất khớp danh mục DB đúng tenant.
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Thuế suất Thuế tiêu thụ đặc biệt phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-479 - tìm Thuế tiêu thụ đặc biệt theo Trạng thái', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy tập Thuế tiêu thụ đặc biệt Hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
    const expected = taxes.filter(({ status }) => status === 'HoatDong').map(({ label }) => label);
    test.skip(expected.length === 0, 'BLOCK: DB đúng tenant chưa có Thuế tiêu thụ đặc biệt Hoạt động');
    // Hành động: Nhập nhãn Trạng thái Hoạt động vào ô tìm kiếm.
    await vatTuPage.searchTax('Thuế tiêu thụ đặc biệt', 'Hoạt động');
    // Xác nhận UI/DB: Kết quả theo Trạng thái khớp danh mục DB đúng tenant.
    await expect.poll(() => vatTuPage.currentTaxLabels(), { message: 'Kết quả tìm theo Trạng thái Thuế tiêu thụ đặc biệt phải khớp DB' }).toEqual(expected);
  });

  test('TC_PMKT-U-00106-480 - Enter chọn dòng Thuế tiêu thụ đặc biệt đầu tiên', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Sinh từ khóa từ DB trả về nhiều option để kiểm tra Enter.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-481 - Up và Down di chuyển từng option Thuế tiêu thụ đặc biệt', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Mở dropdown có tối thiểu ba option theo DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-482 - ESC đóng dropdown Thuế tiêu thụ đặc biệt không đổi giá trị', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Mở combogrid từ danh mục DB đúng tenant và lưu giá trị ban đầu.
    await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
    const valueBefore = await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt');
    // Hành động: Nhấn ESC khi dropdown đang mở.
    await vatTuPage.pressTaxKey('Thuế tiêu thụ đặc biệt', 'Escape');
    // Xác nhận UI: Dropdown đóng và trường giữ nguyên giá trị.
    await expect(vatTuPage.taxDropdown()).toBeHidden();
    expect(await vatTuPage.currentFormOption('Thuế tiêu thụ đặc biệt')).toBe(valueBefore);
  });

  test('TC_PMKT-U-00106-483 - icon X xóa nhanh Thuế tiêu thụ đặc biệt', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu: Lấy và chọn một Thuế tiêu thụ đặc biệt Hoạt động từ DB đúng tenant.
    const taxes = await prepareGoodsExciseTaxes(vatTuPage, db, 'Dịch vụ');
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

  test('TC_PMKT-U-00106-484 - đổi sang Hàng hóa ẩn tab Đơn vị tính khác', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ có tab Đơn vị tính khác.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formTab('Đơn vị tính khác')).toBeVisible();
    // Hành động: Thay đổi tính chất sang Hàng hóa.
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Hàng hóa');
    // Xác nhận UI: Hàng hóa ẩn tab Đơn vị tính khác.
    await expect(vatTuPage.materialTypeValue('Hàng hóa')).toBeVisible(); await expect(vatTuPage.formTab('Đơn vị tính khác')).toBeHidden();
  });

  test('TC_PMKT-U-00106-485 - đổi từ Hàng hóa về Dịch vụ hiện lại tab Đơn vị tính khác', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Dịch vụ rồi chuyển sang Hàng hóa.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Hàng hóa');
    // Hành động: Chuyển lại Dịch vụ.
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Dịch vụ');
    // Xác nhận UI: Tab Đơn vị tính khác hiển thị lại.
    await expect(vatTuPage.materialTypeValue('Dịch vụ')).toBeVisible(); await expect(vatTuPage.formTab('Đơn vị tính khác')).toBeVisible();
  });

  test('TC_PMKT-U-00106-486 - đổi sang Hàng hóa hiện lại tab Thông tin kho', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Dịch vụ đang ẩn tab Thông tin kho.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formTab('Thông tin kho')).toBeHidden();
    // Hành động: Chuyển sang Hàng hóa.
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Hàng hóa');
    // Xác nhận UI: Tab Thông tin kho hiển thị lại.
    await expect(vatTuPage.formTab('Thông tin kho')).toBeVisible();
  });

  test('TC_PMKT-U-00106-487 - đổi từ Hàng hóa sang Dịch vụ ẩn tab Thông tin kho', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Dịch vụ, chuyển Hàng hóa để tab Thông tin kho xuất hiện.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Hàng hóa'); await expect(vatTuPage.formTab('Thông tin kho')).toBeVisible();
    // Hành động: Chuyển lại Dịch vụ.
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Dịch vụ');
    // Xác nhận UI: Tab Thông tin kho bị ẩn.
    await expect(vatTuPage.formTab('Thông tin kho')).toBeHidden();
  });

  test('TC_PMKT-U-00106-488 - đổi sang Hàng hóa hiện lại tab Đơn vị quy đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Dịch vụ đang ẩn tab Đơn vị quy đổi.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeHidden();
    // Hành động: Chuyển sang Hàng hóa.
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Hàng hóa');
    // Xác nhận UI: Tab Đơn vị quy đổi hiển thị lại.
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeVisible();
  });

  test('TC_PMKT-U-00106-489 - đổi từ Hàng hóa sang Dịch vụ ẩn tab Đơn vị quy đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Dịch vụ rồi chuyển sang Hàng hóa.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Hàng hóa'); await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeVisible();
    // Hành động: Chuyển lại Dịch vụ.
    await vatTuPage.changeMaterialType(); await vatTuPage.selectMaterialType('Dịch vụ');
    // Xác nhận UI: Tab Đơn vị quy đổi bị ẩn.
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeHidden();
  });

  test('TC_PMKT-U-00106-490 - STT Đơn vị tính khác là textbox read-only', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Dịch vụ tại tab Đơn vị tính khác và thêm một dòng.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.openFormTab('Đơn vị tính khác'); await vatTuPage.addConversionRow();
    // Xác nhận UI: STT hiển thị dưới dạng textbox không chỉnh sửa được.
    await expect(vatTuPage.alternativeUnitOrderInputs().first()).toBeVisible(); await expect(vatTuPage.alternativeUnitOrderInputs().first()).not.toBeEditable();
  });

  test('TC_PMKT-U-00106-491 - STT Đơn vị tính khác tự sinh tịnh tiến', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn hai Đơn vị tính khác Hoạt động.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const options = units.filter((item) => item.status === 'HoatDong'); test.skip(options.length < 2, 'DB cần tối thiểu hai Đơn vị tính Hoạt động');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.openFormTab('Đơn vị tính khác');
    await vatTuPage.addConversionRow(); await vatTuPage.selectAlternativeUnitAtRow(0, options[0]!); await vatTuPage.addConversionRow();
    // Xác nhận UI: Hai STT lần lượt là 1 và 2.
    await expect(vatTuPage.alternativeUnitOrderInputs()).toHaveCount(2); await expect(vatTuPage.alternativeUnitOrderInputs().nth(0)).toHaveValue('1'); await expect(vatTuPage.alternativeUnitOrderInputs().nth(1)).toHaveValue('2');
  });

  test('TC_PMKT-U-00106-492 - dòng sau bị disable khi dòng trước bỏ trống', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Thêm hai dòng Đơn vị tính khác nhưng để trống dòng đầu.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.openFormTab('Đơn vị tính khác');
    await vatTuPage.addConversionRow(); await vatTuPage.addConversionRow();
    // Xác nhận UI: Dòng hai bị khóa cứng.
    await expect(vatTuPage.alternativeUnitComboboxes()).toHaveCount(2); await expect(vatTuPage.alternativeUnitComboboxes().nth(1)).toBeDisabled();
  });

  test('TC_PMKT-U-00106-493 - chặn Đơn vị tính khác trùng ĐVT chính', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn ĐVT chính rồi thêm dòng Đơn vị tính khác.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong'); test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const g=new TestDataGenerator(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(g.uniqueCode('TC493'),g.uniqueKeyword('TC493'),mainUnit);
    await vatTuPage.openFormTab('Đơn vị tính khác'); await vatTuPage.addConversionRow(); await vatTuPage.alternativeUnitComboboxes().first().click();
    // Hành động: Tìm ĐVT trùng ĐVT chính rồi Lưu.
    await expect(vatTuPage.alternativeUnitOptionByLabel(mainUnit.label)).toBeHidden(); await vatTuPage.closeDropdown(); await vatTuPage.saveMaterial();
    // Xác nhận UI: Hệ thống chặn lưu và báo bắt buộc trên dòng.
    await expect(vatTuPage.alternativeUnitValidation('Đơn vị tính khác không được để trống')).toBeVisible(); await expect(vatTuPage.createMaterialDialog).toBeVisible();
  });

  test('TC_PMKT-U-00106-494 - chặn Đơn vị tính khác trùng nhau giữa hai dòng', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu DB/UI: Chọn cùng một ĐVT ở hai dòng.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const unit=units.find((item)=>item.status==='HoatDong'); test.skip(!unit,'DB cần Đơn vị tính Hoạt động'); if(!unit)return;
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.openFormTab('Đơn vị tính khác');
    await vatTuPage.addConversionRow(); await vatTuPage.selectAlternativeUnitAtRow(0,unit); await vatTuPage.addConversionRow(); await vatTuPage.selectAlternativeUnitAtRow(1,unit);
    // Hành động: Nhấn Lưu.
    await vatTuPage.saveMaterial();
    // Xác nhận UI: Hệ thống chặn lưu và báo lỗi dòng trùng.
    await expect(vatTuPage.alternativeUnitValidation('Đơn vị tính khác không được để trống')).toBeVisible(); await expect(vatTuPage.createMaterialDialog).toBeVisible();
  });

  test('TC_PMKT-U-00106-495 - chặn lưu dòng Đơn vị tính khác bỏ trống', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở Dịch vụ và thêm một dòng trống.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.openFormTab('Đơn vị tính khác'); await vatTuPage.addConversionRow();
    // Hành động: Nhấn Lưu.
    await vatTuPage.saveMaterial();
    // Xác nhận UI: Hiển thị validation bắt buộc của dòng.
    await expect(vatTuPage.alternativeUnitValidation('Đơn vị tính khác không được để trống')).toBeVisible(); await expect(vatTuPage.createMaterialDialog).toBeVisible();
  });

  test('TC_PMKT-U-00106-496 - xóa dòng Đơn vị tính khác cuối cùng rồi Lưu', async ({ vatTuPage, db }) => {
    // Chuẩn bị dữ liệu DB/UI: Nhập Dịch vụ tối thiểu và thêm một dòng hợp lệ.
    const credentials=requireCredentials(); const {units}=await openVatTuWithCatalogues(vatTuPage); const activeUnits=units.filter((item)=>item.status==='HoatDong'); const mainUnit=activeUnits[0]; const alternativeUnit=activeUnits[1]; test.skip(!mainUnit||!alternativeUnit,'DB cần tối thiểu hai Đơn vị tính Hoạt động'); if(!mainUnit||!alternativeUnit)return;
    const g=new TestDataGenerator(); const code=g.uniqueCode('TC496'); const name=g.uniqueKeyword('TC496'); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code,name,mainUnit);
    await vatTuPage.openFormTab('Đơn vị tính khác'); await vatTuPage.addConversionRow(); await vatTuPage.selectAlternativeUnitAtRow(0,alternativeUnit); await vatTuPage.deleteAlternativeUnitRow();
    // Hành động: Lưu sau khi xóa dòng cuối.
    await expect(vatTuPage.alternativeUnitComboboxes()).toHaveCount(0); await vatTuPage.saveMaterial();
    // Xác nhận UI/DB: Lưu thành công, đóng form và DB không có dòng Đơn vị tính khác.
    await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect.poll(async()=> (await db.vatTu.findByCodeForDefaultTenant(credentials.username,code)).length).toBe(1); const saved=(await db.vatTu.findByCodeForDefaultTenant(credentials.username,code))[0]; expect(saved?.alternativeUnits).toHaveLength(0);
  });

  test('TC_PMKT-U-00106-497 - Lưu Dịch vụ đầy đủ trạng thái Hoạt động và kiểm tra DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
    const group = groups.find((item) => item.status === 'HoatDong'); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động'); if (!group || !mainUnit) return;
    const material = fullServiceData('TC497', group, mainUnit);
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); const selection = await vatTuPage.fillFullServiceMaterial(material);
    await vatTuPage.saveMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await vatTuPage.searchMaterial(material.code); await expect(vatTuPage.materialRow(material.code)).toBeVisible();
    await verifyFullServiceSavedInDatabase(db, credentials.username, material, selection, true);
  });

  test('TC_PMKT-U-00106-498 - Lưu Dịch vụ chỉ với trường bắt buộc và kiểm tra mặc định DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { units } = await openVatTuWithCatalogues(vatTuPage);
    const mainUnit = units.find((item) => item.status === 'HoatDong'); test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC498'); const name = generator.uniqueKeyword('TC498');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit); const defaults = await vatTuPage.readRequiredServiceUiDefaults();
    await vatTuPage.saveMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await vatTuPage.searchMaterial(code); await expect(vatTuPage.materialRow(code)).toBeVisible();
    await verifyRequiredGoodsSavedInDatabase(db, credentials.username, { code, name, mainUnit, active: true, defaults }, 'Dịch vụ');
  });

  test('TC_PMKT-U-00106-499 - Lưu Dịch vụ đầy đủ trạng thái Ngừng hoạt động và kiểm tra DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
    const group = groups.find((item) => item.status === 'HoatDong'); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động'); if (!group || !mainUnit) return;
    const material = fullServiceData('TC499', group, mainUnit);
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); const selection = await vatTuPage.fillFullServiceMaterial(material);
    await vatTuPage.setMaterialStatus(false); await vatTuPage.saveMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await vatTuPage.searchMaterial(material.code); await expect(vatTuPage.materialRow(material.code)).toContainText('Ngừng hoạt động');
    await verifyFullServiceSavedInDatabase(db, credentials.username, material, selection, false);
  });

  test('TC_PMKT-U-00106-500 - Lưu và Thêm mới reset form, hiển thị danh sách và kiểm tra DB', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials(); const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
    const group = groups.find((item) => item.status === 'HoatDong'); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động'); if (!group || !mainUnit) return;
    const material = fullServiceData('TC500', group, mainUnit);
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); const selection = await vatTuPage.fillFullServiceMaterial(material);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialCodeInput()).toHaveValue(''); await expect(vatTuPage.materialNameInput()).toHaveValue('');
    await vatTuPage.discardMaterialFormIfOpen(); await vatTuPage.searchMaterial(material.code); await expect(vatTuPage.materialRow(material.code)).toBeVisible();
    await verifyFullServiceSavedInDatabase(db, credentials.username, material, selection, true);
  });


  test('TC_PMKT-U-00106-501 - icon X đóng form ngay sau khi Lưu và Thêm mới reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Tạo Dịch vụ chỉ với trường bắt buộc và đưa form về trạng thái reset sau Lưu và Thêm mới.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC501'); const name = generator.uniqueKeyword('TC501');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    // Hành động: Nhấn icon X khi form reset chưa có thay đổi mới.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Form đóng, quay về danh sách và không hiển thị cảnh báo.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-502 - icon X hiển thị cảnh báo sau khi thay đổi form reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Dịch vụ tối thiểu, reset form rồi nhập lại Tên vật tư unique.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC502'); const name = generator.uniqueKeyword('TC502'); const changedName = generator.uniqueKeyword('TC502_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn icon X sau khi thay đổi dữ liệu trên form reset.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Hiển thị đúng cảnh báo và đủ hai hành động Xác nhận/Hủy.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-503 - Hủy cảnh báo icon X giữ nguyên dữ liệu sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Dịch vụ tối thiểu, reset form, nhập lại Tên và mở cảnh báo bằng icon X.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC503'); const name = generator.uniqueKeyword('TC503'); const changedName = generator.uniqueKeyword('TC503_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận đóng.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và dữ liệu vừa nhập được giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-504 - Xác nhận cảnh báo icon X đóng form sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Dịch vụ tối thiểu, reset form, nhập lại dữ liệu và mở cảnh báo bằng icon X.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC504'); const name = generator.uniqueKeyword('TC504'); const changedName = generator.uniqueKeyword('TC504_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-505 - nút Hủy đóng form ngay sau khi Lưu và Thêm mới reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Tạo Dịch vụ tối thiểu và giữ form reset không có thay đổi mới.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC505'); const name = generator.uniqueKeyword('TC505');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    // Hành động: Nhấn nút Hủy ở cuối form.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Form đóng, quay về danh sách và không hiển thị cảnh báo.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-506 - nút Hủy hiển thị cảnh báo sau khi thay đổi form reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Dịch vụ tối thiểu, reset form rồi nhập lại Tên vật tư unique.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC506'); const name = generator.uniqueKeyword('TC506'); const changedName = generator.uniqueKeyword('TC506_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn nút Hủy sau khi thay đổi dữ liệu trên form reset.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Hiển thị đúng cảnh báo và đủ hai hành động Xác nhận/Hủy.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-507 - Hủy cảnh báo nút Hủy giữ nguyên dữ liệu sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Dịch vụ tối thiểu, reset form, nhập lại Tên và mở cảnh báo bằng nút Hủy.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC507'); const name = generator.uniqueKeyword('TC507'); const changedName = generator.uniqueKeyword('TC507_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận đóng.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và dữ liệu vừa nhập được giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-508 - Xác nhận cảnh báo nút Hủy đóng form sau reset', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Lưu Dịch vụ tối thiểu, reset form, nhập lại dữ liệu và mở cảnh báo bằng nút Hủy.
    const { units } = await openVatTuWithCatalogues(vatTuPage); const mainUnit = units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'DB cần Đơn vị tính Hoạt động'); if (!mainUnit) return;
    const generator = new TestDataGenerator(); const code = generator.uniqueCode('TC508'); const name = generator.uniqueKeyword('TC508'); const changedName = generator.uniqueKeyword('TC508_CHANGED');
    await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.saveAndAddMaterial(); await expect(vatTuPage.successNotification()).toContainText('Thêm mới thành công'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-509 - icon X đóng form chưa thay đổi mà không cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ mới và không thay đổi bất kỳ trường nào.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    // Hành động: Nhấn icon X ở góc form.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Form đóng, danh sách hiển thị và không có popup xác nhận.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-510 - icon X hiển thị cảnh báo khi form có thay đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ và nhập Tên vật tư unique nhưng chưa lưu.
    const changedName = new TestDataGenerator().uniqueKeyword('TC510');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn icon X.
    await vatTuPage.closeCreatingMaterial();
    // Xác nhận UI: Popup hiển thị đúng nội dung và đủ hai nút hành động.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-511 - Hủy cảnh báo icon X giữ nguyên dữ liệu chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng icon X.
    const changedName = new TestDataGenerator().uniqueKeyword('TC511');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và Tên vật tư giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-512 - Xác nhận cảnh báo icon X đóng form chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng icon X.
    const changedName = new TestDataGenerator().uniqueKeyword('TC512');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.closeCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-513 - nút Hủy đóng form chưa thay đổi mà không cảnh báo', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ mới và không thay đổi bất kỳ trường nào.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    // Hành động: Nhấn nút Hủy ở cuối form.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Form đóng, danh sách hiển thị và không có popup xác nhận.
    await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-514 - nút Hủy hiển thị cảnh báo khi form có thay đổi', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ và nhập Tên vật tư unique nhưng chưa lưu.
    const changedName = new TestDataGenerator().uniqueKeyword('TC514');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.materialNameInput().fill(changedName);
    // Hành động: Nhấn nút Hủy ở cuối form.
    await vatTuPage.cancelCreatingMaterial();
    // Xác nhận UI: Popup hiển thị đúng nội dung và đủ hai nút hành động.
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible(); await expect(vatTuPage.closeConfirmationMessage()).toContainText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await expect(vatTuPage.closeConfirmationButton('Xác nhận')).toBeVisible(); await expect(vatTuPage.closeConfirmationButton('Hủy')).toBeVisible();
  });

  test('TC_PMKT-U-00106-515 - Hủy cảnh báo nút Hủy giữ nguyên dữ liệu chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng nút Hủy.
    const changedName = new TestDataGenerator().uniqueKeyword('TC515');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Hủy trên popup xác nhận.
    await vatTuPage.dismissCloseConfirmation();
    // Xác nhận UI: Popup đóng, form còn mở và Tên vật tư giữ nguyên.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeVisible(); await expect(vatTuPage.materialNameInput()).toHaveValue(changedName);
  });

  test('TC_PMKT-U-00106-516 - Xác nhận cảnh báo nút Hủy đóng form chưa lưu', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Nhập Tên vật tư unique rồi mở popup xác nhận bằng nút Hủy.
    const changedName = new TestDataGenerator().uniqueKeyword('TC516');
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ'); await vatTuPage.materialNameInput().fill(changedName); await vatTuPage.cancelCreatingMaterial();
    // Hành động: Nhấn Xác nhận bỏ thay đổi.
    await vatTuPage.confirmClose();
    // Xác nhận UI: Popup và form đóng, màn danh sách hiển thị.
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden(); await expect(vatTuPage.createMaterialDialog).toBeHidden(); await expect(vatTuPage.materialSearchInput()).toBeVisible();
  });

  test('TC_PMKT-U-00106-517 - chặn lưu khi bỏ trống toàn bộ trường bắt buộc', async ({ vatTuPage }) => {
    // Chuẩn bị dữ liệu: Mở form Dịch vụ và giữ trống toàn bộ trường bắt buộc.
    await vatTuPage.openFromDanhMuc(); await vatTuPage.openMaterialTypePopup(); await vatTuPage.selectMaterialType('Dịch vụ');
    // Hành động: Nhấn Lưu ở cuối form.
    await vatTuPage.saveMaterial();
    // Xác nhận UI: Hệ thống chặn lưu và hiển thị đúng lỗi dưới ba trường bắt buộc.
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect.soft(vatTuPage.validationMessage('Mã vật tư', 'Mã không được để trống')).toBeVisible();
    await expect.soft(vatTuPage.validationMessage('Tên vật tư', 'Tên không được để trống')).toBeVisible();
  });

});
