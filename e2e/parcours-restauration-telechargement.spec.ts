import { test, expect } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Crée un fichier .docx avec des tags pseudos pour le test de restauration.
 */
async function creerDocxAvecTags(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun('Rapport médical'),
            ],
            heading: 'Heading1',
          }),
          new Paragraph({
            children: [
              new TextRun('Patient : '),
              new TextRun('[PERSONNE] Sophie Lambert'),
              new TextRun(' né le '),
              new TextRun('[DATE] 15/03/1985'),
              new TextRun('.'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Diagnostic : hypertension. '),
              new TextRun('Suivi par le Dr '),
              new TextRun('[PERSONNE] Martin.'),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

test.describe('Parcours Restauration — Écran Téléchargement', () => {
  let fichierDocx: Uint8Array;

  test.beforeAll(async () => {
    fichierDocx = await creerDocxAvecTags();
  });

  test('affiche les deux couples champ texte/bouton sur l\'écran de téléchargement', async ({ page }) => {
    await page.goto('/');

    // 1. Cliquer sur l'onglet Restore
    await page.getByRole('button', { name: 'Restore' }).click();

    // 2. Uploader le fichier .docx modifié (avec pseudos)
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'rapport-modifié.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // 3. Uploader la clé .key.json
    const cleJson = JSON.stringify({
      '[PERSONNE]': ['Sophie Lambert'],
      '[DATE]': ['15/03/1985'],
    });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'rapport.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleJson),
    });

    // 4. Cliquer sur "Run restoration"
    const boutonLancer = page.getByRole('button', { name: /Run restoration/i });
    await expect(boutonLancer).toBeVisible({ timeout: 15000 });
    await boutonLancer.click();

    // 5. Vérifier l'écran de revue
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });

    // 6. Cliquer sur "Validate and continue" → va à l'écran de téléchargement
    await page.getByRole('button', { name: /Validate and continue/i }).click();

    // 7. Vérifier l'écran de téléchargement
    await expect(page.getByText('Download restored files')).toBeVisible({ timeout: 10000 });

    // 7a. Première ligne : Document restauré
    await expect(page.getByRole('heading', { name: 'Restored document' })).toBeVisible();
    const champDoc = page.getByRole('textbox', { name: 'Restored document' });
    await expect(champDoc).toBeVisible();
    await expect(champDoc).toHaveValue('rapport-modifié-restauré.docx');

    const boutonDoc = page.getByRole('button', { name: /Download restored document/i });
    await expect(boutonDoc).toBeVisible();

    // 7b. Deuxième ligne : Clé .key.json
    await expect(page.getByText('.key.json key')).toBeVisible();
    const champCle = page.getByRole('textbox', { name: '.key.json key' });
    await expect(champCle).toBeVisible();
    await expect(champCle).toHaveValue('rapport-modifié.key.json');

    const boutonCle = page.getByRole('button', { name: /Download key/i });
    await expect(boutonCle).toBeVisible();

    // 7c. Bouton retour
    await expect(page.getByRole('button', { name: /Modify pseudos/i })).toBeVisible();
  });

  test('télécharge le document restauré et la clé indépendamment', async ({ page }) => {
    await page.goto('/');

    // Onglet Restore
    await page.getByRole('button', { name: 'Restore' }).click();

    // Upload .docx
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'compte-rendu.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // Upload clé
    const cleJson = JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'document.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleJson),
    });

    // Lancer la restauration
    await page.getByRole('button', { name: /Run restoration/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });

    // Valider → téléchargement
    await page.getByRole('button', { name: /Validate and continue/i }).click();
    await expect(page.getByText('Download restored files')).toBeVisible({ timeout: 10000 });

    // Vérifier les noms par défaut
    await expect(page.getByRole('textbox', { name: 'Restored document' })).toHaveValue('compte-rendu-restauré.docx');
    await expect(page.getByRole('textbox', { name: '.key.json key' })).toHaveValue('compte-rendu.key.json');

    // Télécharger d'abord la clé
    await page.getByRole('button', { name: /Download key/i }).click();
    await expect(page.getByText('Key downloaded ✓')).toBeVisible();

    // Le document n'est pas encore téléchargé
    await expect(page.getByRole('button', { name: /Download restored document/i })).toBeVisible();

    // Télécharger le document
    await page.getByRole('button', { name: /Download restored document/i }).click();
    await expect(page.getByText('Restored document downloaded ✓')).toBeVisible();

    // Les deux sont marqués comme téléchargés
    await expect(page.getByText('Restored document downloaded ✓')).toBeVisible();
    await expect(page.getByText('Key downloaded ✓')).toBeVisible();

    // Les champs restent modifiables après téléchargement
    const champDoc = page.getByRole('textbox', { name: 'Restored document' });
    await expect(champDoc).toBeEditable();
    await champDoc.fill('mon-rapport-final.docx');
    await expect(champDoc).toHaveValue('mon-rapport-final.docx');

    const champCle = page.getByRole('textbox', { name: '.key.json key' });
    await expect(champCle).toBeEditable();
    await champCle.fill('ma-cle.key.json');
    await expect(champCle).toHaveValue('ma-cle.key.json');
  });

  test('ne montre aucun warning de données sensibles lors du téléchargement en restauration', async ({ page }) => {
    await page.goto('/');

    // Onglet Restore
    await page.getByRole('button', { name: 'Restore' }).click();

    // Upload .docx dont le nom contient une valeur présente dans la clé (donnée sensible)
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'Sophie Lambert.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // Upload clé contenant la valeur "Sophie Lambert"
    const cleJson = JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'document.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleJson),
    });

    // Lancer la restauration
    await page.getByRole('button', { name: /Run restoration/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });

    // Valider → téléchargement
    await page.getByRole('button', { name: /Validate and continue/i }).click();
    await expect(page.getByText('Download restored files')).toBeVisible({ timeout: 10000 });

    // Cliquer sur "Download restored document" : le téléchargement doit aboutir SANS modale de warning
    await page.getByRole('button', { name: /Download restored document/i }).click();

    await expect(page.getByText('Restored document downloaded ✓')).toBeVisible({ timeout: 10000 });

    // Aucune modale de warning sensible ne doit être visible
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/download anyway|Télécharger quand même/i)).toHaveCount(0);
  });

  test('permet de revenir à la revue depuis l\'écran de téléchargement', async ({ page }) => {
    await page.goto('/');

    // Onglet Restore
    await page.getByRole('button', { name: 'Restore' }).click();

    // Upload .docx
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // Upload clé
    const cleJson = JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'document.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleJson),
    });

    // Lancer la restauration
    await page.getByRole('button', { name: /Run restoration/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });

    // Valider → téléchargement
    await page.getByRole('button', { name: /Validate and continue/i }).click();
    await expect(page.getByText('Download restored files')).toBeVisible({ timeout: 10000 });

    // Cliquer sur "← Modify pseudos" pour revenir à la revue
    await page.getByRole('button', { name: /Modify pseudos/i }).click();

    // Vérifier qu'on est revenu à l'écran de revue
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Restored preview')).toBeVisible();
  });
});
