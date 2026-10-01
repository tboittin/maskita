import { test, expect, type Page } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

async function creerDocx(children: TextRun[]): Promise<Uint8Array> {
  const doc = new Document({
    sections: [{ children: [new Paragraph({ children })] }],
  });
  return await Packer.toBuffer(doc);
}

async function creerDocxPii(): Promise<Uint8Array> {
  return creerDocx([
    new TextRun('Contact : '),
    new TextRun('test@exemple.fr'),
    new TextRun(' au '),
    new TextRun('0612345678'),
  ]);
}

/** Sélectionne le contenu du volet lisible contenant le fragment. */
async function surlignerVolet(page: Page, fragment: string) {
  const ok = await page.evaluate((frag) => {
    const containers = [...document.querySelectorAll<HTMLDivElement>('div[style*="max-height"]')];
    const c = containers.find(el => {
      const txt = el.textContent || '';
      return txt.includes(frag) && !txt.includes('[');
    });
    if (!c) return false;
    const range = document.createRange();
    range.selectNodeContents(c);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    c.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return true;
  }, fragment);
  expect(ok, `volet contenant "${fragment}" introuvable`).toBeTruthy();
}

test.describe('SUG-B — Ajout classique depuis le tableau', () => {
  test('ouvre la modale avec Valeur préremplie depuis la sélection texte', async ({ page }) => {
    const fichier = await creerDocxPii();
    await page.goto('/');
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'pii.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichier),
    });
    await page.getByRole('button', { name: /Run analysis/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Pseudos? \(2\)/)).toBeVisible();

    // 1. Sans sélection texte : cliquer "+ Add a pseudo" → modale, Valeur vide
    const boutonAjoutPseudo = page.getByRole('button', { name: /Add a pseudo/i });
    await expect(boutonAjoutPseudo).toBeVisible();
    await boutonAjoutPseudo.click();

    const dialogue = page.getByRole('dialog', { name: /Add a pseudo/i });
    await expect(dialogue).toBeVisible({ timeout: 5000 });
    // Les libellés sont visibles dans la modale
    await expect(dialogue.getByText('Pseudonym', { exact: true })).toBeVisible();
    await expect(dialogue.getByText('Value', { exact: true })).toBeVisible();
    // Le champ Valeur est vide (pas de sélection)
    const inputValeur = page.getByPlaceholder('Value');
    await expect(inputValeur).toHaveValue('');

    // Fermer la modale
    await dialogue.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 2. Avec sélection texte → la modale s'ouvre avec Valeur préremplie
    await surlignerVolet(page, '0612345678');

    await page.getByRole('button', { name: /Add a pseudo/i }).click();
    const dialogue2 = page.getByRole('dialog', { name: /Add a pseudo/i });
    await expect(dialogue2).toBeVisible({ timeout: 5000 });
    // Le champ Valeur contient le texte sélectionné (le volet complet)
    await expect(inputValeur).not.toHaveValue('');

    // 3. Choisir un type et valider → le pseudo est créé
    const selectType = page.getByRole('combobox');
    await selectType.selectOption('EMAIL');
    await dialogue2.getByRole('button', { name: 'Add' }).click();

    // La modale se ferme, le compteur passe à 3
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(/Pseudos? \(3\)/)).toBeVisible({ timeout: 5000 });
  });

  test('saisir une valeur avec crochets desactive le bouton Ajouter et affiche une alerte', async ({ page }) => {
    const fichier = await creerDocxPii();
    await page.goto('/');
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'pii.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichier),
    });
    await page.getByRole('button', { name: /Run analysis/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Pseudos? \(2\)/)).toBeVisible();

    // Ouvrir la modale d'ajout classique sans sélection
    await page.getByRole('button', { name: /Add a pseudo/i }).click();
    const dialogue = page.getByRole('dialog', { name: /Add a pseudo/i });
    await expect(dialogue).toBeVisible({ timeout: 5000 });

    // Saisir une valeur avec crochets
    const inputValeur = page.getByPlaceholder('Value');
    await inputValeur.fill('[ADRESSE]');

    // Choisir un type pour que le bouton soit potentiellement actif
    const selectType = page.getByRole('combobox');
    await selectType.selectOption('EMAIL');

    // Le bouton Ajouter doit être désactivé
    const boutonAjouter = dialogue.getByRole('button', { name: 'Add' });
    await expect(boutonAjouter).toBeDisabled();

    // L'alerte doit être visible
    await expect(dialogue.getByText(/cannot contain brackets/i)).toBeVisible();

    // Corriger la valeur
    await inputValeur.fill('test@exemple.fr');
    await expect(dialogue.getByText(/cannot contain brackets/i)).not.toBeVisible();
    await expect(boutonAjouter).not.toBeDisabled();
  });
});