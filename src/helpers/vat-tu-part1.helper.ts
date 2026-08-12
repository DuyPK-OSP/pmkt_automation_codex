import type { DatabaseContext } from '@database/database.context';
import { expect } from '@fixtures/base.fixture';
import { openVatTuWithAccounts } from '@helpers/vat-tu-expected-data.helper';
import { openVatTuWithCatalogues } from '@helpers/vat-tu-expected-data.helper';
import type {
  AccountOption,
  CatalogueOption,
  FullGoodsMaterialInput,
  FullGoodsMaterialSelection,
  MaterialType,
  RequiredGoodsUiDefaults,
  TaxOption,
  VatTuPage,
  VatTuCatalogues,
} from '@pages/danh-muc/vat-tu.page';
import { expectedMaterialTypeCards } from '@test-data/danh-muc/vat-tu/vat-tu.data';
import { requireCredentials } from '@utils/env.config';
import { TestDataGenerator } from '@utils/test-data';

const normalizeAccountLabel = (value: string | null | undefined): string | null => value
  ?.trim()
  .replace(/\s*[-–—]\s*/u, ' — ') ?? null;

/** Chuẩn hóa riêng định dạng số; giữ nguyên khác biệt có ý nghĩa giữa NULL và 0. */
const nullableNumericValue = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value.trim() === '') return null;
  const numericText = value.match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.');
  return numericText === undefined ? null : Number(numericText);
};

/** Đối chiếu đầy đủ sáu thẻ tính chất và mô tả theo testcase mới. */
export async function verifyMaterialTypeCards(vatTuPage: VatTuPage): Promise<void> {
  for (const card of expectedMaterialTypeCards) {
    await expect(vatTuPage.materialTypeTitle(card.type), `Phải hiển thị thẻ ${card.type}`).toBeVisible();
    await expect(
      vatTuPage.materialTypeDescription(card.description),
      `Mô tả thẻ ${card.type} phải đúng testcase`,
    ).toBeVisible();
  }
}

/** Sinh chuỗi ASCII unique, traceable và chuẩn hóa đúng độ dài boundary yêu cầu. */
export function boundaryText(testCaseId: string, length: number): string {
  const seed = new TestDataGenerator().uniqueKeyword(testCaseId);
  return `${seed}_${'x'.repeat(length)}`.slice(0, length);
}

/** Lấy danh mục từ DB đúng tenant rồi mở form Hàng hóa tại tab Đơn vị quy đổi và thêm dòng đầu tiên. */
export async function prepareGoodsConversionGrid(
  vatTuPage: VatTuPage,
  materialType: MaterialType = 'Hàng hóa',
): Promise<VatTuCatalogues> {
  const catalogues = await openVatTuWithCatalogues(vatTuPage);
  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await vatTuPage.openFormTab('Đơn vị quy đổi');
  await vatTuPage.addConversionRow();
  return catalogues;
}

/** Sinh bộ dữ liệu Hàng hóa đầy đủ, unique và truy vết được cho một testcase lưu thành công. */
export function fullGoodsData(
  testCaseId: string,
  group: CatalogueOption,
  mainUnit: CatalogueOption,
  materialType: MaterialType = 'Hàng hóa',
): FullGoodsMaterialInput {
  const code = new TestDataGenerator().uniqueCode(testCaseId);
  return {
    code,
    name: `${materialType} ${testCaseId} ${code}`,
    description: `Mô tả nghiệp vụ ${testCaseId} ${code}`,
    purchaseName: `Tên mua ${testCaseId} ${code}`,
    saleName: `Tên bán ${testCaseId} ${code}`,
    imagePath: 'test-data/danh-muc/vat-tu/tc32-material.png',
    group,
    mainUnit,
  };
}

