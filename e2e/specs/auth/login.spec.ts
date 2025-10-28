import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { testData } from '../../fixtures/test-data';

test.describe('Authentication - Login Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await loginPage.goto();

    await loginPage.login(
      testData.auth.validUser.email,
      testData.auth.validUser.password
    );

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await dashboardPage.expectDashboardVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.goto();

    await loginPage.login(
      testData.auth.invalidUser.email,
      testData.auth.invalidUser.password
    );

    await page.waitForTimeout(2000);

    const isStillLoginPage = await loginPage.isLoginPage();
    expect(isStillLoginPage).toBe(true);
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isLoginRelated = currentUrl.includes('/login') || currentUrl.includes('/sign-in');

    expect(isLoginRelated).toBe(true);
  });
});
