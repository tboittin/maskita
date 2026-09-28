import { test, expect } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Crée un fichier .docx avec des PII réelles détectables par les regex.
 * Inclut des valeurs qui seront reconnues par le pipeline d'analyse.
 */
async function creerDocxAvecPii(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun('Compte rendu de consultation'),
            ],
            heading: 'Heading1',
          }),
          new Paragraph({
            children: [
              new TextRun('Patient contacté par email : '),
              new TextRun('sophie.lambert@exemple.fr'),
              new TextRun(' et par téléphone au '),
              new TextRun('06 12 34 56 78'),
              new TextRun('.'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Site web de référence : '),
              new TextRun('https://www.exemple-medical.fr/rapport'),
              new TextRun('.'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Adresse IP du serveur : '),
              new TextRun('192.168.1.42'),
              new TextRun('.'),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

test.describe('Affichage du résultat de la vérification initiale', () => {
  let fichierDocx: Uint8Array;

  test.beforeAll(async () => {
    fichierDocx = await creerDocxAvecPii();
  });

  test('affiche le tableau des tags avec les pseudos détectés', async ({ page }) => {
    await page.goto('/');

    // Uploader le fichier .docx
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Drag & drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-pii.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // Attendre que le bouton "Run analysis" apparaisse
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();

    // Vérifier que le tableau des pseudos est affiché
    await expect(page.getByText(/Pseudos? \(\d+\)/)).toBeVisible({ timeout: 10000 });
    // EMAIL, TEL, IP, URL doivent être détectés par les regex
    await expect(page.getByText('EMAIL').first()).toBeVisible();
    await expect(page.getByText('TEL').first()).toBeVisible();
    await expect(page.getByText('IP').first()).toBeVisible();
    await expect(page.getByText('URL').first()).toBeVisible();
  });

  test('affiche le texte pseudonymisé et le texte lisible', async ({ page }) => {
    await page.goto('/');

    // Uploader le fichier .docx
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Drag & drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-pii.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // Lancer l'analyse
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();

    // Vérifier les deux aperçus texte
    await expect(page.getByText('Pseudonymised text')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Readable text')).toBeVisible();

    // Vérifier que le texte pseudonymisé contient des tags (les valeurs PII remplacées)
    await expect(page.getByText('[EMAIL]').first()).toBeVisible();
    await expect(page.getByText('[TEL]').first()).toBeVisible();
  });

  test('affiche le compteur de pseudos correct', async ({ page }) => {
    await page.goto('/');

    // Uploader le fichier .docx
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Drag & drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-pii.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // Lancer l'analyse
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();

    // Vérifier le compteur : 4 types détectés (EMAIL, TEL, IP, URL)
    await expect(page.getByText(/Pseudos? \(4\)/)).toBeVisible({ timeout: 10000 });
  });
});
