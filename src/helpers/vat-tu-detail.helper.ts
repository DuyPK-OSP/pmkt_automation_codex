import type { MaterialCleanupTracker } from '@cleanup/vat-tu.cleanup';
import type { DatabaseContext } from '@database/database.context';
import { expect } from '@fixtures/base.fixture';
import { openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import type { MaterialType, VatTuPage } from '@pages/danh-muc/vat-tu.page';
import {
  materialDetailFullInventoryData,
  materialDetailFullServiceData,
} from '@test-data/danh-muc/vat-tu/vat-tu.data';
import { requireCredentials } from '@utils/env.config';

export interface FullMaterialPreconditionResult {
  readonly code?: string;
  readonly missingRequiredCatalogues: boolean;
}

export function normalizeCatalogueLabel(value: string): string {
  return value.replace(/\s*[\u2013\u2014-]\s*/g, ' - ').replace(/\s+/g, ' ').trim();
}

export function expectedVatRateLabel(value: string | null): string | null {
  if (value === null) return null;
  const labels: Readonly<Record<string, string>> = {
    KhongChiuThue: 'Không chịu thuế',
    KhongKeKhaiTinhNopThue: 'Không kê khai, tính nộp thuế',
    Khac: 'Khác',
  };
  return labels[value] ?? `${Number(value)}%`;
}

/** Chỉ điều phối UI; việc assert tab có/không có thuộc file spec. */
export async function openMaterialDetailTabIfVisible(
  vatTuPage: VatTuPage,
  code: string,
  tabName: string,
): Promise<boolean> {
  const visible = await vatTuPage.materialDetailTab(code, tabName).isVisible();
  if (visible) await vatTuPage.openMaterialDetailTab(code, tabName);
  return visible;
}

export async function readMaterialDetailFieldText(
  vatTuPage: VatTuPage,
  code: string,
  label: string,
): Promise<string> {
  return normalizeCatalogueLabel(await vatTuPage.materialDetailField(code, label).innerText());
}

export async function readMaterialDetailNumber(
  vatTuPage: VatTuPage,
  code: string,
  id: string,
): Promise<number | null> {
  const actual = await vatTuPage.materialDetailControlById(code, id).inputValue();
  return actual === '' ? null : Number(actual);
}

export async function readMaterialDetailConversionRows(
  vatTuPage: VatTuPage,
  code: string,
): Promise<readonly string[]> {
  const rows = vatTuPage.materialDetailTabPanel(code, 'Đơn vị quy đổi').getByRole('row');
  const rowTexts = await rows.allInnerTexts();
  return Promise.all(rowTexts.map(async (text, index) => {
    const inputValues = await rows.nth(index).locator('input').evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value).filter(Boolean));
    return normalizeCatalogueLabel([text, ...inputValues].join(' '));
  }));
}

export async function createFullMaterialPrecondition(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
  materialCleanup: MaterialCleanupTracker,
  testCaseId: string,
  materialType: MaterialType,
  onCreateFormReady?: () => Promise<void>,
): Promise<FullMaterialPreconditionResult> {
  const credentials = requireCredentials();
  const { groups, units } = await openVatTuWithCatalogues(vatTuPage);
  const group = groups.find(({ status }) => status === 'HoatDong');
  const activeUnits = units.filter(({ status }) => status === 'HoatDong');
  const mainUnit = activeUnits[0];
  const missingRequiredCatalogues = group === undefined || mainUnit === undefined
    || (materialType === 'Dịch vụ' && activeUnits.length < 2);
  if (!group || !mainUnit || missingRequiredCatalogues) return { missingRequiredCatalogues: true };

  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await onCreateFormReady?.();

  let code: string;
  if (materialType === 'Dịch vụ') {
    const material = materialDetailFullServiceData(testCaseId, group, mainUnit);
    code = material.code;
    materialCleanup.register(code);
    await vatTuPage.selectFirstFormOption('Loại hàng hóa đặc trưng');
    await vatTuPage.fillFullServiceMaterial(material);
  } else {
    const material = materialDetailFullInventoryData(testCaseId, materialType, group, mainUnit);
    code = material.code;
    materialCleanup.register(code);
    await vatTuPage.fillFullGoodsMaterial(material, materialType === 'Hàng hóa' ? 'goods' : 'inventory-material');
  }

  await vatTuPage.saveMaterial();
  await expect(vatTuPage.successNotification(), `Phải tạo thành công dữ liệu đầy đủ cho ${materialType}`)
    .toContainText('Thêm mới thành công');
  await expect.poll(
    () => db.vatTu.findByCodeForDefaultTenant(credentials.username, code),
    { message: `DB phải có Vật tư ${materialType} vừa tạo`, timeout: 15_000 },
  ).toHaveLength(1);
  return { code, missingRequiredCatalogues: false };
}
