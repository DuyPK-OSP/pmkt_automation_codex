import { test, expect } from '@fixtures/base.fixture';
import { requireCredentials } from '@utils/env.config';

test.describe('Đăng nhập', () => {
  test.beforeEach(async ({ loginPage }) => { await loginPage.open(); });

  test('đăng nhập thành công với tài khoản hợp lệ', async ({ page, loginPage }) => {
    const credentials = requireCredentials();
    await loginPage.login(credentials.username, credentials.password);
    await expect(page, 'Sau đăng nhập phải rời khỏi trang /login').not.toHaveURL(/\/login(?:[/?#]|$)/);
  });
});
