import type { MaterialCleanupTracker } from '@cleanup/vat-tu.cleanup';
import type { DatabaseContext } from '@database/database.context';
import { expect } from '@fixtures/base.fixture';
import { openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import type { MaterialType, VatTuPage } from '@pages/danh-muc/vat-tu.page';
import { materialDetailCreationData, materialDetailFullInventoryData } from '@test-data/danh-muc/vat-tu/vat-tu.data';
import { requireCredentials } from '@utils/env.config';

export interface CreatedDeleteMaterial {
  readonly code: string;
  readonly name: string;
}

/** Tạo đúng một Vật tư AUTO_ mới qua UI và xác nhận DB đúng tenant. */
export async function createDeleteMaterial(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
  materialCleanup: MaterialCleanupTracker,
  testCaseId: string,
  materialType: MaterialType = 'Hàng hóa',
  withConversion = false,
): Promise<CreatedDeleteMaterial | undefined> {
  const credentials = requireCredentials();
  const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
  const unit = units.find(item => item.status === 'HoatDong');
  const group = groups.find(item => item.status === 'HoatDong');
  if (!unit || (withConversion && !group)) return undefined;

  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  let code: string;
  let name: string;
  if (withConversion && group && materialType !== 'Dịch vụ') {
    const data = materialDetailFullInventoryData(testCaseId, materialType, group, unit);
    ({ code, name } = data);
    materialCleanup.register(code);
    await vatTuPage.fillFullGoodsMaterial(data, materialType === 'Hàng hóa' ? 'goods' : 'inventory-material');
  } else {
    const data = materialDetailCreationData(testCaseId);
    ({ code, name } = data);
    materialCleanup.register(code);
    if (materialType === 'Dịch vụ') {
      await vatTuPage.selectFirstFormOption('Loại hàng hóa đặc trưng');
      await vatTuPage.fillRequiredMaterialFields(code, name, unit);
    } else {
      await vatTuPage.fillRequiredInventoryMaterialFields(code, name, unit);
    }
  }
  await vatTuPage.saveMaterial();
  await expect(vatTuPage.successNotification(), `Phải tạo thành công Vật tư riêng cho ${testCaseId}`).toContainText('Thêm mới thành công');
  await vatTuPage.createMaterialDialog.waitFor({ state: 'hidden' });
  await expect.poll(
    () => db.vatTu.findByCodeForDefaultTenant(credentials.username, code),
    { message: `DB phải có đúng Vật tư ${code} vừa tạo`, timeout: 15_000 },
  ).toHaveLength(1);
  return { code, name };
}

/** Tạo nhiều Vật tư cùng prefix testcase để kiểm tra phân trang mà không đụng dữ liệu nền. */
export async function createDeleteMaterials(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
  materialCleanup: MaterialCleanupTracker,
  testCaseId: string,
  count: number,
): Promise<readonly CreatedDeleteMaterial[]> {
  const created: CreatedDeleteMaterial[] = [];
  for (let index = 0; index < count; index += 1) {
    const item = await createDeleteMaterial(vatTuPage, db, materialCleanup, `${testCaseId}-${index + 1}`);
    if (!item) break;
    created.push(item);
  }
  return created;
}
