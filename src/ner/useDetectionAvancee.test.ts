import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDetectionAvancee, type FabriqueWorker } from './useDetectionAvancee';
import type { MessageDuWorker, MessageVersWorker } from './messages';

/** Faux worker : garde les messages reçus et permet d'en émettre. */
function fauxWorker() {
  const recus: MessageVersWorker[] = [];
  let ecouteur: ((e: MessageEvent<MessageDuWorker>) => void) | null = null;
  const worker = {
    postMessage: (m: MessageVersWorker) => { recus.push(m); },
    terminate: vi.fn(),
    addEventListener: (_: string, f: EventListener) => { ecouteur = f as never; },
  };
  const emettre = (m: MessageDuWorker) => act(() => { ecouteur?.({ data: m } as MessageEvent<MessageDuWorker>); });
  return { worker, recus, emettre };
}

describe('useDetectionAvancee', () => {
  it('ne crée aucun worker tant que la détection n’est pas activée', () => {
    const fabrique = vi.fn();
    const { result } = renderHook(() => useDetectionAvancee(fabrique as unknown as FabriqueWorker));
    expect(result.current.etat).toBe('inactif');
    expect(fabrique).not.toHaveBeenCalled();
  });

  it('suit le chargement puis passe à prêt', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const { worker, recus, emettre } = fauxWorker();
    const { result } = renderHook(() => useDetectionAvancee(() => worker));
    act(() => result.current.activer());
    expect(result.current.etat).toBe('chargement');
    expect(recus).toEqual([{ type: 'charger' }]);
    emettre({ type: 'progression', fichier: 'a', charge: 25, total: 100 });
    emettre({ type: 'progression', fichier: 'b', charge: 0, total: 100 });
    expect(result.current.progression).toBe(13);
    emettre({ type: 'pret', dureeMs: 10 });
    expect(result.current.etat).toBe('pret');
    expect(result.current.progression).toBe(100);
  });

  it('renvoie les entités sous forme de détections Maskita', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
    const { worker, recus, emettre } = fauxWorker();
    const { result } = renderHook(() => useDetectionAvancee(() => worker));
    let promesse!: Promise<unknown>;
    act(() => { promesse = result.current.analyser('Sophie à Lyon'); });
    const id = (recus[0] as { id: number }).id;
    emettre({
      type: 'resultat', id, morceaux: 1, dureeMs: 5,
      entites: [
        { valeur: 'Sophie', etiquette: 'PER', debut: 0, fin: 6, score: 0.9 },
        { valeur: 'Lyon', etiquette: 'LOC', debut: 9, fin: 13, score: 0.9 },
        { valeur: 'X', etiquette: 'MISC', debut: 0, fin: 1, score: 0.9 },
      ],
    });
    await expect(promesse).resolves.toEqual([
      { valeur: 'Sophie', type: 'PERSONNE', position: 0, longueur: 6 },
      { valeur: 'Lyon', type: 'LIEU', position: 9, longueur: 4 },
    ]);
  });

  it('signale une erreur de chargement', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { worker, emettre } = fauxWorker();
    const { result } = renderHook(() => useDetectionAvancee(() => worker));
    act(() => result.current.activer());
    emettre({ type: 'erreur', message: 'introuvable' });
    expect(result.current.etat).toBe('erreur');
    expect(result.current.erreur).toBe('introuvable');
  });
});
