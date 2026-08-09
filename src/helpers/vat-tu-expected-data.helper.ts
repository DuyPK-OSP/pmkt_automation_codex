import { DatabaseContext } from '@database/database.context';
import type { AccountOption, CatalogueOption, VatTuCatalogues, VatTuPage } from '@pages/danh-muc/vat-tu.page';
import { requireCredentials } from '@utils/env.config';

/** Chạy truy vấn read-only trong DB context riêng và luôn đóng pool sau khi hoàn tất. */
async function readExpectedFromDatabase<T>(
  query: (db: DatabaseContext, username: string) => Promise<T>,
): Promise<T> {
  const db = new DatabaseContext();
  const credentials = requireCredentials();
  try {
    return await query(db, credentials.username);
  } finally {
    await db.close();
  }
}

/** Ánh xạ bản ghi trạng thái boolean trong DB thành option nghiệp vụ của form Vật tư. */
function toCatalogueOption(record: Readonly<{ code: string; name: string; active: boolean }>): CatalogueOption {
  return {
    code: record.code,
    name: record.name,
    status: record.active ? 'HoatDong' : 'NgungHoatDong',
    label: `${record.code} — ${record.name}`,
  };
}

/** Lấy Nhóm vật tư và Đơn vị tính từ DB rồi mở màn hình Danh mục Vật tư. */
export async function openVatTuWithCatalogues(vatTuPage: VatTuPage): Promise<VatTuCatalogues> {
  const catalogues = await readExpectedFromDatabase(async (db, username) => {
    const [groups, units] = await Promise.all([
      db.nhomVatTu.listForDefaultTenant(username),
      db.donViTinh.listForDefaultTenant(username),
    ]);
    return { groups: groups.map(toCatalogueOption), units: units.map(toCatalogueOption) };
  });
  await vatTuPage.openFromDanhMuc();
  return catalogues;
}

/** Chọn precondition Đơn vị tính Hoạt động có trong DB và đang thực sự khả dụng trên UI. */
export async function firstVisibleActiveMainUnit(
  vatTuPage: VatTuPage,
  units: readonly CatalogueOption[],
): Promise<CatalogueOption | undefined> {
  await vatTuPage.openMainUnitDropdown();
  const activeUnits = units
    .filter((unit) => unit.status === 'HoatDong')
    .sort((left, right) => left.code.localeCompare(right.code, 'vi'))
    .slice(0, 10);
  for (const unit of activeUnits) {
    await vatTuPage.searchMainUnit(unit.name);
    try {
      await vatTuPage.mainUnitOption(unit.label).waitFor({ state: 'visible', timeout: 2_000 });
      return unit;
    } catch {
      // Combogrid server-side có thể không trả về một số bản ghi DB; thử bản ghi Hoạt động kế tiếp.
    }
  }
  await vatTuPage.pressMainUnitKey('Escape');
  return undefined;
}

/** Lấy Tài khoản kế toán từ DB rồi mở màn hình Danh mục Vật tư. */
export async function openVatTuWithAccounts(vatTuPage: VatTuPage): Promise<readonly AccountOption[]> {
  const accounts = await readExpectedFromDatabase((db, username) =>
    db.heThongTaiKhoan.listForDefaultTenant(username),
  );
  await vatTuPage.openFromDanhMuc();
  return accounts.map((account) => ({
    code: account.code,
    name: account.name,
    status: account.status === 'ACTIVE' ? 'HoatDong' : 'NgungHoatDong',
    allowed: account.allowed,
    label: `${account.code} — ${account.name}`,
  }));
}

/** Lấy Kho từ DB rồi mở màn hình Danh mục Vật tư. */
export async function openVatTuWithWarehouses(vatTuPage: VatTuPage): Promise<readonly CatalogueOption[]> {
  const warehouses = await readExpectedFromDatabase((db, username) => db.kho.listForDefaultTenant(username));
  await vatTuPage.openFromDanhMuc();
  return warehouses.map(toCatalogueOption);
}

/** Lấy Thuế tài nguyên từ DB rồi mở màn hình Danh mục Vật tư. */
export async function openVatTuWithResourceTaxes(vatTuPage: VatTuPage): Promise<readonly CatalogueOption[]> {
  const taxes = await readExpectedFromDatabase((db, username) =>
    db.thueTaiNguyen.listForDefaultTenant(username),
  );
  await vatTuPage.openFromDanhMuc();
  return taxes.map(toCatalogueOption);
}
