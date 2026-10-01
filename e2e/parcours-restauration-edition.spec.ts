import { test, expect, type Page } from '@playwright/test';
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
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Navigue jusqu'à l'écran de revue de la restauration.
 */
async function allerARevue(page: Page, fichierDocx: Uint8Array) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Restore' }).click();

  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'rapport-modifié.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(fichierDocx),
  });

  const cleJson = JSON.stringify({
    '[PERSONNE]': ['Sophie Lambert'],
    '[DATE]': ['15/03/1985'],
  });
  await page.locator('input[type="file"]').nth(1).setInputFiles({
    name: 'rapport.key.json',
    mimeType: 'application/json',
    buffer: Buffer.from(cleJson),
  });

  await page.getByRole('button', { name: /Run restoration/i }).click({ timeout: 15000 });
  await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });
}

test.describe('US-V03 — Édition des valeurs à l\'étape Restauration', () => {
  let fichierDocx: Uint8Array;

  test.beforeAll(async () => {
    fichierDocx = await creerDocxAvecTags();
  });

  test('ajoute et retire une valeur dans le tableau', async ({ page }) => {
    await allerARevue(page, fichierDocx);

    // La table du DS a un role="table" et un aria-label fixe (non localisé)
    const tableau = page.getByRole('table', { name: 'Tableau des pseudonymes' });
    await expect(tableau).toBeVisible();
    await expect(tableau.getByText('Sophie Lambert')).toBeVisible();

    // 1. Ajouter une valeur au tag PERSONNE (bouton ➕ + saisie inline)
    await page.getByLabel('Add a value').first().click();
    const inputNouvelleValeur = page.getByPlaceholder('New value…');
    await inputNouvelleValeur.fill('Nouvelle Valeur');
    await inputNouvelleValeur.press('Enter');

    // La nouvelle valeur apparaît dans le tableau
    await expect(tableau.getByText('Nouvelle Valeur')).toBeVisible();

    // 2. Retirer la valeur "Sophie Lambert"
    await page.getByLabel('Remove Sophie Lambert').click();
    await expect(tableau.getByText('Sophie Lambert')).not.toBeVisible();

    // La valeur retirée n'est plus dans le tableau, la nouvelle reste
    await expect(tableau.getByText('Nouvelle Valeur')).toBeVisible();
  });

  test('renomme un pseudo puis supprime un pseudo', async ({ page }) => {
    await allerARevue(page, fichierDocx);
    const tableau = page.getByRole('table', { name: 'Tableau des pseudonymes' });

    // 1. Renommer le tag [PERSONNE] via double-clic
    await tableau.getByText('PERSONNE').first().dblclick();
    const inputRenommage = page.getByRole('textbox').first();
    await inputRenommage.fill('[PATIENT]');
    await inputRenommage.press('Enter');

    // Le tag renommé apparaît dans le tableau
    await expect(tableau.getByText('PATIENT')).toBeVisible();

    // 2. Supprimer le premier pseudo via la poubelle + confirmation
    await page.getByLabel('Delete').first().click();
    await expect(page.getByText('Delete this pseudo?')).toBeVisible();

    // Désambiguïser : la poubelle (aria-label « Delete ») et le bouton danger « Delete »
    // de la modale. La modale est rendue en fin de document (createPortal) → c'est le dernier.
    await page.getByRole('button', { name: 'Delete' }).last().click();

    // Le compteur de pseudos du tableau passe à 1
    await expect(tableau.getByText('Pseudos (1)')).toBeVisible({ timeout: 5000 });
  });

  test('ajoute un pseudo manuellement via la modale', async ({ page }) => {
    await allerARevue(page, fichierDocx);
    const tableau = page.getByRole('table', { name: 'Tableau des pseudonymes' });

    // Ouvrir la modale d'ajout manuel
    await page.getByRole('button', { name: '+ Add a pseudo' }).click();
    await expect(page.getByRole('heading', { name: 'Add a pseudo' })).toBeVisible();

    // Choisir le type LIEU et saisir une valeur
    await page.getByRole('combobox').selectOption('LIEU');
    await page.getByPlaceholder('Value').fill('Paris');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Le nouveau pseudo [LIEU] avec sa valeur apparaît dans le tableau
    await expect(tableau.getByText('LIEU')).toBeVisible();
    await expect(tableau.getByText('Paris')).toBeVisible();
    await expect(tableau.getByText('Pseudos (3)')).toBeVisible();
  });
});