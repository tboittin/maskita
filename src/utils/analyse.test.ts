import { describe, it, expect, beforeEach } from 'vitest';
import { analyserTexte, deduplicator, resoudreConflitsSousChaine, fusionnerAvecMappingExistant } from './analyse';
import { reinitialiserCompteurs } from './mapping';

describe('analyserTexte', () => {
  it('detecte des PII dans un texte', () => {
    const texte = 'Contactez-moi à contact@exemple.fr ou au 06 12 34 56 78.';
    const resultats = analyserTexte(texte);

    expect(resultats.length).toBe(2);
    expect(resultats[0].type).toBe('EMAIL');
    expect(resultats[1].type).toBe('TEL');
  });

  it('retourne un tableau vide pour un texte sans PII', () => {
    const resultats = analyserTexte('Bonjour, ceci est un texte simple.');
    expect(resultats).toHaveLength(0);
  });

  it('detecte plusieurs occurrences du même type', () => {
    const texte = 'a@a.com et b@b.com';
    const resultats = analyserTexte(texte);

    expect(resultats.length).toBe(2);
    expect(resultats.every(r => r.type === 'EMAIL')).toBe(true);
  });

  it('enregistre les positions correctes', () => {
    const texte = 'email: test@exemple.fr';
    const resultats = analyserTexte(texte);

    expect(resultats[0].position).toBe(7);
    expect(resultats[0].longueur).toBe('test@exemple.fr'.length);
  });
});

describe('deduplicator', () => {
  it('deduplique les valeurs identiques', () => {
    const resultats = analyserTexte('a@a.com et a@a.com');
    const groupes = deduplicator(resultats);

    expect(groupes).toHaveLength(1);
    expect(groupes[0].valeurs).toHaveLength(1);
  });

  it('ignore les différences de casse et d\'espacement', () => {
    const resultats = analyserTexte('06 12 34 56 78 et 06.12.34.56.78');
    const groupes = deduplicator(resultats);

    const tel = groupes.find(g => g.type === 'TEL');
    expect(tel?.valeurs).toHaveLength(1);
  });
});

describe('resoudreConflitsSousChaine', () => {
  it('supprime la plus courte quand une valeur est sous-chaine', () => {
    const detections = [
      { valeur: '15 rue Gambetta, 24000', type: 'ADRESSE' as any, position: 0, longueur: 22 },
      { valeur: 'rue Gambetta', type: 'ADRESSE' as any, position: 3, longueur: 12 },
    ];

    const { net, conflits } = resoudreConflitsSousChaine(detections);

    expect(net).toHaveLength(1);
    expect(net[0].valeur).toBe('15 rue Gambetta, 24000');
    expect(conflits).toHaveLength(1);
  });

  it('ne supprime rien si pas de sous-chaine', () => {
    const detections = [
      { valeur: 'Sophie Lambert', type: 'PERSONNE' as any, position: 0, longueur: 14 },
      { valeur: '15 rue Gambetta', type: 'ADRESSE' as any, position: 20, longueur: 16 },
    ];

    const { net, conflits } = resoudreConflitsSousChaine(detections);

    expect(net).toHaveLength(2);
    expect(conflits).toHaveLength(0);
  });
});

describe('fusionnerAvecMappingExistant', () => {
  beforeEach(() => reinitialiserCompteurs());

  it('crée un mapping à partir de zéro si pas de clé existante', () => {
    const detections = analyserTexte('Contact : test@exemple.fr');
    const mapping = fusionnerAvecMappingExistant(null, detections);

    expect(mapping['[EMAIL]']).toEqual(['test@exemple.fr']);
  });

  it('conserve les valeurs du mapping existant', () => {
    const existant = { '[PERSONNE]': ['Sophie Lambert'] };
    const detections = analyserTexte('Contact : test@exemple.fr');

    const mapping = fusionnerAvecMappingExistant(existant, detections);

    expect(mapping['[PERSONNE]']).toEqual(['Sophie Lambert']);
    expect(mapping['[EMAIL]']).toEqual(['test@exemple.fr']);
  });

  it('ne duplique pas une valeur déjà présente', () => {
    const existant = { '[EMAIL]': ['test@exemple.fr'] };
    const detections = analyserTexte('Email : test@exemple.fr');

    const mapping = fusionnerAvecMappingExistant(existant, detections);

    expect(mapping['[EMAIL]']).toEqual(['test@exemple.fr']);
  });

  it('ajoute une nouvelle valeur à un tag existant de même type', () => {
    const existant = { '[EMAIL]': ['ancien@exemple.fr'] };
    const detections = analyserTexte('nouveau@exemple.fr');

    const mapping = fusionnerAvecMappingExistant(existant, detections);

    expect(mapping['[EMAIL]']).toContain('ancien@exemple.fr');
    expect(mapping['[EMAIL]']).toContain('nouveau@exemple.fr');
  });
});