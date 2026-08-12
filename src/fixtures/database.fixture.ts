import { test as base, expect } from '@playwright/test';
import { DatabaseContext } from '@database/database.context';

/** Database context được dùng chung trong một worker cho các spec chỉ kiểm tra DB. */
interface DatabaseWorkerFixtures {
  readonly db: DatabaseContext;
}

/** Mở rộng Playwright test bằng các fixture của framework và lifecycle setup/teardown tương ứng. */
export const test = base.extend<object, DatabaseWorkerFixtures>({
  db: [async ({ }, use) => {
    const database = new DatabaseContext();
    await use(database);
    // Teardown đóng pool một lần khi worker không còn testcase cần truy vấn DB.
    await database.close();
  }, { scope: 'worker' }],
});

export { expect };
