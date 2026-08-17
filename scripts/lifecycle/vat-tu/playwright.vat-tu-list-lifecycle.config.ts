import { defineConfig } from '@playwright/test';

/** Config hẹp chỉ chạy hook setup hoặc teardown; không dùng reporter nghiệp vụ của testcase. */
export default defineConfig({
  testDir: '.',
  testMatch: /vat-tu-list-lifecycle\.(?:setup|teardown)\.spec\.ts/,
  // Không dùng outputDir mặc định test-results vì Playwright sẽ xóa state giữa setup và teardown.
  outputDir: '../../../test-results/vat-tu-list-lifecycle-artifacts',
  workers: 1,
  retries: 0,
  reporter: [['list']],
});
