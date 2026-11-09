import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * MSK-004 — Détection avancée (CamemBERT-NER) sur la page ner.html.
 * La page par défaut ne change pas : aucun panneau, CSP connect-src 'none'.
 * Le parcours complet ne tourne que si le modèle a été téléchargé
 * (scripts/telecharger-modele.sh), car il n'est pas dans le dépôt.
 */
test.use({ locale: 'fr-FR' });

const MODELE_PRESENT = existsSync('public/modeles/Xenova/camembert-ner/onnx/model_quantized.onnx');

const TEXTE = [
  'Patient : Sophie Lambert, suivie au cabinet de Lyon.',
  '',
  'Elle vit avec son frère Julien Lambert depuis mars.',
].join('\n');

test('la page par défaut garde connect-src none et ne propose pas la détection avancée', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("connect-src 'none'");
  await expect(page.getByText(/Détection avancée/i)).toHaveCount(0);
});

test('ner.html a son propre CSP et attend un clic avant de télécharger', async ({ page }) => {
  const requetes: string[] = [];
  page.on('request', r => requetes.push(r.url()));
  await page.goto('/ner.html');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain("'wasm-unsafe-eval'");
  await expect(page.getByRole('button', { name: /Activer la détection avancée/ })).toBeVisible();
  expect(requetes.some(u => u.includes('/modeles/'))).toBe(false);
});

test('ner.html prévient sans rien télécharger si le navigateur ne gère pas WebAssembly', async ({ page }) => {
  // Simule un navigateur sans WebAssembly (ancien, ou Mode Isolement d'Apple)
  await page.addInitScript(() => { delete (globalThis as { WebAssembly?: unknown }).WebAssembly; });
  const requetes: string[] = [];
  page.on('request', r => requetes.push(r.url()));
  await page.goto('/ner.html');
  await expect(page.getByText(/Votre navigateur ne permet pas la détection avancée/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Activer la détection avancée/ })).toHaveCount(0);
  expect(requetes.some(u => u.includes('/modeles/') || u.includes('/ort/'))).toBe(false);
});

test('ner.html propose les noms trouvés comme suggestions à valider', async ({ page }) => {
  test.skip(!MODELE_PRESENT, 'modèle absent : lancer scripts/telecharger-modele.sh');
  test.setTimeout(180_000);
  const horsSite: string[] = [];
  page.on('request', r => { if (!/^(http:\/\/localhost|blob:|data:)/.test(r.url())) horsSite.push(r.url()); });
  await page.goto('/ner.html');
  await page.locator('input[type=file][accept=".docx,.txt,.md"]').setInputFiles({
    name: 'rapport.md', mimeType: 'text/markdown', buffer: Buffer.from(TEXTE),
  });
  await page.getByRole('button', { name: /Activer la détection avancée/ }).click();
  await expect(page.getByText(/Modèle prêt/)).toBeVisible({ timeout: 150_000 });
  await page.getByRole('button', { name: "Lancer l'analyse" }).click();
  const accepter = page.getByRole('button', { name: 'Accepter Sophie Lambert' });
  await expect(accepter).toBeVisible({ timeout: 60_000 });
  // Rien n'est pseudonymisé avant acceptation
  await expect(page.getByText('[PERSONNE]')).toHaveCount(0);
  await accepter.click();
  await expect(page.getByText('[PERSONNE]').first()).toBeVisible();
  expect(horsSite).toEqual([]);
});
