import { describe, it, expect } from 'vitest';
import {
  detecterContexte,
  detecterPrenoms,
  estDebutDePhrase,
  normaliserPrenom,
  retirerChevauchements,
} from './detectionContextuelle';
import { PRENOMS, PRENOMS_AMBIGUS } from './prenoms';

function valeurs(texte: string, type?: string): string[] {
  return detecterContexte(texte)
    .filter(d => !type || d.type === type)
    .map(d => d.valeur);
}

describe('PRENOMS', () => {
  it('contient des prénoms courants et récents', () => {
    for (const p of ['JEAN', 'MARIE', 'LUCAS', 'EMMA', 'INES', 'MOHAMED']) {
      expect(PRENOMS.has(p)).toBe(true);
    }
  });

  it('exclut les civilités et les mots qui ne sont pas des prénoms', () => {
    for (const p of ['MME', 'MLLE', 'PARIS', 'FEMME', 'MEDICAL']) {
      expect(PRENOMS.has(p)).toBe(false);
    }
  });

  it('marque comme ambigus les prénoms qui sont aussi des mots courants', () => {
    expect(PRENOMS_AMBIGUS.has('ROSE')).toBe(true);
    expect(PRENOMS_AMBIGUS.has('PIERRE')).toBe(true);
    expect(PRENOMS_AMBIGUS.has('LUCAS')).toBe(false);
  });
});

describe('normaliserPrenom', () => {
  it('retire les accents et passe en majuscules', () => {
    expect(normaliserPrenom('Inès')).toBe('INES');
    expect(normaliserPrenom('Chloé')).toBe('CHLOE');
  });
});

describe('estDebutDePhrase', () => {
  it('reconnaît le début du texte, de ligne et après un point', () => {
    expect(estDebutDePhrase('Rose', 0)).toBe(true);
    expect(estDebutDePhrase('Bilan\nRose', 6)).toBe(true);
    expect(estDebutDePhrase('Fin. Rose', 5)).toBe(true);
    expect(estDebutDePhrase('- « Rose', 4)).toBe(true);
  });

  it('renvoie faux au milieu d\'une phrase', () => {
    expect(estDebutDePhrase('avec Rose', 5)).toBe(false);
  });
});

describe('retirerChevauchements', () => {
  it('garde la détection la plus longue', () => {
    const r = retirerChevauchements([
      { valeur: 'mars 2024', type: 'DATE', position: 3, longueur: 9 },
      { valeur: '12 mars 2024', type: 'DATE', position: 0, longueur: 12 },
    ]);
    expect(r.map(d => d.valeur)).toEqual(['12 mars 2024']);
  });

  it('garde les détections disjointes', () => {
    const r = retirerChevauchements([
      { valeur: 'a', type: 'DATE', position: 0, longueur: 1 },
      { valeur: 'b', type: 'DATE', position: 5, longueur: 1 },
    ]);
    expect(r).toHaveLength(2);
  });
});

describe('detecterContexte — dates', () => {
  it('détecte les dates numériques', () => {
    expect(valeurs('Vu le 03/10/2026, puis le 4-11-26 et le 05.12.2026.', 'DATE'))
      .toEqual(['03/10/2026', '4-11-26', '05.12.2026']);
  });

  it('détecte les dates en toutes lettres, avec ou sans jour de la semaine', () => {
    expect(valeurs('Né le 12 mars 2015. RDV lundi 1er juin 2026, puis le 3 Mai.', 'DATE'))
      .toEqual(['12 mars 2015', 'lundi 1er juin 2026', '3 Mai']);
  });

  it('détecte « mois année » sans doublon avec la date complète', () => {
    expect(valeurs('Depuis septembre 2024 et le 2 octobre 2025.', 'DATE'))
      .toEqual(['septembre 2024', '2 octobre 2025']);
  });

  it('ne confond pas une adresse IP avec une date', () => {
    expect(valeurs('IP 10.12.1.20', 'DATE')).toEqual([]);
  });
});

describe('detecterContexte — personnes', () => {
  it('retient le nom après une civilité, sans la civilité', () => {
    expect(valeurs('Mme Dupont et le Dr Marie Martin sont venus.', 'PERSONNE'))
      .toEqual(['Dupont', 'Marie Martin']);
  });

  it('retient une initiale suivie d\'un nom, ou une initiale seule', () => {
    expect(valeurs('Le Dr L. Moreau a vu Mme B. hier.', 'PERSONNE'))
      .toEqual(['L. Moreau', 'B.']);
  });

  it('détecte les initiales mais pas les sigles', () => {
    expect(valeurs('J.D. et A. B. sont suivis au C.M.P. de la ville.', 'PERSONNE'))
      .toEqual(['J.D.', 'A. B.']);
  });
});

describe('detecterPrenoms', () => {
  it('détecte un prénom seul, avec accent ou composé', () => {
    expect(detecterPrenoms('Il joue avec Inès et Jean-Pierre.').map(d => d.valeur))
      .toEqual(['Inès', 'Jean-Pierre']);
  });

  it('associe le nom qui suit le prénom', () => {
    expect(detecterPrenoms('Patient : Lucas Martin, 10 ans.').map(d => d.valeur))
      .toEqual(['Lucas Martin']);
    expect(detecterPrenoms('Patiente : Emma DUPONT').map(d => d.valeur))
      .toEqual(['Emma DUPONT']);
  });

  it('ignore un prénom ambigu en début de phrase', () => {
    expect(detecterPrenoms('Pierre angulaire du suivi.')).toEqual([]);
  });

  it('garde un prénom ambigu au milieu d\'une phrase', () => {
    expect(detecterPrenoms('Il parle de Rose.').map(d => d.valeur)).toEqual(['Rose']);
  });

  it('garde un prénom ambigu en début de phrase s\'il apparaît ailleurs avec un nom', () => {
    expect(detecterPrenoms('Rose dit que Rose Bernard viendra.').map(d => d.valeur))
      .toEqual(['Rose Bernard', 'Rose']);
  });

  it('ignore les mots qui ne sont pas des prénoms', () => {
    expect(detecterPrenoms('Bonjour, Bilan Psychologique du Centre.')).toEqual([]);
  });
});

describe('detecterContexte — adresses', () => {
  it('détecte une adresse complète avec code postal', () => {
    expect(valeurs('Domicile : 12 bis, rue de la République, 75012 Paris.', 'ADRESSE'))
      .toEqual(['12 bis, rue de la République, 75012 Paris']);
  });

  it('détecte une voie seule', () => {
    expect(valeurs('Il habite 4 avenue Jean Jaurès depuis peu.', 'ADRESSE'))
      .toEqual(['4 avenue Jean Jaurès']);
  });

  it('détecte un code postal suivi d\'une ville composée', () => {
    expect(valeurs('Scolarisé à 42000 Saint-Étienne.', 'ADRESSE'))
      .toEqual(['42000 Saint-Étienne']);
  });
});

describe('detecterContexte — texte sans donnée', () => {
  it('ne détecte rien dans un texte neutre', () => {
    expect(detecterContexte('Le patient présente une anxiété modérée. La pierre tombe.')).toEqual([]);
  });

  it('renvoie des positions cohérentes avec le texte', () => {
    const texte = 'Vu Mme Dupont le 03/10/2026.';
    for (const d of detecterContexte(texte)) {
      expect(texte.slice(d.position, d.position + d.longueur)).toBe(d.valeur);
    }
  });
});
