import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRestauration } from './useRestauration';
import * as mammoth from 'mammoth';

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

const extractRawTextMock = vi.mocked(mammoth.extractRawText);

function creerDocx(contenu = 'texte', nom = 'modifié.docx'): File {
  return new File([contenu], nom, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function creerCle(mapping: Record<string, string[]>, nom = 'key.json'): File {
  return new File([JSON.stringify(mapping)], nom, { type: 'application/json' });
}

describe('useRestauration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne l\'état initial', () => {
    const { result } = renderHook(() => useRestauration());
    expect(result.current.texteAvecTags).toBeNull();
    expect(result.current.texteRestauré).toBeNull();
    expect(result.current.mapping).toBeNull();
    expect(result.current.chargement).toBe(false);
    expect(result.current.erreur).toBeNull();
    expect(result.current.fichierDocx).toBeNull();
    expect(result.current.nomFichierCle).toBeNull();
  });

  it('rejette un format non supporté', async () => {
    const { result } = renderHook(() => useRestauration());
    const fauxDoc = new File(['hello'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleDocxChoisi(fauxDoc);
    });

    expect(result.current.erreur).toBe('Format accepté : .docx, .txt, .md');
    expect(result.current.fichierDocx).toBeNull();
    expect(result.current.texteAvecTags).toBeNull();
  });

  it('extrait le texte d\'un .docx valide', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    const { result } = renderHook(() => useRestauration());
    const fichier = creerDocx();

    await act(async () => {
      await result.current.handleDocxChoisi(fichier);
    });

    expect(result.current.erreur).toBeNull();
    expect(result.current.fichierDocx).toBe(fichier);
    expect(result.current.texteAvecTags).toBe('Rapport pour [PERSONNE]');
  });

  it('charge une clé .key.json valide', async () => {
    const { result } = renderHook(() => useRestauration());
    const mapping = { '[PERSONNE]': ['Sophie Lambert'] };

    await act(async () => {
      await result.current.handleCleChoisie(creerCle(mapping));
    });

    expect(result.current.mapping).toEqual(mapping);
    expect(result.current.nomFichierCle).toBe('key.json');
    expect(result.current.erreur).toBeNull();
  });

  it('restaure le texte quand .docx et clé sont chargés', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    const { result } = renderHook(() => useRestauration());

    await act(async () => {
      await result.current.handleDocxChoisi(creerDocx());
    });

    // Pas encore restauré : pas de clé
    expect(result.current.texteRestauré).toBeNull();

    await act(async () => {
      await result.current.handleCleChoisie(creerCle({ '[PERSONNE]': ['Sophie Lambert'] }));
    });

    // Maintenant le texte est restauré automatiquement
    await waitFor(() => {
      expect(result.current.texteRestauré).toBe('Rapport pour Sophie Lambert');
    });
  });

  it('rejette une clé invalide', async () => {
    const { result } = renderHook(() => useRestauration());
    const fichier = new File(['pas du json'], 'key.json', { type: 'application/json' });

    await act(async () => {
      await result.current.handleCleChoisie(fichier);
    });

    expect(result.current.erreur).toBe('Fichier .key.json invalide ou corrompu');
    expect(result.current.mapping).toBeNull();
  });

  it('rejette une clé qui n\'est pas .json', async () => {
    const { result } = renderHook(() => useRestauration());
    const fichier = new File(['{}'], 'cle.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.handleCleChoisie(fichier);
    });

    expect(result.current.erreur).toBe('La clé doit être au format .json');
  });

  it('réinitialise tout', async () => {
    extractRawTextMock.mockResolvedValue({ value: 'texte', messages: [] });

    const { result } = renderHook(() => useRestauration());
    await act(async () => {
      await result.current.handleDocxChoisi(creerDocx());
    });
    expect(result.current.texteAvecTags).toBe('texte');

    act(() => {
      result.current.reinitialiser();
    });

    expect(result.current.texteAvecTags).toBeNull();
    expect(result.current.texteRestauré).toBeNull();
    expect(result.current.mapping).toBeNull();
    expect(result.current.chargement).toBe(false);
    expect(result.current.erreur).toBeNull();
    expect(result.current.fichierDocx).toBeNull();
    expect(result.current.nomFichierCle).toBeNull();
  });

  describe('US-V03 — Modification du mapping à l\'étape Restauration', () => {
    const MAPPING = { '[PERSONNE]': ['Sophie Lambert'] };

    async function chargerAvecMapping(mapping: Record<string, string[]> = MAPPING) {
      const { result } = renderHook(() => useRestauration());
      await act(async () => {
        await result.current.handleCleChoisie(creerCle(mapping));
      });
      return result;
    }

    it('ajoute une valeur à un tag existant', async () => {
      const result = await chargerAvecMapping();
      act(() => result.current.ajouterValeur('[PERSONNE]', 'Martin Dupont'));
      expect(result.current.mapping?.['[PERSONNE]']).toContain('Martin Dupont');
      expect(result.current.mapping?.['[PERSONNE]']).toContain('Sophie Lambert');
    });

    it('retire une valeur d\'un tag', async () => {
      const result = await chargerAvecMapping();
      act(() => result.current.retirerValeur('[PERSONNE]', 'Sophie Lambert'));
      expect(result.current.mapping?.['[PERSONNE]']).toEqual([]);
    });

    it('renommerTag ajoute les crochets et met en majuscule (B01/B03)', async () => {
      const result = await chargerAvecMapping();
      act(() => result.current.renommerTag('[PERSONNE]', 'patient'));
      expect(result.current.mapping?.['[PATIENT]']).toContain('Sophie Lambert');
      expect(result.current.mapping?.['[PERSONNE]']).toBeUndefined();
    });

    it('supprime complètement un tag du mapping', async () => {
      const result = await chargerAvecMapping();
      act(() => result.current.supprimerTag('[PERSONNE]'));
      expect(result.current.mapping).toEqual({});
    });

    it('ajouteTag crée un tag avec suffixe _2 si le type existe', async () => {
      const result = await chargerAvecMapping();
      act(() => result.current.ajouterTag('PERSONNE', 'Martin Dupont'));
      expect(result.current.mapping?.['[PERSONNE_2]']).toContain('Martin Dupont');
    });

    it('déplace une valeur d\'un tag vers un autre', async () => {
      const result = await chargerAvecMapping({
        '[PERSONNE]': ['Sophie Lambert'],
        '[TEL]': ['0612345678'],
      });
      act(() => result.current.deplacerValeur('Sophie Lambert', '[PERSONNE]', '[TEL]'));
      expect(result.current.mapping?.['[PERSONNE]']).toEqual([]);
      expect(result.current.mapping?.['[TEL]']).toContain('Sophie Lambert');
    });

    it('recalcule le texte restauré après ajout d\'une valeur', async () => {
      extractRawTextMock.mockResolvedValue({
        value: 'Rapport pour [PERSONNE]',
        messages: [],
      });
      const { result } = renderHook(() => useRestauration());
      await act(async () => {
        await result.current.handleDocxChoisi(creerDocx());
      });
      await act(async () => {
        await result.current.handleCleChoisie(creerCle(MAPPING));
      });
      await waitFor(() => {
        expect(result.current.texteRestauré).toBe('Rapport pour Sophie Lambert');
      });

      // Modifier le mapping → le texte restauré se met à jour
      act(() => result.current.ajouterValeur('[PERSONNE]', 'Pseudo Corrigé'));
      // La première valeur du tag est utilisée pour la restauration
      expect(result.current.mapping?.['[PERSONNE]'][0]).toBe('Sophie Lambert');
    });
  });
});