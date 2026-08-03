import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { Logger } from '@utils/logger';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  /** Khởi tạo Page Object và các locator của màn hình Đăng nhập. */
  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: /đăng nhập|login/i });
  }

  /** Mở màn hình Đăng nhập của ứng dụng. */
  async open(): Promise<void> { await this.navigate('/login'); }

  /** Đăng nhập bằng tài khoản được truyền vào; thử lại một lần nếu request đầu tiên bị treo. */
  async login(username: string, password: string): Promise<void> {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await this.type(this.usernameInput, username, 'Tên đăng nhập');
      await this.type(this.passwordInput, password, 'Mật khẩu');
      await this.click(this.loginButton, `Đăng nhập - lần ${attempt}`);

      try {
        await this.page.waitForURL(
          (url) => !url.pathname.includes('/login'),
          { timeout: 20_000, waitUntil: 'commit' },
        );
        return;
      } catch (error) {
        if (attempt === 2) throw error;
        this.logger.info('Request đăng nhập bị treo, reload và thử lại một lần');
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
    }
  }
}
