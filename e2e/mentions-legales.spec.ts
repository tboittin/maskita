import { test, expect } from '@playwright/test';

test.describe('US-ML-01 — Mentions légales et coordonnées EI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Passer en français si la page est en anglais
    const bascule = page.getByTitle('Passer en français');
    if (await bascule.isVisible()) {
      await bascule.click();
    }
  });

  test('affiche le bouton "Afficher les coordonnées" dans la modale', async ({
    page,
  }) => {
    // Ouvrir la modale des mentions légales
    await page.getByText('Mentions légales').click();

    // Vérifier que le bouton est visible dans la modale
    await expect(
      page.getByText('Afficher les coordonnées'),
    ).toBeVisible();
  });

  test('au clic sur "Afficher les coordonnées", les valeurs décodées apparaissent', async ({
    page,
  }) => {
    // Ouvrir la modale
    await page.getByText('Mentions légales').click();

    // Cliquer pour afficher les coordonnées
    await page.getByText('Afficher les coordonnées').click();

    // Vérifier que les valeurs décodées sont visibles
    await expect(page.getByText('0623397978')).toBeVisible();
    await expect(page.getByText('tboittin.pro@gmail.com')).toBeVisible();
    await expect(
      page.getByText('200, impasse des cerisiers, 83560 Ginasservis, France'),
    ).toBeVisible();
  });

  test('le bouton disparaît après affichage des coordonnées', async ({
    page,
  }) => {
    // Ouvrir la modale
    await page.getByText('Mentions légales').click();

    // Le bouton est présent avant le clic
    await expect(
      page.getByText('Afficher les coordonnées'),
    ).toBeVisible();

    // Cliquer pour afficher les coordonnées
    await page.getByText('Afficher les coordonnées').click();

    // Le bouton a disparu
    await expect(
      page.getByText('Afficher les coordonnées'),
    ).not.toBeVisible();
  });
});
