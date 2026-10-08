import { test, expect } from '@playwright/test';

const OG_TAGS: { selector: string; attr: string; expected: string }[] = [
  {
    selector: 'meta[name="description"]',
    attr: 'content',
    expected:
      'Pseudonymisation et restauration de documents .docx, .md et .txt dans le navigateur. Aucun serveur, open source.',
  },
  { selector: 'meta[property="og:type"]', attr: 'content', expected: 'website' },
  {
    selector: 'meta[property="og:url"]',
    attr: 'content',
    expected: 'https://maskita.vercel.app/',
  },
  {
    selector: 'meta[property="og:title"]',
    attr: 'content',
    expected:
      'Maskita — Pseudonymisez vos documents localement avant de les confier à une IA',
  },
  {
    selector: 'meta[property="og:description"]',
    attr: 'content',
    expected:
      'Pseudonymisation et restauration de documents .docx, .md et .txt dans le navigateur. Aucun serveur, open source.',
  },
  {
    selector: 'meta[property="og:image"]',
    attr: 'content',
    expected: 'https://maskita.vercel.app/og-image.png',
  },
  {
    selector: 'meta[property="og:site_name"]',
    attr: 'content',
    expected: 'Maskita',
  },
  {
    selector: 'meta[property="og:image:width"]',
    attr: 'content',
    expected: '1200',
  },
  {
    selector: 'meta[property="og:image:height"]',
    attr: 'content',
    expected: '630',
  },
  {
    selector: 'meta[property="og:image:alt"]',
    attr: 'content',
    expected:
      'Maskita : un document dont les noms sont remplacés par des tags [PERSONNE]',
  },
  {
    selector: 'meta[property="og:locale"]',
    attr: 'content',
    expected: 'fr_FR',
  },
  {
    selector: 'meta[name="twitter:card"]',
    attr: 'content',
    expected: 'summary_large_image',
  },
];

test.describe('US-OG-01 — Balises Open Graph et Twitter Card', () => {
  test('toutes les balises meta OG et Twitter sont présentes dans le <head>', async ({
    page,
  }) => {
    await page.goto('/');

    for (const tag of OG_TAGS) {
      const el = page.locator(tag.selector);
      await expect(el).toBeAttached({ timeout: 5000 });
      expect(await el.getAttribute(tag.attr)).toBe(tag.expected);
    }
  });
});