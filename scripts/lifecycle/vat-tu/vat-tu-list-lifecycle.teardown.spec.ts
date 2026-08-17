import { test } from '@playwright/test';
import { globalTeardown } from './vat-tu-list-dataset.global';

test('teardown dataset dùng chung của spec danh sách Vật tư', async ({}, testInfo) => {
  // Teardown luôn đọc đúng danh sách mã từ state do setup của cùng spec tạo ra.
  await globalTeardown(testInfo.config);
});
