import { test as authenticatedTest, expect } from '../../fixtures/auth.fixture';
import { DashboardPage } from '../../pages/DashboardPage';
import { AnalysisPage } from '../../pages/AnalysisPage';

authenticatedTest.describe('PDF Analysis Flow', () => {
  let dashboardPage: DashboardPage;
  let analysisPage: AnalysisPage;

  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    analysisPage = new AnalysisPage(authenticatedPage);
  });

  authenticatedTest('should navigate to analysis page from dashboard', async ({ authenticatedPage }) => {
    await dashboardPage.expectDashboardVisible();

    await dashboardPage.clickNewAnalysis();

    await authenticatedPage.waitForTimeout(1000);

    const isAnalysisPage = await analysisPage.isNewAnalysisPage();
    expect(isAnalysisPage).toBe(true);
  });

  authenticatedTest('should be able to access analysis page directly', async ({ authenticatedPage }) => {
    await analysisPage.gotoNew();

    const isAnalysisPage = await analysisPage.isNewAnalysisPage();
    expect(isAnalysisPage).toBe(true);
  });

  authenticatedTest.skip('should successfully upload and analyze PDF', async ({ authenticatedPage }) => {
    await analysisPage.gotoNew();

    const testPdfPath = './e2e/fixtures/sample.pdf';

    await analysisPage.uploadFile(testPdfPath);

    await analysisPage.clickAnalyze();

    await analysisPage.expectAnalysisResult();

    await expect(authenticatedPage).toHaveURL(/\/analyze\/[a-z0-9-]+/);
  });
});
