import { chromium, type Browser, type FullConfig } from '@playwright/test';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseContext } from '../../../src/database/database.context';
import { LoginPage } from '../../../src/pages/common/login.page';
import { VatTuPage } from '../../../src/pages/danh-muc/vat-tu.page';
import { Logger } from '../../../src/utils/logger';
import { requireCredentials } from '../../../src/utils/env.config';
import { env } from '../../../src/utils/env.config';
import {
  buildPayload,
  createMaterialWithRetry,
  deleteMaterialWithRetry,
  runInBatches,
  type MaterialListDataset,
} from '../../../src/helpers/vat-tu-list-dataset.helper';

const STATE_PATH = path.resolve('test-results', 'vat-tu-list-dataset-state.json');

/** Đăng nhập UI để lấy header xác thực và tenant; không lưu token vào state hoặc log. */
async function openApiSession(browser: Browser) {
  const context = await browser.newContext({ baseURL: env.baseUrl, viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const logger = new Logger();
  const loginPage = new LoginPage(page, logger);
  const vatTuPage = new VatTuPage(page, logger);
  const credentials = requireCredentials();
  await loginPage.open();
  await loginPage.login(credentials.username, credentials.password);
  const listRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return request.method() === 'GET' && url.pathname === '/api/master-data/vat-tu';
  });
  await vatTuPage.openFromDanhMuc();
  const requestHeaders = await (await listRequest).allHeaders();
  const headers = Object.fromEntries(
    Object.entries(requestHeaders).filter(([name]) =>
      ['authorization', 'x-tenant-id', 'tenant-id'].includes(name.toLowerCase()),
    ),
  );
  return { context, origin: new URL(page.url()).origin, headers };
}

/** Global setup tạo một lần 110 Vật tư trước toàn suite và truyền prefix cho mọi worker được restart. */
export default async function globalSetup(_: FullConfig): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const db = new DatabaseContext();
  const credentials = requireCredentials();
  const prefix = `AUTO_LIST_${Date.now().toString(36).toUpperCase()}`;
  const codes = Array.from({ length: 110 }, (_, index) => `${prefix}_${String(index + 1).padStart(3, '0')}`);
  const dataset: MaterialListDataset = { prefix, codes };
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(dataset), 'utf8');
  process.env.MATERIAL_LIST_DATASET_PREFIX = prefix;

  const { context, origin, headers } = await openApiSession(browser);
  try {
    const seeds = await db.vatTu.findApiSeedsForDefaultTenant(credentials.username);
    const goodsSeed = seeds.find(seed => seed.materialType === 'HangHoa');
    const serviceSeed = seeds.find(seed => seed.materialType === 'DichVu');
    if (!goodsSeed || !serviceSeed) throw new Error('DB đúng tenant thiếu seed Hàng hóa hoặc Dịch vụ đang hoạt động.');

    await runInBatches(codes, 1, async code => {
      const index = codes.indexOf(code);
      const seed = index < 55 ? goodsSeed : serviceSeed;
      const typeName = index < 55 ? 'Hàng hóa' : 'Dịch vụ';
      await createMaterialWithRetry(
        () => context.request.post(`${origin}/api/master-data/vat-tu`, {
          headers,
          data: buildPayload(seed, code, `${prefix} ${typeName} ${String(index + 1).padStart(3, '0')}`),
        }),
        code,
      );
    });
    const identities = await db.vatTu.findActiveIdentitiesByCodesForDefaultTenant(credentials.username, codes);
    if (identities.length !== 110) throw new Error(`Global setup chỉ tạo được ${identities.length}/110 Vật tư.`);
  } finally {
    await context.close();
    await browser.close();
    await db.close();
  }
}

/** Global teardown xóa đúng dataset trong state sau khi toàn bộ Playwright process kết thúc. */
export async function globalTeardown(_: FullConfig): Promise<void> {
  let dataset: MaterialListDataset;
  try {
    dataset = JSON.parse(await readFile(STATE_PATH, 'utf8')) as MaterialListDataset;
  } catch (error) {
    // Fallback phục hồi cleanup theo prefix khi state bị tiến trình ngoài ý muốn xóa mất.
    const prefix = process.env.MATERIAL_LIST_DATASET_PREFIX;
    if (!prefix) throw error;
    dataset = {
      prefix,
      codes: Array.from({ length: 110 }, (_, index) => `${prefix}_${String(index + 1).padStart(3, '0')}`),
    };
  }
  const browser = await chromium.launch({ headless: true });
  const db = new DatabaseContext();
  const credentials = requireCredentials();
  const { context, origin, headers } = await openApiSession(browser);
  try {
    const identities = await db.vatTu.findActiveIdentitiesByCodesForDefaultTenant(credentials.username, dataset.codes);
    await runInBatches(identities, 1, async ({ id, code, updatedAt }) => {
      await deleteMaterialWithRetry(
        () => context.request.delete(`${origin}/api/master-data/vat-tu/${id}`, { headers, data: { updatedAt } }),
        code,
      );
    });
    const remaining = await db.vatTu.findActiveIdentitiesByCodesForDefaultTenant(credentials.username, dataset.codes);
    if (remaining.length > 0) throw new Error(`Global teardown còn sót ${remaining.map(item => item.code).join(', ')}.`);
    await unlink(STATE_PATH).catch(error => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    });
  } finally {
    delete process.env.MATERIAL_LIST_DATASET_PREFIX;
    await context.close();
    await browser.close();
    await db.close();
  }
}
