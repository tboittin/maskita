import { describe, it, expect } from 'vitest';
import {
  alignerJetons,
  decouperTexte,
  regrouperEntites,
  versDetections,
  type JetonNer,
} from './regroupement';

/** Fabrique des jetons à partir de couples [mot, étiquette]. */
function jetons(...paires: [string, string, number?][]): JetonNer[] {
  return paires.map(([word, entity, score]) => ({ word, entity, score: score ?? 0.9 }));
}

describe('decouperTexte', () => {
  it('découpe par paragraphes en gardant les positions d’origine', () => {
    const texte = 'Premier paragraphe.\n\n  Second paragraphe.\n';
    const morceaux = decouperTexte(texte);
    expect(morceaux.map(m => m.texte)).toEqual(['Premier paragraphe.', 'Second paragraphe.']);
    for (const m of morceaux) {
      expect(texte.slice(m.decalage, m.decalage + m.texte.length)).toBe(m.texte);
    }
  });

  it('coupe un paragraphe trop long à la fin d’une phrase', () => {
    const phrase = 'Une phrase assez longue pour remplir. ';
    const texte = phrase.repeat(10).trim();
    const morceaux = decouperTexte(texte, 100);
    expect(morceaux.length).toBeGreaterThan(1);
    for (const m of morceaux) {
      expect(m.texte.length).toBeLessThanOrEqual(100);
      expect(texte.slice(m.decalage, m.decalage + m.texte.length)).toBe(m.texte);
      expect(m.texte.endsWith('.')).toBe(true);
    }
  });

  it('coupe sur un espace s’il n’y a pas de fin de phrase', () => {
    const texte = 'mot '.repeat(50).trim();
    const morceaux = decouperTexte(texte, 30);
    expect(morceaux.every(m => m.texte.length <= 30)).toBe(true);
    expect(morceaux.map(m => m.texte).join(' ')).toBe(texte);
  });

  it('renvoie une liste vide pour un texte vide', () => {
    expect(decouperTexte('\n\n  \n')).toEqual([]);
  });
});

describe('alignerJetons', () => {
  it('retrouve la position de chaque jeton', () => {
    const texte = 'Mme Claire Lambert, née';
    const pos = alignerJetons(texte, jetons(['Mme', 'O'], ['Claire', 'I-PER'], ['Lambert', 'I-PER'], [',', 'O'], ['née', 'O']));
    expect(pos.map(p => p && texte.slice(p.debut, p.fin))).toEqual(['Mme', 'Claire', 'Lambert', ',', 'née']);
  });

  it('retire le marqueur de début de mot SentencePiece', () => {
    const pos = alignerJetons('Paris', jetons(['▁Paris', 'I-LOC']));
    expect(pos[0]).toEqual({ debut: 0, fin: 5 });
  });

  it('donne null à un jeton introuvable sans perdre la suite', () => {
    const texte = 'Jean Dupont';
    const pos = alignerJetons(texte, jetons(['Jean', 'I-PER'], ['???', 'O'], ['Dupont', 'I-PER']));
    expect(pos[1]).toBeNull();
    expect(pos[2]).toEqual({ debut: 5, fin: 11 });
  });

  it('ne saute pas loin vers une autre occurrence', () => {
    const texte = 'abc ' + 'x'.repeat(20) + ' Paris';
    const pos = alignerJetons(texte, jetons(['abc', 'O'], ['Paris', 'I-LOC']));
    expect(pos[1]).toBeNull();
  });
});

