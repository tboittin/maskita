import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extensionDepuisNom,
  extensionSansPoint,
  extraireTexte,
} from './extraction';
import * as mammoth from 'mammoth';

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

const extractRawTextMock = vi.mocked(mammoth.extractRawText);

describe('extensionDepuisNom', () => {
  it('reconnaît les extensions .docx, .txt et .md (insensible à la casse)', () => {
    expect(extensionDepuisNom('rapport.docx')).toBe('.docx');
    expect(extensionDepuisNom('notes.txt')).toBe('.txt');
    expect(extensionDepuisNom('notes.md')).toBe('.md');
    expect(extensionDepuisNom('RAPPORT.DOCX')).toBe('.docx');
  });

  it('retourne null pour une extension non autorisée', () => {
    expect(extensionDepuisNom('photo.jpg')).toBeNull();
    expect(extensionDepuisNom('sans_extension')).toBeNull();
  });
});

describe('extensionSansPoint', () => {
  it('retourne l\'extension sans le point', () => {
    expect(extensionSansPoint('rapport.docx')).toBe('docx');
    expect(extensionSansPoint('notes.txt')).toBe('txt');
    expect(extensionSansPoint('notes.md')).toBe('md');
  });

  it('retourne null pour une extension non autorisée', () => {
    expect(extensionSansPoint('photo.jpg')).toBeNull();
  });
});

describe('extraireTexte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lit le contenu d\'un fichier .txt', async () => {
    const fichier = new File(['Le contenu du rapport'], 'notes.txt', {
      type: 'text/plain',
    });
    await expect(extraireTexte(fichier)).resolves.toBe('Le contenu du rapport');
  });

  it('lit le contenu d\'un fichier .md', async () => {
    const fichier = new File(['# Titre'], 'notes.md', {
      type: 'text/markdown',
    });
    await expect(extraireTexte(fichier)).resolves.toBe('# Titre');
  });

  it('extrait le texte d\'un .docx via mammoth', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pseudonymisé',
      messages: [],
    });
    const fichier = new File(['contenu'], 'rapport.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await expect(extraireTexte(fichier)).resolves.toBe('Rapport pseudonymisé');
    expect(extractRawTextMock).toHaveBeenCalledTimes(1);
  });

  it('émet un avertissement console si mammoth retourne des messages', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Texte',
      messages: [{ type: 'warning' as const, message: 'fichier peu fiable' }],
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fichier = new File(['contenu'], 'rapport.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    await expect(extraireTexte(fichier)).resolves.toBe('Texte');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('rejette un format non supporté', async () => {
    const fichier = new File(['hi'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(extraireTexte(fichier)).rejects.toThrow(
      'Format non supporté : photo.jpg',
    );
  });
});
