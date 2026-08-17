import type { Page } from '@playwright/test';
import type { VatTuPage } from '@pages/danh-muc/vat-tu.page';

const materialCataloguePaths = new Set([
  '/api/master-data/don-vi-tinh',
  '/api/master-data/nhom-vat-tu',
]);

/** Mở đúng bản ghi Vật tư từ danh sách rồi chuyển sang form Chỉnh sửa. */
export async function openExistingMaterialForEdit(vatTuPage: VatTuPage, code: string): Promise<void> {
  await vatTuPage.openFromDanhMuc();
  await vatTuPage.searchMaterial(code);
  await vatTuPage.openMaterialDetails(code);
  await vatTuPage.openMaterialEdit(code);
}

/** Giả lập mất kết nối hai API danh mục được form Chỉnh sửa dùng khi tải dữ liệu ban đầu. */
export async function blockMaterialEditCatalogues(page: Page): Promise<void> {
  await page.route('**/api/master-data/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === 'GET' && materialCataloguePaths.has(pathname)) {
      await route.abort('failed');
      return;
    }
    await route.continue();
  });
}

/** Gỡ mô phỏng lỗi danh mục để không ảnh hưởng cleanup và testcase tiếp theo. */
export async function unblockMaterialEditCatalogues(page: Page): Promise<void> {
  await page.unroute('**/api/master-data/**');
}
