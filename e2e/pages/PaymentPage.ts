import { Page, expect } from '@playwright/test';

export class PaymentPage {
  constructor(private page: Page) {}

  private selectors = {
    checkoutButton: 'button:has-text("결제"), button:has-text("Checkout")',
    planCard: '[data-testid="plan-card"]',
    selectPlanButton: 'button:has-text("선택"), button:has-text("Select")',
    cardNumberInput: 'input[placeholder*="카드"], input[placeholder*="Card"]',
    expiryInput: 'input[placeholder*="유효"], input[placeholder*="Expiry"]',
    cvcInput: 'input[placeholder*="CVC"], input[placeholder*="보안"]',
    payButton: 'button:has-text("결제하기"), button:has-text("Pay")',
    successMessage: '[data-testid="payment-success"]',
    errorMessage: '[role="alert"]',
  };

  async gotoCheckout() {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoSubscription() {
    await this.page.goto('/subscription');
    await this.page.waitForLoadState('networkidle');
  }

  async isCheckoutPage() {
    const url = this.page.url();
    return url.includes('/checkout') || url.includes('/subscription');
  }

  async selectPlan(planName: string) {
    const planCard = this.page.locator(this.selectors.planCard, {
      hasText: planName,
    });
    const selectBtn = planCard.locator(this.selectors.selectPlanButton).first();
    await selectBtn.click();
    await this.page.waitForTimeout(500);
  }

  async fillCardDetails(cardNumber: string, expiry: string, cvc: string) {
    if (await this.page.locator(this.selectors.cardNumberInput).isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.page.fill(this.selectors.cardNumberInput, cardNumber);
      await this.page.fill(this.selectors.expiryInput, expiry);
      await this.page.fill(this.selectors.cvcInput, cvc);
    }
  }

  async clickPay() {
    const payBtn = this.page.locator(this.selectors.payButton).first();
    await payBtn.click();
  }

  async expectPaymentSuccess() {
    await expect(this.page).toHaveURL(/\/payments\/success/, { timeout: 30000 });
  }

  async expectPaymentError(message?: string) {
    const errorEl = this.page.locator(this.selectors.errorMessage);
    await expect(errorEl).toBeVisible();
    if (message) {
      await expect(errorEl).toContainText(message);
    }
  }
}
