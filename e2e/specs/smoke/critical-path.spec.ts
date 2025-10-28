import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { AnalysisPage } from '../../pages/AnalysisPage';
import { testData } from '../../fixtures/test-data';

test.describe('Critical User Journey', () => {
  test('should complete end-to-end workflow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      testData.auth.validUser.email,
      testData.auth.validUser.password
    );

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectDashboardVisible();

    await dashboardPage.clickNewAnalysis();

    await page.waitForTimeout(1000);

    const analysisPage = new AnalysisPage(page);
    const isAnalysisPage = await analysisPage.isNewAnalysisPage();
    expect(isAnalysisPage).toBe(true);

    await page.goto('/dashboard');
    await dashboardPage.expectDashboardVisible();

    await dashboardPage.openUserMenu();
    await page.waitForTimeout(500);

    await dashboardPage.logout();

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isLoggedOut = currentUrl.includes('/') && !currentUrl.includes('/dashboard');
    expect(isLoggedOut).toBe(true);
  });
});
