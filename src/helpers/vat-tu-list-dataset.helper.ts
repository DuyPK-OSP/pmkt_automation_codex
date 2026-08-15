import type { Browser } from '@playwright/test';
import type { DatabaseContext } from '@database/database.context';
import type { VatTuApiSeed } from '@database/repositories/vat-tu.repository';
import { LoginPage } from '@pages/common/login.page';
import { VatTuPage } from '@pages/danh-muc/vat-tu.page';
import { Logger } from '@utils/logger';
import { requireCredentials } from '@utils/env.config';

/** Dataset 110 Vật tư thật được setup API và dùng chung trong một worker của spec danh sách. */
export interface MaterialListDataset {
  readonly prefix: string;
  readonly codes: readonly string[];
}

/** Tạo payload tối thiểu theo seed DB; API chỉ phục vụ setup, không cung cấp expected cho assertion. */
export function buildPayload(seed: VatTuApiSeed, code: string, name: string): Readonly<Record<string, unknown>> {
  const isGoods = seed.materialType === 'HangHoa';
  return {
    ma: code,
    ten: name,
    tenMua: name,
    tenBan: name,
    loaiVatTu: seed.materialType,
    donViTinhId: seed.mainUnitId,
    loaiHangHoaDacTrung: isGoods ? null : (seed.specialGoodsType ?? 'Dịch vụ vận chuyển'),
    thoiHanBaoHanh: null,
    donViThoiGian: null,
    moTa: null,
    anhId: null,
    trangThai: 'HoatDong',
    thueSuatGtgtMacDinh: null,
    giaTriThueSuatGtgt: null,
    thueTnId: null,
    thueTtdbId: null,
    thueNhapKhau: null,
    thueXuatKhau: null,
    giamThueTheoQuyDinh: false,
    khoMacDinhId: null,
    phuongPhapTinhGia: isGoods ? 'NhapTruocXuatTruoc' : null,
    tonToiThieu: null,
    tonToiDa: null,
    theoDoiLo: false,
    theoDoiMaVach: false,
    donViTinhQuyDoiId: null,
    nhomVatTuIds: null,
    taiKhoanVatTuId: isGoods ? seed.materialAccountId : null,
    taiKhoanGiaVonId: isGoods ? seed.costOfGoodsAccountId : null,
    taiKhoanDoanhThuId: seed.revenueAccountId,
    taiKhoanHangBanTraLaiId: seed.salesReturnAccountId,
    taiKhoanChietKhauId: seed.discountAccountId,
    taiKhoanChiPhiId: seed.expenseAccountId,
    taiKhoanGiamGiaId: seed.priceReductionAccountId,
    taiKhoanChoPhanBoId: null,
    donViTinhKhacIds: [],
    donViQuyDois: [],
  };
}

/** Chạy tác vụ API theo từng nhóm nhỏ để staging không bị dồn 110 request đồng thời. */
export async function runInBatches<T>(items: readonly T[], size: number, task: (item: T) => Promise<void>): Promise<void> {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(task));
  }
}

/** Xóa một Vật tư với retry có giới hạn khi staging trả rate-limit 429. */
export async function deleteMaterialWithRetry(
  requestDelete: () => Promise<import('@playwright/test').APIResponse>,
  code: string,
): Promise<void> {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await requestDelete();
    if (response.ok() || response.status() === 404) return;
    if (response.status() !== 429 || attempt === 6) {
      throw new Error(`Teardown API ${code} thất bại (${response.status()}): ${await response.text()}`);
    }
    const retryAfterSeconds = Number(response.headers()['retry-after'] ?? '1');
    await new Promise(resolve => setTimeout(resolve, Math.max(retryAfterSeconds, 1) * 1_000));
  }
}

