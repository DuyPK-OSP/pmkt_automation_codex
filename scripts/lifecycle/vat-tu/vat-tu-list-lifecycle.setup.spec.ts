import { test } from '@playwright/test';
import globalSetup from './vat-tu-list-dataset.global';

test('setup dataset dùng chung cho spec danh sách Vật tư', async ({}, testInfo) => {
  // Setup chạy trong process riêng; state chứa prefix nhưng không chứa token hoặc credentials.
  await globalSetup(testInfo.config);
});
