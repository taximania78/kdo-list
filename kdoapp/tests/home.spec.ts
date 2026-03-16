import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // On suppose que la page d'accueil de kdo-list-dev s'affiche correctement
  // et possède un titre pertinent, ou au moins ne renvoie pas une erreur 500
  await expect(page).toHaveTitle(/kdo/i);
});

test('can navigate or find text', async ({ page }) => {
  await page.goto('/');

  // Test basique pour s'assurer que le rendu SSR et client fonctionne.
  // Ce test peut être affiné avec de vrais IDs ou textes de l'appli.
  const body = page.locator('body');
  await expect(body).toBeVisible();
});
