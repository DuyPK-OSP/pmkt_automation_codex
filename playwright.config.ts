import { defineConfig, devices } from '@playwright/test';
import { env } from './src/utils/env.config';

export default defineConfig({
  testDir: './src/tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : 1,
  timeout: env.testTimeoutMs,
  expect: { timeout: env.expectTimeoutMs },
  // reporter: [
  //   ['./src/reporters/case-result.reporter.ts'],
  //   ['list'],
  //   ['html', { outputFolder: 'playwright-report', open: 'never' }],
  //   ['allure-playwright', { resultsDir: 'allure-results', detail: true }],
  // ],
  reporter: [
    ['./src/reporters/case-result.reporter.ts'],
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never',
    }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      detail: true,
    }],
  ],
  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
    viewport: { width: 1920, height: 1080 },
    actionTimeout: env.actionTimeoutMs,
    navigationTimeout: env.navigationTimeoutMs,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
  }],
});
