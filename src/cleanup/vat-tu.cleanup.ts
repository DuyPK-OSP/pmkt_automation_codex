import type { Page, Response, TestInfo } from '@playwright/test';
import type { VatTuPage } from '@pages/vat-tu.page';

interface CleanupResult {
  readonly code: string;
  readonly status: 'deleted' | 'skipped' | 'failed';
  readonly detail: string;
}

const AUTOMATION_CODE_PREFIX = 'AUTO_';
const MATERIAL_PATH = '/api/master-data/vat-tu';

export class MaterialCleanupTracker {
  private readonly createdMaterialCodes = new Set<string>();
  private readonly pendingCaptures = new Set<Promise<void>>();
  private readonly responseListener: (response: Response) => void;

  constructor(
    private readonly page: Page,
    private readonly vatTuPage: VatTuPage,
  ) {
    this.responseListener = (response) => {
      const capture = this.captureCreatedMaterial(response).finally(() => {
        this.pendingCaptures.delete(capture);
      });
      this.pendingCaptures.add(capture);
    };
    this.page.on('response', this.responseListener);
  }

  async cleanup(testInfo: TestInfo): Promise<void> {
    this.page.off('response', this.responseListener);
    await Promise.allSettled(this.pendingCaptures);

    const results: CleanupResult[] = [];
    for (const code of [...this.createdMaterialCodes].reverse()) {
      try {
        const deleted = await this.vatTuPage.deleteMaterialIfPresent(code);
        results.push({
          code,
          status: deleted ? 'deleted' : 'skipped',
          detail: deleted ? 'Đã xóa qua UI' : 'Không còn bản ghi trên danh sách',
        });
      } catch (error) {
        results.push({
          code,
          status: 'failed',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (results.length > 0) {
      await testInfo.attach('test-data-cleanup', {
        body: Buffer.from(JSON.stringify(results, null, 2)),
        contentType: 'application/json',
      });
    }
  }

  private async captureCreatedMaterial(response: Response): Promise<void> {
    const request = response.request();
    const url = new URL(response.url());
    if (
      request.method() !== 'POST'
      || url.pathname !== MATERIAL_PATH
      || !response.ok()
    ) return;

    try {
      const payload = request.postDataJSON() as unknown;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
      const code = (payload as Record<string, unknown>).ma;
      if (typeof code === 'string' && code.startsWith(AUTOMATION_CODE_PREFIX)) {
        this.createdMaterialCodes.add(code);
      }
    } catch {
      return;
    }
  }
}
