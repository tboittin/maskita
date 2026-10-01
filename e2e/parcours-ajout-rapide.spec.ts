import { test, expect, type Page } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

async function creerDocx(children: TextRun[]): Promise<Uint8Array> {
  const doc = new Document({
    sections: [{ children: [new Paragraph({ children })] }],
  });
  return await Packer.toBuffer(doc);
}

/** .docx contenant de la PII pour le parcours Pseudonymisation. */
async function creerDocxPii(): Promise<Uint8Array> {
  return creerDocx([
    new TextRun('Contact : '),
    new TextRun('test@exemple.fr'),
    new TextRun(' au '),
    new TextRun('0612345678'),
  ]);
}

/** .docx avec des tags pour le parcours Restauration. */
async function creerDocxTags(): Promise<Uint8Array> {
  return creerDocx([
    new TextRun('Patient : '),
    new TextRun('[PERSONNE] Sophie Lambert'),
  ]);
}

/** Sélectionne tout le texte du volet cible (bas/lisible, sans crochets) et déclenche mouseup. */
async function surlignerVolet(page: Page, fragment: string) {
  const ok = await page.evaluate((frag) => {
    const containers = [...document.querySelectorAll<HTMLDivElement>('div[style*="max-height"]')];
    // Éviter le volet haut (pseudonymisé avec tags [crochets]) : INT-1
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

/** Sélectionne un fragment de texte à l'intérieur d'un tag dans le volet haut (pseudonymisé). */
async function surlignerInterieurTag(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const containers = [...document.querySelectorAll<HTMLDivElement>('div[style*="max-height"]')];
    // Volet haut = contient des crochets (tags)
    const c = containers.find(el => el.textContent?.includes('['));
    if (!c) return false;

    // Trouver un span qui est un tag complet ex: [EMAIL] ou [TEL]
    const spans = [...c.querySelectorAll('span')];
    const tagSpan = spans.find(s => {
      const t = s.textContent || '';
      return t.startsWith('[') && t.endsWith(']') && t.length > 2;
    });
    if (!tagSpan || !tagSpan.firstChild) return false;

    const textNode = tagSpan.firstChild;
    const len = textNode.textContent?.length ?? 0;
    if (len < 3) return false;

    // Sélectionner le contenu INTERNE du tag (sans les crochets)
    const range = document.createRange();
    range.setStart(textNode, 1);
    range.setEnd(textNode, len - 1);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    c.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return true;
  });
}

test.describe('Ajout rapide par surlignage (non-régression)', () => {
  test('Pseudonymisation — la sélection de texte affiche les boutons et crée un pseudo', async ({ page }) => {
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

    // Surligner le texte lisible → barre d'ajout rapide
    await surlignerVolet(page, 'Contact :');
    await expect(page.getByRole('button', { name: 'New pseudo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New value' })).toBeVisible();

    // Créer un nouveau pseudo → le compteur passe à 3
    await page.getByRole('button', { name: 'New pseudo' }).click();
    await expect(page.getByText(/Pseudos? \(3\)/)).toBeVisible({ timeout: 5000 });
  });

  test('Pseudonymisation — sélection INTERNE à un tag ne montre pas les boutons (CORR-1)', async ({ page }) => {
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

    // Sélectionner du texte À L'INTÉRIEUR d'un tag du volet haut
    const ok = await surlignerInterieurTag(page);
    expect(ok, 'volet haut avec tag introuvable').toBeTruthy();

    // Les boutons d'ajout rapide ne doivent PAS apparaître
    await expect(page.getByRole('button', { name: 'New pseudo' })).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: 'New value' })).not.toBeVisible({ timeout: 3000 });
  });

  test('Restauration — la sélection de texte affiche les boutons et crée un pseudo', async ({ page }) => {
    const fichier = await creerDocxTags();
    await page.goto('/');
    await page.getByRole('button', { name: 'Restore' }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'r.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichier),
    });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'r.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] })),
    });
    await page.getByRole('button', { name: /Run restoration/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Pseudos? \(1\)/)).toBeVisible();

    // Surligner le volet restauré → barre d'ajout rapide
    await surlignerVolet(page, 'Sophie Lambert Sophie Lambert');
    await expect(page.getByRole('button', { name: 'New pseudo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New value' })).toBeVisible();

    // Créer un nouveau pseudo → le compteur passe à 2
    await page.getByRole('button', { name: 'New pseudo' }).click();
    await expect(page.getByText(/Pseudos? \(2\)/)).toBeVisible({ timeout: 5000 });
  });
});
