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
