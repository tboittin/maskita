import { test, expect } from '@playwright/test';

/**
 * DET-02 — La détection des données sensibles du titre se fait par tokens
 * (découpe sur les espaces ET les tirets), et non plus sur la chaîne complète.
 *
 * Context : au téléchargement (parcours Pseudonymisation), si une valeur du
 * mapping contient des espaces/tirets ("M. Lefevre", "06 12 34 56 78"…), on
 * vérifie la présence d'AU MOINS UN de ses tokens dans le nom du fichier.
 *
 * Ici la valeur pseudonymisée est un numéro de téléphone "06 12 34 56 78"
 * (détecté par le regex TEL). Le fichier uploadé est nommé "releve-12.txt" :
 * la chaîne complète "06 12 34 56 78" n'est PAS dans le nom, mais le token
 * "12" l'est → le warning de nom sensible doit s'afficher (nouveau comp. DET-02).
 */
test.describe('Détection par tokens du titre (DET-02)', () => {
  test('alerte quand un token d\'une valeur pseudonymisée est présent dans le nom du fichier', async ({ page }) => {
    await page.goto('/');

    // 1. Uploader un fichier .txt nommé "releve-12" (contient le token "12")
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Drag & drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'releve-12.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Le patient est joignable au 06 12 34 56 78.'),
    });

    // 2. Lancer l'analyse
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();

    // 3. L'écran de revue affiche le tag TEL (le numéro est pseudonymisé)
    await expect(page.getByText(/Pseudos? \(\d+\)/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('TEL').first()).toBeVisible();

    // 4. Valider → écran de téléchargement
    await page.getByRole('button', { name: /Validate and continue/i }).click();
    await expect(page.getByText(/Download files/i)).toBeVisible({ timeout: 10000 });

    // 5. Le nom par défaut reprend le nom d'origine (le token complet "06 12 34 56 78" n'y est pas)
    const champDoc = page.getByRole('textbox', { name: 'Pseudonymised document' });
    await expect(champDoc).toHaveValue('releve-12-pseudonymise.txt');

    // 6. Cliquer "Download document" : la TOKENISATION détecte "12" dans le nom
    //    "releve-12" alors que la chaîne complète "06 12 34 56 78" n'y est pas
    await page.getByRole('button', { name: /Download document/i }).click();

    // Le warning inline (MessageErreur avec role="alert") est visible sous le champ
    // (l'ancien comportement Modal a été remplacé par un affichage inline)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('alert')).toContainText(/12|sensitive data/i);

    // Vérifier qu'aucune Modal ne s'affiche (non-régression : plus d'ancienne popup)
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Le champ a aria-invalid="true" et le clic n'a pas téléchargé
    await expect(champDoc).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Document downloaded ✓')).toHaveCount(0);

    // Corriger le nom : enlever le token sensible "12"
    await champDoc.fill('releve-nettoye.txt');
    await expect(champDoc).toHaveValue('releve-nettoye.txt');

    // Le warning inline a disparu et aria-invalid="false"
    await expect(page.getByRole('alert')).not.toBeVisible();
    await expect(champDoc).toHaveAttribute('aria-invalid', 'false');

    // Le téléchargement fonctionne maintenant
    await page.getByRole('button', { name: /Download document/i }).click();
    await expect(page.getByText('Document downloaded ✓')).toBeVisible({ timeout: 10000 });
  });
});
