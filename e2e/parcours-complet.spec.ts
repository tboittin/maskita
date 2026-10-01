import { test, expect } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Crée un fichier .docx minimal pour les tests.
 */
async function creerDocxTest(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun("Compte rendu médical"),
            ],
            heading: 'Heading1',
          }),
          new Paragraph({
            children: [
              new TextRun("Patient : "),
              new TextRun("[PERSONNE] Jean Dupont"),
              new TextRun(" né le "),
              new TextRun("[DATE] 15/03/1985"),
              new TextRun(" au "),
              new TextRun("[LIEU] Centre Hospitalier de Lyon"),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun("Diagnostic : hypertension artérielle. "),
              new TextRun("Le patient a été suivi par le Dr [PERSONNE] Martin."),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun("Traitement prescrit : consultation chez "),
              new TextRun("[ETABLISSEMENT] Hôpital Saint-Joseph"),
              new TextRun(" le "),
              new TextRun("[DATE] 20/06/2024"),
              new TextRun("."),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

test.describe('Parcours complet Maskita', () => {
  let fichierDocx: Uint8Array;

  test.beforeAll(async () => {
    fichierDocx = await creerDocxTest();
  });

  test('Parcours Pseudonymisation complet', async ({ page }) => {
    await page.goto('/');

    // 1. Vérifier le titre et la structure de la page
    await expect(page.locator('h1')).toHaveText('Maskita');
    // Le navigateur Playwright est en anglais par défaut
    await expect(page.getByText(/Document pseudonymisation/)).toBeVisible();

    // 2. Vérifier les onglets (libellés anglais car navigateur en anglais)
    const ongletPseudo = page.getByRole('button', { name: 'Pseudonymise' });
    const ongletRestaurer = page.getByRole('button', { name: 'Restore' });
    await expect(ongletPseudo).toBeVisible();
    await expect(ongletRestaurer).toBeVisible();

    // 3. Uploader le fichier .docx
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Drag & drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-rapport.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // 4. Attendre que le bouton "Run analysis" apparaisse
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();

    // 5. Vérifier l'écran de revue
    // La table de mapping doit être visible
    await expect(page.getByText(/Pseudos? \(\d+\)/)).toBeVisible({ timeout: 10000 });
    // Les aperçus texte doivent être visibles
    await expect(page.getByText('Pseudonymised text')).toBeVisible();
    await expect(page.getByText('Readable text')).toBeVisible();

    // Vérifier que les pseudos détectés sont affichés dans le tableau
    await expect(page.getByText('PERSONNE').first()).toBeVisible();
    await expect(page.getByText('DATE').first()).toBeVisible();
    await expect(page.getByText('LIEU').first()).toBeVisible();
    await expect(page.getByText('ETABLISSEMENT').first()).toBeVisible();

    // 6. Vérifier le bouton "Validate and continue" (navigation vers l'écran de téléchargement)
    const boutonContinuer = page.getByRole('button', { name: /Validate and continue/i });
    await expect(boutonContinuer).toBeVisible();
    await boutonContinuer.click();

    // 7. Vérifier l'écran de téléchargement
    await expect(page.getByText(/Download files/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Pseudonymised document/i)).toBeVisible();
    await expect(page.getByText(/\.key\.json key/i)).toBeVisible();

    // Vérifier les noms de fichiers dans les champs texte et les boutons de téléchargement
    await expect(page.getByRole('textbox', { name: 'Pseudonymised document' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '.key.json key' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download document/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download key/i })).toBeVisible();

    // 8. Modifier le nom du fichier avant téléchargement
    const champDoc = page.getByRole('textbox', { name: 'Pseudonymised document' });
    await expect(champDoc).toHaveValue('test-rapport-pseudonymise.docx');
    await champDoc.fill('mon-rapport-final.docx');
    await expect(champDoc).toHaveValue('mon-rapport-final.docx');

    const champCle = page.getByRole('textbox', { name: '.key.json key' });
    await expect(champCle).toHaveValue('test-rapport.key.json');
    await champCle.fill('ma-cle.key.json');
    await expect(champCle).toHaveValue('ma-cle.key.json');

    // 9. Revenir à l'écran de revue via "← Modify pseudos"
    const boutonRetour = page.getByRole('button', { name: /Modify pseudos/i });
    await expect(boutonRetour).toBeVisible();
    await boutonRetour.click();

    // Vérifier qu'on est bien revenu à l'écran de revue
    await expect(page.getByText(/Pseudonymised text/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Readable text/)).toBeVisible();

    // 9. Revenir à l'étape d'upload
    const boutonRecommencer = page.getByRole('button', { name: /Start over/i });
    await expect(boutonRecommencer).toBeVisible();
    await boutonRecommencer.click();

    // Vérifier qu'on est bien revenu à l'étape d'upload
    await expect(boutonAnalyser).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Drag & drop/ }).first()).toBeVisible();
  });

  test('Parcours Restauration complet avec étape Revue', async ({ page }) => {
    await page.goto('/');

    // 1. Cliquer sur l'onglet Restaurer
    await page.getByRole('button', { name: 'Restore' }).click();

    // 2. Vérifier les titres de section et le jalon actif "Drop"
    await expect(page.getByText(/Modified report/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /key.*json/i })).toBeVisible();

    // 3. Uploader le fichier .docx modifié (avec pseudos)
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'modifié.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // 4. Uploader la clé .key.json
    const cleJson = JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'document.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleJson),
    });

    // 5. Vérifier que le bouton "Run restoration" apparaît
    const boutonLancer = page.getByRole('button', { name: /Run restoration/i });
    await expect(boutonLancer).toBeVisible({ timeout: 15000 });
    await boutonLancer.click();

    // 6. Vérifier l'écran de revue Restauration (EcranRestaurationRevue)
    // 6a. La table de mapping doit être visible avec le tag PERSONNE
    await expect(page.getByText(/Pseudos? \(1\)/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('PERSONNE').first()).toBeVisible();

    // 6b. L'aperçu pseudonymisé (texte avec tags) doit être visible
    await expect(page.getByText('Pseudonymised text')).toBeVisible();
    await expect(page.getByText('[PERSONNE]').first()).toBeVisible();

    // 6c. L'aperçu restauré doit être visible avec la valeur restaurée
    await expect(page.getByText('Restored preview')).toBeVisible();
    await expect(page.getByText('Sophie Lambert').first()).toBeVisible();

    // 7. Vérifier que le jalon est sur "Review"
    await expect(page.getByText('Review').first()).toBeVisible();

    // 8. Vérifier le bouton "Validate and continue"
    await expect(page.getByRole('button', { name: /Validate and continue/i })).toBeVisible();

    // 9. Revenir à l'étape d'upload
    const boutonRecommencer = page.getByRole('button', { name: /Start over/i });
    await expect(boutonRecommencer).toBeVisible();
    await boutonRecommencer.click();

    // Vérifier qu'on est bien revenu à l'étape d'upload
    await expect(page.getByRole('button', { name: /Run restoration/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Drag & drop/ }).first()).toBeVisible();
  });
});