/** Đối chiếu toàn bộ dữ liệu Hàng hóa đã nhập với mst_vat_tu và bảng Đơn vị quy đổi. */
export async function verifyFullGoodsSavedInDatabase(
  db: DatabaseContext,
  username: string,
  material: FullGoodsMaterialInput,
  selection: FullGoodsMaterialSelection,
  active: boolean,
  expectedConversionCount = 1,
  materialType: MaterialType = 'Hàng hóa',
): Promise<void> {
  await expect.poll(
    async () => (await db.vatTu.findByCodeForDefaultTenant(username, material.code)).length,
    { message: `DB phải có đúng một Vật tư ${material.code}` },
  ).toBe(1);
  const records = await db.vatTu.findByCodeForDefaultTenant(username, material.code);
  const actual = records[0];
  expect(actual, `Phải đọc được Vật tư ${material.code} từ DB`).toBeDefined();
  if (!actual) return;

  expect(actual.id).toBeTruthy();
  expect(actual.tenantId).toBeTruthy();
  expect(actual.code).toBe(material.code);
  expect(actual.name).toBe(material.name);
  expect(actual.purchaseName).toBe(material.purchaseName);
  expect(actual.saleName).toBe(material.saleName);
  expect(actual.materialType).toBe(materialType);
  expect(actual.mainUnit).toBe(material.mainUnit.label);
  expect(actual.imageId).toBeTruthy();
  expect(actual.specialGoodsType).toBe(selection.specialGoodsType || null);
  expect(actual.warrantyPeriod).toBe(12);
  expect(actual.warrantyUnit).toBe(selection.warrantyUnit);
  expect(actual.active).toBe(active);
  expect(actual.description).toBe(material.description);
  expect(actual.groups).toEqual([material.group.label]);
  expect(actual.reducedTax).toBe(true);
  expect(normalizeAccountLabel(actual.materialAccount)).toBe(normalizeAccountLabel(selection.accounts['Tài khoản vật tư']));
  expect(normalizeAccountLabel(actual.costOfGoodsAccount)).toBe(normalizeAccountLabel(selection.accounts['Tài khoản giá vốn']));
  expect(normalizeAccountLabel(actual.revenueAccount)).toBe(normalizeAccountLabel(selection.accounts['Tài khoản doanh thu']));
  expect(normalizeAccountLabel(actual.salesReturnAccount)).toBe(normalizeAccountLabel(selection.accounts['Tài khoản hàng bán trả lại']));
  expect(normalizeAccountLabel(actual.expenseAccount)).toBe(normalizeAccountLabel(selection.accounts['Tài khoản chi phí']));
  expect(normalizeAccountLabel(actual.discountAccount)).toBe(normalizeAccountLabel(selection.accounts['Tài khoản chiết khấu']));
  expect(normalizeAccountLabel(actual.priceReductionAccount)).toBe(normalizeAccountLabel(selection.accounts['Tài khoản giảm giá']));
  expect(actual.warehouse).toBe(selection.warehouse);
  expect(actual.pricingMethod).toBe(selection.pricingMethod);
  expect(nullableNumericValue(actual.minimumStock)).toBe(10);
  expect(nullableNumericValue(actual.maximumStock)).toBe(1000);
  expect(actual.trackLot).toBe(true);
  expect(actual.trackBarcode).toBe(true);
  expect(nullableNumericValue(actual.defaultVatRate)).toBe(nullableNumericValue(selection.vatRate));
  expect(nullableNumericValue(actual.defaultVatValue)).toBe(nullableNumericValue(selection.vatRateValue));
  expect(nullableNumericValue(actual.importTax)).toBe(0);
  expect(nullableNumericValue(actual.exportTax)).toBe(0);
  expect(actual.exciseTax).toBe(selection.exciseTax);
  expect(actual.resourceTax).toBe(selection.resourceTax);
  expect(actual.deleted).toBe(false);

  const conversions = await db.donViQuyDoiVatTu.listByMaterialCodeForDefaultTenant(username, material.code);
  expect(conversions).toHaveLength(expectedConversionCount);
  if (expectedConversionCount === 0) return;
  expect(conversions[0]?.unit).toBe(selection.conversion.unit);
  expect(nullableNumericValue(conversions[0]?.ratio)).toBe(nullableNumericValue(selection.conversion.ratio));
  expect(conversions[0]?.operation).toBe(selection.conversion.operation);
  expect(conversions[0]?.description).toBe(selection.conversion.description);
  expect(conversions[0]?.order).toBe(0);
}

