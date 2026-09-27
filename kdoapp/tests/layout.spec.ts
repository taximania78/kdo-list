import { test, expect, type Page } from '@playwright/test';

// Jeton non signé : le frontend ne fait que le décoder (jwt-decode).
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
  sub: 2,
  username: 'marie',
  isAdmin: false,
  isMegaAdmin: false,
  exp: 4102444800,
})}.signature`;

const LONG = 'Anticonstitutionnellement extraordinaire coffret de thés de Noël édition collector';

async function mockApi(page: Page) {
  await page.route('**/api/lists/', (route) =>
    route.fulfill({
      status: 200,
      json: [
        { slug: 'lea', label: 'Léa-Marguerite-Joséphine', owner_name: null, is_common: false, enabled: true },
        { slug: 'commune', label: 'Liste commune', owner_name: null, is_common: true, enabled: true },
      ],
    })
  );
  await page.route(/\/api\/kdos\/\?/, (route) =>
    route.fulfill({
      status: 200,
      json: [
        { id: 1, name: LONG, price: 1234.5, user: 'Léa', url: 'https://example.com/produit', comment: LONG, imageDisplay: 'unknown.jpg', availability: true, takenBy: null },
        { id: 2, name: 'Pull', price: null, user: 'Léa', url: null, comment: null, imageDisplay: 'unknown.jpg', availability: false, takenBy: 'marie' },
        { id: 3, name: 'Livre', price: 12, user: 'Léa', url: null, comment: null, imageDisplay: 'unknown.jpg', availability: false, takenBy: 'Paul' },
      ],
    })
  );
}

test.describe('Mise en page mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((value) => {
      localStorage.setItem('authToken', value);
      localStorage.setItem('refreshToken', 'refresh');
    }, token);
    await mockApi(page);
  });

  for (const path of ['/list', '/list/lea']) {
    test(`${path} ne défile pas horizontalement`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (path === '/list/lea') await expect(page.getByText('Emballé par Paul')).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await expect(page.getByRole('navigation', { name: 'Navigation mobile' })).toBeVisible();
    });
  }
});
