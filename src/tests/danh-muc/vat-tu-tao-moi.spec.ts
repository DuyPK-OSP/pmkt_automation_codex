import { test, expect } from '@fixtures/base.fixture';
import {
  verifyAccountingAccountCombobox,
  verifyAllowedAccountingAccountCombobox,
  verifyBasicMaterialDetails,
  verifyFullGoodsMaterialDetails,
  verifyFullServiceMaterialDetails,
} from '@helpers/vat-tu-assertion.helper';
import { MATERIAL_TYPES } from '@pages/danh-muc/vat-tu.page';
import { expectedMaterialTypeCards } from '@test-data/vat-tu.data';
import { requireCredentials } from '@utils/env.config';
import { statusPair } from '@utils/vat-tu-test.util';
import { TestDataGenerator } from '@utils/test-data';
import { ScreenshotUtil } from '@utils/screenshot.util';

test.describe('PMKT-U-00106 - Thêm mới Danh mục Vật tư', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('CL-UAT-U-00106-01 - popup chọn Loại vật tư hiển thị đủ 6 lựa chọn', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();

    await expect(
      vatTuPage.materialTypeDialog,
      'Popup Chọn tính chất hàng hóa dịch vụ phải hiển thị',
    ).toBeVisible();
    const popupLines = (await vatTuPage.materialTypeDialog.innerText())
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const card of expectedMaterialTypeCards) {
      await expect.soft(
        vatTuPage.materialTypeTitle(card.type),
        `Phải hiển thị lựa chọn ${card.type}`,
      ).toBeVisible();
      await expect.soft(
        popupLines,
        `Mô tả của ${card.type} phải đúng manual testcase`,
      ).toContain(card.description);
    }
  });

  test('CL-UAT-U-00106-02 - multiple select Nhóm vật tư', async ({ vatTuPage }) => {
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const pair = statusPair(catalogues.groups);
    test.skip(
      pair === undefined,
      'Thiếu precondition: danh mục Nhóm vật tư chưa có đồng thời dữ liệu hoạt động và ngừng hoạt động',
    );
    if (!pair) return;

    await vatTuPage.openMaterialTypePopup();
    for (const [index, materialType] of MATERIAL_TYPES.entries()) {
      await vatTuPage.selectMaterialType(materialType);
      await expect(
        vatTuPage.groupCombobox,
        `Loại ${materialType} phải có dropdown Nhóm vật tư`,
      ).toBeVisible();

      await vatTuPage.openGroupDropdown();
      for (const group of catalogues.groups) {
        await expect(
          vatTuPage.groupOption(group.label),
          `Danh sách phải hiển thị nhóm ${group.label}`,
        ).toBeVisible();
      }

      await vatTuPage.searchGroup(pair.active.code);
      await expect(
        vatTuPage.groupOption(pair.active.label),
        'Nhóm vật tư phải tìm được theo mã',
      ).toBeVisible();
      await vatTuPage.searchGroup(pair.active.name);
      await expect(
        vatTuPage.groupOption(pair.active.label),
        'Nhóm vật tư phải tìm được theo tên',
      ).toBeVisible();
      await vatTuPage.closeDropdown();

      if (index < MATERIAL_TYPES.length - 1) {
        await vatTuPage.changeMaterialType();
      }
    }

    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(pair.active);
    await vatTuPage.selectGroup(pair.inactive);
    await vatTuPage.closeDropdown();

    await expect(
      vatTuPage.selectedGroup(pair.active.label),
      'Phải chọn được Nhóm vật tư đang hoạt động',
    ).toBeVisible();
    await expect(
      vatTuPage.selectedGroup(pair.inactive.label),
      'Phải chọn được Nhóm vật tư ngừng hoạt động',
    ).toBeVisible();
  });

  test('CL-UAT-U-00106-03 - select Đơn vị tính chính', async ({ vatTuPage }) => {
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const pair = statusPair(catalogues.units);
    test.skip(
      pair === undefined,
      'Thiếu precondition: danh mục Đơn vị tính chưa có đồng thời dữ liệu hoạt động và ngừng hoạt động',
    );
    if (!pair) return;

    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openMainUnitDropdown();

    await vatTuPage.searchMainUnit(pair.active.code);
    await expect(
      vatTuPage.mainUnitOption(pair.active.label),
      'Đơn vị tính chính phải tìm được theo mã',
    ).toBeVisible();
    await vatTuPage.searchMainUnit(pair.active.name);
    await expect(
      vatTuPage.mainUnitOption(pair.active.label),
      'Đơn vị tính chính phải tìm được theo tên',
    ).toBeVisible();
    await vatTuPage.selectMainUnit(pair.active);
    await expect(
      vatTuPage.selectedMainUnit(pair.active.label),
      'Phải chọn được một Đơn vị tính đang hoạt động hợp lệ',
    ).toBeVisible();

    await vatTuPage.openMainUnitDropdown();
    await vatTuPage.searchMainUnit(pair.inactive.code);
    await expect(
      vatTuPage.mainUnitOption(pair.inactive.label),
      'Dropdown phải hiển thị Đơn vị tính ngừng hoạt động',
    ).toBeVisible();
    await vatTuPage.selectMainUnit(pair.inactive);
    await expect(
      vatTuPage.selectedMainUnit(pair.inactive.label),
      'Phải chọn được Đơn vị tính ngừng hoạt động',
    ).toBeVisible();
  });

  test('CL-UAT-U-00106-04 - combogrid Tài khoản doanh thu', async ({ vatTuPage }) => {
    await verifyAccountingAccountCombobox(vatTuPage, 'Tài khoản doanh thu');
  });

  test('CL-UAT-U-00106-05 - combogrid Tài khoản hàng bán trả lại', async ({ vatTuPage }) => {
    await verifyAccountingAccountCombobox(vatTuPage, 'Tài khoản hàng bán trả lại');
  });

  test('CL-UAT-U-00106-06 - combogrid Tài khoản chi phí', async ({ vatTuPage }) => {
    await verifyAccountingAccountCombobox(vatTuPage, 'Tài khoản chi phí');
  });

  test('CL-UAT-U-00106-07 - combogrid Tài khoản chiết khấu', async ({ vatTuPage }) => {
    await verifyAccountingAccountCombobox(vatTuPage, 'Tài khoản chiết khấu');
  });

  test('CL-UAT-U-00106-08 - combogrid Tài khoản giảm giá', async ({ vatTuPage }) => {
    await verifyAccountingAccountCombobox(vatTuPage, 'Tài khoản giảm giá');
  });

  test('CL-UAT-U-00106-14 - form Hàng hóa hiển thị đầy đủ tab và trường', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await expect(vatTuPage.createMaterialDialog, 'Form Thêm mới vật tư phải hiển thị').toBeVisible();
    await expect(
      vatTuPage.materialTypeValue('Hàng hóa'),
      'Tính chất hàng hóa phải hiển thị dạng textlabel với giá trị Hàng hóa',
    ).toBeVisible();

    for (const tabName of [
      'Hạch toán ngầm định',
      'Thông tin kho',
      'Thông tin thuế',
      'Đơn vị quy đổi',
    ]) {
      await expect.soft(
        vatTuPage.formTab(tabName),
        `Form phải hiển thị Tab ${tabName}`,
      ).toBeVisible();
    }

    const generalControls = [
      { label: 'Mã vật tư', role: 'textbox' as const, required: true },
      { label: 'Tên vật tư', role: 'textbox' as const, required: true },
      { label: 'Nhóm vật tư', role: 'combobox' as const },
      { label: 'Loại hàng hóa đặc trưng', role: 'combobox' as const },
      { label: 'Đơn vị tính chính', role: 'combobox' as const, required: true },
      { label: 'Giảm thuế theo quy định', role: 'checkbox' as const },
      { label: 'Thời hạn bảo hành', role: 'spinbutton' as const },
      { label: 'Mô tả', role: 'textbox' as const },
      { label: 'Tên vật tư khi mua', role: 'textbox' as const },
      { label: 'Tên vật tư khi bán', role: 'textbox' as const },
    ];
    for (const control of generalControls) {
      await expect.soft(
        vatTuPage.formFieldControl(control.label, control.role),
        `${control.label} phải hiển thị đúng control ${control.role}`,
      ).toBeVisible();
      if (control.required) {
        await expect.soft(
          vatTuPage.requiredFormField(control.label),
          `${control.label} phải là trường bắt buộc`,
        ).toBeVisible();
      }
    }
    await expect.soft(
      vatTuPage.warrantyUnitCombobox(),
      'Đơn vị thời hạn bảo hành phải hiển thị dạng select',
    ).toBeVisible();
    await expect.soft(
      vatTuPage.formFieldControl('Giảm thuế theo quy định', 'checkbox'),
      'Giảm thuế theo quy định phải mặc định bỏ chọn',
    ).not.toBeChecked();
    await expect.soft(
      vatTuPage.statusSwitch(),
      'Trạng thái phải là toggle và mặc định Hoạt động',
    ).toBeChecked();

    await vatTuPage.openFormTab('Hạch toán ngầm định');
    for (const fieldLabel of [
      'Tài khoản vật tư',
      'Tài khoản giá vốn',
      'Tài khoản doanh thu',
      'Tài khoản hàng bán trả lại',
      'Tài khoản chi phí',
      'Tài khoản chiết khấu',
      'Tài khoản giảm giá',
    ]) {
      await expect.soft(
        vatTuPage.formFieldControl(fieldLabel, 'combobox'),
        `${fieldLabel} phải hiển thị dạng combogrid`,
      ).toBeVisible();
    }

    await vatTuPage.openFormTab('Thông tin kho');
    for (const control of [
      { label: 'Kho mặc định', role: 'combobox' as const },
      { label: 'Tồn tối thiểu', role: 'spinbutton' as const },
      { label: 'Tồn tối đa', role: 'spinbutton' as const },
      { label: 'Phương pháp tính giá', role: 'combobox' as const },
    ]) {
      await expect.soft(
        vatTuPage.formFieldControl(control.label, control.role),
        `${control.label} phải hiển thị đúng control ${control.role}`,
      ).toBeVisible();
    }
    for (const checkboxName of ['Theo dõi lô', 'Theo dõi mã vạch']) {
      await expect.soft(
        vatTuPage.dialogControl('checkbox', checkboxName),
        `${checkboxName} phải hiển thị dạng checkbox`,
      ).toBeVisible();
    }

    await vatTuPage.openFormTab('Thông tin thuế');
    for (const control of [
      { label: 'Thuế suất GTGT mặc định', role: 'combobox' as const },
      { label: 'Thuế nhập khẩu', role: 'spinbutton' as const },
      { label: 'Thuế xuất khẩu', role: 'spinbutton' as const },
      { label: 'Thuế tiêu thụ đặc biệt', role: 'combobox' as const },
      { label: 'Thuế tài nguyên', role: 'combobox' as const },
    ]) {
      await expect.soft(
        vatTuPage.formFieldControl(control.label, control.role),
        `${control.label} phải hiển thị đúng control ${control.role}`,
      ).toBeVisible();
    }

    await vatTuPage.openFormTab('Đơn vị quy đổi');
    await expect.soft(
      vatTuPage.conversionGrid(),
      'Tab Đơn vị quy đổi phải hiển thị grid',
    ).toBeVisible();
    await expect.soft(
      vatTuPage.addConversionRowButton(),
      'Tab Đơn vị quy đổi phải có nút Thêm dòng',
    ).toBeVisible();
    await vatTuPage.addConversionRow();
    for (const columnName of ['Đơn vị quy đổi', 'Tỷ lệ quy đổi', 'Phép tính', 'Mô tả']) {
      await expect.soft(
        vatTuPage.conversionColumnHeader(columnName),
        `Grid Đơn vị quy đổi phải có cột ${columnName}`,
      ).toBeVisible();
    }
    await expect.soft(
      vatTuPage.conversionRowControls('combobox'),
      'Dòng quy đổi phải có select ĐVT và Phép tính',
    ).toHaveCount(2);
    await expect.soft(
      vatTuPage.conversionRowControls('spinbutton'),
      'Dòng quy đổi phải có input Tỷ lệ',
    ).toHaveCount(1);
    await expect.soft(
      vatTuPage.conversionRowControls('textbox'),
      'Dòng quy đổi phải có trường Mô tả read-only',
    ).toHaveCount(1);
    await expect.soft(
      vatTuPage.conversionRowControls('textbox'),
      'Mô tả Đơn vị quy đổi phải ở trạng thái read-only',
    ).not.toBeEditable();
  });

  test('CL-UAT-U-00106-15 - dropdown Loại hàng hóa đặc trưng', async ({ vatTuPage }) => {
    const expectedOptions = ['Xe ô tô', 'Xe mô tô', 'Hàng hóa khác'];
    const selectedOption = 'Xe ô tô';

    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openSpecialGoodsTypeDropdown();

    for (const option of expectedOptions) {
      await expect(
        vatTuPage.specialGoodsTypeOption(option),
        `Dropdown Loại hàng hóa đặc trưng phải hiển thị ${option}`,
      ).toBeVisible();
    }

    await vatTuPage.selectSpecialGoodsType(selectedOption);
    await expect(
      vatTuPage.selectedSpecialGoodsType(selectedOption),
      `Phải chọn được Loại hàng hóa đặc trưng ${selectedOption}`,
    ).toBeVisible();

    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(
      vatTuPage.selectedSpecialGoodsType(selectedOption),
      'Giá trị Loại hàng hóa đặc trưng không còn phù hợp phải được reset hoặc ẩn',
    ).toBeHidden();
  });

  test('CL-UAT-U-00106-32 - tạo Hàng hóa với đầy đủ thông tin, trạng thái Hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC32');
    const name = `Vật tư hàng hóa TC32 ${code}`;
    const description = `Vật tư phục vụ kiểm thử nghiệp vụ mua bán ${code}`;
    const purchaseName = `Hàng mua ${code}`;
    const saleName = `Hàng bán ${code}`;
    const imagePath = 'test-data/tc32-material.png';
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const group = catalogues.groups[0];
    const mainUnit = catalogues.units[0];
    test.skip(!group || !mainUnit, 'Thiếu Nhóm vật tư hoặc Đơn vị tính hợp lệ trong danh mục');
    if (!group || !mainUnit) return;

    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const material = {
      code,
      name,
      description,
      purchaseName,
      saleName,
      imagePath,
      group,
      mainUnit,
    };
    const selection = await vatTuPage.fillFullGoodsMaterial(material);
    await expect(vatTuPage.materialImagePreview(), 'Ảnh vật tư phải hiển thị preview').toBeVisible();

    const successNotificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    const successNotification = await successNotificationPromise;
    await expect.soft(successNotification, 'Thông báo thành công phải đúng manual testcase').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog, 'Form tạo mới phải đóng sau khi lưu').toBeHidden();

    await verifyFullGoodsMaterialDetails(vatTuPage, material, selection);
  });

  test('CL-UAT-U-00106-33 - tạo Hàng hóa với tối thiểu trường bắt buộc', async ({ vatTuPage }) => {
    const traceId = Date.now().toString();
    const code = `AUTO_TC33_${traceId}`;
    const name = `Auto TCS33 ${traceId}`;
    const pricingMethod = 'Nhập trước xuất trước';
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find(
      (unit) => unit.name === 'Cái' && unit.status === 'HoatDong',
    );
    test.skip(
      mainUnit === undefined,
      'Thiếu precondition: không có Đơn vị tính chính Cái ở trạng thái hoạt động',
    );
    if (!mainUnit) return;

    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);

    await expect(
      vatTuPage.statusSwitch(),
      'Trạng thái phải mặc định là Hoạt động',
    ).toBeChecked();
    await expect(
      vatTuPage.formFieldControl('Nhóm vật tư', 'combobox'),
      'Nhóm vật tư không bắt buộc phải để trống',
    ).toHaveValue('');
    await expect(
      vatTuPage.formFieldControl('Mô tả', 'textbox'),
      'Mô tả không bắt buộc phải để trống',
    ).toHaveValue('');

    await vatTuPage.selectPricingMethod(pricingMethod);
    const successNotificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    const successNotification = await successNotificationPromise;
    await expect.soft(
      successNotification,
      'Thông báo thành công phải đúng testcase',
    ).toBe('Thêm mới thành công');
    await expect(
      vatTuPage.createMaterialDialog,
      'Form phải đóng sau khi lưu thành công',
    ).toBeHidden();

    await vatTuPage.searchMaterial(code);
    await expect(
      vatTuPage.materialRow(code),
      'Bản ghi vừa tạo phải hiển thị trên danh sách',
    ).toBeVisible();
    await vatTuPage.openMaterialDetails(code);

    const details = vatTuPage.materialDetails(code);
    await expect(details, 'Chi tiết bản ghi vừa tạo phải hiển thị').toBeVisible();
    await expect(
      vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox'),
      'Chi tiết phải hiển thị đúng Mã vật tư',
    ).toHaveValue(code);
    await expect(
      vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox'),
      'Chi tiết phải hiển thị đúng Tên vật tư',
    ).toHaveValue(name);
    await expect(
      vatTuPage.materialDetailSelectedValue(
        code,
        'Đơn vị tính chính',
        mainUnit.label,
      ),
      'Chi tiết phải hiển thị đúng Đơn vị tính chính',
    ).toBeVisible();
    await expect(
      vatTuPage.materialDetailStatusSwitch(code),
      'Chi tiết phải hiển thị Trạng thái Hoạt động',
    ).toBeChecked();

    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(
      vatTuPage.materialDetailSelectedValue(
        code,
        'Phương pháp tính giá',
        pricingMethod,
      ),
      'Chi tiết phải hiển thị đúng Phương pháp tính giá',
    ).toBeVisible();
  });

  test('CL-UAT-U-00106-34 - tạo Hàng hóa với trạng thái Ngừng hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC34');
    const name = `Vật tư TC34 ${code}`;
    const pricingMethod = 'Nhập trước xuất trước';
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find(
      (unit) => unit.name === 'Cái' && unit.status === 'HoatDong',
    );
    test.skip(
      mainUnit === undefined,
      'Thiếu precondition: không có Đơn vị tính chính Cái ở trạng thái hoạt động',
    );
    if (!mainUnit) return;

    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(false);
    await expect(
      vatTuPage.statusSwitch(),
      'Trạng thái trên form phải là Ngừng hoạt động',
    ).not.toBeChecked();
    await vatTuPage.selectPricingMethod(pricingMethod);

    const successNotificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    const successNotification = await successNotificationPromise;
    await expect.soft(
      successNotification,
      'Thông báo thành công phải đúng manual testcase',
    ).toBe('Thêm mới thành công');

    await vatTuPage.searchMaterial(code);
    await expect(
      vatTuPage.materialRow(code),
      'Bản ghi Ngừng hoạt động vừa tạo phải hiển thị trên danh sách',
    ).toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await expect(
      vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox'),
      'Chi tiết phải hiển thị đúng Mã vật tư',
    ).toHaveValue(code);
    await expect(
      vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox'),
      'Chi tiết phải hiển thị đúng Tên vật tư',
    ).toHaveValue(name);
    await expect(
      vatTuPage.materialDetailStatusSwitch(code),
      'Chi tiết phải hiển thị Trạng thái Ngừng hoạt động',
    ).not.toBeChecked();
  });

  test('CL-UAT-U-00106-35 - tạo Hàng hóa bằng Lưu và Thêm mới', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC35');
    const name = `Vật tư TC35 ${code}`;
    const pricingMethod = 'Nhập trước xuất trước';
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find(
      (unit) => unit.name === 'Cái' && unit.status === 'HoatDong',
    );
    test.skip(
      mainUnit === undefined,
      'Thiếu precondition: không có Đơn vị tính chính Cái ở trạng thái hoạt động',
    );
    if (!mainUnit) return;

    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.selectPricingMethod(pricingMethod);

    const successNotificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveAndAddMaterial();
    const successNotification = await successNotificationPromise;
    await expect.soft(
      successNotification,
      'Thông báo thành công phải đúng manual testcase',
    ).toBe('Thêm mới thành công');
    await expect(
      vatTuPage.createMaterialDialog,
      'Form tạo mới phải tiếp tục mở sau khi Lưu và Thêm mới',
    ).toBeVisible();
    await expect(
      vatTuPage.materialCodeInput(),
      'Mã vật tư phải được reset',
    ).toHaveValue('');
    await expect(
      vatTuPage.materialNameInput(),
      'Tên vật tư phải được reset',
    ).toHaveValue('');
    await expect(
      vatTuPage.mainUnitCombobox,
      'Đơn vị tính chính phải được reset',
    ).toHaveValue('');
    await expect(
      vatTuPage.statusSwitch(),
      'Trạng thái phải reset về mặc định Hoạt động',
    ).toBeChecked();
    await expect(
      vatTuPage.materialRow(code),
      'Bản ghi vừa tạo phải hiển thị trên danh sách phía sau form',
    ).toBeAttached();
  });

  test('CL-UAT-U-00106-36 - hủy tạo mới khi chưa nhập dữ liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');

    await vatTuPage.cancelCreatingMaterial();

    await expect(
      vatTuPage.closeConfirmationDialog,
      'Không được hiển thị popup xác nhận khi người dùng chưa nhập dữ liệu',
    ).toBeHidden();
    await expect(
      vatTuPage.createMaterialDialog,
      'Form tạo mới phải đóng ngay khi chưa có dữ liệu thay đổi',
    ).toBeHidden();
    await expect(
      vatTuPage.addButton,
      'Hệ thống phải quay lại màn hình danh sách Vật tư',
    ).toBeVisible();
  });

  test('CL-UAT-U-00106-37 - hủy tạo mới khi đã nhập dữ liệu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC37');
    const name = `Vật tư TC37 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(code);
    await vatTuPage.materialNameInput().fill(name);

    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible();
    await expect.soft(
      vatTuPage.closeConfirmationMessage(),
      'Nội dung popup xác nhận phải đúng manual testcase',
    ).toHaveText(
      'Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.',
    );

    await vatTuPage.dismissCloseConfirmation();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
    await expect(vatTuPage.materialNameInput()).toHaveValue(name);

    await vatTuPage.cancelCreatingMaterial();
    await vatTuPage.confirmClose();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
    await vatTuPage.searchMaterial(code);
    await expect(
      vatTuPage.materialRow(code),
      'Dữ liệu đã hủy không được lưu vào danh sách',
    ).toBeHidden();
  });

  test('CL-UAT-U-00106-38 - đổi Hàng hóa sang Dịch vụ phải ẩn và reset dữ liệu đặc thù', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC38');
    const pricingMethod = 'Nhập trước xuất trước';
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.materialCodeInput().fill(code);
    await vatTuPage.materialNameInput().fill(`Vật tư TC38 ${code}`);
    await vatTuPage.selectPricingMethod(pricingMethod);
    await expect(vatTuPage.selectedPricingMethod(pricingMethod)).toBeVisible();

    await vatTuPage.openFormTab('Đơn vị quy đổi');
    await vatTuPage.addConversionRow();
    await vatTuPage.conversionRowControls('spinbutton').fill('2');
    await expect(vatTuPage.conversionRowControls('spinbutton')).toHaveValue('2');

    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formTab('Thông tin kho')).toBeHidden();
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeHidden();
    await vatTuPage.openDefaultAccountingTab();
    await expect(vatTuPage.formField('Tài khoản vật tư')).toBeHidden();
    await expect(vatTuPage.formField('Tài khoản giá vốn')).toBeHidden();
    for (const account of [
      'Tài khoản doanh thu',
      'Tài khoản hàng bán trả lại',
      'Tài khoản chi phí',
      'Tài khoản chiết khấu',
      'Tài khoản giảm giá',
    ]) {
      await expect(vatTuPage.formField(account), `${account} phải tiếp tục hiển thị`).toBeVisible();
    }

    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Hàng hóa');
    await vatTuPage.openFormTab('Thông tin kho');
    await expect(vatTuPage.selectedPricingMethod(pricingMethod)).toBeHidden();
    await vatTuPage.openFormTab('Đơn vị quy đổi');
    await expect(vatTuPage.conversionRowControls('spinbutton')).toHaveCount(0);
  });

  test('CL-UAT-U-00106-48 - tạo Dịch vụ với đầy đủ thông tin, trạng thái Hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC48');
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const group = catalogues.groups[0];
    const mainUnit = catalogues.units[0];
    test.skip(!group || !mainUnit, 'Thiếu Nhóm vật tư hoặc Đơn vị tính hợp lệ trong danh mục');
    if (!group || !mainUnit) return;
    const material = {
      code,
      name: `Dịch vụ kế toán TC48 ${code}`,
      description: `Dịch vụ tư vấn nghiệp vụ kế toán ${code}`,
      purchaseName: `Dịch vụ mua ${code}`,
      saleName: `Dịch vụ bán ${code}`,
      group,
      mainUnit,
    };

    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await expect(vatTuPage.formField('Thời hạn bảo hành')).toBeHidden();
    await expect(vatTuPage.materialImageSection()).toBeHidden();
    await expect(vatTuPage.formTab('Thông tin kho')).toBeHidden();
    await expect(vatTuPage.formTab('Đơn vị quy đổi')).toBeHidden();
    const selection = await vatTuPage.fillFullServiceMaterial(material);

    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise).toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await verifyFullServiceMaterialDetails(vatTuPage, material, selection);
  });

  test('CL-UAT-U-00106-49 - tạo Dịch vụ với tối thiểu trường bắt buộc', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC49');
    const name = `Dịch vụ tối thiểu TC49 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillMaterialIdentity(code, name);
    await expect(vatTuPage.mainUnitCombobox, 'Đơn vị tính chính của Dịch vụ không bắt buộc').toHaveValue('');
    await expect(vatTuPage.statusSwitch()).toBeChecked();

    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise).toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, true);
  });

  test('CL-UAT-U-00106-50 - tạo Dịch vụ với trạng thái Ngừng hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC50');
    const name = `Dịch vụ ngừng hoạt động TC50 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillMaterialIdentity(code, name);
    await vatTuPage.setMaterialStatus(false);
    await expect(vatTuPage.statusSwitch()).not.toBeChecked();

    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise).toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, false);
  });

  test('CL-UAT-U-00106-51 - tạo Dịch vụ bằng Lưu và Thêm mới', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC51');
    const name = `Dịch vụ lưu thêm TC51 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillMaterialIdentity(code, name);

    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveAndAddMaterial();
    await expect.soft(await notificationPromise).toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    await expect(vatTuPage.materialNameInput()).toHaveValue('');
    await expect(vatTuPage.mainUnitCombobox).toHaveValue('');
    await expect(vatTuPage.statusSwitch()).toBeChecked();
    await expect(vatTuPage.materialRow(code)).toBeAttached();
  });

  test('CL-UAT-U-00106-52 - hủy tạo mới Dịch vụ khi chưa nhập dữ liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.cancelCreatingMaterial();

    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
  });

  test('CL-UAT-U-00106-53 - hủy tạo mới Dịch vụ khi đã nhập dữ liệu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC53');
    const name = `Dịch vụ hủy TC53 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Dịch vụ');
    await vatTuPage.fillMaterialIdentity(code, name);

    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible();
    await expect(vatTuPage.closeConfirmationMessage()).toHaveText(
      'Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.',
    );
    await vatTuPage.dismissCloseConfirmation();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
    await expect(vatTuPage.materialNameInput()).toHaveValue(name);

    await vatTuPage.cancelCreatingMaterial();
    await vatTuPage.confirmClose();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code)).toBeHidden();
  });

  test('CL-UAT-U-00106-54 - form Nguyên vật liệu hiển thị đầy đủ tab và trường', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');

    for (const tabName of ['Hạch toán ngầm định', 'Thông tin kho', 'Thông tin thuế', 'Đơn vị quy đổi']) {
      await expect.soft(vatTuPage.formTab(tabName), `Phải hiển thị Tab ${tabName}`).toBeVisible();
    }
    await expect(vatTuPage.formTab('Đơn vị tính khác')).toBeHidden();
    for (const label of ['Mã vật tư', 'Tên vật tư', 'Đơn vị tính chính']) {
      await expect.soft(vatTuPage.requiredFormField(label), `${label} phải là trường bắt buộc`).toBeVisible();
    }
    await expect(vatTuPage.statusSwitch(), 'Trạng thái phải mặc định Hoạt động').toBeChecked();
  });

  test('CL-UAT-U-00106-55 - dropdown Đơn vị thời hạn bảo hành của Nguyên vật liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.fillFormField('Thời hạn bảo hành', '6');
    await vatTuPage.openWarrantyUnitDropdown();
    const options = vatTuPage.warrantyUnitOptions().first();
    const selectedUnit = (await options.innerText()).trim();
    expect(selectedUnit, 'Danh sách đơn vị thời gian cấu hình không được rỗng').not.toBe('');
    await vatTuPage.selectWarrantyUnit(selectedUnit);
    await expect(vatTuPage.selectedWarrantyUnit(selectedUnit)).toBeVisible();
    await vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton').fill('');
    await expect(vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton')).toHaveValue('');
    await expect(vatTuPage.selectedWarrantyUnit(selectedUnit)).toBeVisible();
  });

  test('CL-UAT-U-00106-56 - combogrid Tài khoản vật tư của Nguyên vật liệu', async ({ vatTuPage }) => {
    await verifyAllowedAccountingAccountCombobox(vatTuPage, 'Tài khoản vật tư', 'Nguyên vật liệu');
  });

  test('CL-UAT-U-00106-57 - combogrid Tài khoản giá vốn của Nguyên vật liệu', async ({ vatTuPage }) => {
    await verifyAllowedAccountingAccountCombobox(vatTuPage, 'Tài khoản giá vốn', 'Nguyên vật liệu');
  });

  test('CL-UAT-U-00106-58 - combogrid Kho mặc định của Nguyên vật liệu', async ({ vatTuPage }) => {
    const warehouses = await vatTuPage.openFromDanhMucAndCollectWarehouses();
    const pair = statusPair(warehouses);
    test.skip(!pair, 'Thiếu precondition: danh mục Kho chưa có đồng thời kho hoạt động và ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openWarehouseDropdown();
    await expect.soft((await vatTuPage.warehouseColumnHeaders().allTextContents()).map((value) => value.trim()).filter(Boolean))
      .toEqual(['Mã kho', 'Tên kho', 'Trạng thái']);
    await vatTuPage.searchWarehouse(pair.active.code);
    await expect(vatTuPage.warehouseOption(pair.active.label), 'Phải tìm được kho theo mã').toBeVisible();
    await vatTuPage.searchWarehouse(pair.active.name);
    await expect(vatTuPage.warehouseOption(pair.active.label), 'Phải tìm được kho theo tên').toBeVisible();
    await vatTuPage.selectWarehouse(pair.active);
    await expect(vatTuPage.selectedWarehouse(pair.active.label)).toBeVisible();
    await vatTuPage.openWarehouseDropdown();
    await vatTuPage.searchWarehouse(pair.inactive.code);
    await expect(vatTuPage.warehouseOption(pair.inactive.label), 'Kho ngừng hoạt động phải hiển thị').toBeVisible();
    await expect.soft(vatTuPage.warehouseOptionRow(pair.inactive.label), 'Dòng kho phải hiển thị trạng thái Ngừng hoạt động').toContainText('Ngừng hoạt động');
    await vatTuPage.selectWarehouse(pair.inactive);
    await expect(vatTuPage.selectedWarehouse(pair.inactive.label), 'Phải chọn được kho ngừng hoạt động').toBeVisible();
  });

  test('CL-UAT-U-00106-59 - dropdown Phương pháp tính giá của Nguyên vật liệu', async ({ vatTuPage }) => {
    const methods = ['Nhập trước xuất trước', 'Bình quân gia quyền cuối kỳ', 'Bình quân gia quyền tức thời', 'Đích danh'];
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openFormTab('Thông tin kho');
    const initialValue = await vatTuPage.pricingMethodCombobox().inputValue();
    for (const method of methods) {
      await vatTuPage.selectPricingMethod(method);
      await expect(vatTuPage.selectedPricingMethod(method), `Phải chọn được ${method}`).toBeVisible();
    }
    await vatTuPage.changeMaterialType();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openFormTab('Thông tin kho');
    await expect(vatTuPage.pricingMethodCombobox(), 'Giá trị mặc định phải nhất quán sau khi reset form').toHaveValue(initialValue);
  });

  test('CL-UAT-U-00106-60 - combogrid Thuế tài nguyên của Nguyên vật liệu', async ({ vatTuPage }) => {
    const taxes = await vatTuPage.openFromDanhMucAndCollectResourceTaxes();
    const pair = statusPair(taxes);
    test.skip(!pair, 'Thiếu precondition: danh mục Thuế tài nguyên chưa có đồng thời dữ liệu hoạt động và ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openTaxDropdown('Thuế tài nguyên');
    await vatTuPage.searchTax('Thuế tài nguyên', pair.active.code);
    await expect(vatTuPage.taxOption(pair.active.label), 'Phải tìm được Thuế tài nguyên hoạt động theo mã').toBeVisible();
    await vatTuPage.searchTax('Thuế tài nguyên', pair.active.name);
    await expect(vatTuPage.taxOption(pair.active.label), 'Phải tìm được Thuế tài nguyên hoạt động theo tên').toBeVisible();
    await vatTuPage.selectTax('Thuế tài nguyên', pair.active);
    await expect(vatTuPage.selectedTax('Thuế tài nguyên', pair.active.label)).toBeVisible();
    await vatTuPage.openTaxDropdown('Thuế tài nguyên');
    await vatTuPage.searchTax('Thuế tài nguyên', pair.inactive.code);
    await expect(vatTuPage.taxOption(pair.inactive.label), 'Thuế tài nguyên ngừng hoạt động phải hiển thị').toBeVisible();
    await vatTuPage.selectTax('Thuế tài nguyên', pair.inactive);
    await expect(vatTuPage.selectedTax('Thuế tài nguyên', pair.inactive.label), 'Phải chọn được Thuế tài nguyên ngừng hoạt động').toBeVisible();
  });

  test('CL-UAT-U-00106-61 - đúng loại control các trường Thuế của Nguyên vật liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openFormTab('Thông tin thuế');
    for (const label of ['Thuế suất GTGT mặc định', 'Thuế tiêu thụ đặc biệt', 'Thuế tài nguyên']) {
      await expect.soft(vatTuPage.formFieldControl(label, 'combobox'), `${label} phải là select/combogrid`).toBeVisible();
      const selected = await vatTuPage.selectFirstFormOption(label);
      await expect(vatTuPage.selectedTax(label, selected), `Phải chọn được giá trị hợp lệ của ${label}`).toBeVisible();
    }
    for (const label of ['Thuế nhập khẩu', 'Thuế xuất khẩu']) {
      await expect.soft(vatTuPage.formFieldControl(label, 'spinbutton'), `${label} phải là numeric`).toBeVisible();
      await vatTuPage.fillFormField(label, '10');
      await expect(vatTuPage.formFieldControl(label, 'spinbutton')).toHaveValue('10');
    }
  });

  test('CL-UAT-U-00106-62 - dropdown Đơn vị quy đổi của Nguyên vật liệu', async ({ vatTuPage }) => {
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const pair = statusPair(catalogues.units);
    test.skip(!pair, 'Thiếu precondition: danh mục Đơn vị tính chưa có đồng thời dữ liệu hoạt động và ngừng hoạt động');
    if (!pair) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openFormTab('Đơn vị quy đổi');
    await vatTuPage.addConversionRow();
    await vatTuPage.openFirstConversionUnitDropdown();
    await vatTuPage.searchFirstConversionUnit(pair.active.code);
    await expect(vatTuPage.mainUnitOption(pair.active.label), 'Phải tìm được Đơn vị quy đổi theo mã').toBeVisible();
    await vatTuPage.searchFirstConversionUnit(pair.active.name);
    await expect(vatTuPage.mainUnitOption(pair.active.label), 'Phải tìm được Đơn vị quy đổi theo tên').toBeVisible();
    await vatTuPage.selectFirstConversionUnit(pair.active);
    await expect(vatTuPage.selectedFirstConversionUnit(pair.active.label)).toBeVisible();
    await vatTuPage.openFirstConversionUnitDropdown();
    await vatTuPage.searchFirstConversionUnit(pair.inactive.code);
    await expect(vatTuPage.mainUnitOption(pair.inactive.label), 'Đơn vị tính ngừng hoạt động phải hiển thị').toBeVisible();
    await vatTuPage.selectFirstConversionUnit(pair.inactive);
    await expect(vatTuPage.selectedFirstConversionUnit(pair.inactive.label), 'Phải chọn được Đơn vị tính ngừng hoạt động').toBeVisible();
  });

  test('CL-UAT-U-00106-63 - tự động fill tài khoản ngầm định của Nguyên vật liệu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const accounts = await vatTuPage.openFromDanhMucAndCollectAccounts();
    const disallowed = accounts.find((account) => !account.allowed);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.fillMaterialIdentity(data.uniqueCode('TC63'), 'Nguyên vật liệu kiểm tra tài khoản TC63');
    await vatTuPage.openDefaultAccountingTab();
    for (const label of ['Tài khoản vật tư', 'Tài khoản giá vốn', 'Tài khoản doanh thu', 'Tài khoản hàng bán trả lại', 'Tài khoản chi phí', 'Tài khoản chiết khấu', 'Tài khoản giảm giá']) {
      await expect.soft(vatTuPage.selectedFormValue(label), `${label} phải được tự động fill từ cấu hình Loại vật tư`).toBeVisible({ timeout: 1_000 });
      if (disallowed) {
        await vatTuPage.openAccountingAccountDropdown(label);
        await vatTuPage.searchAccountingAccount(label, disallowed.code);
        await expect(vatTuPage.accountingAccountOption(disallowed.label), `${label} không được hiển thị tài khoản không cho phép hạch toán`).toBeHidden();
        await vatTuPage.closeDropdown();
      }
    }
    await expect(vatTuPage.formField('Tài khoản vật tư')).toBeVisible();
    await expect(vatTuPage.formField('Tài khoản giá vốn')).toBeVisible();
  });

  test('CL-UAT-U-00106-64 - validate và tự động điều chỉnh Thời hạn bảo hành', async ({ vatTuPage, page }, testInfo) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    const code = data.uniqueCode('TC64');
    const name = `Nguyên vật liệu kiểm tra THBH ${code}`;
    await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    const warrantyInput = vatTuPage.formFieldControl('Thời hạn bảo hành', 'spinbutton');

    await warrantyInput.fill('-1');
    await vatTuPage.commitCurrentFormField();
    await expect(warrantyInput, 'THBH âm phải tự động được điều chỉnh thành 0').toHaveValue('0');

    await warrantyInput.fill('1.5');
    await vatTuPage.commitCurrentFormField();
    const decimalWarranty = await warrantyInput.inputValue();
    if (!/^\d+$/.test(decimalWarranty)) {
      await ScreenshotUtil.attachLocator(
        vatTuPage.createMaterialDialog,
        testInfo,
        'BUG-TC64-warranty-decimal-mismatch',
      );
    }
    await expect.soft(warrantyInput, 'THBH thập phân phải tự động được điều chỉnh thành số nguyên').toHaveValue(/^\d+$/);

    const valueBeforeTextInput = await warrantyInput.inputValue();
    await warrantyInput.fill('ABC');
    await vatTuPage.commitCurrentFormField();
    await expect(warrantyInput, 'THBH phải chặn ký tự text và giữ nguyên giá trị trước đó').toHaveValue(valueBeforeTextInput);

    await warrantyInput.fill('0');
    const zeroWarrantyNotificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    const zeroWarrantyNotification = await zeroWarrantyNotificationPromise;
    if (zeroWarrantyNotification !== 'Thời hạn bảo hành phải là số nguyên dương') {
      await ScreenshotUtil.attach(
        page,
        testInfo,
        'BUG-TC64-warranty-zero-toast-content-mismatch',
      );
    }
    await expect.soft(
      zeroWarrantyNotification,
      'THBH bằng 0 phải hiển thị đúng thông báo lỗi',
    ).toBe('Thời hạn bảo hành phải là số nguyên dương');
    await expect(
      vatTuPage.createMaterialDialog,
      'Form phải giữ nguyên khi THBH bằng 0',
    ).toBeVisible();
  });

  test('CL-UAT-U-00106-65 - chặn Tồn tối thiểu âm và tự động gán bằng 0', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    const code = data.uniqueCode('TC65');
    const name = `Nguyên vật liệu tồn tối thiểu TC65 ${code}`;
    await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    const minimumStockInput = vatTuPage.formFieldControl('Tồn tối thiểu', 'spinbutton');
    await minimumStockInput.fill('-1');
    await vatTuPage.commitCurrentFormField();
    await expect(minimumStockInput, 'Tồn tối thiểu âm phải tự động được điều chỉnh thành 0').toHaveValue('0');

    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog, 'Form phải đóng sau khi lưu thành công').toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Bản ghi vừa tạo phải hiển thị trên danh sách').toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(
      vatTuPage.materialDetailControl(code, 'Tồn tối thiểu', 'spinbutton'),
      'Chi tiết vật tư phải lưu Tồn tối thiểu bằng 0',
    ).toHaveValue('0');
  });

  test('CL-UAT-U-00106-66 - chặn Tồn tối đa âm và tự động gán bằng 0', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    const code = data.uniqueCode('TC66');
    const name = `Nguyên vật liệu tồn tối đa TC66 ${code}`;
    await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    const maximumStockInput = vatTuPage.formFieldControl('Tồn tối đa', 'spinbutton');
    await maximumStockInput.fill('-1');
    await vatTuPage.commitCurrentFormField();
    await expect(maximumStockInput, 'Tồn tối đa âm phải tự động được điều chỉnh thành 0').toHaveValue('0');

    await vatTuPage.saveMaterial();
    await expect(vatTuPage.successNotification(), 'Phải hiển thị thông báo tạo mới thành công').toContainText(/thành công/i);
    await expect(vatTuPage.createMaterialDialog, 'Form phải đóng sau khi lưu thành công').toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Bản ghi vừa tạo phải hiển thị trên danh sách').toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(
      vatTuPage.materialDetailControl(code, 'Tồn tối đa', 'spinbutton'),
      'Chi tiết vật tư phải lưu Tồn tối đa bằng 0',
    ).toHaveValue('0');
  });

  test('CL-UAT-U-00106-67 - không cho lưu khi Tồn tối đa nhỏ hơn Tồn tối thiểu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    const code = data.uniqueCode('TC67');
    const name = `Nguyên vật liệu kiểm tra giới hạn tồn TC67 ${code}`;
    await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    const minimumStockInput = vatTuPage.formFieldControl('Tồn tối thiểu', 'spinbutton');
    const maximumStockInput = vatTuPage.formFieldControl('Tồn tối đa', 'spinbutton');
    await minimumStockInput.fill('10');
    await maximumStockInput.fill('5');

    await vatTuPage.saveMaterial();
    await expect.soft(
      vatTuPage.validationMessage('Tồn tối đa', 'Tồn tối đa phải ≥ Tồn tối thiểu'),
      'Phải hiển thị đúng thông báo khi Tồn tối đa nhỏ hơn Tồn tối thiểu',
    ).toBeVisible();
    await expect(vatTuPage.createMaterialDialog, 'Form phải giữ nguyên khi dữ liệu tồn kho không hợp lệ').toBeVisible();
    await expect(minimumStockInput, 'Giá trị Tồn tối thiểu đã nhập không được mất').toHaveValue('10');
    await expect(maximumStockInput, 'Giá trị Tồn tối đa đã nhập không được mất').toHaveValue('5');
  });

  test('CL-UAT-U-00106-68 - không cho lưu khi bỏ trống các trường bắt buộc', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.openFormTab('Hạch toán ngầm định');
    await vatTuPage.openFormTab('Thông tin kho');
    await vatTuPage.openFormTab('Thông tin thuế');
    await vatTuPage.openFormTab('Đơn vị quy đổi');
    await vatTuPage.addConversionRow();

    await vatTuPage.saveMaterial();
    await expect.soft(
      vatTuPage.validationMessage('Mã vật tư', 'Vui lòng nhập Mã vật tư'),
      'Mã vật tư trống phải hiển thị đúng lỗi bắt buộc',
    ).toBeVisible();
    await expect.soft(
      vatTuPage.validationMessage('Tên vật tư', 'Vui lòng nhập Tên vật tư'),
      'Tên vật tư trống phải hiển thị đúng lỗi bắt buộc',
    ).toBeVisible();
    await expect.soft(
      vatTuPage.validationMessage('Đơn vị tính chính', 'Vui lòng chọn Đơn vị tính'),
      'Đơn vị tính chính trống phải hiển thị đúng lỗi bắt buộc',
    ).toBeVisible({ timeout: 2_000 });
    await expect.soft(
      vatTuPage.conversionValidationMessages(),
      'Dòng Đơn vị quy đổi trống phải hiển thị MSG_PMKT-U-00106_012',
    ).not.toHaveCount(0, { timeout: 2_000 });
    await expect(vatTuPage.createMaterialDialog, 'Form phải giữ nguyên khi thiếu dữ liệu bắt buộc').toBeVisible();
    await expect(vatTuPage.conversionRowControls('combobox'), 'Dòng Đơn vị quy đổi đã thêm không được mất').toHaveCount(2);
  });

  test('CL-UAT-U-00106-69 - kiểm soát max length các trường của Nguyên vật liệu', async ({ vatTuPage }) => {
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');

    const values = {
      code: `TC69_${'C'.repeat(96)}`,
      name: 'N'.repeat(256),
      description: 'D'.repeat(1001),
      purchaseName: 'M'.repeat(256),
      saleName: 'B'.repeat(256),
      ratio: '9'.repeat(51),
    };
    await vatTuPage.fillRequiredMaterialFields(values.code, values.name, mainUnit);
    await vatTuPage.fillFormField('Mô tả', values.description);
    await vatTuPage.fillFormField('Tên vật tư khi mua', values.purchaseName);
    await vatTuPage.fillFormField('Tên vật tư khi bán', values.saleName);
    await vatTuPage.openFormTab('Đơn vị quy đổi');
    await vatTuPage.addConversionRow();
    await vatTuPage.conversionRowControls('spinbutton').first().fill(values.ratio);

    const limits = [
      { field: vatTuPage.formFieldControl('Mã vật tư', 'textbox'), max: 100, name: 'Mã vật tư' },
      { field: vatTuPage.formFieldControl('Tên vật tư', 'textbox'), max: 255, name: 'Tên vật tư' },
      { field: vatTuPage.formFieldControl('Mô tả', 'textbox'), max: 1000, name: 'Mô tả' },
      { field: vatTuPage.formFieldControl('Tên vật tư khi mua', 'textbox'), max: 255, name: 'Tên vật tư khi mua' },
      { field: vatTuPage.formFieldControl('Tên vật tư khi bán', 'textbox'), max: 255, name: 'Tên vật tư khi bán' },
      { field: vatTuPage.conversionRowControls('spinbutton').first(), max: 50, name: 'Tỷ lệ quy đổi' },
    ];
    const exceededLimits: string[] = [];
    for (const limit of limits) {
      const actualLength = (await limit.field.inputValue()).length;
      if (actualLength > limit.max) exceededLimits.push(limit.name);
      else await expect.soft(actualLength, `${limit.name} không được vượt quá ${limit.max} ký tự`).toBeLessThanOrEqual(limit.max);
    }

    if (exceededLimits.length) {
      await vatTuPage.saveMaterial();
      await expect(vatTuPage.createMaterialDialog, `Form phải giữ nguyên khi vượt max length: ${exceededLimits.join(', ')}`).toBeVisible();
    } else {
      expect(exceededLimits, 'Tất cả control phải chặn dữ liệu vượt max length').toEqual([]);
    }
  });

  test('CL-UAT-U-00106-70 - tự động trim khoảng trắng đầu cuối khi lưu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((unit) => unit.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    const code = data.uniqueCode('TC70');
    const name = `Nguyên vật liệu trim TC70 ${code}`;
    const description = `Mô tả kiểm tra trim ${code}`;
    const purchaseName = `Tên mua kiểm tra trim ${code}`;
    const saleName = `Tên bán kiểm tra trim ${code}`;
    await vatTuPage.fillRequiredInventoryMaterialFields(`  ${code}  `, `  ${name}  `, mainUnit);
    await vatTuPage.fillFormField('Mô tả', `  ${description}  `);
    await vatTuPage.fillFormField('Tên vật tư khi mua', `  ${purchaseName}  `);
    await vatTuPage.fillFormField('Tên vật tư khi bán', `  ${saleName}  `);

    await vatTuPage.saveMaterial();
    await expect(vatTuPage.createMaterialDialog, 'Form phải đóng sau khi lưu thành công').toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Bản ghi vừa tạo phải hiển thị trên màn hình danh sách').toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox')).toHaveValue(code);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(name);
    await expect(vatTuPage.materialDetailControl(code, 'Mô tả', 'textbox')).toHaveValue(description);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư khi mua', 'textbox')).toHaveValue(purchaseName);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư khi bán', 'textbox')).toHaveValue(saleName);
  });

  test('CL-UAT-U-00106-71 - tạo Nguyên vật liệu với đầy đủ thông tin', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const group = catalogues.groups.find((item) => item.status === 'HoatDong');
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit || catalogues.units.length < 2, 'Thiếu danh mục Nhóm vật tư hoặc Đơn vị tính phù hợp');
    if (!group || !mainUnit) return;
    const code = data.uniqueCode('TC71');
    const name = `Nguyên vật liệu đầy đủ TC71 ${code}`;
    const description = `Nguyên liệu phục vụ sản xuất ${code}`;
    const purchaseName = `Nguyên liệu mua ${code}`;
    const saleName = `Nguyên liệu bán ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.fillRequiredMaterialFields(code, name, mainUnit);
    await vatTuPage.openGroupDropdown();
    await vatTuPage.selectGroup(group);
    await vatTuPage.closeDropdown();
    await vatTuPage.setCheckbox('Giảm thuế theo quy định', true);
    await vatTuPage.fillFormField('Thời hạn bảo hành', '12');
    await vatTuPage.fillFormField('Mô tả', description);
    await vatTuPage.fillFormField('Tên vật tư khi mua', purchaseName);
    await vatTuPage.fillFormField('Tên vật tư khi bán', saleName);
    await vatTuPage.uploadMaterialImage('test-data/tc32-material.png');
    await vatTuPage.setMaterialStatus(true);

    await vatTuPage.openDefaultAccountingTab();
    for (const label of ['Tài khoản vật tư', 'Tài khoản giá vốn', 'Tài khoản doanh thu', 'Tài khoản hàng bán trả lại', 'Tài khoản chi phí', 'Tài khoản chiết khấu', 'Tài khoản giảm giá']) {
      await vatTuPage.ensureFirstFormOption(label);
    }
    await vatTuPage.openFormTab('Thông tin kho');
    const warehouse = await vatTuPage.ensureFirstFormOption('Kho mặc định');
    const pricingMethod = await vatTuPage.ensureFirstFormOption('Phương pháp tính giá');
    await vatTuPage.fillFormField('Tồn tối thiểu', '10');
    await vatTuPage.fillFormField('Tồn tối đa', '100');
    await vatTuPage.setCheckbox('Theo dõi lô', true);
    await vatTuPage.setCheckbox('Theo dõi mã vạch', true);
    await vatTuPage.openFormTab('Thông tin thuế');
    const vatRate = await vatTuPage.selectFirstFormOption('Thuế suất GTGT mặc định');
    await vatTuPage.fillFormField('Thuế nhập khẩu', '5');
    await vatTuPage.fillFormField('Thuế xuất khẩu', '5');
    await vatTuPage.selectFirstFormOption('Thuế tiêu thụ đặc biệt');
    await vatTuPage.selectFirstFormOption('Thuế tài nguyên');
    await vatTuPage.openFormTab('Đơn vị quy đổi');
    await vatTuPage.addConversionRow();
    const conversion = await vatTuPage.fillFirstConversionRow('2', mainUnit.label);

    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code)).toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox')).toHaveValue(code);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(name);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Nhóm vật tư', group.label)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await expect(vatTuPage.materialDetailControl(code, 'Mô tả', 'textbox')).toHaveValue(description);
    await expect(vatTuPage.materialDetailStatusSwitch(code)).toBeChecked();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Kho mặc định', warehouse)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
    await expect(vatTuPage.materialDetailControl(code, 'Tồn tối thiểu', 'spinbutton')).toHaveValue('10');
    await expect(vatTuPage.materialDetailControl(code, 'Tồn tối đa', 'spinbutton')).toHaveValue('100');
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin thuế');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Thuế suất GTGT mặc định', vatRate)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Đơn vị quy đổi');
    await expect(vatTuPage.materialDetailText(code, conversion.unit)).toBeVisible();
    await expect(vatTuPage.materialDetailText(code, conversion.operation)).toBeVisible();
  });

  test('CL-UAT-U-00106-72 - tạo Nguyên vật liệu với tối thiểu trường bắt buộc', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC72');
    const name = `Nguyên vật liệu tối thiểu TC72 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(true);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, true);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-73 - tạo Nguyên vật liệu với trạng thái Ngừng hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC73');
    const name = `Nguyên vật liệu ngừng hoạt động TC73 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(false);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, false);
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-74 - tạo Nguyên vật liệu bằng Lưu và Thêm mới', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC74');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, `Nguyên vật liệu lưu thêm TC74 ${code}`, mainUnit);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveAndAddMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    await expect(vatTuPage.materialNameInput()).toHaveValue('');
    await expect(vatTuPage.mainUnitCombobox).toHaveValue('');
    await expect(vatTuPage.statusSwitch()).toBeChecked();
    await expect(vatTuPage.materialRow(code), 'Bản ghi vừa tạo phải tồn tại trên danh sách').toBeAttached();
  });

  test('CL-UAT-U-00106-75 - hủy Nguyên vật liệu khi chưa nhập dữ liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
  });

  test('CL-UAT-U-00106-76 - hủy Nguyên vật liệu khi đã nhập dữ liệu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC76');
    const name = `Nguyên vật liệu hủy TC76 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Nguyên vật liệu');
    await vatTuPage.fillMaterialIdentity(code, name);
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible();
    await expect(
      vatTuPage.closeConfirmationMessage(),
      'Popup xác nhận phải hiển thị đúng nội dung manual testcase',
    ).toHaveText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await vatTuPage.dismissCloseConfirmation();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
    await expect(vatTuPage.materialNameInput()).toHaveValue(name);
    await vatTuPage.cancelCreatingMaterial();
    await vatTuPage.confirmClose();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Dữ liệu đã hủy không được lưu').toBeHidden();
  });

  test('CL-UAT-U-00106-96 - tạo CCDC với đầy đủ thông tin', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const group = catalogues.groups.find((item) => item.status === 'HoatDong');
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit || catalogues.units.length < 2, 'Thiếu Nhóm vật tư hoặc Đơn vị tính phù hợp');
    if (!group || !mainUnit) return;
    const code = data.uniqueCode('TC96');
    const material = {
      code,
      name: `CCDC đầy đủ TC96 ${code}`,
      description: `Công cụ dụng cụ phục vụ hoạt động ${code}`,
      purchaseName: `CCDC mua ${code}`,
      saleName: `CCDC bán ${code}`,
      imagePath: 'test-data/tc32-material.png',
      group,
      mainUnit,
    };
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Công cụ, dụng cụ');
    const selection = await vatTuPage.fillFullGoodsMaterial(material);
    await expect(vatTuPage.materialImagePreview()).toBeVisible();
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code)).toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox')).toHaveValue(code);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(material.name);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Nhóm vật tư', group.label)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await expect(vatTuPage.materialDetailControl(code, 'Mô tả', 'textbox')).toHaveValue(material.description);
    await expect(vatTuPage.materialDetailStatusSwitch(code)).toBeChecked();
    await expect(vatTuPage.materialDetailImage(code)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Kho mặc định', selection.warehouse)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', selection.pricingMethod)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin thuế');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Thuế suất GTGT mặc định', selection.vatRate)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Đơn vị quy đổi');
    await expect(vatTuPage.materialDetailText(code, selection.conversion.unit)).toBeVisible();
  });

  test('CL-UAT-U-00106-97 - tạo CCDC với tối thiểu trường bắt buộc', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC97');
    const name = `CCDC tối thiểu TC97 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Công cụ, dụng cụ');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(true);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, true);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-98 - tạo CCDC với trạng thái Ngừng hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC98');
    const name = `CCDC ngừng hoạt động TC98 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Công cụ, dụng cụ');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(false);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, false);
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-99 - tạo CCDC bằng Lưu và Thêm mới', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC99');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Công cụ, dụng cụ');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, `CCDC lưu thêm TC99 ${code}`, mainUnit);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveAndAddMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    await expect(vatTuPage.materialNameInput()).toHaveValue('');
    await expect(vatTuPage.mainUnitCombobox).toHaveValue('');
    await expect(vatTuPage.statusSwitch()).toBeChecked();
    await expect(vatTuPage.materialRow(code)).toBeAttached();
  });

  test('CL-UAT-U-00106-100 - hủy CCDC khi chưa nhập dữ liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Công cụ, dụng cụ');
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
  });

  test('CL-UAT-U-00106-101 - hủy CCDC khi đã nhập dữ liệu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC101');
    const name = `CCDC hủy TC101 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Công cụ, dụng cụ');
    await vatTuPage.fillMaterialIdentity(code, name);
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible();
    await expect(vatTuPage.closeConfirmationMessage()).toHaveText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await vatTuPage.dismissCloseConfirmation();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
    await expect(vatTuPage.materialNameInput()).toHaveValue(name);
    await vatTuPage.cancelCreatingMaterial();
    await vatTuPage.confirmClose();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Dữ liệu đã hủy không được lưu').toBeHidden();
  });

  test('CL-UAT-U-00106-102 - upload và lưu ảnh cho CCDC', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC102');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Công cụ, dụng cụ');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, `CCDC ảnh TC102 ${code}`, mainUnit);
    await vatTuPage.uploadMaterialImage('test-data/tc32-material.png');
    await expect(vatTuPage.materialImagePreview(), 'Ảnh hợp lệ phải được preview').toBeVisible();
    await vatTuPage.saveMaterial();
    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailImage(code), 'Ảnh phải được attach và hiển thị trong chi tiết').toBeVisible();
  });

  test('CL-UAT-U-00106-120 - tạo Thành phẩm với đầy đủ thông tin', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const group = catalogues.groups.find((item) => item.status === 'HoatDong');
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit || catalogues.units.length < 2, 'Thiếu Nhóm vật tư hoặc Đơn vị tính phù hợp');
    if (!group || !mainUnit) return;
    const code = data.uniqueCode('TC120');
    const material = {
      code,
      name: `Thành phẩm đầy đủ TC120 ${code}`,
      description: `Thành phẩm hoàn thiện phục vụ kinh doanh ${code}`,
      purchaseName: `Thành phẩm mua ${code}`,
      saleName: `Thành phẩm bán ${code}`,
      imagePath: 'test-data/tc32-material.png',
      group,
      mainUnit,
    };
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const selection = await vatTuPage.fillFullGoodsMaterial(material);
    await expect(vatTuPage.materialImagePreview()).toBeVisible();
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code)).toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox')).toHaveValue(code);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(material.name);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Nhóm vật tư', group.label)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await expect(vatTuPage.materialDetailControl(code, 'Mô tả', 'textbox')).toHaveValue(material.description);
    await expect(vatTuPage.materialDetailStatusSwitch(code)).toBeChecked();
    await expect(vatTuPage.materialDetailImage(code)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Kho mặc định', selection.warehouse)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', selection.pricingMethod)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin thuế');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Thuế suất GTGT mặc định', selection.vatRate)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Đơn vị quy đổi');
    await expect(vatTuPage.materialDetailText(code, selection.conversion.unit)).toBeVisible();
  });

  test('CL-UAT-U-00106-121 - tạo Thành phẩm với tối thiểu trường bắt buộc', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC121');
    const name = `Thành phẩm tối thiểu TC121 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(true);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, true);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-122 - tạo Thành phẩm với trạng thái Ngừng hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC122');
    const name = `Thành phẩm ngừng hoạt động TC122 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(false);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, false);
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-123 - tạo Thành phẩm bằng Lưu và Thêm mới', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC123');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, `Thành phẩm lưu thêm TC123 ${code}`, mainUnit);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveAndAddMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    await expect(vatTuPage.materialNameInput()).toHaveValue('');
    await expect(vatTuPage.mainUnitCombobox).toHaveValue('');
    await expect(vatTuPage.statusSwitch()).toBeChecked();
    await expect(vatTuPage.materialRow(code), 'Bản ghi vừa tạo phải tồn tại trên danh sách').toBeAttached();
  });

  test('CL-UAT-U-00106-124 - hủy Thành phẩm khi chưa nhập dữ liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
  });

  test('CL-UAT-U-00106-125 - hủy Thành phẩm khi đã nhập dữ liệu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC125');
    const name = `Thành phẩm hủy TC125 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillMaterialIdentity(code, name);
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible();
    await expect(vatTuPage.closeConfirmationMessage()).toHaveText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await vatTuPage.dismissCloseConfirmation();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
    await expect(vatTuPage.materialNameInput()).toHaveValue(name);
    await vatTuPage.cancelCreatingMaterial();
    await vatTuPage.confirmClose();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Dữ liệu đã hủy không được lưu').toBeHidden();
  });

  test('CL-UAT-U-00106-126 - upload và lưu ảnh cho Thành phẩm', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC126');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, `Thành phẩm ảnh TC126 ${code}`, mainUnit);
    await vatTuPage.uploadMaterialImage('test-data/tc32-material.png');
    await expect(vatTuPage.materialImagePreview(), 'Ảnh hợp lệ phải được preview').toBeVisible();
    await vatTuPage.saveMaterial();
    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailImage(code), 'Ảnh phải được attach và hiển thị trong chi tiết').toBeVisible();
  });

  test('CL-UAT-U-00106-144 - tạo Bán thành phẩm với đầy đủ thông tin', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const group = catalogues.groups.find((item) => item.status === 'HoatDong');
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!group || !mainUnit || catalogues.units.length < 2, 'Thiếu Nhóm vật tư hoặc Đơn vị tính phù hợp');
    if (!group || !mainUnit) return;
    const code = data.uniqueCode('TC144');
    const material = {
      code,
      name: `Bán thành phẩm đầy đủ TC144 ${code}`,
      description: `Bán thành phẩm phục vụ sản xuất ${code}`,
      purchaseName: `Bán thành phẩm mua ${code}`,
      saleName: `Bán thành phẩm bán ${code}`,
      imagePath: 'test-data/tc32-material.png',
      group,
      mainUnit,
    };
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Bán thành phẩm');
    const selection = await vatTuPage.fillFullGoodsMaterial(material);
    await expect(vatTuPage.materialImagePreview()).toBeVisible();
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code)).toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox')).toHaveValue(code);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(material.name);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Nhóm vật tư', group.label)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await expect(vatTuPage.materialDetailControl(code, 'Mô tả', 'textbox')).toHaveValue(material.description);
    await expect(vatTuPage.materialDetailStatusSwitch(code)).toBeChecked();
    await expect(vatTuPage.materialDetailImage(code)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Kho mặc định', selection.warehouse)).toBeVisible();
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', selection.pricingMethod)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin thuế');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Thuế suất GTGT mặc định', selection.vatRate)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Đơn vị quy đổi');
    await expect(vatTuPage.materialDetailText(code, selection.conversion.unit)).toBeVisible();
  });

  test('CL-UAT-U-00106-145 - tạo Bán thành phẩm với tối thiểu trường bắt buộc', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC145');
    const name = `Bán thành phẩm tối thiểu TC145 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Bán thành phẩm');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(true);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, true);
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Đơn vị tính chính', mainUnit.label)).toBeVisible();
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-146 - tạo Bán thành phẩm với trạng thái Ngừng hoạt động', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC146');
    const name = `Bán thành phẩm ngừng hoạt động TC146 ${code}`;
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Bán thành phẩm');
    const pricingMethod = await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.setMaterialStatus(false);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await verifyBasicMaterialDetails(vatTuPage, code, name, false);
    await vatTuPage.openMaterialDetailTab(code, 'Thông tin kho');
    await expect(vatTuPage.materialDetailSelectedValue(code, 'Phương pháp tính giá', pricingMethod)).toBeVisible();
  });

  test('CL-UAT-U-00106-147 - tạo Bán thành phẩm bằng Lưu và Thêm mới', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC147');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Bán thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, `Bán thành phẩm lưu thêm TC147 ${code}`, mainUnit);
    const notificationPromise = vatTuPage.waitForSuccessNotification();
    await vatTuPage.saveAndAddMaterial();
    await expect.soft(await notificationPromise, 'Phải hiển thị MSG_PMKT-U-00106_010').toBe('Thêm mới thành công');
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue('');
    await expect(vatTuPage.materialNameInput()).toHaveValue('');
    await expect(vatTuPage.mainUnitCombobox).toHaveValue('');
    await expect(vatTuPage.statusSwitch()).toBeChecked();
    await expect(vatTuPage.materialRow(code), 'Bản ghi vừa tạo phải tồn tại trên danh sách').toBeAttached();
  });

  test('CL-UAT-U-00106-148 - hủy Bán thành phẩm khi chưa nhập dữ liệu', async ({ vatTuPage }) => {
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Bán thành phẩm');
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await expect(vatTuPage.addButton).toBeVisible();
  });

  test('CL-UAT-U-00106-149 - hủy Bán thành phẩm khi đã nhập dữ liệu', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const code = data.uniqueCode('TC149');
    const name = `Bán thành phẩm hủy TC149 ${code}`;
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Bán thành phẩm');
    await vatTuPage.fillMaterialIdentity(code, name);
    await vatTuPage.cancelCreatingMaterial();
    await expect(vatTuPage.closeConfirmationDialog).toBeVisible();
    await expect(vatTuPage.closeConfirmationMessage()).toHaveText('Dữ liệu đã có thay đổi. Bạn có chắc chắn muốn đóng? Thay đổi sẽ không được lưu.');
    await vatTuPage.dismissCloseConfirmation();
    await expect(vatTuPage.closeConfirmationDialog).toBeHidden();
    await expect(vatTuPage.createMaterialDialog).toBeVisible();
    await expect(vatTuPage.materialCodeInput()).toHaveValue(code);
    await expect(vatTuPage.materialNameInput()).toHaveValue(name);
    await vatTuPage.cancelCreatingMaterial();
    await vatTuPage.confirmClose();
    await expect(vatTuPage.createMaterialDialog).toBeHidden();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Dữ liệu đã hủy không được lưu').toBeHidden();
  });

  test('CL-UAT-U-00106-150 - upload và lưu ảnh cho Bán thành phẩm', async ({ vatTuPage }) => {
    const data = new TestDataGenerator();
    const catalogues = await vatTuPage.openFromDanhMucAndCollectCatalogues();
    const mainUnit = catalogues.units.find((item) => item.status === 'HoatDong');
    test.skip(!mainUnit, 'Thiếu Đơn vị tính chính đang hoạt động');
    if (!mainUnit) return;
    const code = data.uniqueCode('TC150');
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Bán thành phẩm');
    await vatTuPage.fillRequiredInventoryMaterialFields(code, `Bán thành phẩm ảnh TC150 ${code}`, mainUnit);
    await vatTuPage.uploadMaterialImage('test-data/tc32-material.png');
    await expect(vatTuPage.materialImagePreview(), 'Ảnh hợp lệ phải được preview').toBeVisible();
    await vatTuPage.saveMaterial();
    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailImage(code), 'Ảnh phải được attach và hiển thị trong chi tiết').toBeVisible();
  });
});