/** Đối chiếu trường bắt buộc và toàn bộ giá trị rỗng/mặc định của Hàng hóa tối thiểu trong DB. */
export async function verifyRequiredGoodsSavedInDatabase(
  db: DatabaseContext,
  username: string,
  expected: Readonly<{
    code: string;
    name: string;
    mainUnit: CatalogueOption;
    active: boolean;
    defaults: RequiredGoodsUiDefaults;
  }>,
  materialType: MaterialType = 'Hàng hóa',
): Promise<void> {
  await expect.poll(
    async () => (await db.vatTu.findByCodeForDefaultTenant(username, expected.code)).length,
    { message: `DB phải có đúng một Vật tư ${expected.code}` },
  ).toBe(1);
  const records = await db.vatTu.findByCodeForDefaultTenant(username, expected.code);
  const actual = records[0];
  expect(actual, `Phải đọc được Vật tư ${expected.code} từ DB`).toBeDefined();
  if (!actual) return;

  expect(actual.id).toBeTruthy();
  expect(actual.tenantId).toBeTruthy();
  expect(actual.code).toBe(expected.code);
  expect(actual.name).toBe(expected.name);
  expect(actual.materialType).toBe(materialType);
  expect(actual.mainUnit).toBe(expected.mainUnit.label);
  expect(actual.active).toBe(expected.active);
  const defaults = expected.defaults;
  const nullableText = (value: string): string | null => value === '' ? null : value;
  const nullableNumber = (value: string): number | null => value === '' ? null : Number(value);
  expect(actual.pricingMethod).toBe(defaults.pricingMethod);
  expect(normalizeAccountLabel(actual.materialAccount)).toBe(normalizeAccountLabel(defaults.accounts['Tài khoản vật tư']));
  expect(normalizeAccountLabel(actual.costOfGoodsAccount)).toBe(normalizeAccountLabel(defaults.accounts['Tài khoản giá vốn']));
  expect(normalizeAccountLabel(actual.revenueAccount)).toBe(normalizeAccountLabel(defaults.accounts['Tài khoản doanh thu']));
  expect(normalizeAccountLabel(actual.salesReturnAccount)).toBe(normalizeAccountLabel(defaults.accounts['Tài khoản hàng bán trả lại']));
  expect(normalizeAccountLabel(actual.expenseAccount)).toBe(normalizeAccountLabel(defaults.accounts['Tài khoản chi phí']));
  expect(normalizeAccountLabel(actual.discountAccount)).toBe(normalizeAccountLabel(defaults.accounts['Tài khoản chiết khấu']));
  expect(normalizeAccountLabel(actual.priceReductionAccount)).toBe(normalizeAccountLabel(defaults.accounts['Tài khoản giảm giá']));
  expect(actual.purchaseName).toBe(nullableText(defaults.purchaseName));
  expect(actual.saleName).toBe(nullableText(defaults.saleName));
  expect(actual.description).toBe(nullableText(defaults.description));
  expect(Boolean(actual.imageId)).toBe(defaults.imageVisible);
  expect(actual.specialGoodsType).toBe(defaults.specialGoodsType);
  expect(actual.warrantyPeriod).toBe(nullableNumber(defaults.warrantyPeriod));
  expect(actual.warrantyUnit).toBe(defaults.warrantyUnit);
  expect(actual.groups).toEqual(defaults.groups);
  expect(actual.reducedTax).toBe(defaults.reducedTax);
  expect(actual.warehouse).toBe(defaults.warehouse);
  expect(actual.minimumStock === null ? null : Number(actual.minimumStock)).toBe(nullableNumber(defaults.minimumStock));
  expect(actual.maximumStock === null ? null : Number(actual.maximumStock)).toBe(nullableNumber(defaults.maximumStock));
  expect(actual.trackLot).toBe(defaults.trackLot);
  expect(actual.trackBarcode).toBe(defaults.trackBarcode);
  const defaultVatRate = defaults.defaultVatRate?.match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.');
  expect(actual.defaultVatRate === null ? null : Number(actual.defaultVatRate)).toBe(defaultVatRate === undefined ? null : Number(defaultVatRate));
  expect(nullableNumericValue(actual.defaultVatValue)).toBe(nullableNumericValue(defaults.defaultVatValue));
  expect(actual.importTax === null ? null : Number(actual.importTax)).toBe(nullableNumber(defaults.importTax));
  expect(actual.exportTax === null ? null : Number(actual.exportTax)).toBe(nullableNumber(defaults.exportTax));
  expect(actual.exciseTax).toBe(defaults.exciseTax);
  expect(actual.resourceTax).toBe(defaults.resourceTax);
  expect(actual.deleted).toBe(false);
  expect(await db.donViQuyDoiVatTu.listByMaterialCodeForDefaultTenant(username, expected.code)).toHaveLength(defaults.conversionRowCount);
}

