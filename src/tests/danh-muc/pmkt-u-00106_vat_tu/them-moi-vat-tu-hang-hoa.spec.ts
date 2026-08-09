import { test, expect } from '@fixtures/base.fixture';
import { firstVisibleActiveMainUnit, openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import { boundaryText, verifyMaterialTypeCards } from '@helpers/vat-tu-part1.helper';
import { requireCredentials } from '@utils/env.config';
import { TestDataGenerator } from '@utils/test-data';

test.describe('PMKT-U-00106 - Thêm mới Vật tư Hàng hóa TC4-TC20', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('TC_PMKT-U-00106-4 - hiển thị popup chọn tính chất với đủ 6 loại vật tư', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();

    await expect(vatTuPage.materialTypeDialog, 'Phải hiển thị popup Chọn tính chất hàng hóa dịch vụ').toBeVisible();
    await verifyMaterialTypeCards(vatTuPage);
  });

  test('TC_PMKT-U-00106-5 - đóng popup Chọn tính chất bằng icon X', async ({ vatTuPage, page }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.closeMaterialTypePopup();

    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng').toBeHidden();
    await expect(vatTuPage.addButton, 'Phải quay về màn hình danh sách có nút Thêm mới').toBeVisible();
    await expect(page, 'Phải quay về đúng màn hình danh sách Vật tư').toHaveURL(/\/danh-muc\/vat-tu$/);
  });

  test('TC_PMKT-U-00106-6 - chọn Hàng hóa và hiển thị form thông tin tương ứng', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng sau khi chọn Hàng hóa').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Phải hiển thị popup Thêm mới vật tư').toBeVisible();
    await expect(vatTuPage.materialTypeValue('Hàng hóa'), 'Tính chất phải hiển thị Hàng hóa ở trạng thái chỉ đọc').toBeVisible();
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
        vatTuPage.formFieldControl(field.label, field.role),
        `Phần Thông tin chính phải hiển thị trường ${field.label}`,
      ).toBeVisible();
    }
    await expect.soft(vatTuPage.checkbox('Giảm thuế theo quy định'), 'Phải hiển thị trường Giảm thuế theo quy định').toBeVisible();
    await expect.soft(vatTuPage.specialGoodsTypeCombobox(), 'Phải hiển thị trường Loại hàng hóa đặc trưng').toBeVisible();
    await expect.soft(vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton'), 'Phải hiển thị trường Thời hạn bảo hành').toBeVisible();
    await expect.soft(vatTuPage.warrantyUnitCombobox(), 'Phải hiển thị đơn vị Thời hạn bảo hành').toBeVisible();
    await expect.soft(vatTuPage.statusSwitch(), 'Phải hiển thị trường Trạng thái').toBeVisible();
    await expect.soft(vatTuPage.materialImageSection(), 'Phải hiển thị trường Hình ảnh hàng hóa').toBeVisible();
    for (const tab of ['Hạch toán ngầm định', 'Thông tin kho', 'Thông tin thuế', 'Đơn vị quy đổi']) {
      await expect.soft(vatTuPage.formTab(tab), `Phải hiển thị tab ${tab}`).toBeVisible();
    }
  });

  test('TC_PMKT-U-00106-7 - Thay đổi tính chất hiển thị lại popup đủ 6 lựa chọn', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.changeMaterialType();

    await expect(vatTuPage.materialTypeDialog, 'Phải hiển thị lại popup Chọn tính chất').toBeVisible();
    await verifyMaterialTypeCards(vatTuPage);
  });

  test('TC_PMKT-U-00106-8 - đóng popup thay đổi và giữ nguyên Hàng hóa cùng dữ liệu đang nhập', async ({ vatTuPage }) => {
    const materialName = new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-8');
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(materialName);
    await vatTuPage.changeMaterialType();
    await vatTuPage.closeMaterialTypePopup();

    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Form Thêm mới phải tiếp tục hiển thị').toBeVisible();
    await expect(vatTuPage.materialTypeValue('Hàng hóa'), 'Loại vật tư cũ phải được giữ nguyên').toBeVisible();
    await expect(vatTuPage.materialNameInput(), 'Dữ liệu đang nhập phải được giữ nguyên').toHaveValue(materialName);
  });

  test('TC_PMKT-U-00106-9 - thay đổi tính chất từ Hàng hóa sang Dịch vụ', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');

    await expect(vatTuPage.materialTypeDialog, 'Popup Chọn tính chất phải đóng').toBeHidden();
    await expect(vatTuPage.createMaterialDialog, 'Form Thêm mới loại Dịch vụ phải hiển thị').toBeVisible();
    await expect(vatTuPage.materialTypeValue('Dịch vụ'), 'Loại vật tư mới phải là Dịch vụ').toBeVisible();
    await expect(vatTuPage.formTab('Thông tin kho'), 'Dịch vụ không được hiển thị tab Thông tin kho').toBeHidden();
    await expect(vatTuPage.formTab('Đơn vị quy đổi'), 'Dịch vụ không được hiển thị tab Đơn vị quy đổi').toBeHidden();
  });

  test('TC_PMKT-U-00106-10 - hiển thị TextBox Mã vật tư bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải hiển thị dưới dạng TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Mã vật tư'), 'Label Mã vật tư phải có dấu * màu đỏ bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-11 - nhập Mã vật tư dài 49 ký tự', async ({ vatTuPage }) => {
    const code = boundaryText('TC_PMKT-U-00106-11', 49);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(code);

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải giữ đầy đủ 49 ký tự').toHaveValue(code);
  });

  test('TC_PMKT-U-00106-12 - nhập Mã vật tư dài tối đa 50 ký tự', async ({ vatTuPage }) => {
    const code = boundaryText('TC_PMKT-U-00106-12', 50);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(code);

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải giữ đầy đủ 50 ký tự').toHaveValue(code);
  });

  test('TC_PMKT-U-00106-13 - chặn ký tự thứ 51 của Mã vật tư', async ({ vatTuPage }) => {
    const firstFiftyCharacters = boundaryText('TC_PMKT-U-00106-13', 50);
    const fiftyOneCharacters = `${firstFiftyCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(fiftyOneCharacters);

    await expect(vatTuPage.materialCodeInput(), 'Mã vật tư phải chặn cứng ký tự thứ 51').toHaveValue(firstFiftyCharacters);
  });

  test('TC_PMKT-U-00106-14 - validate bỏ trống Mã vật tư khi Lưu', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredInventoryMaterialFields(
      '',
      new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-14'),
      mainUnit,
    );
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu khi Mã vật tư trống').toBeVisible();
    await expect(
      vatTuPage.validationMessage('Mã vật tư', 'Mã không được để trống'),
      'Phải hiển thị lỗi Mã không được để trống dưới chân trường Mã vật tư',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-15 - validate trùng Mã vật tư đã tồn tại', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const existingCode = await db.vatTu.findFirstExistingCodeForDefaultTenant(credentials.username);
    test.skip(!existingCode, 'Precondition DB đúng tenant không có vật tư đang tồn tại');
    if (!existingCode) return;
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredInventoryMaterialFields(
      existingCode,
      new TestDataGenerator().uniqueKeyword('TC_PMKT-U-00106-15'),
      mainUnit,
    );
    await vatTuPage.saveMaterial();

    await expect(vatTuPage.createMaterialDialog, 'Hệ thống phải chặn lưu mã vật tư trùng').toBeVisible();
    await expect(
      vatTuPage.notificationMessage('Mã vật tư đã tồn tại'),
      'Phải hiển thị MSG_PMKT-U-00106_003: Mã vật tư đã tồn tại',
    ).toBeVisible();
  });

  test('TC_PMKT-U-00106-16 - hiển thị TextBox Tên vật tư bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải hiển thị dưới dạng TextBox').toBeVisible();
    await expect(vatTuPage.requiredFormField('Tên vật tư'), 'Label Tên vật tư phải có dấu * màu đỏ bắt buộc').toBeVisible();
  });

  test('TC_PMKT-U-00106-17 - nhập Tên vật tư dài 254 ký tự', async ({ vatTuPage }) => {
    const name = boundaryText('TC_PMKT-U-00106-17', 254);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(name);

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải giữ đầy đủ 254 ký tự').toHaveValue(name);
  });

  test('TC_PMKT-U-00106-18 - nhập Tên vật tư dài tối đa 255 ký tự', async ({ vatTuPage }) => {
    const name = boundaryText('TC_PMKT-U-00106-18', 255);
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(name);

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải giữ đầy đủ 255 ký tự').toHaveValue(name);
  });

  test('TC_PMKT-U-00106-19 - chặn ký tự thứ 256 của Tên vật tư', async ({ vatTuPage }) => {
    const firstTwoHundredFiftyFiveCharacters = boundaryText('TC_PMKT-U-00106-19', 255);
    const twoHundredFiftySixCharacters = `${firstTwoHundredFiftyFiveCharacters}X`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialNameInput().fill(twoHundredFiftySixCharacters);

    await expect(vatTuPage.materialNameInput(), 'Tên vật tư phải chặn cứng ký tự thứ 256').toHaveValue(firstTwoHundredFiftyFiveCharacters);
  });

  test('TC_PMKT-U-00106-20 - validate bỏ trống Tên vật tư khi Lưu', async ({ vatTuPage }) => {
    const catalogues = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, catalogues.units);
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính Hoạt động khả dụng trên cả DB và UI');
    if (!mainUnit) return;
    await vatTuPage.fillRequiredInventoryMaterialFields(
      new TestDataGenerator().uniqueCode('TC_PMKT-U-00106-20'),
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
});
