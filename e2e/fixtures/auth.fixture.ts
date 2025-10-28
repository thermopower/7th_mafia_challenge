import { test as base } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { LoginPage } from '../pages/LoginPage';

const authFile = path.join(__dirname, '../.auth/user.json');

export const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ page }, use) => {
    let isAuthenticated = false;

    try {
      if (fs.existsSync(authFile)) {
        const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
        await page.context().addCookies(storageState.cookies);
        isAuthenticated = true;
      }
    } catch (error) {
      console.log('No valid auth state found, performing login...');
    }

    if (!isAuthenticated) {
      const email = process.env.E2E_TEST_USER_EMAIL;
      const password = process.env.E2E_TEST_USER_PASSWORD;

      if (!email || !password) {
        throw new Error(
          'E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD must be set in .env.e2e'
        );
      }

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);

      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
        console.log('Dashboard URL not reached, but continuing...');
      });

      const storageState = await page.context().storageState({ path: authFile });

      fs.mkdirSync(path.dirname(authFile), { recursive: true });
      fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await use(page);
  },
});

export { expect } from '@playwright/test';
