import { describe, it, expect } from 'vitest';
import {
  extraireMots,
  filtrerParPrefixe,
  existeCorrespondanceExacte,
} from './tokenisation';

describe('extraireMots', () => {
  it('extrait les mots uniques depuis un texte simple', () => {
    expect(extraireMots('M. Lefevre est médecin')).toEqual(['M', 'Lefevre', 'est', 'médecin']);
  });

  it('déduplique les mots identiques', () => {
    expect(extraireMots('chat chat chien chat')).toEqual(['chat', 'chien']);
  });

  it('ignore les tokens vides', () => {
    expect(extraireMots('un  deux   trois')).toEqual(['un', 'deux', 'trois']);
  });

  it('découpe sur la ponctuation', () => {
    expect(extraireMots('Mot; autre: fin!')).toEqual(['Mot', 'autre', 'fin']);
  });

  it('retourne un tableau vide pour un texte vide', () => {
    expect(extraireMots('')).toEqual([]);
  });

  it('retourne un tableau vide pour null/undefined', () => {
    expect(extraireMots(null as unknown as string)).toEqual([]);
    expect(extraireMots(undefined as unknown as string)).toEqual([]);
  });

  it('gère les crochets (ne les garde pas comme mots)', () => {
    const mots = extraireMots('Contact [PERSONNE] test');
    // Les crochets sont des séparateurs, les mots sont les tokens entre
    expect(mots).toContain('Contact');
    expect(mots).toContain('PERSONNE');
    expect(mots).toContain('test');
  });
});

describe('filtrerParPrefixe', () => {
  const mots = ['Lefevre', 'Martin', 'M.', 'Legrand', 'lefevre'];

  it('filtre les mots par préfixe insensible à la casse', () => {
    expect(filtrerParPrefixe(mots, 'le')).toEqual(['Lefevre', 'Legrand', 'lefevre']);
  });

  it('retourne un tableau vide si le préfixe est vide', () => {
    expect(filtrerParPrefixe(mots, '')).toEqual([]);
  });

  it("n'inclut pas le mot qui correspond exactement au préfixe", () => {
    const m = ['Mot', 'Motif', 'moteur'];
    expect(filtrerParPrefixe(m, 'Mot')).toEqual(['Motif', 'moteur']);
  });

  it('respecte la limite optionnelle', () => {
    const m = ['aa', 'ab', 'ac', 'ad', 'ae'];
    expect(filtrerParPrefixe(m, 'a', 3)).toEqual(['aa', 'ab', 'ac']);
    expect(filtrerParPrefixe(m, 'a', 5)).toEqual(['aa', 'ab', 'ac', 'ad', 'ae']);
    expect(filtrerParPrefixe(m, 'a', 10)).toEqual(['aa', 'ab', 'ac', 'ad', 'ae']);
  });

  it('retourne un tableau vide si aucun mot ne correspond', () => {
    expect(filtrerParPrefixe(mots, 'xyz')).toEqual([]);
  });
});

describe('existeCorrespondanceExacte', () => {
  const mots = ['Lefevre', 'M.', 'Martin', '12 rue de Paris'];

  it('détecte une correspondance exacte insensible à la casse', () => {
    expect(existeCorrespondanceExacte(mots, 'lefevre')).toBe(true);
    expect(existeCorrespondanceExacte(mots, 'LEFEVRE')).toBe(true);
    expect(existeCorrespondanceExacte(mots, 'Lefevre')).toBe(true);
  });

  it("retourne false si le mot n'existe pas", () => {
    expect(existeCorrespondanceExacte(mots, 'Legrand')).toBe(false);
  });

  it('retourne false pour une chaîne vide', () => {
    expect(existeCorrespondanceExacte(mots, '')).toBe(false);
    expect(existeCorrespondanceExacte(mots, '   ')).toBe(false);
  });

  it('retourne false pour un préfixe (non exact)', () => {
    expect(existeCorrespondanceExacte(mots, 'Le')).toBe(false);
    expect(existeCorrespondanceExacte(mots, 'Mar')).toBe(false);
  });

  it('gère les valeurs avec espaces', () => {
    expect(existeCorrespondanceExacte(mots, '12 rue de Paris')).toBe(true);
  });
});