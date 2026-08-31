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

  it('vide un tag (supprime les valeurs)', () => {
    const { result } = renderHook(() => useRevue(TEXTE, MAPPING_INITIAL));
    act(() => result.current.supprimerTag('[EMAIL]'));
    // Le tag reste avec un tableau vide
    expect(result.current.tags).toHaveLength(1);
    expect(result.current.tags[0].valeurs).toHaveLength(0);
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
});