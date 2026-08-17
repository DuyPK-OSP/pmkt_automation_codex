import { test, expect } from '@fixtures/base.fixture';
import { verifyMaterialDetailAgainstDatabase } from '@helpers/vat-tu-detail.assertions';
import {
  blockMaterialEditCatalogues,
  openExistingMaterialForEdit,
  unblockMaterialEditCatalogues,
} from '@helpers/vat-tu-edit.helper';
import { requireCredentials } from '@utils/env.config';

test.describe('PMKT-U-00106 - Chỉnh sửa Vật tư Hàng hóa TC-EditVatTu-0003–0005', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('TC-EditVatTu-0003 - hiển thị lỗi hệ thống khi API danh mục mất kết nối', async ({ page, vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = await db.vatTu.findFirstExistingCodeByTypeForDefaultTenant(credentials.username, 'HangHoa');
    test.skip(!code, 'Tenant cần ít nhất một Vật tư Hàng hóa để mở form Chỉnh sửa');
    if (!code) return;

    // Chuẩn bị dữ liệu: Mở đúng bản ghi Hàng hóa có sẵn trước khi chặn hai API danh mục.
    await vatTuPage.openFromDanhMuc();
    await vatTuPage.searchMaterial(code);
    await vatTuPage.openMaterialDetails(code);
    await blockMaterialEditCatalogues(page);
    try {
      // Hành động: Chi tiết > Chỉnh sửa trong lúc API Đơn vị tính/Nhóm vật tư bị ngắt kết nối.
      await vatTuPage.openMaterialEdit(code);

      // Xác nhận UI: Hiển thị đúng thông báo lỗi tải dữ liệu theo manual testcase.
      await expect(
        vatTuPage.notificationMessage('Có lỗi xảy ra trong quá trình tải dữ liệu. Vui lòng tải lại trang hoặc liên hệ quản trị viên.'),
      ).toBeVisible();
    } finally {
      await unblockMaterialEditCatalogues(page);
    }
  });

  test('TC-EditVatTu-0004 - hiển thị đúng form Chỉnh sửa Hàng hóa và dữ liệu cũ', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = await db.vatTu.findFirstExistingCodeByTypeForDefaultTenant(credentials.username, 'HangHoa');
    test.skip(!code, 'Tenant cần ít nhất một Vật tư Hàng hóa để kiểm tra form Chỉnh sửa');
    if (!code) return;
    const records = await db.vatTu.findByCodeForDefaultTenant(credentials.username, code);
    expect(records, 'DB phải trả về đúng một Vật tư Hàng hóa theo tenant và mã').toHaveLength(1);

    // Hành động: Danh sách > Xem chi tiết > Chỉnh sửa đúng bản ghi Hàng hóa.
    await openExistingMaterialForEdit(vatTuPage, code);

    // Xác nhận UI: Form đúng bản ghi, đúng Tính chất Hàng hóa, đủ tab và tải các trường nhận diện đã lưu.
    await expect(vatTuPage.materialEditControl(code, 'Mã vật tư', 'textbox')).toHaveValue(records[0]!.code);
    await expect(vatTuPage.materialEditControl(code, 'Tên vật tư', 'textbox')).toHaveValue(records[0]!.name);
    await expect(vatTuPage.materialDetailControlById(code, 'loaiVatTu')).toHaveValue('HangHoa');
    await expect(vatTuPage.materialDetailTabs(code)).toHaveText([
      'Hạch toán ngầm định',
      'Thông tin kho',
      'Thông tin thuế',
      'Đơn vị quy đổi',
    ]);
  });

  test('TC-EditVatTu-0005 - toàn bộ dữ liệu form Chỉnh sửa khớp DB đúng tenant', async ({ vatTuPage, db }) => {
    const credentials = requireCredentials();
    const code = await db.vatTu.findFirstExistingCodeByTypeForDefaultTenant(credentials.username, 'HangHoa');
    test.skip(!code, 'Tenant cần ít nhất một Vật tư Hàng hóa để đối chiếu dữ liệu Chỉnh sửa với DB');
    if (!code) return;

    // Xác nhận UI/DB: Mở form Chỉnh sửa và đối chiếu toàn bộ trường, trạng thái, tab và dòng quy đổi với DB.
    await verifyMaterialDetailAgainstDatabase(vatTuPage, db, code, 'Hàng hóa', 'edit');
  });
});
