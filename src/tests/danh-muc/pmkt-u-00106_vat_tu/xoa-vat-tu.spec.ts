import { test, expect } from '@fixtures/base.fixture';
import { createDeleteMaterial, createDeleteMaterials } from '@helpers/vat-tu-delete.helper';
import { requireCredentials } from '@utils/env.config';

test.describe('PMKT-U-00106 - Xóa Vật tư TC-DeleteVatTu-003–011, 013–014', () => {
  test.beforeEach(async ({ loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
  });

  test('TC-DeleteVatTu-003 - hiển thị đầy đủ hộp thoại xác nhận xóa', async ({ vatTuPage, db, materialCleanup }) => {
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-003');
    test.skip(!material, 'DB cần ít nhất một Đơn vị tính Hoạt động để tạo dữ liệu riêng');
    if (!material) return;

    await vatTuPage.searchMaterial(material.code);
    await vatTuPage.openListMaterialDeleteConfirmation(material.code);

    await expect(vatTuPage.materialDeleteConfirmation(), 'Phải hiển thị hộp thoại xác nhận xóa').toBeVisible();
    await expect(vatTuPage.materialDeleteConfirmation(), 'Thông báo phải chứa đúng Tên vật tư riêng của testcase').toContainText(material.name);
    await expect(vatTuPage.materialDeleteConfirmation(), 'Thông báo phải cảnh báo thao tác không thể hoàn tác').toContainText('Thao tác này không thể hoàn tác');
    await expect(vatTuPage.materialDeleteConfirmationButton('Xác nhận'), 'Popup phải có nút Xác nhận theo testcase').toBeVisible();
    await expect(vatTuPage.materialDeleteConfirmationButton('Hủy'), 'Popup phải có nút Hủy').toBeVisible();
  });

  test('TC-DeleteVatTu-004 - xác nhận xóa mềm thành công', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-004');
    test.skip(!material, 'DB cần ít nhất một Đơn vị tính Hoạt động để tạo dữ liệu riêng');
    if (!material) return;

    await vatTuPage.searchMaterial(material.code);
    await vatTuPage.openListMaterialDeleteConfirmation(material.code);
    const response = await vatTuPage.confirmMaterialDeletionRequest();

    expect(response.status, 'Backend phải chấp nhận xóa Vật tư chưa được sử dụng').toBeGreaterThanOrEqual(200);
    expect(response.status, 'Backend phải chấp nhận xóa Vật tư chưa được sử dụng').toBeLessThan(300);
    await expect(vatTuPage.notificationContaining(/Xóa.*thành công/), 'UI phải thông báo xóa thành công').toContainText('Xóa');
    await expect(vatTuPage.notificationContaining(/Xóa.*thành công/), 'UI phải thông báo xóa thành công').toContainText('thành công');
    await expect(vatTuPage.materialRow(material.code), 'Danh sách không còn hiển thị Vật tư đã xóa').toBeHidden();
    await expect.poll(
      () => db.vatTu.findDeletionStateByCodeForDefaultTenant(credentials.username, material.code),
      { message: 'DB phải giữ bản ghi với trạng thái xóa mềm', timeout: 15_000 },
    ).toEqual([{ code: material.code, deleted: true }]);
  });

  test('TC-DeleteVatTu-005 - hủy xác nhận xóa giữ nguyên Vật tư', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-005');
    test.skip(!material, 'DB cần ít nhất một Đơn vị tính Hoạt động để tạo dữ liệu riêng');
    if (!material) return;

    await vatTuPage.searchMaterial(material.code);
    await vatTuPage.openListMaterialDeleteConfirmation(material.code);
    await vatTuPage.cancelMaterialDeletion();

    await expect(vatTuPage.materialDeleteConfirmation(), 'Hủy phải đóng popup xác nhận').toBeHidden();
    await expect(vatTuPage.materialRow(material.code), 'Hủy phải giữ Vật tư trên danh sách').toBeVisible();
    expect(await db.vatTu.findByCodeForDefaultTenant(credentials.username, material.code), 'Hủy không được thay đổi Vật tư trong DB').toHaveLength(1);
  });

  test('TC-DeleteVatTu-006 - chặn xóa Vật tư đang dùng trong giao dịch', async ({ vatTuPage, db, materialCleanup }) => {
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-006');
    test.skip(!material, 'DB cần ít nhất một Đơn vị tính Hoạt động để tạo dữ liệu riêng');
    if (!material) return;
    test.skip(true, 'BLOCK: tài khoản test không truy cập được Mua hàng/Kho để tạo giao dịch mới qua UI; menu Kho bị khóa và route Chứng từ mua hàng trả 404');
  });

  test('TC-DeleteVatTu-007 - chặn xóa Vật tư có đơn vị quy đổi', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-007', 'Hàng hóa', true);
    test.skip(!material, 'DB cần Nhóm vật tư và Đơn vị tính Hoạt động để tạo dữ liệu quy đổi riêng');
    if (!material) return;

    await vatTuPage.searchMaterial(material.code);
    await vatTuPage.openListMaterialDeleteConfirmation(material.code);
    const response = await vatTuPage.confirmMaterialDeletionRequest();

    expect(response.status, 'Backend phải từ chối xóa Vật tư đang có đơn vị quy đổi').toBeGreaterThanOrEqual(400);
    await expect(vatTuPage.notificationContaining(/Không thể xóa/i), 'UI phải thông báo Vật tư đang được sử dụng').toContainText('Không thể xóa Vật Tư này vì đang được sử dụng');
    expect(await db.vatTu.findByCodeForDefaultTenant(credentials.username, material.code)).toHaveLength(1);
  });

  test('TC-DeleteVatTu-008 - chặn xóa Vật tư có tham chiếu Công cụ dụng cụ', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-008', 'Công cụ, dụng cụ');
    test.skip(!material, 'DB cần Đơn vị tính Hoạt động để tạo dữ liệu CCDC riêng');
    if (!material) return;
    test.skip(true, 'BLOCK: menu Công cụ dụng cụ đang bị khóa nên không thể tạo bản ghi CCDC mới tham chiếu Vật tư qua UI');
  });

  test('TC-DeleteVatTu-009 - lỗi hệ thống khi xóa giữ nguyên Vật tư', async ({ page, vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-009');
    test.skip(!material, 'DB cần ít nhất một Đơn vị tính Hoạt động để tạo dữ liệu riêng');
    if (!material) return;

    await page.route('**/api/master-data/vat-tu/*', async route => {
      if (route.request().method() === 'DELETE') await route.abort('failed');
      else await route.continue();
    });
    await vatTuPage.searchMaterial(material.code);
    await vatTuPage.openListMaterialDeleteConfirmation(material.code);
    await vatTuPage.submitMaterialDeletion();
    const systemError = vatTuPage.notificationContaining(/Mất kết nối|Có lỗi xảy ra/i);
    await expect(systemError, 'UI phải hiển thị một thông báo lỗi hệ thống').toBeVisible();
    await page.unroute('**/api/master-data/vat-tu/*');
    await expect(systemError, 'UI phải hiển thị thông báo lỗi hệ thống dễ hiểu').toContainText('Có lỗi xảy ra, vui lòng thử lại');
    expect(await db.vatTu.findByCodeForDefaultTenant(credentials.username, material.code), 'Lỗi hệ thống không được xóa Vật tư').toHaveLength(1);
  });

  test('TC-DeleteVatTu-010 - xóa dòng cuối trang và cập nhật phân trang', async ({ vatTuPage, db, materialCleanup }) => {
    const materials = await createDeleteMaterials(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-010', 11);
    test.skip(materials.length < 11, 'DB cần Đơn vị tính Hoạt động để tạo đủ 11 dữ liệu phân trang riêng');
    if (materials.length < 11) return;

    await vatTuPage.searchMaterial('AUTO_TC_DELETEVATTU_010');
    await expect(vatTuPage.materialPaginationSummary(), 'Kết quả riêng phải có 11 bản ghi trên hai trang').toContainText('trên 11');
    await vatTuPage.goToNextMaterialPage();
    const lastPageCodes = await vatTuPage.visibleMaterialCodes();
    expect(lastPageCodes, 'Trang cuối phải có đúng một Vật tư do testcase tạo').toHaveLength(1);
    await vatTuPage.openListMaterialDeleteConfirmation(lastPageCodes[0]!);
    const response = await vatTuPage.confirmMaterialDeletionRequest();

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    await expect(vatTuPage.materialPaginationSummary(), 'Xóa dòng cuối phải tự quay về trang trước và cập nhật tổng').toContainText('1-10 trên 10');
    await expect(vatTuPage.materialPreviousPageButton(), 'Sau khi quay về trang đầu, nút Trang Trước phải bị khóa').toBeDisabled();
  });

  test('TC-DeleteVatTu-011 - xóa liên tiếp ba Vật tư riêng', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const materials = await createDeleteMaterials(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-011', 3);
    test.skip(materials.length < 3, 'DB cần Đơn vị tính Hoạt động để tạo đủ ba dữ liệu riêng');
    if (materials.length < 3) return;

    for (const material of materials) {
      await vatTuPage.searchMaterial(material.code);
      await vatTuPage.openListMaterialDeleteConfirmation(material.code);
      await expect(vatTuPage.materialDeleteConfirmation()).toContainText(material.name);
      const response = await vatTuPage.confirmMaterialDeletionRequest();
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
    }
    for (const material of materials) {
      const state = await db.vatTu.findDeletionStateByCodeForDefaultTenant(credentials.username, material.code);
      expect(state).toEqual([{ code: material.code, deleted: true }]);
    }
  });

  test('TC-DeleteVatTu-013 - xóa trong kết quả tìm kiếm và giữ từ khóa', async ({ vatTuPage, db, materialCleanup }) => {
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-013');
    test.skip(!material, 'DB cần ít nhất một Đơn vị tính Hoạt động để tạo dữ liệu riêng');
    if (!material) return;

    await vatTuPage.searchMaterial(material.code);
    await vatTuPage.openListMaterialDeleteConfirmation(material.code);
    const response = await vatTuPage.confirmMaterialDeletionRequest();

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    await expect(vatTuPage.materialSearchInput(), 'Sau khi xóa phải giữ nguyên từ khóa tìm kiếm').toHaveValue(material.code);
    await expect(vatTuPage.materialRow(material.code), 'Kết quả tìm kiếm phải cập nhật và bỏ dòng đã xóa').toBeHidden();
  });

  test('TC-DeleteVatTu-014 - xóa Vật tư loại Dịch vụ', async ({ vatTuPage, db, materialCleanup }) => {
    const credentials = requireCredentials();
    const material = await createDeleteMaterial(vatTuPage, db, materialCleanup, 'TC-DeleteVatTu-014', 'Dịch vụ');
    test.skip(!material, 'DB cần ít nhất một Đơn vị tính Hoạt động để tạo Dịch vụ riêng');
    if (!material) return;

    await vatTuPage.searchMaterial(material.code);
    await vatTuPage.openListMaterialDeleteConfirmation(material.code);
    const response = await vatTuPage.confirmMaterialDeletionRequest();

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    await expect(vatTuPage.notificationContaining(/Xóa.*thành công/), 'Dịch vụ không có ràng buộc kho/quy đổi phải xóa thành công').toContainText('Xóa');
    await expect(vatTuPage.notificationContaining(/Xóa.*thành công/), 'Dịch vụ không có ràng buộc kho/quy đổi phải xóa thành công').toContainText('thành công');
    await expect.poll(
      () => db.vatTu.findDeletionStateByCodeForDefaultTenant(credentials.username, material.code),
      { timeout: 15_000 },
    ).toEqual([{ code: material.code, deleted: true }]);
  });
});
