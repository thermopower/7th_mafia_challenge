import { test as authenticatedTest, expect } from '../../fixtures/auth.fixture';
import { DashboardPage } from '../../pages/DashboardPage';

authenticatedTest.describe('Authentication - Logout Flow', () => {
  authenticatedTest('should successfully logout from dashboard', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);

    await dashboardPage.expectDashboardVisible();

    await dashboardPage.logout();

    await authenticatedPage.waitForTimeout(2000);

    const currentUrl = authenticatedPage.url();
    const isLoggedOut = currentUrl.includes('/') && !currentUrl.includes('/dashboard');

    expect(isLoggedOut).toBe(true);
  });
});
