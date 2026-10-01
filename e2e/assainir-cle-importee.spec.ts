import { test, expect } from '@playwright/test';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Crée un .docx minimal avec un contenu textuel pour déclencher l'analyse.
 */
async function creerDocxBasique(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun('Contact : '),
              new TextRun('test@exemple.fr'),
            ],
          }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

test.describe('Assainir clé importée — INT-3', () => {
  test('filtre les valeurs invalides et affiche le message', async ({ page }) => {
    const fichierDocx = await creerDocxBasique();

    await page.goto('/');

    // 1. Uploader le fichier .docx (déclenche l'étape analyse)
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'rapport.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    // Attendre que le bouton "Run analysis" soit visible
    const boutonAnalyser = page.getByRole('button', { name: /Run analysis/i });
    await expect(boutonAnalyser).toBeVisible({ timeout: 15000 });

    // 2. Uploader une clé .key.json avec des valeurs invalides (crochets)
    const cleAvecInvalides = JSON.stringify({
      '[PERSONNE]': [
        'Sophie Lambert',
        '[ADRESSE]',
        'Jean [Dupont]',
      ],
      '[TEL]': [
        '0612345678',
        '[PERS',
      ],
    });

    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'ma-cle.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleAvecInvalides),
    });

    // 3. Vérifier qu'aucune erreur ne bloque l'import
    //    (le FileDropZone n'affiche pas de message d'erreur rouge)
    await expect(page.getByText('Fichier .key.json invalide ou corrompu')).not.toBeVisible();

    // 4. Vérifier que le message d'avertissement est affiché
    const messageAlerte = page.getByRole('alert');
    await expect(messageAlerte).toBeVisible({ timeout: 5000 });
    await expect(messageAlerte).toContainText('Valeurs invalides retirées de la clé importée');

    // 5. Vérifier que le message liste les valeurs retirées avec leur tag
    await expect(messageAlerte).toContainText('[PERSONNE] : [ADRESSE]');
    await expect(messageAlerte).toContainText('[PERSONNE] : Jean [Dupont]');
    await expect(messageAlerte).toContainText('[TEL] : [PERS');

    // 6. Vérifier que les valeurs valides NE sont PAS mentionnées dans le message
    await expect(messageAlerte).not.toContainText('Sophie Lambert');
    await expect(messageAlerte).not.toContainText('0612345678');

    // 7. Lancer l'analyse et vérifier le mapping assaini
    await boutonAnalyser.click();

    // L'écran de revue s'affiche
    await expect(page.getByText(/Pseudos? \(\d+\)/)).toBeVisible({ timeout: 10000 });

    // 8. Vérifier que le tag PERSONNE est présent (conserve les valeurs valides)
    // et ne contient PAS les valeurs invalides comme [ADRESSE]
    const valeursTag = page.locator('section').filter({ hasText: 'PERSONNE' });
    await expect(valeursTag).toBeVisible();

    // Le tag TEL est présent (conserve sa valeur valide)
    await expect(page.getByText('TEL').first()).toBeVisible();

    // Vérifier qu'aucune valeur avec crochets n'a été conservée
    // (le texte pseudonymisé ne doit pas contenir de [ADRESSE] comme valeur)
    const textePseudo = page.getByText('Pseudonymised text');
    await expect(textePseudo).toBeVisible();
  });

  test('clé entièrement valide n\'affiche pas de message', async ({ page }) => {
    const fichierDocx = await creerDocxBasique();
    await page.goto('/');

    // Uploader le .docx
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'rapport.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(fichierDocx),
    });

    await expect(page.getByRole('button', { name: /Run analysis/i })).toBeVisible({ timeout: 15000 });

    // Uploader une clé avec uniquement des valeurs valides
    const cleValide = JSON.stringify({
      '[PERSONNE]': ['Sophie Lambert'],
      '[TEL]': ['0612345678'],
    });

    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'valide.key.json',
      mimeType: 'application/json',
      buffer: Buffer.from(cleValide),
    });

    // Vérifier qu'aucun message d'alerte ne s'affiche (messageCle reste null)
    const messageAlerte = page.getByRole('alert');
    await expect(messageAlerte).not.toBeVisible();
  });
});