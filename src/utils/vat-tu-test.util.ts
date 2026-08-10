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

/** Tìm từ khóa ngắn nhất xuất hiện trong ít nhất hai giá trị để tạo kết quả tìm kiếm đa dòng. */
export function sharedSearchKeyword(values: readonly string[]): string | undefined {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  for (const value of normalized) {
    for (let length = 2; length <= Math.min(value.length, 12); length += 1) {
      for (let start = 0; start + length <= value.length; start += 1) {
        const candidate = value.slice(start, start + length);
        const matches = normalized.filter((item) =>
          item.toLocaleLowerCase('vi').includes(candidate.toLocaleLowerCase('vi')),
        );
        if (matches.length >= 2) return candidate;
      }
    }
  }
  return undefined;
}

/**
 * Tìm từ khóa có trong cột mục tiêu nhưng không xuất hiện ở cột đối chứng,
 * giúp testcase chứng minh đúng phạm vi tìm kiếm theo từng cột.
 */
export function discriminatingSearchKeyword(
  targetValues: readonly string[],
  excludedValues: readonly string[],
): string | undefined {
  const targets = targetValues.map((value) => value.trim()).filter(Boolean);
  const excluded = excludedValues.map((value) => value.trim().toLocaleLowerCase('vi'));
  for (const value of [...targets].sort((left, right) => right.length - left.length)) {
    for (let length = value.length; length >= 2; length -= 1) {
      for (let start = 0; start + length <= value.length; start += 1) {
        const candidate = value.slice(start, start + length);
        const normalized = candidate.toLocaleLowerCase('vi');
        if (!excluded.some((item) => item.includes(normalized))) return candidate;
      }
    }
  }
  return undefined;
}

/** Xác định CSS color là màu xám khi ba kênh RGB bằng nhau, không phụ thuộc alpha. */
export function isGrayCssColor(color: string): boolean {
  const channels = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!channels) return false;
  const [, red, green, blue] = channels.map(Number);
  return red === green && green === blue;
}
