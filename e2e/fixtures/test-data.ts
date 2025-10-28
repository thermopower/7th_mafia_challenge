export const testData = {
  auth: {
    validUser: {
      email: process.env.E2E_TEST_USER_EMAIL || '',
      password: process.env.E2E_TEST_USER_PASSWORD || '',
    },
    invalidUser: {
      email: 'invalid@test.com',
      password: 'wrongpassword123',
    },
  },
  payment: {
    testCard: {
      number: '4242424242424242',
      expiry: '12/30',
      cvc: '123',
    },
  },
  analysis: {
    samplePdfPath: './e2e/fixtures/sample.pdf',
  },
};
