import { test as base } from './base.fixture';
import { requireCredentials } from '@utils/env.config';

/** Fixture đăng nhập sẵn trước khi trao quyền điều khiển cho testcase. */
interface AuthFixtures { readonly authenticatedPage: void; }

/** Mở rộng Playwright test bằng các fixture của framework và lifecycle setup/teardown tương ứng. */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ loginPage }, use) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
    await use();
  },
});
