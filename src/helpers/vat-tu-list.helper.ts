import type { Page } from '@playwright/test';
import type { VatTuListRecord } from '@database/repositories/vat-tu.repository';

const materialListPattern = '**/api/master-data/vat-tu?*';

/** Ánh xạ dữ liệu DB sang đúng chín cột nghiệp vụ được hiển thị trên Data Grid. */
export function toExpectedMaterialListValues(records: readonly VatTuListRecord[]): readonly (readonly string[])[] {
  return records.map(record => [
    record.code,
    record.name,
    record.materialType,
    record.groups ?? '—',
    record.mainUnit ?? '—',
    record.trackLot ? 'Có theo dõi' : 'Không theo dõi',
    record.pricingMethod ?? '—',
    record.warehouse ?? '—',
    record.active ? 'Hoạt động' : 'Ngừng hoạt động',
  ]);
}

/** Đổi kiểu hoa/thường của từ khóa nhưng giữ nguyên nội dung để kiểm tra tìm kiếm không phân biệt case. */
export function alternateSearchCase(value: string): string {
  const lowerCase = value.toLocaleLowerCase('vi-VN');
  return lowerCase === value ? value.toLocaleUpperCase('vi-VN') : lowerCase;
}

/** Giả lập tenant không có Vật tư mà không thay đổi hoặc xóa dữ liệu thật. */
export async function mockEmptyMaterialList(page: Page): Promise<void> {
  await page.route(materialListPattern, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: [],
      pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
    }),
  }));
}

/** Giả lập mất kết nối riêng request tải danh sách Vật tư. */
export async function blockMaterialListRequests(page: Page): Promise<void> {
  await page.route(materialListPattern, route => route.abort('failed'));
}

/** Khôi phục request thật để kiểm tra thao tác Thử lại. */
export async function restoreMaterialListRequests(page: Page): Promise<void> {
  await page.unroute(materialListPattern);
}

/** Tạo tập response nhiều trang từ một bản ghi có schema thật, chỉ phục vụ kiểm tra hành vi Data Grid. */
export async function mockMaterialListCount(page: Page, totalItems: number): Promise<void> {
  let cachedTemplate: Readonly<Record<string, unknown>> | undefined;
  await page.route(materialListPattern, async route => {
    const response = await route.fetch();
    const original = await response.json() as {
      readonly data: readonly Record<string, unknown>[];
    };
    const template = original.data[0] ?? cachedTemplate;
    if (!template) {
      await route.fulfill({ response });
      return;
    }
    cachedTemplate = template;

    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '10');
    const allRows = Array.from({ length: totalItems }, (_, index) => ({
      ...template,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      ma: `AUTO_LIST_${String(index + 1).padStart(3, '0')}`,
      ten: `Automation danh sách ${String(index + 1).padStart(3, '0')}`,
    }));
    const start = (pageNumber - 1) * pageSize;

    await route.fulfill({
      response,
      contentType: 'application/json',
      body: JSON.stringify({
        data: allRows.slice(start, start + pageSize),
        pagination: {
          page: pageNumber,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
        },
      }),
    });
  });
}
