import { invalidUsers } from '@test-data/users.data';
import { test, expect } from '@fixtures/base.fixture';

test.describe('Kiểm tra dữ liệu đăng nhập', () => {
  for (const user of invalidUsers) {
    test(`từ chối dữ liệu: ${user.caseName}`, async ({ page, loginPage }) => {
      await loginPage.open();
      await loginPage.login(user.username, user.password);
      await expect(page, 'Dữ liệu không hợp lệ phải giữ người dùng tại trang đăng nhập').toHaveURL(/\/login(?:[/?#]|$)/);
    });
  }
});
