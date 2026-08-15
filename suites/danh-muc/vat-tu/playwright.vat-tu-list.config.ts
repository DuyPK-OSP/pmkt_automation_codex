import { defineConfig } from '@playwright/test';
import path from 'node:path';
import baseConfig from '../../../playwright.config';

/** Cấu hình chạy trọn spec danh sách với dataset sống ngoài lifecycle worker. */
export default defineConfig({
  ...baseConfig,
  testDir: '../../../src/tests',
  testMatch: /danh-sach-vat-tu\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    [path.resolve('src/reporters/case-result.reporter.ts')],
    ['list'],
    ['html', { outputFolder: path.resolve('playwright-report'), open: 'never' }],
    ['allure-playwright', { resultsDir: path.resolve('allure-results'), detail: true }],
  ],
  globalSetup: './vat-tu-list-dataset.global.ts',
  globalTeardown: './vat-tu-list-dataset.teardown.ts',
});
