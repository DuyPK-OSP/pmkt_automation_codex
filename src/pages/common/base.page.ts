import { expect, type Locator, type Page } from '@playwright/test';
import type { Logger } from '@utils/logger';

export abstract class BasePage {
  /** Khởi tạo lớp Page nền với Playwright Page và logger dùng chung. */
  protected constructor(protected readonly page: Page, protected readonly logger: Logger) {}

  /** Điều hướng đến đường dẫn trong ứng dụng và chờ DOM tải xong. */
  async navigate(path: string): Promise<void> {
    this.logger.info('Điều hướng', { path });
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** Click phần tử sau khi xác nhận phần tử hiển thị và đang được bật. */
  protected async click(locator: Locator, action: string): Promise<void> {
    this.logger.info(action);
    await expect(locator, `${action}: element phải hiển thị`).toBeVisible();
    await expect(locator, `${action}: element phải bật`).toBeEnabled();
    await locator.click();
  }

  /** Điền giá trị vào trường sau khi xác nhận trường cho phép chỉnh sửa. */
  protected async type(locator: Locator, value: string, fieldName: string): Promise<void> {
    this.logger.info('Nhập dữ liệu', { fieldName });
    await expect(locator, `${fieldName} phải có thể nhập`).toBeEditable();
    await locator.fill(value);
  }

  /** Trả về nội dung text đã loại bỏ khoảng trắng thừa của phần tử đang hiển thị. */
  protected async getText(locator: Locator): Promise<string> {
    await expect(locator).toBeVisible();
    return (await locator.textContent())?.trim() ?? '';
  }

  /** Trả về trạng thái hiển thị hiện tại của phần tử. */
  protected async isVisible(locator: Locator): Promise<boolean> { return locator.isVisible(); }
}
