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

    // Vérifier les noms de fichiers et les boutons de téléchargement
    await expect(page.getByText('test-rapport-pseudonymise.docx')).toBeVisible();
    await expect(page.getByText('test-rapport.key.json')).toBeVisible();
    await expect(page.getByRole('button', { name: /Download document/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download key/i })).toBeVisible();

    // 8. Revenir à l'écran de revue via "← Modify pseudos"
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

  test('Parcours Restauration - affichage des éléments', async ({ page }) => {
    await page.goto('/');

    // 1. Cliquer sur l'onglet Restaurer
    await page.getByRole('button', { name: 'Restore' }).click();

    // 2. Vérifier les titres de section
    await expect(page.getByText(/Modified report/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /key.*json/i })).toBeVisible();
    await expect(page.getByText('(required)')).toBeVisible();

    // 3. Vérifier que les zones de dépôt sont présentes
    const dropZones = page.getByRole('button', { name: /Drag & drop/ });
    await expect(dropZones.first()).toBeVisible();

    // 4. Vérifier qu'il n'y a pas d'aperçu tant qu'on n'a pas uploadé
    await expect(page.getByText(/restored text preview/i)).not.toBeVisible();
  });
});
