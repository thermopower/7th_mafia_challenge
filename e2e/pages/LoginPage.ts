import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  private selectors = {
    emailInput: 'input[name="identifier"]',
    passwordInput: 'input[name="password"]',
    continueButton: 'button:has-text("Continue")',
    submitButton: 'button[type="submit"]',
    errorMessage: '[role="alert"]',
    signInHeading: 'h1:has-text("Sign in")',
  };

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.page.fill(this.selectors.emailInput, email);

    const continueBtn = this.page.locator(this.selectors.continueButton).first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click();
      await this.page.waitForTimeout(1000);
    }

    await this.page.fill(this.selectors.passwordInput, password);

    const submitBtn = this.page.locator(this.selectors.submitButton).first();
    await submitBtn.click();

    await this.page.waitForLoadState('networkidle');
  }

  async expectError(message: string) {
    const errorEl = this.page.locator(this.selectors.errorMessage);
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText(message);
  }

  async isLoginPage() {
    const url = this.page.url();
    return url.includes('/login') || url.includes('/sign-in');
  }
}
