import { describe, it, expect, beforeEach } from 'vitest';
import {
  reinitialiserCompteurs,
  genererTag,
  genererMapping,
  appliquerMapping,
  restaurerTexte,
  genererCleJson,
  chargerCleJson,
  nomContientValeursMapping,
} from './mapping';

describe('genererTag', () => {
  beforeEach(() => reinitialiserCompteurs());

  it('génère [TYPE] pour la première occurrence', () => {
    expect(genererTag('PERSONNE')).toBe('[PERSONNE]');
  });

  it('génère [TYPE_2] pour la deuxième occurrence', () => {
    genererTag('PERSONNE');
    expect(genererTag('PERSONNE')).toBe('[PERSONNE_2]');
  });

  it('gère plusieurs types indépendamment', () => {
    genererTag('PERSONNE');
    genererTag('ADRESSE');
    expect(genererTag('PERSONNE')).toBe('[PERSONNE_2]');
    expect(genererTag('ADRESSE')).toBe('[ADRESSE_2]');
  });
});

describe('genererMapping', () => {
  beforeEach(() => reinitialiserCompteurs());

  it('crée un mapping à partir de groupes', () => {
    const groupes = [
      { type: 'EMAIL', valeurs: ['test@exemple.fr'] },
      { type: 'TEL', valeurs: ['0612345678'] },
    ];

    const mapping = genererMapping(groupes);

    expect(mapping['[EMAIL]']).toEqual(['test@exemple.fr']);
    expect(mapping['[TEL]']).toEqual(['0612345678']);
  });
});

describe('appliquerMapping', () => {
  it('remplace les valeurs par leurs tags', () => {
    const mapping = {
      '[EMAIL]': ['test@exemple.fr'],
      '[TEL]': ['0612345678'],
    };

    const texte = 'Contact : test@exemple.fr ou 0612345678';
    const resultat = appliquerMapping(texte, mapping);

    expect(resultat).toBe('Contact : [EMAIL] ou [TEL]');
  });

  it('remplace toutes les occurrences de la même valeur', () => {
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };
    const texte = 'a@a.com et test@exemple.fr et test@exemple.fr';

    const resultat = appliquerMapping(texte, mapping);

    expect(resultat).toContain('[EMAIL]');
    expect((resultat.match(/test@exemple\.fr/g) || []).length).toBe(0);
  });
});

describe('restaurerTexte', () => {
  it('remplace les tags par leurs valeurs', () => {
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };
    const texte = 'Contact : [EMAIL]';

    const resultat = restaurerTexte(texte, mapping);

    expect(resultat).toBe('Contact : test@exemple.fr');
  });
});

describe('genererCleJson / chargerCleJson', () => {
  it('fait un round-trip JSON', () => {
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };

    const json = genererCleJson(mapping);
    const reloaded = chargerCleJson(json);

    expect(reloaded).toEqual(mapping);
  });
});

describe('nomContientValeursMapping', () => {
  it('détecte une valeur du mapping dans le nom du fichier', () => {
    const mapping = { '[PERSONNE]': ['Sophie Lambert'] };
    expect(nomContientValeursMapping('compte-rendu Sophie Lambert', mapping)).toEqual([
      'Sophie Lambert',
    ]);
  });

  it('retourne une liste vide si le nom est sûr', () => {
    const mapping = { '[PERSONNE]': ['Sophie Lambert'] };
    expect(nomContientValeursMapping('compte-rendu patient', mapping)).toEqual([]);
  });

  it('détecte plusieurs valeurs', () => {
    const mapping = {
      '[PERSONNE]': ['Sophie Lambert', 'Jean Dupont'],
    };
    const resultat = nomContientValeursMapping(
      'Sophie Lambert et Jean Dupont rapport',
      mapping,
    );
    expect(resultat).toContain('Sophie Lambert');
    expect(resultat).toContain('Jean Dupont');
  });

  it('ignore les valeurs vides', () => {
    const mapping = { '[PERSONNE]': [''] };
    expect(nomContientValeursMapping('test', mapping)).toEqual([]);
  });

  it('est insensible à la casse', () => {
    const mapping = { '[EMAIL]': ['sophie@test.fr'] };
    expect(nomContientValeursMapping('Rapport SOPHIE@test.fr', mapping)).toEqual([
      'sophie@test.fr',
    ]);
  });
});