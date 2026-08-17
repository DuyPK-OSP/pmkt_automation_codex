import type { ConsoleMessage, Page, Request, Response, TestInfo } from '@playwright/test';

/** Một sự kiện console được giữ trong gói evidence của testcase. */
interface ConsoleEvidence {
  readonly type: string;
  readonly text: string;
  readonly location: { readonly url: string; readonly lineNumber: number; readonly columnNumber: number };
}

/** Metadata network đã loại bỏ header nhạy cảm và không lưu response body mặc định. */
interface NetworkEvidence {
  readonly method: string;
  readonly url: string;
  readonly resourceType: string;
  readonly status?: number;
  readonly statusText?: string;
  readonly failure?: string;
}

/** Thu thập trạng thái UI, console và network để Codex phân tích ngay sau một testcase FAIL. */
export class FailureEvidenceCollector {
  private readonly consoleEvents: ConsoleEvidence[] = [];
  private readonly networkEvents = new Map<Request, NetworkEvidence>();

  constructor(private readonly page: Page) {}

  /** Bắt đầu nghe các sự kiện; chỉ giữ một cửa sổ giới hạn để tránh artifact quá lớn. */
  start(): void {
    this.page.on('console', this.onConsole);
    this.page.on('request', this.onRequest);
    this.page.on('response', this.onResponse);
    this.page.on('requestfailed', this.onRequestFailed);
  }

  /** Dừng listener và attach gói JSON/DOM khi testcase có kết quả khác expected. */
  async stopAndAttach(testInfo: TestInfo): Promise<void> {
    this.page.off('console', this.onConsole);
    this.page.off('request', this.onRequest);
    this.page.off('response', this.onResponse);
    this.page.off('requestfailed', this.onRequestFailed);
    if (testInfo.status === testInfo.expectedStatus) return;

    const uiState = await this.captureUiState();
    await testInfo.attach('failure-runtime-evidence', {
      body: Buffer.from(JSON.stringify({
        capturedAt: new Date().toISOString(),
        url: this.page.url(),
        console: this.consoleEvents.slice(-200),
        network: [...this.networkEvents.values()].slice(-300),
        ...uiState,
      }, null, 2)),
      contentType: 'application/json',
    });
  }

  /** Ghi console message cùng vị trí nguồn để phân biệt lỗi ứng dụng và log thông thường. */
  private readonly onConsole = (message: ConsoleMessage): void => {
    this.consoleEvents.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  };

  /** Ghi metadata request, không ghi credential, cookie hoặc payload nhạy cảm. */
  private readonly onRequest = (request: Request): void => {
    this.networkEvents.set(request, {
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
    });
  };

  /** Bổ sung HTTP status vào request tương ứng để nhận diện response lỗi. */
  private readonly onResponse = (response: Response): void => {
    const request = response.request();
    const current = this.networkEvents.get(request);
    if (!current) return;
    this.networkEvents.set(request, {
      ...current,
      status: response.status(),
      statusText: response.statusText(),
    });
  };

  /** Ghi nguyên nhân request thất bại ở tầng browser/network. */
  private readonly onRequestFailed = (request: Request): void => {
    const current = this.networkEvents.get(request) ?? {
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
    };
    this.networkEvents.set(request, { ...current, failure: request.failure()?.errorText ?? 'Unknown network failure' });
  };

  /** Chụp DOM và các trạng thái UI thường gây failure; lỗi chụp không được che lỗi testcase gốc. */
  private async captureUiState(): Promise<{ dom?: string; visibleUiStates?: readonly string[]; captureError?: string }> {
    try {
      const state = await this.page.evaluate(() => {
        const selectors = [
          '[role="alert"]',
          '[role="dialog"]',
          '[aria-busy="true"]',
          '[class*="toast" i]',
          '[class*="popup" i]',
          '[class*="loading" i]',
          '[class*="spinner" i]',
        ];
        const visibleUiStates = Array.from(document.querySelectorAll(selectors.join(',')))
          .filter((element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })
          .map((element) => (element.textContent ?? '').trim().replace(/\s+/g, ' '))
          .filter(Boolean)
          .slice(0, 50);
        return { dom: document.documentElement.outerHTML, visibleUiStates };
      });
      return state;
    } catch (error) {
      return { captureError: error instanceof Error ? error.message : String(error) };
    }
  }
}
