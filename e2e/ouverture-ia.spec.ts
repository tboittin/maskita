import { test, expect, type Page } from '@playwright/test';

/**
 * Ouverture vers l'IA : panneau « What next? » de l'écran de téléchargement,
 * copie du prompt, notice de précautions (aussi accessible depuis le pied de page).
 */
async function allerAuTelechargement(page: Page) {
  await page.goto('/');
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'rapport.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Contact : jean.dupont@exemple.fr'),
  });
  const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
  await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
  await boutonAnalyser.click();
  await page.getByRole('button', { name: /Validate and continue/i }).click();
  await expect(page.getByText(/Download files/i)).toBeVisible({ timeout: 10000 });
}

test.describe("Ouverture vers l'IA", () => {
  test('copie le prompt depuis l\'écran de téléchargement', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await allerAuTelechargement(page);

    await expect(page.getByText('What next? Using an AI')).toBeVisible();
    await page.getByRole('button', { name: 'Copy the prompt' }).click();
    await expect(page.getByRole('button', { name: /Prompt copied/ })).toBeVisible();

    const copie = await page.evaluate(() => navigator.clipboard.readText());
    expect(copie).toContain('Copy each tag exactly as written');
  });

  test('ouvre les précautions depuis le panneau', async ({ page }) => {
    await allerAuTelechargement(page);
    await page.getByRole('button', { name: 'Precautions before using an AI' }).click();

    const modale = page.getByRole('dialog', { name: 'Precautions before using an AI' });
    await expect(modale).toBeVisible();
    await expect(modale).toContainText('HDS');
    await expect(modale).toContainText('Never send the .key.json file');
  });

  test('ouvre les précautions depuis le pied de page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Using an AI' }).click();
    await expect(page.getByRole('dialog', { name: 'Precautions before using an AI' })).toBeVisible();
  });
});
