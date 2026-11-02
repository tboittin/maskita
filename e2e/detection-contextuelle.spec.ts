import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
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

async function creerDocxNom(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun('Patient : Lucas Martin, né le 12 mars 2015.')] }),
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

  test('restaure « Lucas Martin » avec ses majuscules (aller-retour)', async ({ page }) => {
    const fichier = await creerDocxNom();
    await page.goto('/');

    // 1. Pseudonymiser un document contenant « Lucas Martin »
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'rapport-nom.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichier),
    });

    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });
    await boutonAnalyser.click();
    await page.getByRole('button', { name: /Validate and continue/i }).click({ timeout: 10000 });
    await expect(page.getByText(/Download files/i)).toBeVisible({ timeout: 10000 });

    // 2. La clé produite stocke la forme d'origine « Lucas Martin »
    const telechargementCle = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download key/i }).click();
    const cheminCle = await (await telechargementCle).path();
    const cle = JSON.parse(await readFile(cheminCle as string, 'utf-8'));
    expect(cle['[PERSONNE]']).toContain('Lucas Martin');

    // 3. Récupérer le document pseudonymisé pour le restaurer
    const telechargementDoc = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download document/i }).click();
    const cheminDoc = await (await telechargementDoc).path();
    const docPseudonymise = await readFile(cheminDoc as string);

    // 4. Restaurer avec la clé produite
    await page.getByRole('button', { name: 'Restore' }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'rapport-nom-pseudonymise.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: docPseudonymise,
    });
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'rapport-nom.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(cle)),
    });

    await page.getByRole('button', { name: /Run restoration/i }).click({ timeout: 15000 });
    await expect(page.getByText('Validate and continue')).toBeVisible({ timeout: 10000 });

    // 5. Le document restauré restitue la casse d'origine
    const texteRestaure = await texteVolet(page, 'Restored preview');
    expect(texteRestaure).toContain('Lucas Martin');
  });
});
