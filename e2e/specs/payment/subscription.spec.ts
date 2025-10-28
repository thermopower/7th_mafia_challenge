import { test as authenticatedTest, expect } from '../../fixtures/auth.fixture';
import { PaymentPage } from '../../pages/PaymentPage';
import { testData } from '../../fixtures/test-data';

authenticatedTest.describe('Payment - Subscription Flow', () => {
  let paymentPage: PaymentPage;

  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    paymentPage = new PaymentPage(authenticatedPage);
  });

  authenticatedTest('should access subscription page', async ({ authenticatedPage }) => {
    await paymentPage.gotoSubscription();

    const isCheckoutPage = await paymentPage.isCheckoutPage();
    expect(isCheckoutPage).toBe(true);
  });

  authenticatedTest('should access checkout page', async ({ authenticatedPage }) => {
    await paymentPage.gotoCheckout();

    const isCheckoutPage = await paymentPage.isCheckoutPage();
    expect(isCheckoutPage).toBe(true);
  });

  authenticatedTest.skip('should complete payment with test card', async ({ authenticatedPage }) => {
    await paymentPage.gotoCheckout();

    await paymentPage.fillCardDetails(
      testData.payment.testCard.number,
      testData.payment.testCard.expiry,
      testData.payment.testCard.cvc
    );

    await paymentPage.clickPay();

    await paymentPage.expectPaymentSuccess();
  });

  authenticatedTest.skip('should handle payment error gracefully', async ({ authenticatedPage }) => {
    await paymentPage.gotoCheckout();

    await paymentPage.fillCardDetails('4000000000000002', '12/30', '123');

    await paymentPage.clickPay();

    await paymentPage.expectPaymentError();
  });
});
