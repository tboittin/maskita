import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRevue } from './useRevue';

const TEXTE = 'Contact : test@exemple.fr ou 0612345678';
const MAPPING_INITIAL = { '[EMAIL]': ['test@exemple.fr'] };

describe('useRevue', () => {
  it('initialise les tags depuis le mapping', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    expect(result.current.tags).toHaveLength(1);
    expect(result.current.tags[0].tag).toBe('[EMAIL]');
    expect(result.current.tags[0].estNouveau).toBe(false);
  });

  it('génère le texte pseudonymisé', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    expect(result.current.textePseudonymise).toContain('[EMAIL]');
    expect(result.current.textePseudonymise).not.toContain('test@exemple.fr');
  });

  it('ajoute une valeur à un tag', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.ajouterValeur('[EMAIL]', 'autre@exemple.fr'));
    expect(result.current.tags[0].valeurs).toContain('autre@exemple.fr');
  });

  it('retire une valeur d\'un tag', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.retirerValeur('[EMAIL]', 'test@exemple.fr'));
    // Le tag reste mais vide
    expect(result.current.tags).toHaveLength(1);
    expect(result.current.tags[0].valeurs).toHaveLength(0);
  });

  it('supprime complètement un tag du mapping', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.supprimerTag('[EMAIL]'));
    // Le tag est complètement supprimé du mapping
    expect(result.current.tags).toHaveLength(0);
  });

  it('ajoute un tag manuellement', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.ajouterTag('PERSONNE', 'Sophie Lambert'));
    const nouveau = result.current.tags.find(t => t.tag.includes('PERSONNE'));
    expect(nouveau).toBeDefined();
    expect(nouveau!.valeurs).toContain('Sophie Lambert');
  });

  it('bascule la surbrillance', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    // Auto-highlight active le premier tag à l'ouverture
    expect(result.current.tagSurbrillance).toBe('[EMAIL]');
    // Cliquer à nouveau désactive
    act(() => result.current.mettreSurbrillance('[EMAIL]'));
    expect(result.current.tagSurbrillance).toBeNull();
    // Cliquer réactive
    act(() => result.current.mettreSurbrillance('[EMAIL]'));
    expect(result.current.tagSurbrillance).toBe('[EMAIL]');
  });

  it('renommerTag ajoute les crochets si omis (B01)', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.renommerTag('[EMAIL]', 'TEL'));
    expect(result.current.tags.find(t => t.tag === '[TEL]')).toBeDefined();
    expect(result.current.tags.find(t => t.tag === 'TEL')).toBeUndefined();
  });

  it('renommerTag met le type en majuscule (B03)', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.renommerTag('[EMAIL]', '[personne]'));
    expect(result.current.tags.find(t => t.tag === '[PERSONNE]')).toBeDefined();
  });

  it('reordonnerValeurs ne modifie pas mappingModifie (B07)', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    expect(result.current.mappingModifie).toBe(false);
    act(() => result.current.reordonnerValeurs('[EMAIL]', 0, 0));
    expect(result.current.mappingModifie).toBe(false);
  });

  it('mappingModifie détecte l\'ajout de valeurs', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.ajouterValeur('[EMAIL]', 'autre@exemple.fr'));
    expect(result.current.mappingModifie).toBe(true);
  });

  it('déplace une valeur d\'un tag vers un autre', () => {
    const mappingAvecDeuxTags = { '[EMAIL]': ['test@exemple.fr'], '[TEL]': ['0612345678'] };
    const { result } = renderHook(() => useRevue(TEXTE, mappingAvecDeuxTags));
    act(() => result.current.deplacerValeur('test@exemple.fr', '[EMAIL]', '[TEL]'));
    expect(result.current.tags.find(t => t.tag === '[EMAIL]')?.valeurs).toEqual([]);
    expect(result.current.tags.find(t => t.tag === '[TEL]')?.valeurs).toContain('test@exemple.fr');
  });

  it('ne fait rien si on déplace une valeur vers le même tag', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.deplacerValeur('test@exemple.fr', '[EMAIL]', '[EMAIL]'));
    expect(result.current.tags[0].valeurs).toHaveLength(1);
  });

  it('ajouterTag crée un suffixe _2 pour un type existant', () => {
    const mappingAvecPERSONNE = { '[PERSONNE]': ['Jean Dupont'] };
    const { result } = renderHook(() => useRevue(TEXTE, mappingAvecPERSONNE));
    act(() => result.current.ajouterTag('PERSONNE', 'Sophie Lambert'));
    expect(result.current.tags.find(t => t.tag === '[PERSONNE_2]')).toBeDefined();
    expect(result.current.tags.find(t => t.tag === '[PERSONNE_2]')?.valeurs).toContain('Sophie Lambert');
  });

  it('mettreSurbrillanceValeur surbrille une valeur spécifique', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.mettreSurbrillanceValeur('[EMAIL]', 'test@exemple.fr'));
    expect(result.current.tagSurbrillance).toBe('[EMAIL]');
    expect(result.current.valeurSurbrillance).toBe('test@exemple.fr');
  });

  it('mettreSurbrillanceValeur bascule si même valeur', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.mettreSurbrillanceValeur('[EMAIL]', 'test@exemple.fr'));
    expect(result.current.valeurSurbrillance).toBe('test@exemple.fr');
    act(() => result.current.mettreSurbrillanceValeur('[EMAIL]', 'test@exemple.fr'));
    expect(result.current.valeurSurbrillance).toBeNull();
  });
});