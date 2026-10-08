import { test, expect, type Page } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Crée un fichier .docx avec des PII détectables (EMAIL, TEL).
 * Les regex PII de Maskita détectent: EMAIL, TEL, ADELI, NIR, SIRET, IBAN, IP, URL, CARTE_BANCAIRE.
 */
async function creerDocxPii(): Promise<Uint8Array> {
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
              new TextRun('0612345678'),
              new TextRun('.'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Site web : '),
              new TextRun('https://www.exemple-medical.fr'),
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
 * Navigue jusqu'à l'écran de revue de la pseudonymisation.
 */
async function allerARevuePseudonymisation(page: Page, fichierDocx: Uint8Array) {
  await page.goto('/');

  // Uploader le fichier .docx
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'rapport-consultation.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(fichierDocx),
  });

  // Lancer l'analyse
  await page.getByRole('button', { name: /Run analysis/i }).click({ timeout: 15000 });

  // Vérifier l'écran de revue
  await expect(page.getByText(/Pseudos? \(\d+\)/)).toBeVisible({ timeout: 10000 });
}

test.describe('US-V03 — Édition des valeurs à l\'étape Pseudonymisation', () => {
  let fichierDocx: Uint8Array;

  test.beforeAll(async () => {
    fichierDocx = await creerDocxPii();
  });

  test('ajoute et retire une valeur dans le tableau', async ({ page }) => {
    await allerARevuePseudonymisation(page, fichierDocx);

    const tableau = page.getByRole('table', { name: 'Tableau des pseudonymes' });
    await expect(tableau).toBeVisible();

    // Le tag EMAIL est détecté avec sa valeur
    await expect(tableau.getByText('sophie.lambert@exemple.fr')).toBeVisible();

    // 1. Ajouter une valeur au tag EMAIL (bouton ➕ + saisie inline)
    const boutonAjoutValeur = page.getByLabel('Add a value').first();
    await expect(boutonAjoutValeur).toBeVisible();
    await boutonAjoutValeur.click();

    const inputNouvelleValeur = page.getByPlaceholder('New value…');
    await expect(inputNouvelleValeur).toBeVisible();
    await inputNouvelleValeur.fill('contact@maskita.fr');
    await inputNouvelleValeur.press('Enter');

    // La nouvelle valeur apparaît dans le tableau
    await expect(tableau.getByText('contact@maskita.fr')).toBeVisible();

    // 2. Retirer la valeur "sophie.lambert@exemple.fr" du tag EMAIL
    await page.getByLabel('Remove sophie.lambert@exemple.fr').click();
    await expect(tableau.getByText('sophie.lambert@exemple.fr')).not.toBeVisible();

    // La valeur retirée n'est plus dans le tableau, la nouvelle reste
    await expect(tableau.getByText('contact@maskita.fr')).toBeVisible();
  });

  test('renomme un pseudo puis supprime un pseudo', async ({ page }) => {
    await allerARevuePseudonymisation(page, fichierDocx);
    const tableau = page.getByRole('table', { name: 'Tableau des pseudonymes' });

    // 1. Renommer le tag EMAIL via double-clic
    await tableau.getByText('EMAIL').first().dblclick();
    const inputRenommage = page.getByRole('textbox').first();
    await inputRenommage.fill('[COURRIEL]');
    await inputRenommage.press('Enter');

    // Le tag renommé apparaît dans le tableau
    await expect(tableau.getByText('COURRIEL')).toBeVisible();

    // 2. Supprimer le premier pseudo via la poubelle + confirmation
    await page.getByLabel('Delete').first().click();
    await expect(page.getByText('Delete this pseudo?')).toBeVisible();

    // La modale de confirmation est rendue en fin de document (createPortal)
    // — c'est le dernier bouton "Delete"
    await page.getByRole('button', { name: 'Delete' }).last().click();

    // Le compteur indique qu'il reste au moins un pseudo
    await expect(tableau.getByText(/Pseudos \(\d+\)/)).toBeVisible();
  });

  test('ajoute un pseudo manuellement via la modale', async ({ page }) => {
    await allerARevuePseudonymisation(page, fichierDocx);
    const tableau = page.getByRole('table', { name: 'Tableau des pseudonymes' });

    // Compter les pseudos avant
    const texteAvant = await tableau.getByText(/Pseudos \(\d+\)/).textContent();

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

    // Vérifier que le compteur a augmenté
    const texteApres = await tableau.getByText(/Pseudos \(\d+\)/).textContent();
    expect(texteApres).not.toBe(texteAvant);
  });
});