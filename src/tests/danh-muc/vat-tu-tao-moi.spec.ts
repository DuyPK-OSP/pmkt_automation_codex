import { test, expect } from '@fixtures/base.fixture';
import { verifyAccountingAccountCombobox } from '@helpers/vat-tu-assertion.helper';
import { MATERIAL_TYPES } from '@pages/vat-tu.page';
import { expectedMaterialTypeCards } from '@test-data/vat-tu.data';
import { requireCredentials } from '@utils/env.config';
import { statusPair } from '@utils/vat-tu-test.util';

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
      expect.soft(
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
    expect.soft(
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
});
