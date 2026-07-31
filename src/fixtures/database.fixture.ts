import { test as base, expect } from '@playwright/test';
import { DatabaseContext } from '@database/database.context';

interface DatabaseFixtures {
  readonly db: DatabaseContext;
}

export const test = base.extend<DatabaseFixtures>({
  db: async ({ }, use) => {
    const database = new DatabaseContext();
    await use(database);
    await database.close();
  },
});

export { expect };
