import { test, expect } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/** .docx contenant un même type de pseudo avec 6 valeurs distinctes. */
async function creerDocxSixEmails(): Promise<Uint8Array> {
  const emails = [
    'alpha@exemple.fr',
    'bravo@exemple.fr',
    'charlie@exemple.fr',
    'delta@exemple.fr',
    'echo@exemple.fr',
    'foxtrot@exemple.fr',
  ];
  const children: TextRun[] = [];
  emails.forEach((e, i) => {
    children.push(new TextRun(`Contact ${i + 1} : `));
    children.push(new TextRun(e));
    children.push(new TextRun(' '));
  });
  const doc = new Document({
    sections: [{ children: [new Paragraph({ children })] }],
  });
  return await Packer.toBuffer(doc);
}

const EMAILS = [
  'alpha@exemple.fr',
  'bravo@exemple.fr',
  'charlie@exemple.fr',
  'delta@exemple.fr',
  'echo@exemple.fr',
  'foxtrot@exemple.fr',
];

test.describe('US-TAB-01 — Toutes les valeurs d\'un pseudo sont affichées', () => {
  test('un pseudo avec 6 valeurs les affiche toutes dans le tableau (aucun « +N »)', async ({ page }) => {
    const fichier = await creerDocxSixEmails();
    await page.goto('/');
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'emails.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichier),
    });

    await page.getByRole('button', { name: /Run analysis/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });

    // Le tableau des pseudos est affiché sur cet écran de revue.
    const tableau = page.locator('div[style*="max-height: 500px"]');
    await expect(tableau).toBeVisible({ timeout: 10000 });

    // Les 6 valeurs doivent toutes être rendues dans le tableau.
    for (const email of EMAILS) {
      await expect(tableau.getByText(email, { exact: true }).first()).toBeVisible();
    }

    // Aucun indicateur de tronquage « +N ».
    await expect(page.getByText(/^\+\d+$/)).toHaveCount(0);
  });
});
