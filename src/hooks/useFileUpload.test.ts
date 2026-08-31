import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';
import * as mammoth from 'mammoth';

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

const extractRawTextMock = vi.mocked(mammoth.extractRawText);

function creerDocx(contenu: ArrayBuffer, nom = 'rapport.docx'): File {
  return new File([contenu], nom, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function creerTxt(contenu = 'Hello', nom = 'notes.txt'): File {
  return new File([contenu], nom, { type: 'text/plain' });
}

function creerMd(contenu = '# Titre', nom = 'article.md'): File {
  return new File([contenu], nom, { type: 'text/markdown' });
}

function creerCleMock(mapping: Record<string, string[]>, nom = 'key.json'): File {
  return new File([JSON.stringify(mapping)], nom, { type: 'application/json' });
}

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    extractRawTextMock.mockReset();
  });

  it('retourne l\'état initial', () => {
    const { result } = renderHook(() => useFileUpload());
    expect(result.current.fichier).toBeNull();
    expect(result.current.extension).toBeNull();
    expect(result.current.texte).toBeNull();
    expect(result.current.chargement).toBe(false);
    expect(result.current.erreur).toBeNull();
    expect(result.current.cle).toBeNull();
    expect(result.current.nomFichierCle).toBeNull();
    expect(result.current.erreurCle).toBeNull();
  });

  it('rejette un format non supporté', async () => {
    const { result } = renderHook(() => useFileUpload());
    const fauxDoc = new File(['hello'], 'notes.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.uploader(fauxDoc);
    });

    expect(result.current.erreur).toBe('Format accepté : .docx, .txt, .md');
    expect(result.current.fichier).toBeNull();
    expect(result.current.texte).toBeNull();
  });

  it('rejette un fichier vide', async () => {
    const { result } = renderHook(() => useFileUpload());
    const vide = new File([], 'vide.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await act(async () => {
      await result.current.uploader(vide);
    });

    expect(result.current.erreur).toBe('Le fichier est vide');
  });

  it('extrait le texte d\'un .docx valide et définit extension', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Bonjour ceci est un rapport de psychologie.',
      messages: [],
    });

    const { result } = renderHook(() => useFileUpload());
    const fichier = creerDocx(new ArrayBuffer(8));

    await act(async () => {
      await result.current.uploader(fichier);
    });

    expect(result.current.erreur).toBeNull();
    expect(result.current.fichier).toBe(fichier);
    expect(result.current.extension).toBe('docx');
    expect(result.current.texte).toBe('Bonjour ceci est un rapport de psychologie.');
  });

  it('extrait le texte d\'un .txt valide', async () => {
    const { result } = renderHook(() => useFileUpload());
    const fichier = creerTxt('Notes de consultation');

    await act(async () => {
      await result.current.uploader(fichier);
    });

    expect(result.current.erreur).toBeNull();
    expect(result.current.fichier).toBe(fichier);
    expect(result.current.extension).toBe('txt');
    expect(result.current.texte).toBe('Notes de consultation');
  });

  it('extrait le texte d\'un .md valide', async () => {
    const { result } = renderHook(() => useFileUpload());
    const fichier = creerMd('# Compte-rendu\n\nPatient vu en consultation.');

    await act(async () => {
      await result.current.uploader(fichier);
    });

    expect(result.current.erreur).toBeNull();
    expect(result.current.fichier).toBe(fichier);
    expect(result.current.extension).toBe('md');
    expect(result.current.texte).toBe('# Compte-rendu\n\nPatient vu en consultation.');
  });

  it('gère une erreur d\'extraction', async () => {
    extractRawTextMock.mockRejectedValue(new Error('fichier corrompu'));

    const { result } = renderHook(() => useFileUpload());
    const fichier = creerDocx(new ArrayBuffer(8));

    await act(async () => {
      await result.current.uploader(fichier);
    });

    expect(result.current.erreur).toContain('Impossible de lire le fichier');
    expect(result.current.fichier).toBeNull();
    expect(result.current.extension).toBeNull();
    expect(result.current.texte).toBeNull();
  });

  it('charge une clé .key.json valide', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };
    const fichierCle = creerCleMock(mapping);

    await act(async () => {
      await result.current.uploaderCle(fichierCle);
    });

    expect(result.current.cle).toEqual(mapping);
    expect(result.current.nomFichierCle).toBe('key.json');
    expect(result.current.erreurCle).toBeNull();
  });

  it('rejette une clé invalide', async () => {
    const { result } = renderHook(() => useFileUpload());
    const fichierInvalide = new File(['pas du json'], 'key.json', { type: 'application/json' });

    await act(async () => {
      await result.current.uploaderCle(fichierInvalide);
    });

    expect(result.current.erreurCle).toBe('Fichier .key.json invalide ou corrompu');
    expect(result.current.cle).toBeNull();
  });

  it('rejette une clé qui n\'est pas .json', async () => {
    const { result } = renderHook(() => useFileUpload());
    const fichier = new File(['{}'], 'cle.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploaderCle(fichier);
    });

    expect(result.current.erreurCle).toBe('La clé doit être au format .json');
  });

  it('réinitialise tout', async () => {
    extractRawTextMock.mockResolvedValue({ value: 'texte', messages: [] });

    const { result } = renderHook(() => useFileUpload());
    await act(async () => {
      await result.current.uploader(creerDocx(new ArrayBuffer(8)));
    });

    expect(result.current.texte).toBe('texte');
    expect(result.current.extension).toBe('docx');

    act(() => {
      result.current.reinitialiser();
    });

    expect(result.current.fichier).toBeNull();
    expect(result.current.extension).toBeNull();
    expect(result.current.texte).toBeNull();
    expect(result.current.chargement).toBe(false);
    expect(result.current.erreur).toBeNull();
    expect(result.current.cle).toBeNull();
    expect(result.current.nomFichierCle).toBeNull();
    expect(result.current.erreurCle).toBeNull();
  });
});