import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  private selectors = {
    dashboardHeading: 'h1, h2',
    userMenu: '[data-testid="user-menu"]',
    userMenuButton: 'button:has-text("Account")',
    profileLink: 'a:has-text("프로필"), a:has-text("Profile")',
    logoutButton: 'button:has-text("로그아웃"), button:has-text("Sign out")',
    newAnalysisButton: 'a:has-text("새 분석"), a:has-text("New Analysis"), a:has-text("분석 시작")',
  };

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async isDashboardPage() {
    const url = this.page.url();
    return url.includes('/dashboard');
  }

  async expectDashboardVisible() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async clickNewAnalysis() {
    const button = this.page.locator(this.selectors.newAnalysisButton).first();
    await button.click();
    await this.page.waitForLoadState('networkidle');
  }

  async openUserMenu() {
    const menuBtn = this.page.locator(this.selectors.userMenuButton).first();
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async clickProfile() {
    await this.openUserMenu();
    const profileLink = this.page.locator(this.selectors.profileLink).first();
    await profileLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    await this.openUserMenu();
    const logoutBtn = this.page.locator(this.selectors.logoutButton).first();
    await logoutBtn.click();
    await this.page.waitForLoadState('networkidle');
  }
}
