import type { Page, TestInfo } from '@playwright/test';
import { expect as playwrightExpect } from '@playwright/test';
import { ScreenshotUtil } from '@utils/screenshot.util';

interface EvidenceContext {
  readonly page: Page;
  readonly testInfo: TestInfo;
  sequence: number;
}

let activeEvidenceContext: EvidenceContext | undefined;

export async function runWithEvidenceContext(
  page: Page,
  testInfo: TestInfo,
  use: () => Promise<void>,
): Promise<void> {
  activeEvidenceContext = { page, testInfo, sequence: 0 };
  try {
    await use();
  } finally {
    activeEvidenceContext = undefined;
  }
}

function evidenceName(context: EvidenceContext): string {
  context.sequence += 1;
  const testCaseId = context.testInfo.title.match(/CL-UAT-U-\d+-\d+/)?.[0] ?? 'test';
  return `mismatch-${testCaseId}-${String(context.sequence).padStart(2, '0')}`;
}

async function attachMismatch(context: EvidenceContext, errorStartIndex: number): Promise<void> {
  const newErrors = context.testInfo.errors.slice(errorStartIndex);
  if (newErrors.length === 0) return;

  const name = evidenceName(context);
  try {
    await ScreenshotUtil.attach(context.page, context.testInfo, name);
    await context.testInfo.attach(`${name}-details`, {
      body: Buffer.from(JSON.stringify({
        testCaseId: context.testInfo.title.match(/CL-UAT-U-\d+-\d+/)?.[0] ?? null,
        status: 'FAIL',
        errors: newErrors.map((error) => error.message),
        evidence: `${name}.png`,
      }, null, 2)),
      contentType: 'application/json',
    });
  } catch (error) {
    await context.testInfo.attach(`${name}-capture-error`, {
      body: Buffer.from(error instanceof Error ? error.message : String(error)),
      contentType: 'text/plain',
    });
  }
}

function wrapSoftMatcher<T extends object>(
  matcher: T,
  context: EvidenceContext,
  errorStartIndex: number,
): T {
  return new Proxy(matcher, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      if (typeof value === 'function') {
        return async (...args: unknown[]) => {
          const result = Reflect.apply(value, target, args) as unknown;
          const resolved = await Promise.resolve(result);
          await attachMismatch(context, errorStartIndex);
          return resolved;
        };
      }
      if (value && typeof value === 'object') {
        return wrapSoftMatcher(value, context, errorStartIndex);
      }
      return value;
    },
  });
}

export const expect = new Proxy(playwrightExpect, {
  get(target, property, receiver) {
    if (property !== 'soft') return Reflect.get(target, property, receiver);

    return (...args: unknown[]) => {
      const context = activeEvidenceContext;
      if (!context) {
        throw new Error('expect.soft() phải chạy qua fixture @fixtures/base.fixture để tự động lưu milestone evidence.');
      }
      const errorStartIndex = context.testInfo.errors.length;
      const matcher = Reflect.apply(playwrightExpect.soft, playwrightExpect, args) as object;
      return wrapSoftMatcher(matcher, context, errorStartIndex);
    };
  },
}) as typeof playwrightExpect;
