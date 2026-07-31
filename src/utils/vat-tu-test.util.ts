import type { AccountOption, CatalogueOption } from '@pages/danh-muc/vat-tu.page';

export function statusPair(options: readonly CatalogueOption[]):
  | Readonly<{ active: CatalogueOption; inactive: CatalogueOption }>
  | undefined {
  const active = options.find((option) => option.status === 'HoatDong');
  const inactive = options.find((option) => option.status === 'NgungHoatDong');
  return active && inactive ? { active, inactive } : undefined;
}

export function accountingAccountCoverage(options: readonly AccountOption[]):
  | Readonly<{ activeAllowed: AccountOption; inactive: AccountOption }>
  | undefined {
  const activeAllowed = options.find(
    (option) => option.allowed && option.status === 'HoatDong',
  );
  const inactive = options.find((option) => option.status === 'NgungHoatDong');
  return activeAllowed && inactive ? { activeAllowed, inactive } : undefined;
}