test.describe('Warning données sensibles inline (MessageErreur) — Pseudonymisation', () => {
  let fichierDocx: Uint8Array;

  test.beforeAll(async () => {
    fichierDocx = await creerDocxTest();
  });

  test("affiche le warning inline quand le nom contient une donnée sensible, disparaît après correction, et permet le téléchargement", async ({ page }) => {
    await page.goto('/');

    // 1. Uploader le fichier .docx
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Drag & drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'Sophie Lambert.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // 2. Uploader une clé .key.json contenant "Sophie Lambert" comme valeur
    //    Ainsi le mappingFinal contiendra cette valeur → warning dans le nom
    const cleJson = JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] });
    await page.locator('input[type=\"file\"]').nth(1).setInputFiles({
      name: 'rapport.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleJson),
    });

    // 3. Lancer l'analyse
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();

    // 4. Valider la revue → écran téléchargement
    await expect(page.getByRole('button', { name: /Validate and continue/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Validate and continue/i }).click();

    // 5. Vérifier l'écran de téléchargement
    await expect(page.getByText(/Download files/i)).toBeVisible({ timeout: 10000 });
    const champDoc = page.getByRole('textbox', { name: 'Pseudonymised document' });
    await expect(champDoc).toHaveValue('Sophie Lambert-pseudonymise.docx');

    // 6. Le warning inline MessageErreur (role="alert") est visible
    //    "Sophie Lambert" est dans le mapping via la clé ET dans le nom du fichier
    const alertWarning = page.getByRole('alert');
    await expect(alertWarning).toBeVisible();
    await expect(alertWarning).toContainText(/sensitive data|Sophie Lambert/i);

    // 7. Vérifier qu'aucune Modal ne s'affiche (pas d'ancien comportement popup)
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // 8. Le téléchargement est bloqué — cliquer ne fait rien
    await expect(champDoc).toHaveAttribute('aria-invalid', 'true');
    await page.getByRole('button', { name: /Download document/i }).click();
    await expect(page.getByRole('button', { name: /Download document/i })).toBeVisible();
    await expect(page.getByText(/Document downloaded/i)).not.toBeVisible();

    // 9. Corriger le nom : enlever la donnée sensible
    await champDoc.fill('rapport-propre.docx');
    await expect(champDoc).toHaveValue('rapport-propre.docx');

    // 10. Le warning inline a disparu
    await expect(page.getByRole('alert')).not.toBeVisible();
    await expect(champDoc).toHaveAttribute('aria-invalid', 'false');

    // 11. Le téléchargement fonctionne maintenant
    await page.getByRole('button', { name: /Download document/i }).click();
    await expect(page.getByText(/Document downloaded/i)).toBeVisible({ timeout: 10000 });
  });
});
