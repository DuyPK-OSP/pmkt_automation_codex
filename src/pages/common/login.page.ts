import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { Logger } from '@utils/logger';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: /đăng nhập|login/i });
  }

  async open(): Promise<void> { await this.navigate('/login'); }

  async login(username: string, password: string): Promise<void> {
    await this.type(this.usernameInput, username, 'Tên đăng nhập');
    await this.type(this.passwordInput, password, 'Mật khẩu');
    await this.click(this.loginButton, 'Đăng nhập');
    await this.page.waitForURL((url) => !url.pathname.includes('/login'));
  }
}
