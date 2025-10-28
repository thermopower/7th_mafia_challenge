import { test, expect } from '@playwright/test';

test.describe('Basic Navigation Smoke Tests', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/');
    await expect(page).toHaveURL(/\//);
  });

  test('should load login page successfully', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const isLoginPage = page.url().includes('/login') || page.url().includes('/sign-in');
    expect(isLoginPage).toBe(true);
  });

  test('should load signup page successfully', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    const isSignupPage = page.url().includes('/signup') || page.url().includes('/sign-up');
    expect(isSignupPage).toBe(true);
  });

  test('should redirect to login when accessing protected dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isProtected = currentUrl.includes('/login') || currentUrl.includes('/sign-in');
    expect(isProtected).toBe(true);
  });
});
