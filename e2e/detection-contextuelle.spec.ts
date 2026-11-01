import { test, expect } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * DET-AUTO — Les noms, dates et adresses sont proposés automatiquement
 * dans l'écran de revue, sans ajout manuel.
 */
async function creerDocx(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun('Patient : Lucas Martin, né le 12 mars 2015.')] }),
          new Paragraph({ children: [new TextRun('Mme Dupont est venue le 03/10/2026 avec Lucas.')] }),
          new Paragraph({ children: [new TextRun('Domicile : 4 avenue Jean Jaurès, 69007 Lyon.')] }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

async function texteVolet(page: import('@playwright/test').Page, titre: string): Promise<string> {
  return await page.evaluate((t) => {
    const h4 = [...document.querySelectorAll<HTMLHeadingElement>('h4')].find(el => el.textContent?.trim() === t);
    const c = h4?.nextElementSibling as HTMLDivElement | null;
    return c ? (c.textContent || '') : '';
  }, titre);
}

test.describe('DET-AUTO — Détection contextuelle', () => {
  test('les personnes, dates et adresses sont pseudonymisées dès l\'analyse', async ({ page }) => {
    const fichier = await creerDocx();
    await page.goto('/');

    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'rapport.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichier),
    });

    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });

    const textePseudo = await texteVolet(page, 'Pseudonymised text');
    for (const tag of ['[PERSONNE]', '[PERSONNE_2]', '[DATE]', '[DATE_2]', '[ADRESSE]']) {
      expect(textePseudo).toContain(tag);
    }
    for (const valeur of ['Lucas', 'Martin', 'Dupont', '12 mars 2015', '03/10/2026', 'Jaurès', '69007']) {
      expect(textePseudo).not.toContain(valeur);
    }
  });
});
