import { test, expect } from '@playwright/test';

/**
 * Restauration d'un texte revenu d'une IA : tags à la casse altérée
 * restaurés, tags absents de la clé signalés.
 */
test.describe('Restauration — tags altérés par une IA', () => {
  async function lancerRestauration(page: import('@playwright/test').Page, texte: string) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Restore' }).click();

    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'rapport-ia.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(texte),
    });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'rapport.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'], '[PERSONNE_2]': ['Tom'] })),
    });

    const boutonLancer = page.getByRole('button', { name: /Run restoration/i });
    await expect(boutonLancer).toBeVisible({ timeout: 15000 });
    await boutonLancer.click();
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });
  }

  test('restaure les tags dont la casse a changé, sans alerte', async ({ page }) => {
    await lancerRestauration(page, 'Suivi de [Personne] avec [personne 2].');

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('Suivi de Sophie Lambert avec Tom.')).toBeVisible();
  });

  test('signale les tags du texte absents de la clé', async ({ page }) => {
    await lancerRestauration(page, 'Suivi de [PERSONNE] à [LIEU].');

    const alerte = page.getByRole('alert');
    await expect(alerte).toBeVisible();
    await expect(alerte).toContainText('[LIEU]');
    await expect(alerte).toContainText('will not be restored');
  });
});
