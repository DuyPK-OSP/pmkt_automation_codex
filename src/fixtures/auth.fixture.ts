import { test as base } from './base.fixture';
import { requireCredentials } from '@utils/env.config';

interface AuthFixtures { readonly authenticatedPage: void; }

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ loginPage }, use) => {
    const credentials = requireCredentials();
    await loginPage.open();
    await loginPage.login(credentials.username, credentials.password);
    await use();
  },
});
