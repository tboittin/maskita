import { describe, it, expect } from 'vitest';
import { detecterContexte, retirerChevauchements } from './detectionContextuelle';

function valeurs(texte: string, type?: string): string[] {
  return detecterContexte(texte)
    .filter(d => !type || d.type === type)
    .map(d => d.valeur);
}

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

  it('ne détecte pas les noms de personnes', () => {
    expect(detecterContexte('Mme Nathalie Dubois et Lucas sont venus.')).toEqual([]);
  });

  it('renvoie des positions cohérentes avec le texte', () => {
    const texte = 'Vu le 03/10/2026 au 4 rue des Lilas, 69003 Lyon.';
    for (const d of detecterContexte(texte)) {
      expect(texte.slice(d.position, d.position + d.longueur)).toBe(d.valeur);
    }
  });
});
