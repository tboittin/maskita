import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAjoutRapide } from './useAjoutRapide';

describe('useAjoutRapide — INT-1 garde-fou sélection', () => {
  it('sélection sans crochets (volet haut) → barre visible', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('haut')('Paris');
    });

    expect(result.current.selection).toEqual({ valeur: 'Paris', source: 'haut' });
  });

  it('sélection avec crochets [VILLE] (volet haut) → pas de barre', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('haut')('[VILLE]');
    });

    expect(result.current.selection).toBeNull();
  });

  it('sélection avec texte mixte contenant [ (volet haut) → pas de barre', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('haut')('texte avant [VILLE] texte après');
    });

    expect(result.current.selection).toBeNull();
  });

  it('sélection avec texte mixte contenant ] (volet haut) → pas de barre', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('haut')('test]valeur');
    });

    expect(result.current.selection).toBeNull();
  });

  it('sélection avec crochets (volet bas) → barre visible (non impacté)', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('bas')('[VILLE]');
    });

    expect(result.current.selection).toEqual({ valeur: '[VILLE]', source: 'bas' });
  });

  it('sélection sans crochets (volet bas) → barre visible', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('bas')('Paris');
    });

    expect(result.current.selection).toEqual({ valeur: 'Paris', source: 'bas' });
  });
});

describe('useAjoutRapide — CORR-1 sélection interne à un tag', () => {
  describe('Cas à bloquer (estDansTag=true)', () => {
    it.each([
      'ATI',
      'PATIENT',
      'TIEN',
    ])('texte "%s" avec estDansTag → pas de barre', (valeur) => {
      const { result } = renderHook(() =>
        useAjoutRapide({
          onAjouterPseudo: vi.fn(),
          onAjouterValeur: vi.fn(),
        }),
      );

      act(() => {
        result.current.gererSelection('haut')(valeur, true);
      });

      expect(result.current.selection).toBeNull();
    });
  });

  describe('Non-régression INT-1 (sélection contient crochets)', () => {
    it.each([
      ['[PAT', 'contient ['],
      ['IENT]', 'contient ]'],
      ['[PATIENT]', 'contient [ et ]'],
    ])('texte "%s" (%s) sans estDansTag → pas de barre', (valeur) => {
      const { result } = renderHook(() =>
        useAjoutRapide({
          onAjouterPseudo: vi.fn(),
          onAjouterValeur: vi.fn(),
        }),
      );

      act(() => {
        result.current.gererSelection('haut')(valeur);
      });

      expect(result.current.selection).toBeNull();
    });
  });

  it('[PATI] contient [ → pas de barre (INT-1) et pas de valeur préremplie', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('haut')('[PATI');
    });

    // INT-1 bloque car la sélection contient '['
    expect(result.current.selection).toBeNull();
    // Aucun picker ouvert, aucune valeur préremplie
    expect(result.current.picker).toBeNull();
  });

  it('sélection normale hors tag (volet haut) → barre visible', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      result.current.gererSelection('haut')('est arrivé');
    });

    expect(result.current.selection).toEqual({ valeur: 'est arrivé', source: 'haut' });
  });

  it('volet bas non impacté par estDansTag', () => {
    const { result } = renderHook(() =>
      useAjoutRapide({
        onAjouterPseudo: vi.fn(),
        onAjouterValeur: vi.fn(),
      }),
    );

    act(() => {
      // Même avec estDansTag=true, le volet bas ne doit pas être bloqué
      result.current.gererSelection('bas')('ATI', true);
    });

    expect(result.current.selection).toEqual({ valeur: 'ATI', source: 'bas' });
  });
});
