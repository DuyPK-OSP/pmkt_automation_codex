import { createHash } from 'node:crypto';

export class TestDataGenerator {
  constructor(private readonly seed = process.env.TEST_DATA_SEED ?? 'local-seed') {}

  uniqueEmail(testName: string): string {
    const safeName = testName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();
    const suffix = createHash('sha256').update(`${this.seed}:${testName}:${runId}`).digest('hex').slice(0, 8);
    return `auto_${safeName}_${runId}_${suffix}@example.test`;
  }

  uniqueKeyword(testName: string): string {
    const safeName = testName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();
    const suffix = createHash('sha256').update(`${this.seed}:${testName}:${runId}`).digest('hex').slice(0, 8);
    return `auto_${safeName}_${runId}_${suffix}`;
  }

  uniqueCode(testName: string): string {
    const safeName = testName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20);
    const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();
    const suffix = createHash('sha256').update(`${this.seed}:${testName}:${runId}`).digest('hex').slice(0, 6).toUpperCase();
    return `AUTO_${safeName}_${runId}_${suffix}`;
  }
}
