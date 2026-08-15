import { test, expect } from '@fixtures/base.fixture';
import type { VatTuRecord } from '@database/repositories/vat-tu.repository';
import { firstVisibleActiveMainUnit, openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import { createFullMaterialPrecondition } from '@helpers/vat-tu-detail.helper';
import { verifyMaterialDetailAgainstDatabase } from '@helpers/vat-tu-detail.assertions';
import {
  materialDetailCreationData,
  materialDetailEditData,
} from '@test-data/danh-muc/vat-tu/vat-tu.data';
import { requireCredentials } from '@utils/env.config';

test.describe('PMKT-U-00106 - Xem chi tiết Vật tư TC-ViewVatTu-003–020', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('TC-ViewVatTu-003 - mở đúng màn hình chi tiết từ danh sách', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = await db.vatTu.findFirstExistingCodeForDefaultTenant(credentials.username);
    test.skip(!code, 'Tenant cần ít nhất một Vật tư để kiểm tra màn Chi tiết');
    if (!code) return;
    const records = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
    expect(records, 'DB phải trả về đúng một Vật tư theo tenant và mã').toHaveLength(1);

    await vatTuPage.openFromDanhMuc();
    await vatTuPage.searchMaterial(code);
    await expect(vatTuPage.materialRow(code), 'Danh sách phải hiển thị đúng Vật tư lấy từ DB').toBeVisible();
    await vatTuPage.openMaterialDetails(code);

    await expect(vatTuPage.materialDetailHeading(code), 'Popup phải là màn Chi tiết của đúng Vật tư đã chọn').toBeVisible();
    await expect(vatTuPage.materialDetailControl(code, 'Mã vật tư', 'textbox')).toHaveValue(records[0]!.code);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(records[0]!.name);
  });

  test('TC-ViewVatTu-004 - form chi tiết readonly và hiển thị đủ nút chức năng', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = await db.vatTu.findFirstExistingCodeForDefaultTenant(credentials.username);
    test.skip(!code, 'Tenant cần ít nhất một Vật tư để kiểm tra màn Chi tiết');
    if (!code) return;

    await vatTuPage.openFromDanhMuc();
    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);

    const controls = vatTuPage.materialDetailControls(code);
    await expect(controls, 'Form Chi tiết phải có các control dữ liệu').not.toHaveCount(0);
    expect(
      await controls.evaluateAll((elements) => elements.every((element) => element.hasAttribute('disabled'))),
      'Tất cả textbox, combobox, checkbox và switch trên form Chi tiết phải bị vô hiệu hóa',
    ).toBe(true);
    for (const action of ['Chỉnh sửa', 'Xóa', 'Hủy'] as const) {
      await expect(vatTuPage.materialDetailAction(code, action), `Phải hiển thị nút ${action}`).toBeVisible();
    }
  });

  test('TC-ViewVatTu-005 - chỉnh sửa lưu thành công và hủy không làm đổi dữ liệu', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const { units } = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, units);
    test.skip(!mainUnit, 'DB và UI cần ít nhất một Đơn vị tính Hoạt động');
    if (!mainUnit) return;

    const { code, originalName, updatedName, cancelledDescription } = materialDetailEditData('TC-ViewVatTu-005');
    materialCleanup.register(code);
    await vatTuPage.fillRequiredInventoryMaterialFields(code, originalName, mainUnit);
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.successNotification(), 'Phải tạo thành công dữ liệu tiền đề riêng của testcase').toContainText('Thêm mới thành công');

    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await vatTuPage.openMaterialEdit(code);
    await expect(vatTuPage.materialEditControl(code, 'Tên vật tư', 'textbox')).toBeEditable();
    await vatTuPage.fillMaterialEditField(code, 'Tên vật tư', updatedName);
    await vatTuPage.saveMaterialEdit(code);
    await expect(
      vatTuPage.notificationMessage('Cập nhật vật tư thành công'),
      'Phải hiển thị thông báo cập nhật vật tư thành công',
    ).toBeVisible();

    const updatedRecords = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
    expect(updatedRecords, 'DB phải còn đúng một Vật tư sau khi cập nhật').toHaveLength(1);
    expect(updatedRecords[0]!.name, 'ENT_VatTu phải lưu Tên vật tư mới').toBe(updatedName);
    await expect(vatTuPage.materialRow(code), 'Danh sách sau cập nhật phải giữ đúng bản ghi đang lọc').toBeVisible();
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailControl(code, 'Tên vật tư', 'textbox')).toHaveValue(updatedName);

    await vatTuPage.openMaterialEdit(code);
    await vatTuPage.fillMaterialEditField(code, 'Mô tả', cancelledDescription);
    await vatTuPage.cancelMaterialEdit(code);
    const recordsAfterCancel = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
    expect(recordsAfterCancel, 'DB phải còn đúng một Vật tư sau khi hủy').toHaveLength(1);
    expect(recordsAfterCancel[0]!.name, 'Tên đã lưu trước đó phải được giữ nguyên sau khi hủy').toBe(updatedName);
    expect(recordsAfterCancel[0]!.description, 'Mô tả nhập ở lần chỉnh sửa bị hủy không được lưu').not.toBe(cancelledDescription);
  });

  test('TC-ViewVatTu-006 - hủy rồi xác nhận xóa từ màn Chi tiết', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const { units } = await openVatTuWithCatalogues(vatTuPage);
    await vatTuPage.openMaterialTypePopup();
    await vatTuPage.selectMaterialType('Hàng hóa');
    const mainUnit = await firstVisibleActiveMainUnit(vatTuPage, units);
    test.skip(!mainUnit, 'DB và UI cần ít nhất một Đơn vị tính Hoạt động');
    if (!mainUnit) return;

    const { code, name } = materialDetailCreationData('TC-ViewVatTu-006');
    materialCleanup.register(code);
    await vatTuPage.fillRequiredInventoryMaterialFields(code, name, mainUnit);
    await vatTuPage.saveMaterial();
    await expect(vatTuPage.successNotification(), 'Phải tạo thành công Vật tư riêng cho testcase xóa').toContainText('Thêm mới thành công');
    expect(await db.vatTu.findByCodeForDefaultTenant(credentials.username, code), 'DB phải có đúng Vật tư vừa tạo').toHaveLength(1);

    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await vatTuPage.openMaterialDeleteConfirmation(code);
    await expect(vatTuPage.materialDeleteConfirmation(), 'Phải hiển thị xác nhận xóa đúng Vật tư đang xem').toContainText(name);
    await vatTuPage.cancelMaterialDeletion();
    await expect(vatTuPage.materialDetailHeading(code), 'Hủy xác nhận xóa phải quay lại màn Chi tiết').toBeVisible();
    expect(await db.vatTu.findByCodeForDefaultTenant(credentials.username, code), 'Hủy xóa phải giữ nguyên Vật tư trong DB').toHaveLength(1);

    await vatTuPage.openMaterialDeleteConfirmation(code);
    await vatTuPage.confirmMaterialDeletion(code);
    await expect.poll(
      () => db.vatTu.findByCodeForDefaultTenant(credentials.username, code),
      { message: 'Xác nhận xóa phải xóa mềm Vật tư khỏi tenant hiện tại', timeout: 15_000 },
    ).toHaveLength(0);
  });

  test('TC-ViewVatTu-007 - nút Hủy đóng màn Chi tiết và không đổi dữ liệu', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = await db.vatTu.findFirstExistingCodeForDefaultTenant(credentials.username);
    test.skip(!code, 'Tenant cần ít nhất một Vật tư để kiểm tra nút Hủy');
    if (!code) return;
    const before = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
    expect(before, 'DB phải trả về đúng một Vật tư theo tenant và mã').toHaveLength(1);

    await vatTuPage.openFromDanhMuc();
    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await vatTuPage.closeMaterialDetailsByCancel(code);

    await expect(vatTuPage.materialRow(code), 'Sau khi Hủy phải quay về danh sách và giữ đúng dòng Vật tư').toBeVisible();
    expect(await db.vatTu.findByCodeForDefaultTenant(credentials.username, code), 'Nút Hủy không được thay đổi dữ liệu DB').toEqual(before);
  });

  test('TC-ViewVatTu-008 - icon X đóng màn Chi tiết và không đổi dữ liệu', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = await db.vatTu.findFirstExistingCodeForDefaultTenant(credentials.username);
    test.skip(!code, 'Tenant cần ít nhất một Vật tư để kiểm tra icon X');
    if (!code) return;
    const before = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
    expect(before, 'DB phải trả về đúng một Vật tư theo tenant và mã').toHaveLength(1);

    await vatTuPage.openFromDanhMuc();
    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await expect(vatTuPage.materialDetailCloseButton(code), 'Giao diện thực tế phải có icon X trên popup Chi tiết').toBeVisible();
    await vatTuPage.closeMaterialDetailsByIcon(code);

    await expect(vatTuPage.materialRow(code), 'Sau khi đóng bằng icon X phải quay về danh sách').toBeVisible();
    expect(await db.vatTu.findByCodeForDefaultTenant(credentials.username, code), 'Icon X không được thay đổi dữ liệu DB').toEqual(before);
  });

  test('TC-ViewVatTu-015 - chi tiết Hàng hóa khớp toàn bộ dữ liệu DB', async ({ vatTuPage, db, materialCleanup }) => {
    const { code, missingRequiredCatalogues } = await createFullMaterialPrecondition(vatTuPage, db, materialCleanup, 'TC-ViewVatTu-015', 'Hàng hóa');
    test.skip(missingRequiredCatalogues, 'DB cần Nhóm vật tư và đủ Đơn vị tính Hoạt động để tạo bản ghi đầy đủ');
    if (code) await verifyMaterialDetailAgainstDatabase(vatTuPage, db, code, 'Hàng hóa');
  });

  test('TC-ViewVatTu-016 - chi tiết Dịch vụ khớp toàn bộ dữ liệu DB', async ({ vatTuPage, db, materialCleanup }) => {
    const { code, missingRequiredCatalogues } = await createFullMaterialPrecondition(vatTuPage, db, materialCleanup, 'TC-ViewVatTu-016', 'Dịch vụ');
    test.skip(missingRequiredCatalogues, 'DB cần Nhóm vật tư và đủ Đơn vị tính Hoạt động để tạo bản ghi đầy đủ');
    if (code) await verifyMaterialDetailAgainstDatabase(vatTuPage, db, code, 'Dịch vụ');
  });

  test('TC-ViewVatTu-017 - chi tiết Nguyên vật liệu khớp toàn bộ dữ liệu DB', async ({ vatTuPage, db, materialCleanup }) => {
    const { code, missingRequiredCatalogues } = await createFullMaterialPrecondition(
      vatTuPage, db, materialCleanup, 'TC-ViewVatTu-017', 'Nguyên vật liệu',
      async () => {
        await expect.soft(
          vatTuPage.specialGoodsTypeCombobox(),
          'Form Nguyên vật liệu phải hiển thị trường Loại hàng hóa đặc trưng',
        ).toBeVisible({ timeout: 500 });
      },
    );
    test.skip(missingRequiredCatalogues, 'DB cần Nhóm vật tư và đủ Đơn vị tính Hoạt động để tạo bản ghi đầy đủ');
    if (code) await verifyMaterialDetailAgainstDatabase(vatTuPage, db, code, 'Nguyên vật liệu');
  });

  test('TC-ViewVatTu-018 - chi tiết Công cụ, dụng cụ khớp toàn bộ dữ liệu DB', async ({ vatTuPage, db, materialCleanup }) => {
    const { code, missingRequiredCatalogues } = await createFullMaterialPrecondition(
      vatTuPage, db, materialCleanup, 'TC-ViewVatTu-018', 'Công cụ, dụng cụ',
      async () => {
        await expect.soft(
          vatTuPage.specialGoodsTypeCombobox(),
          'Form Công cụ, dụng cụ phải hiển thị trường Loại hàng hóa đặc trưng',
        ).toBeVisible({ timeout: 500 });
      },
    );
    test.skip(missingRequiredCatalogues, 'DB cần Nhóm vật tư và đủ Đơn vị tính Hoạt động để tạo bản ghi đầy đủ');
    if (code) await verifyMaterialDetailAgainstDatabase(vatTuPage, db, code, 'Công cụ, dụng cụ');
  });

  test('TC-ViewVatTu-019 - chi tiết Thành phẩm khớp toàn bộ dữ liệu DB', async ({ vatTuPage, db, materialCleanup }) => {
    const { code, missingRequiredCatalogues } = await createFullMaterialPrecondition(
      vatTuPage, db, materialCleanup, 'TC-ViewVatTu-019', 'Thành phẩm',
      async () => {
        await expect.soft(
          vatTuPage.specialGoodsTypeCombobox(),
          'Form Thành phẩm phải hiển thị trường Loại hàng hóa đặc trưng',
        ).toBeVisible({ timeout: 500 });
      },
    );
    test.skip(missingRequiredCatalogues, 'DB cần Nhóm vật tư và đủ Đơn vị tính Hoạt động để tạo bản ghi đầy đủ');
    if (code) await verifyMaterialDetailAgainstDatabase(vatTuPage, db, code, 'Thành phẩm');
  });

  test('TC-ViewVatTu-020 - chi tiết Bán thành phẩm khớp toàn bộ dữ liệu DB', async ({ vatTuPage, db, materialCleanup }) => {
    const { code, missingRequiredCatalogues } = await createFullMaterialPrecondition(
      vatTuPage, db, materialCleanup, 'TC-ViewVatTu-020', 'Bán thành phẩm',
      async () => {
        await expect.soft(
          vatTuPage.specialGoodsTypeCombobox(),
          'Form Bán thành phẩm phải hiển thị trường Loại hàng hóa đặc trưng',
        ).toBeVisible({ timeout: 500 });
      },
    );
    test.skip(missingRequiredCatalogues, 'DB cần Nhóm vật tư và đủ Đơn vị tính Hoạt động để tạo bản ghi đầy đủ');
    if (code) await verifyMaterialDetailAgainstDatabase(vatTuPage, db, code, 'Bán thành phẩm');
  });
});
