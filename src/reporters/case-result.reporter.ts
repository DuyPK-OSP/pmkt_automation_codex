import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import type {
  FullConfig,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

/** Dữ liệu kết quả chuẩn hóa được ghi riêng cho từng testcase, project và retry. */
interface CaseResultRecord {
  readonly testCaseId: string;
  readonly title: string;
  readonly titlePath: readonly string[];
  readonly source: { readonly file: string; readonly line: number; readonly column: number };
  readonly project: string;
  readonly status: 'PASS' | 'FAIL' | 'SKIP';
  readonly runnerStatus: TestResult['status'];
  readonly expectedStatus: TestCase['expectedStatus'];
  readonly skipReason?: string;
  readonly durationMs: number;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly retry: number;
  readonly workerIndex: number;
  readonly errors: readonly {
    readonly message: string;
    readonly stack?: string;
    readonly expected?: string;
    readonly actual?: string;
  }[];
  readonly attachments: readonly {
    readonly name: string;
    readonly contentType: string;
    readonly path?: string;
  }[];
}

/** Chuyển thời gian thành chuỗi UTC ổn định dùng trong mã lần chạy. */
function timestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Chuẩn hóa chuỗi thành tên file an toàn; dùng test làm fallback khi chuỗi rỗng. */
function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'test';
}

/** Loại bỏ mã màu ANSI khỏi message và stack trước khi ghi JSON. */
function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
}

/** Ánh xạ trạng thái Playwright thành PASS, FAIL hoặc SKIP cho báo cáo. */
function normalizedStatus(result: TestResult): CaseResultRecord['status'] {
  if (result.status === 'passed') return 'PASS';
  if (result.status === 'skipped' || result.status === 'interrupted') return 'SKIP';
  return 'FAIL';
}

/** Trích Expected và Actual từ assertion message khi dữ liệu có sẵn. */
function extractExpectedActual(message: string): { expected?: string; actual?: string } {
  const cleanMessage = stripAnsi(message);
  const expected = cleanMessage.match(/Expected(?: pattern| value)?:\s*([^\r\n]+)/)?.[1]?.trim();
  const actual = cleanMessage.match(/(?:Received(?: string| array)?:|Actual:)\s*([^\r\n]+)/)?.[1]?.trim();
  return {
    ...(expected ? { expected } : {}),
    ...(actual ? { actual } : {}),
  };
}

/** Reporter ghi ngay JSON của từng testcase và cập nhật index tổng hợp sau mỗi onTestEnd. */
export default class CaseResultReporter implements Reporter {
  private readonly runId = process.env.TEST_RUN_ID?.trim() || timestamp();
  private readonly records = new Map<string, CaseResultRecord>();
  private caseResultsDir = resolve('test-results', `run-${this.runId}`, 'case-results');

  /** Khởi tạo thư mục case-results và index.json khi bắt đầu test run. */
  async onBegin(config: FullConfig): Promise<void> {
    const outputDir = config.projects[0]?.outputDir ?? resolve('test-results');
    this.caseResultsDir = resolve(outputDir, `run-${this.runId}`, 'case-results');
    await mkdir(this.caseResultsDir, { recursive: true });
    await this.writeIndex();
  }

  /** Chuẩn hóa kết quả, lưu attachment body, ghi JSON testcase và cập nhật index ngay khi test kết thúc. */
  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const testCaseId = test.title.match(/(?:TC|CL)[A-Za-z0-9_-]+/)?.[0] ?? safeName(test.title);
    const project = test.parent.project()?.name ?? 'default';
    const recordKey = `${testCaseId}--${safeName(project)}--retry-${result.retry}`;
    const attachmentDir = resolve(this.caseResultsDir, 'attachments', recordKey);
    const attachments = [];

    for (let index = 0; index < result.attachments.length; index += 1) {
      const attachment = result.attachments[index];
      if (!attachment) continue;
      let attachmentPath = attachment.path;

      if (attachment.body) {
        await mkdir(attachmentDir, { recursive: true });
        const extension = extname(attachment.path ?? '') || this.extensionFor(attachment.contentType);
        const fileName = `${String(index + 1).padStart(2, '0')}-${safeName(attachment.name)}${extension}`;
        attachmentPath = resolve(attachmentDir, fileName);
        await writeFile(attachmentPath, attachment.body);
      }

      attachments.push({
        name: attachment.name,
        contentType: attachment.contentType,
        ...(attachmentPath ? { path: relative(process.cwd(), attachmentPath).replaceAll('\\', '/') } : {}),
      });
    }

    const startedAt = result.startTime;
    const finishedAt = new Date(startedAt.getTime() + result.duration);
    const record: CaseResultRecord = {
      testCaseId,
      title: test.title,
      titlePath: test.titlePath(),
      source: {
        file: relative(process.cwd(), test.location.file).replaceAll('\\', '/'),
        line: test.location.line,
        column: test.location.column,
      },
      project,
      status: normalizedStatus(result),
      runnerStatus: result.status,
      expectedStatus: test.expectedStatus,
      ...(normalizedStatus(result) === 'SKIP'
        ? { skipReason: test.annotations.find((annotation) => annotation.type === 'skip')?.description ?? 'Playwright đánh dấu SKIP nhưng không cung cấp lý do.' }
        : {}),
      durationMs: result.duration,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      retry: result.retry,
      workerIndex: result.workerIndex,
      errors: result.errors.map((error) => ({
        message: stripAnsi(error.message ?? String(error.value ?? 'Unknown error')),
        ...(error.stack ? { stack: stripAnsi(error.stack) } : {}),
        ...extractExpectedActual(error.message ?? ''),
      })),
      attachments,
    };

    this.records.set(recordKey, record);
    await mkdir(dirname(resolve(this.caseResultsDir, `${recordKey}.json`)), { recursive: true });
    await writeFile(
      resolve(this.caseResultsDir, `${recordKey}.json`),
      JSON.stringify(record, null, 2),
      'utf8',
    );
    await this.writeIndex();
  }

  /** Ghi index.json với tổng PASS/FAIL/SKIP và đường dẫn tới từng file kết quả. */
  private async writeIndex(): Promise<void> {
    const records = [...this.records.values()];
    await writeFile(resolve(this.caseResultsDir, 'index.json'), JSON.stringify({
      runId: this.runId,
      updatedAt: new Date().toISOString(),
      totalCompleted: records.length,
      pass: records.filter((record) => record.status === 'PASS').length,
      fail: records.filter((record) => record.status === 'FAIL').length,
      skip: records.filter((record) => record.status === 'SKIP').length,
      caseResults: records.map((record) => ({
        testCaseId: record.testCaseId,
        project: record.project,
        retry: record.retry,
        status: record.status,
        file: `${record.testCaseId}--${safeName(record.project)}--retry-${record.retry}.json`,
      })),
    }, null, 2), 'utf8');
  }

  /** Ánh xạ content type của attachment sang phần mở rộng file phù hợp. */
  private extensionFor(contentType: string): string {
    if (contentType === 'image/png') return '.png';
    if (contentType === 'application/json') return '.json';
    if (contentType === 'text/plain') return '.txt';
    if (contentType === 'text/markdown') return '.md';
    return '.bin';
  }
}
