import type { AccountOption, CatalogueOption } from '@pages/danh-muc/vat-tu.page';

/** Tìm một lựa chọn Hoạt động và một lựa chọn Ngừng hoạt động từ dữ liệu danh mục. */
export function statusPair(options: readonly CatalogueOption[]):
  | Readonly<{ active: CatalogueOption; inactive: CatalogueOption }>
  | undefined {
  const active = options.find((option) => option.status === 'HoatDong');
  const inactive = options.find((option) => option.status === 'NgungHoatDong');
  return active && inactive ? { active, inactive } : undefined;
}

/** Tìm bộ dữ liệu gồm tài khoản hoạt động được phép hạch toán và tài khoản ngừng hoạt động. */
export function accountingAccountCoverage(options: readonly AccountOption[]):
  | Readonly<{ activeAllowed: AccountOption; inactive: AccountOption }>
  | undefined {
  const activeAllowed = options.find(
    (option) => option.allowed && option.status === 'HoatDong',
  );
  const inactive = options.find(
    (option) => option.allowed && option.status === 'NgungHoatDong',
  );
  return activeAllowed && inactive ? { activeAllowed, inactive } : undefined;
}
