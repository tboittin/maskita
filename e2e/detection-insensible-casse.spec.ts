import { test, expect, type Page } from '@playwright/test';

/**
 * DET-01 — La détection/pseudonymisation est insensible à la casse.
 * TEXTE : 'Contactez TEST@exemple.fr ou test@exemple.fr.'
 * Les deux variantes de casse doivent aboutir au même pseudo [EMAIL]
 * et aucune occurrence ne doit rester visible dans le texte pseudonymisé.
 */

async function localiserApercuPseudonymise(page: Page) {
  return page
    .getByRole('heading', { name: 'Pseudonymised text' })
    .locator('xpath=following-sibling::div[1]');
}

test.describe('Détection insensible à la casse (DET-01)', () => {
  test("Pseudonymise de la même façon les variantes de casse d'une valeur", async ({ page }) => {
    await page.goto('/');

    // 1. Uploader un fichier .txt contenant les deux variantes de casse
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Drag & drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'rapport-casse.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Contactez TEST@exemple.fr ou test@exemple.fr.'),
    });

    // 2. Lancer l'analyse
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();

    // 3. L'écran de revue est affiché avec un tag EMAIL
    await expect(page.getByText(/Pseudos? \(\d+\)/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('EMAIL').first()).toBeVisible();

    // 4. Le texte pseudonymisé utilise le MÊME pseudo pour les 2 variantes
    const apercuPseudo = await localiserApercuPseudonymise(page);
    await expect(apercuPseudo).toBeVisible();
    await expect(apercuPseudo).toContainText('[EMAIL]');

    // Les deux variantes de casse sont remplacées par le même tag [EMAIL]
    const nbTags = await apercuPseudo.getByText('[EMAIL]', { exact: true }).count();
    expect(nbTags).toBe(2);

    // Aucune variante de casse ne subsiste dans le texte pseudonymisé
    await expect(apercuPseudo).not.toContainText('TEST@exemple.fr');
    await expect(apercuPseudo).not.toContainText('test@exemple.fr');
    await expect(apercuPseudo).not.toContainText('exemple.fr');
  });
});
