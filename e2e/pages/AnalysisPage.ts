import { Page, expect } from '@playwright/test';

export class AnalysisPage {
  constructor(private page: Page) {}

  private selectors = {
    fileInput: 'input[type="file"]',
    uploadButton: 'button:has-text("업로드"), button:has-text("Upload")',
    analyzeButton: 'button:has-text("분석"), button:has-text("Analyze")',
    resultSection: '[data-testid="analysis-result"]',
    statusIndicator: '[data-testid="analysis-status"]',
    errorMessage: '[role="alert"]',
  };

  async gotoNew() {
    await this.page.goto('/analyze/new');
    await this.page.waitForLoadState('networkidle');
  }

  async isNewAnalysisPage() {
    const url = this.page.url();
    return url.includes('/analyze/new');
  }

  async uploadFile(filePath: string) {
    const fileInput = this.page.locator(this.selectors.fileInput);
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(500);
  }

  async clickAnalyze() {
    const analyzeBtn = this.page.locator(this.selectors.analyzeButton).first();
    await analyzeBtn.click();
  }

  async waitForAnalysisComplete(timeout = 30000) {
    await this.page.waitForTimeout(timeout);
  }

  async expectAnalysisResult() {
    const resultSection = this.page.locator(this.selectors.resultSection);
    await expect(resultSection).toBeVisible({ timeout: 30000 });
  }

  async expectError(message: string) {
    const errorEl = this.page.locator(this.selectors.errorMessage);
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText(message);
  }
}
