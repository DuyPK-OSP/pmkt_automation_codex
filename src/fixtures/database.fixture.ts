import { test as base, expect } from '@playwright/test';
import { DatabaseContext } from '@database/database.context';

/** Fixture cung cấp DatabaseContext và tự đóng pool kết nối sau khi testcase kết thúc. */
interface DatabaseFixtures {
  readonly db: DatabaseContext;
}

/** Mở rộng Playwright test bằng các fixture của framework và lifecycle setup/teardown tương ứng. */
export const test = base.extend<DatabaseFixtures>({
  db: async ({ }, use) => {
    const database = new DatabaseContext();
    await use(database);
    // Teardown đóng pool sau khi testcase sử dụng DB xong.
    await database.close();
  },
});

export { expect };