/** Tạo một Vật tư với retry có giới hạn khi staging trả rate-limit 429. */
export async function createMaterialWithRetry(
  requestPost: () => Promise<import('@playwright/test').APIResponse>,
  code: string,
): Promise<void> {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await requestPost();
    if (response.ok()) return;
    if (response.status() !== 429 || attempt === 6) {
      throw new Error(`Setup API ${code} thất bại (${response.status()}): ${await response.text()}`);
    }
    const retryAfterSeconds = Number(response.headers()['retry-after'] ?? '1');
    await new Promise(resolve => setTimeout(resolve, Math.max(retryAfterSeconds, 1) * 1_000));
  }
}

/** Setup 55 Hàng hóa + 55 Dịch vụ, giữ context đăng nhập để teardown chính xác sau khi worker kết thúc. */
export async function useMaterialListDataset(
  browser: Browser,
  db: DatabaseContext,
  use: (dataset: MaterialListDataset) => Promise<void>,
): Promise<void> {
  const credentials = requireCredentials();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const logger = new Logger();
  const loginPage = new LoginPage(page, logger);
  const vatTuPage = new VatTuPage(page, logger);
  const runId = `${Date.now().toString(36).toUpperCase()}`;
  const prefix = `AUTO_LIST_${runId}`;
  const codes = Array.from({ length: 110 }, (_, index) => `${prefix}_${String(index + 1).padStart(3, '0')}`);

  await loginPage.open();
  await loginPage.login(credentials.username, credentials.password);
  const origin = new URL(page.url()).origin;
  // Lấy header xác thực/tenant từ request danh sách thật vì PMKT lưu token ngoài cookie của APIRequestContext.
  const listRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return request.method() === 'GET' && url.pathname === '/api/master-data/vat-tu';
  });
  await vatTuPage.openFromDanhMuc();
  const browserHeaders = await (await listRequest).allHeaders();
  const apiHeaders = Object.fromEntries(
    Object.entries(browserHeaders).filter(([name]) => ['authorization', 'x-tenant-id', 'tenant-id'].includes(name.toLowerCase())),
  );
  const seeds = await db.vatTu.findApiSeedsForDefaultTenant(credentials.username);
  const goodsSeed = seeds.find(seed => seed.materialType === 'HangHoa');
  const serviceSeed = seeds.find(seed => seed.materialType === 'DichVu');
  if (!goodsSeed || !serviceSeed) throw new Error('DB đúng tenant cần seed Hàng hóa và Dịch vụ đang hoạt động để setup dataset.');

  try {
    // Setup trước use(): 55 mã đầu là Hàng hóa, 55 mã sau là Dịch vụ.
    await runInBatches(codes, 1, async (code) => {
      const index = codes.indexOf(code);
      const seed = index < 55 ? goodsSeed : serviceSeed;
      const typeName = index < 55 ? 'Hàng hóa' : 'Dịch vụ';
      await createMaterialWithRetry(
        () => context.request.post(`${origin}/api/master-data/vat-tu`, {
          headers: apiHeaders,
          data: buildPayload(seed, code, `${prefix} ${typeName} ${String(index + 1).padStart(3, '0')}`),
        }),
        code,
      );
    });

    const identities = await db.vatTu.findActiveIdentitiesByCodesForDefaultTenant(credentials.username, codes);
    if (identities.length !== 110) throw new Error(`DB chỉ ghi nhận ${identities.length}/110 Vật tư setup.`);
    await use({ prefix, codes });
  } finally {
    // Teardown sau use(): chỉ xóa từng ID ứng với danh sách mã đã quản lý, kể cả khi testcase fail.
    const identities = await db.vatTu.findActiveIdentitiesByCodesForDefaultTenant(credentials.username, codes);
    await runInBatches(identities, 1, async ({ id, code, updatedAt }) => {
      await deleteMaterialWithRetry(
        () => context.request.delete(`${origin}/api/master-data/vat-tu/${id}`, {
          headers: apiHeaders,
          data: { updatedAt },
        }),
        code,
      );
    });
    const remaining = await db.vatTu.findActiveIdentitiesByCodesForDefaultTenant(credentials.username, codes);
    await context.close();
    if (remaining.length > 0) throw new Error(`Teardown còn sót ${remaining.map(item => item.code).join(', ')}.`);
  }
}
