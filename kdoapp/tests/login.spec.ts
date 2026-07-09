import { test, expect } from '@playwright/test';

test.describe('Login & Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend login requests
    await page.route('**/api/login/', async route => {
      const postData = route.request().postData();
      if (postData?.includes('username=admin') && postData?.includes('password=password123')) {
        await route.fulfill({
          status: 200,
          json: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            isAdmin: true,
            username: 'admin',
            firstConnection: false
          }
        });
      } else if (postData?.includes('username=user')) {
        await route.fulfill({
          status: 200,
          json: {
            access_token: 'mock-access-token-user',
            refresh_token: 'mock-refresh-token',
            isAdmin: false,
            username: 'user',
            firstConnection: true
          }
        });
      } else {
        await route.fulfill({ status: 401, json: { detail: 'Nom d\'utilisateur ou mot de passe invalide.' } });
      }
    });

    // Mock the lists endpoint to avoid crashing after redirect
    await page.route('**/api/lists/', async route => {
      await route.fulfill({
        status: 200,
        json: [{ id: 1, name: 'Liste de Test', slug: 'liste-test', isCommon: false, isUserList: false }]
      });
    });
    
    // Mock user details
    await page.route('**/api/users/', async route => {
      await route.fulfill({ status: 200, json: [] });
    });
  });

  test('should show error on wrong credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="username"]', 'wrong');
    await page.fill('input[name="password"]', 'credentials');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('text=Nom d\'utilisateur ou mot de passe invalide.');
    await expect(errorMessage).toBeVisible();
  });

  test('should login successfully as admin and redirect to /admin', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin');
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('should login as user on first connection and redirect to /first-connection', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="username"]', 'user');
    await page.fill('input[name="password"]', 'anypass');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/first-connection');
    await expect(page).toHaveURL(/.*\/first-connection/);
  });
});
