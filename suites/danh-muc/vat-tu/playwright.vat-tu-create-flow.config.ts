import { defineConfig, devices } from '@playwright/test';
import baseConfig from '../../../playwright.config';

/**
 * Suite chỉ chạy các testcase hoàn tất luồng tạo mới của năm loại vật tư.
 * Mỗi project được chạy riêng khi xuất report để artifacts và số liệu không trộn giữa các loại.
 */
export default defineConfig({
  ...baseConfig,
  testDir: '../../../src/tests',
  outputDir: '../../../test-results',
  reporter: [
    ['../../../src/reporters/case-result.reporter.ts'],
    ['list'],
    ['html', { outputFolder: '../../../playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: '../../../allure-results', detail: true }],
  ],
  projects: [
    {
      name: 'vat-tu-hang-hoa-create-flow',
      testMatch: /pmkt-u-00106_vat_tu[\\/]them-moi-vat-tu-hang-hoa\.spec\.ts$/,
      grep: /TC_PMKT-U-00106-(308|309|310|311|312)\b/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'vat-tu-nguyen-vat-lieu-create-flow',
      testMatch: /pmkt-u-00106_vat_tu[\\/]them-moi-vat-tu-nguyen-vat-lieu\.spec\.ts$/,
      grep: /TC_PMKT-U-00106-(818|819|820|821|822)\b/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'vat-tu-cong-cu-dung-cu-create-flow',
      testMatch: /pmkt-u-00106_vat_tu[\\/]them-moi-vat-tu-cong-cu-dung-cu\.spec\.ts$/,
      grep: /TC_PMKT-U-00106-(1140|1141|1142|1143|1144)\b/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'vat-tu-thanh-pham-create-flow',
      testMatch: /pmkt-u-00106_vat_tu[\\/]them-moi-vat-tu-thanh-pham\.spec\.ts$/,
      grep: /TC_PMKT-U-00106-(1462|1463|1464|1465|1466)\b/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'vat-tu-ban-thanh-pham-create-flow',
      testMatch: /pmkt-u-00106_vat_tu[\\/]them-moi-vat-tu-ban-thanh-pham\.spec\.ts$/,
      grep: /TC_PMKT-U-00106-(1784|1785|1786|1787|1788)\b/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
