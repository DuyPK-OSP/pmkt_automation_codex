import { createHash } from 'node:crypto';

/** Sinh test data unique, traceable và có thể deterministic khi cấu hình seed. */
export class TestDataGenerator {
  /** function Object() { [native code] } */
  constructor(private readonly seed = process.env.TEST_DATA_SEED ?? 'local-seed') {}

  /** Sinh email automation unique theo tên testcase, run id và seed. */
  uniqueEmail(testName: string): string {
    const safeName = testName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();
    const suffix = createHash('sha256').update(`${this.seed}:${testName}:${runId}`).digest('hex').slice(0, 8);
    return `auto_${safeName}_${runId}_${suffix}@example.test`;
  }

  /** Sinh từ khóa automation unique dùng cho tìm kiếm hoặc dữ liệu text. */
  uniqueKeyword(testName: string): string {
    const safeName = testName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();
    const suffix = createHash('sha256').update(`${this.seed}:${testName}:${runId}`).digest('hex').slice(0, 8);
    return `auto_${safeName}_${runId}_${suffix}`;
  }

  /** Sinh mã AUTO_ unique, traceable dùng cho bản ghi cần cleanup. */
  uniqueCode(testName: string): string {
    const safeName = testName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20);
    const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();
    const suffix = createHash('sha256').update(`${this.seed}:${testName}:${runId}`).digest('hex').slice(0, 6).toUpperCase();
    return `AUTO_${safeName}_${runId}_${suffix}`;
  }
}
