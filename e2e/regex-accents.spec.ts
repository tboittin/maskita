import { test, expect } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * REGEX-01 — Vérifie en e2e le scénario UTILISATEUR : une valeur accentuée
 * ('Chloé') est pseudonymisée correctement via le flux normal de l'application
 * (sélection dans le texte + ajout d'un pseudo dans le tableau), et n'apparaît
 * plus en clair dans le texte pseudonymisé.
 */
async function creerDocx(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun("J'ai discuté avec Chloé hier."),
            ],
          }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

/** Extrait le texte du volet d'aperçu identifié par son titre (h4). */
async function texteVolet(page: import('@playwright/test').Page, titre: string): Promise<string> {
  return await page.evaluate((t) => {
    const h4 = [...document.querySelectorAll<HTMLHeadingElement>('h4')].find(el => el.textContent?.trim() === t);
    const c = h4?.nextElementSibling as HTMLDivElement | null;
    return c ? (c.textContent || '') : '';
  }, titre);
}

test.describe('REGEX-01 — Pseudonymisation d\'une valeur accentuée (flux utilisateur)', () => {
  test('Chloé est remplacée par un tag [PERSONNE] et n\'apparaît plus en clair', async ({ page }) => {
    const fichier = await creerDocx();
    await page.goto('/');

    // 1. Uploader le .docx contenant 'Chloé'
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'chloe.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichier),
    });

    // 2. Lancer l'analyse → écran de revue
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Pseudonymised text/i)).toBeVisible();

    // 3. Flux normal : l'utilisateur crée le pseudo 'Chloé' via le bouton
    //    "+ Add a pseudo" du tableau, avec le type PERSONNE
    const boutonAjoutPseudo = page.getByRole('button', { name: /Add a pseudo/i });
    await expect(boutonAjoutPseudo).toBeVisible();
    await boutonAjoutPseudo.click();

    const dialogue = page.getByRole('dialog', { name: /Add a pseudo/i });
    await expect(dialogue).toBeVisible({ timeout: 5000 });

    // Valeur accentnée → 'Chloé' en fin de mot
    const inputValeur = page.getByPlaceholder('Value');
    await inputValeur.fill('Chloé');

    const selectType = page.getByRole('combobox');
    await selectType.selectOption('PERSONNE');

    await dialogue.getByRole('button', { name: 'Add' }).click();

    // 4. Le pseudo est créé → le compteur du tableau passe à 1
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(/Pseudos? \(1\)/)).toBeVisible({ timeout: 5000 });

    // 5. Le volet pseudonymisé contient le tag [PERSONNE] et ne contient
    //    plus 'Chloé' en clair
    await expect(page.getByText('[PERSONNE]').first()).toBeVisible({ timeout: 5000 });
    const textePseudo = await texteVolet(page, 'Pseudonymised text');
    expect(textePseudo).toContain('[PERSONNE]');
    expect(textePseudo).not.toContain('Chloé');

    // 6. Le texte lisible (volet bas) garde la valeur d'origine avec l'accent
    const texteLisible = await texteVolet(page, 'Readable text');
    expect(texteLisible).toContain('Chloé');
  });
});
