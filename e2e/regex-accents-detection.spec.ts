import { test, expect, type Page } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * REGEX-02 — Vérifie en e2e (via l'UI) que la détection automatique des regex
 * est Unicode-aware : un email commençant par une lettre accentuée
 * ('é.dupont@exemple.fr') doit être détecté comme EMAIL et pseudonymisé,
 * comme un email ASCII classique (non-régression).
 *
 * Bug d'origine : `\b`/`\w` sans flag `u` sont ASCII-only, un accent adjacent
 * n'est pas vu comme un caractère de mot.
 */

/** Crée un .docx contenant le texte fourni dans un paragraphe. */
async function creerDocx(texte: string): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun(texte)] }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

/** Upload le .docx, lance l'analyse et attend l'écran de revue. */
async function uploaderEtAnalyser(page: Page, fichier: Uint8Array): Promise<void> {
  await page.goto('/');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Drag & drop/ }).first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'rapport.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(fichier),
  });

  const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
  await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
  await boutonAnalyser.click();

  await expect(page.getByText(/Pseudos? \(\d+\)/)).toBeVisible({ timeout: 10000 });
}

function localiserApercuPseudonymise(page: Page) {
  return page
    .getByRole('heading', { name: 'Pseudonymised text' })
    .locator('xpath=following-sibling::div[1]');
}

test.describe('REGEX-02 — Détection automatique Unicode (accents)', () => {
  test("un email à accent initial ('é.dupont@exemple.fr') est détecté comme EMAIL", async ({ page }) => {
    const fichier = await creerDocx("Merci d'écrire à é.dupont@exemple.fr pour la suite.");
    await uploaderEtAnalyser(page, fichier);

    // Le type EMAIL apparaît dans la liste des détections
    await expect(page.getByText('EMAIL').first()).toBeVisible();

    // Le texte pseudonymisé utilise le tag [EMAIL] et ne laisse plus l'email en clair
    const apercuPseudo = localiserApercuPseudonymise(page);
    await expect(apercuPseudo).toContainText('[EMAIL]');
    await expect(apercuPseudo).not.toContainText('é.dupont@exemple.fr');
    await expect(apercuPseudo).not.toContainText('exemple.fr');
  });

  test('non-régression : un email ASCII normal est toujours détecté comme EMAIL', async ({ page }) => {
    const fichier = await creerDocx("Merci d'écrire à contact@exemple.fr pour la suite.");
    await uploaderEtAnalyser(page, fichier);

    await expect(page.getByText('EMAIL').first()).toBeVisible();

    const apercuPseudo = localiserApercuPseudonymise(page);
    await expect(apercuPseudo).toContainText('[EMAIL]');
    await expect(apercuPseudo).not.toContainText('contact@exemple.fr');
  });
});