describe('regrouperEntites', () => {
  it('regroupe les jetons consécutifs de même étiquette', () => {
    const morceau = { texte: 'Mme Claire Lambert, née à Saint-Étienne.', decalage: 100 };
    const entites = regrouperEntites(morceau, jetons(
      ['Mme', 'O'], ['Claire', 'I-PER', 0.6], ['Lambert', 'I-PER', 0.8], [',', 'O'],
      ['née', 'O'], ['à', 'O'], ['Saint', 'I-LOC'], ['-', 'I-LOC'], ['Étienne', 'I-LOC'], ['.', 'O'],
    ));
    expect(entites.map(e => [e.etiquette, e.valeur])).toEqual([
      ['PER', 'Claire Lambert'],
      ['LOC', 'Saint-Étienne'],
    ]);
    expect(entites[0].debut).toBe(104);
    expect(entites[0].fin).toBe(118);
    expect(entites[0].score).toBeCloseTo(0.7);
  });

  it('élargit une entité coupée au milieu d’un mot', () => {
    const entites = regrouperEntites({ texte: 'Vu Lambertini hier', decalage: 0 }, jetons(
      ['Vu', 'O'], ['Lamb', 'I-PER'], ['ertini', 'O'], ['hier', 'O'],
    ));
    expect(entites.map(e => e.valeur)).toEqual(['Lambertini']);
  });

  it('retire un titre en tête (Dr., Mme…)', () => {
    const entites = regrouperEntites({ texte: 'Dr. Laurence Petit', decalage: 0 }, jetons(
      ['Dr', 'I-PER'], ['.', 'I-PER'], ['Laurence', 'I-PER'], ['Petit', 'I-PER'],
    ));
    expect(entites.map(e => e.valeur)).toEqual(['Laurence Petit']);
    expect(entites[0].debut).toBe(4);
  });

  it('sépare deux entités d’étiquettes différentes accolées', () => {
    const entites = regrouperEntites({ texte: 'Lefèvre Horlogerie Périgueux', decalage: 0 }, jetons(
      ['Lefèvre', 'I-ORG'], ['Horlogerie', 'I-ORG'], ['Périgueux', 'I-LOC'],
    ));
    expect(entites.map(e => [e.etiquette, e.valeur])).toEqual([
      ['ORG', 'Lefèvre Horlogerie'],
      ['LOC', 'Périgueux'],
    ]);
  });

  it('ouvre une nouvelle entité sur un B-', () => {
    const entites = regrouperEntites({ texte: 'Paul Marie', decalage: 0 }, jetons(
      ['Paul', 'B-PER'], ['Marie', 'B-PER'],
    ));
    expect(entites.map(e => e.valeur)).toEqual(['Paul', 'Marie']);
  });

  it('ignore la ponctuation seule', () => {
    const entites = regrouperEntites({ texte: 'a - b', decalage: 0 }, jetons(
      ['a', 'O'], ['-', 'I-LOC'], ['b', 'O'],
    ));
    expect(entites).toEqual([]);
  });
});

describe('versDetections', () => {
  const base = { debut: 10, fin: 16, score: 0.9 };

  it('convertit PER, LOC et ORG en types Maskita', () => {
    const d = versDetections([
      { ...base, valeur: 'Dupont', etiquette: 'PER' },
      { ...base, valeur: 'Lyon', etiquette: 'LOC', fin: 14 },
      { ...base, valeur: 'CMP Est', etiquette: 'ORG', fin: 17 },
    ]);
    expect(d.map(x => [x.type, x.valeur])).toEqual([
      ['PERSONNE', 'Dupont'],
      ['LIEU', 'Lyon'],
      ['ETABLISSEMENT', 'CMP Est'],
    ]);
    expect(d[0]).toMatchObject({ position: 10, longueur: 6 });
  });

  it('écarte MISC, les scores faibles et les entités d’une lettre', () => {
    const d = versDetections([
      { ...base, valeur: 'CIM-11', etiquette: 'MISC' },
      { ...base, valeur: 'lambert', etiquette: 'PER', score: 0.4 },
      { ...base, valeur: 'I', etiquette: 'LOC' },
    ]);
    expect(d).toEqual([]);
  });

  it('accepte un seuil personnalisé', () => {
    const d = versDetections([{ ...base, valeur: 'lambert', etiquette: 'PER', score: 0.4 }], 0.3);
    expect(d).toHaveLength(1);
  });
});