/** Mở form Hàng hóa tại tab Hạch toán và trả về danh mục Tài khoản từ DB. */
export async function prepareGoodsAccounting(
  vatTuPage: VatTuPage,
  materialType: MaterialType = 'Hàng hóa',
): Promise<readonly AccountOption[]> {
  const accounts = await openVatTuWithAccounts(vatTuPage);
  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await vatTuPage.openDefaultAccountingTab();
  return accounts;
}

/** Mở form Hàng hóa tại tab Thông tin kho, không tương tác với trường nào. */
export async function openGoodsInventoryTab(vatTuPage: VatTuPage, materialType: MaterialType = 'Hàng hóa'): Promise<void> {
  await vatTuPage.openFromDanhMuc();
  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await vatTuPage.openFormTab('Thông tin kho');
}

/** Mở form Hàng hóa tại tab Thông tin thuế, không tương tác với trường nào. */
export async function openGoodsTaxTab(vatTuPage: VatTuPage, materialType: MaterialType = 'Hàng hóa'): Promise<void> {
  await vatTuPage.openFromDanhMuc();
  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await vatTuPage.openFormTab('Thông tin thuế');
}

/** Mở form Hàng hóa tại combogrid Kho mặc định. */
export async function openGoodsWarehouse(vatTuPage: VatTuPage, materialType: MaterialType = 'Hàng hóa'): Promise<void> {
  await vatTuPage.openFromDanhMuc();
  await vatTuPage.openMaterialTypePopup();
  await vatTuPage.selectMaterialType(materialType);
  await vatTuPage.openWarehouseDropdown();
}

/** Lấy danh mục Kho từ DB đúng tenant mặc định rồi mở combogrid để đối chiếu UI. */
export async function prepareGoodsWarehouses(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
  materialType: MaterialType = 'Hàng hóa',
): Promise<readonly CatalogueOption[]> {
  const credentials = requireCredentials();
  const records = await db.kho.listForDefaultTenant(credentials.username);
  await openGoodsWarehouse(vatTuPage, materialType);
  return records.map((record) => ({
    code: record.code,
    name: record.name,
    status: record.active ? 'HoatDong' : 'NgungHoatDong',
    label: `${record.code} — ${record.name}`,
  }));
}

/** Lấy danh mục Thuế tài nguyên từ DB đúng tenant rồi mở combogrid để đối chiếu UI. */
export async function prepareGoodsResourceTaxes(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
  materialType: MaterialType = 'Hàng hóa',
): Promise<readonly TaxOption[]> {
  const credentials = requireCredentials();
  const records = await db.thueTaiNguyen.listForDefaultTenant(credentials.username);
  await openGoodsTaxTab(vatTuPage, materialType);
  await vatTuPage.openTaxDropdown('Thuế Tài nguyên');
  return records.map((record) => ({
    code: record.code,
    name: record.name,
    rate: String(Number(record.rate)),
    status: record.active ? 'HoatDong' : 'NgungHoatDong',
    label: `${record.code} — ${record.name}`,
  }));
}

/** Lấy danh mục Thuế tiêu thụ đặc biệt từ DB đúng tenant rồi mở combogrid để đối chiếu UI. */
export async function prepareGoodsExciseTaxes(
  vatTuPage: VatTuPage,
  db: DatabaseContext,
  materialType: MaterialType = 'Hàng hóa',
): Promise<readonly TaxOption[]> {
  const credentials = requireCredentials();
  const records = await db.thueTieuThuDacBiet.listForDefaultTenant(credentials.username);
  await openGoodsTaxTab(vatTuPage, materialType);
  await vatTuPage.openTaxDropdown('Thuế tiêu thụ đặc biệt');
  return records.map((record) => ({
    code: record.code,
    name: record.name,
    rate: String(Number(record.rate)),
    status: record.active ? 'HoatDong' : 'NgungHoatDong',
    label: `${record.code} — ${record.name}`,
  }));
}
