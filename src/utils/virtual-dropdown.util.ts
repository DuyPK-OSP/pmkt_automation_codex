import type { Locator } from '@playwright/test';

export interface VirtualDropdownCollection<T> {
  readonly dropdown: Locator;
  readonly readVisibleItems: () => Promise<readonly T[]>;
  readonly itemKey: (item: T) => string;
  readonly expectedCount?: number | undefined;
  readonly maxScrolls?: number | undefined;
}

interface ScrollState {
  readonly scrollTop: number;
  readonly clientHeight: number;
  readonly scrollHeight: number;
}

/**
 * Thu thập đầy đủ dữ liệu của select/combogrid dùng virtual scroll hoặc lazy render.
 * Thứ tự Map phản ánh thứ tự bản ghi xuất hiện khi cuộn từ đầu xuống cuối danh sách.
 */
export async function collectVirtualDropdownItems<T>(
  options: VirtualDropdownCollection<T>,
): Promise<readonly T[]> {
  const { dropdown, readVisibleItems, itemKey, expectedCount, maxScrolls = 100 } = options;
  const virtualHolder = dropdown
    .locator('.rc-virtual-list-holder, .ant-table-body, [class*="virtual-list-holder"]')
    .first();
  const scrollTarget = (await virtualHolder.count()) > 0 ? virtualHolder : dropdown;
  const collected = new Map<string, T>();

  await scrollTarget.evaluate((element) => {
    element.scrollTop = 0;
  });

  for (let index = 0; index < maxScrolls; index += 1) {
    for (const item of await readVisibleItems()) {
      const key = itemKey(item).trim();
      if (key && !collected.has(key)) collected.set(key, item);
    }

    if (expectedCount !== undefined && collected.size >= expectedCount) break;

    const before: ScrollState = await scrollTarget.evaluate((element) => ({
      scrollTop: element.scrollTop,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    const reachedBottom = before.scrollTop + before.clientHeight >= before.scrollHeight - 1;
    if (reachedBottom) break;

    const after: ScrollState = await scrollTarget.evaluate((element) => {
      element.scrollTop = Math.min(
        element.scrollTop + Math.max(Math.floor(element.clientHeight * 0.8), 1),
        element.scrollHeight,
      );
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve({
          scrollTop: element.scrollTop,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
        })));
      });
    });
    if (after.scrollTop <= before.scrollTop) break;
  }

  return [...collected.values()];
}
