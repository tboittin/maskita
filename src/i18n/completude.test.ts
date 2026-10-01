import { describe, it, expect } from 'vitest';
import { fr, type Dictionnaire } from './fr';
import { en } from './en';

// Arguments d'exemple adaptés aux signatures des fonctions de traduction.
const ARGUMENTS_EXEMPLES: unknown[] = [
  'valeur-exemple',
  'nom-exemple',
  3,
  '.docx, .txt, .md',
];

describe('Dictionnaires i18n (fr/en)', () => {
  it('fr et en exposent exactement les mêmes clés', () => {
    const clesFr = new Set(Object.keys(fr));
    const clesEn = new Set(Object.keys(en));

    const manquantesEn = [...clesFr].filter(k => !clesEn.has(k));
    const manquantesFr = [...clesEn].filter(k => !clesFr.has(k));

    expect(manquantesEn).toEqual([]);
    expect(manquantesFr).toEqual([]);
  });

  it('toutes les valeurs (fr) sont des chaînes ou des fonctions', () => {
    for (const valeur of Object.values(fr)) {
      expect(typeof valeur === 'string' || typeof valeur === 'function').toBe(true);
    }
  });

  it('les fonctions de traduction (fr) retournent une chaîne', () => {
    for (const [cle, valeur] of Object.entries(fr)) {
      if (typeof valeur !== 'function') continue;
      const resultat = (valeur as (...a: unknown[]) => string)(...ARGUMENTS_EXEMPLES);
      expect(typeof resultat, `clé ${cle}`).toBe('string');
      expect((resultat as string).length).toBeGreaterThan(0);
    }
  });

  it('les fonctions de traduction (en) retournent une chaîne', () => {
    for (const [cle, valeur] of Object.entries(en)) {
      if (typeof valeur !== 'function') continue;
      const resultat = (valeur as (...a: unknown[]) => string)(...ARGUMENTS_EXEMPLES);
      expect(typeof resultat, `clé ${cle}`).toBe('string');
      expect((resultat as string).length).toBeGreaterThan(0);
    }
  });

  it('le format des fonctions du dictionnaire fr est conservé dans en', () => {
    const dictionnaire: Dictionnaire = fr;
    for (const cle of Object.keys(dictionnaire)) {
      expect(typeof fr[cle as keyof typeof fr]).toBe(typeof en[cle as keyof typeof en]);
    }
  });
});
