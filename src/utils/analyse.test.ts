import { describe, it, expect, beforeEach } from 'vitest';
import { analyserTexte, deduplicator, resoudreConflitsSousChaine, fusionnerAvecMappingExistant, trouverPersonneLiee } from './analyse';
import { reinitialiserCompteurs, restaurerTexte } from './mapping';
import type { Detection } from './regex';

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

  // DET-01 — Détection insensible à la casse (la forme d'origine est conservée)
  it('regroupe Lefevre et lefevre dans une seule entrée, en gardant la forme d\'origine', () => {
    const detections: Detection[] = [
      { valeur: 'Lefevre', type: 'PERSONNE' as any, position: 0, longueur: 7 },
      { valeur: 'lefevre', type: 'PERSONNE' as any, position: 10, longueur: 7 },
    ];

    const mapping = fusionnerAvecMappingExistant(null, detections);

    expect(Object.keys(mapping)).toHaveLength(1);
    // Déduplication insensible à la casse : une seule entrée, « Lefevre »
    // (la première forme vue, déjà capitalisée, n'est pas dégradée).
    expect(mapping['[PERSONNE]']).toEqual(['Lefevre']);
  });

  it('regroupe "Henri Lefevre" et "henri lefevre" dans une seule entrée', () => {
    const detections: Detection[] = [
      { valeur: 'Henri Lefevre', type: 'PERSONNE' as any, position: 0, longueur: 13 },
      { valeur: 'henri lefevre', type: 'PERSONNE' as any, position: 25, longueur: 13 },
    ];

    const mapping = fusionnerAvecMappingExistant(null, detections);

    expect(Object.keys(mapping)).toHaveLength(1);
    expect(mapping['[PERSONNE]']).toEqual(['Henri Lefevre']);
  });

  it('même pseudo pour deux variantes de casse (insensibilité à la casse)', () => {
    const detections: Detection[] = [
      { valeur: 'Lefevre', type: 'PERSONNE' as any, position: 0, longueur: 7 },
      { valeur: 'lefevre', type: 'PERSONNE' as any, position: 10, longueur: 7 },
    ];

    const mapping = fusionnerAvecMappingExistant(null, detections);
    const pseudo = Object.keys(mapping)[0];

    // Les deux variantes aboutissent à la même valeur de pseudo
    expect(mapping[pseudo]).toEqual(['Lefevre']);
  });

  it('conserve la forme capitalisée quand la première vue était en minuscules', () => {
    const detections: Detection[] = [
      { valeur: 'lucas martin', type: 'PERSONNE' as any, position: 0, longueur: 12 },
      { valeur: 'Lucas Martin', type: 'PERSONNE' as any, position: 20, longueur: 12 },
    ];

    const mapping = fusionnerAvecMappingExistant(null, detections);

    expect(Object.keys(mapping)).toHaveLength(1);
    expect(mapping['[PERSONNE]']).toEqual(['Lucas Martin']);
  });

  it('ne capitalise pas un email en minuscules (pas de casse abusive)', () => {
    const detections: Detection[] = [
      { valeur: 'lucas.martin@exemple.fr', type: 'EMAIL' as any, position: 0, longueur: 23 },
      { valeur: 'lucas.martin@exemple.fr', type: 'EMAIL' as any, position: 30, longueur: 23 },
    ];

    const mapping = fusionnerAvecMappingExistant(null, detections);

    expect(Object.keys(mapping)).toHaveLength(1);
    expect(mapping['[EMAIL]']).toEqual(['lucas.martin@exemple.fr']);
  });
});
describe('analyserTexte — détection contextuelle (DET-AUTO)', () => {
  it('ajoute les personnes, dates et adresses aux détections regex', () => {
    const types = analyserTexte('Mme Dupont, née le 12/03/1980, tél. 06 12 34 56 78.').map(d => d.type);
    expect(types).toEqual(['TEL', 'PERSONNE', 'DATE']);
  });
});

describe('trouverPersonneLiee', () => {
  it('rattache un prénom seul à la seule personne qui le contient', () => {
    const mapping = { '[PERSONNE]': ['Lucas Martin'], '[PERSONNE_2]': ['Emma Dupont'] };
    expect(trouverPersonneLiee(mapping, 'Lucas')).toBe('[PERSONNE]');
    expect(trouverPersonneLiee(mapping, 'dupont')).toBe('[PERSONNE_2]');
  });

  it('ne rattache rien en cas d\'ambiguïté ou pour une valeur de plusieurs mots', () => {
    const mapping = { '[PERSONNE]': ['Paul Dupont'], '[PERSONNE_2]': ['Emma Dupont'] };
    expect(trouverPersonneLiee(mapping, 'Dupont')).toBeNull();
    expect(trouverPersonneLiee(mapping, 'Paul Dupont')).toBeNull();
  });

  it('ignore les tags qui ne sont pas des personnes', () => {
    expect(trouverPersonneLiee({ '[LIEU]': ['Saint Lucas'] }, 'Lucas')).toBeNull();
  });
});

describe('fusionnerAvecMappingExistant — entités (DET-AUTO)', () => {
  beforeEach(() => reinitialiserCompteurs());

  it('crée un tag par personne', () => {
    const mapping = fusionnerAvecMappingExistant(null, analyserTexte('Lucas Martin voit Emma Dupont.'));
    expect(mapping).toEqual({ '[PERSONNE]': ['Lucas Martin'], '[PERSONNE_2]': ['Emma Dupont'] });
  });

  it('conserve la casse d\'origine et la restitue à la restauration', () => {
    const mapping = fusionnerAvecMappingExistant(null, analyserTexte('Patient : Lucas Martin, 10 ans.'));
    expect(mapping['[PERSONNE]']).toEqual(['Lucas Martin']);
    expect(restaurerTexte('Le patient [PERSONNE] va bien.', mapping))
      .toBe('Le patient Lucas Martin va bien.');
  });

  it('rattache le prénom seul au nom complet', () => {
    const mapping = fusionnerAvecMappingExistant(null, analyserTexte('Lucas Martin, 10 ans. Lucas dessine.'));
    expect(mapping).toEqual({ '[PERSONNE]': ['Lucas Martin', 'Lucas'] });
  });

  it('crée un tag par date distincte', () => {
    const mapping = fusionnerAvecMappingExistant(null, analyserTexte('Le 01/02/2026 puis le 03/04/2026.'));
    expect(Object.keys(mapping)).toHaveLength(2);
  });

  it('rattache un prénom à une personne d\'une clé chargée', () => {
    const mapping = fusionnerAvecMappingExistant(
      { '[PERSONNE]': ['lucas martin'] },
      analyserTexte('Lucas va mieux.'),
    );
    expect(mapping).toEqual({ '[PERSONNE]': ['lucas martin', 'Lucas'] });
  });

  it('ne duplique pas une personne déjà présente dans la clé et améliore sa forme', () => {
    const mapping = fusionnerAvecMappingExistant(
      { '[PERSONNE]': ['emma dupont'] },
      analyserTexte('Emma Dupont va mieux.'),
    );
    expect(mapping).toEqual({ '[PERSONNE]': ['Emma Dupont'] });
  });
});
