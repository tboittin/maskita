import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EcranRestauration } from './EcranRestauration';
import * as mammoth from 'mammoth';
import { buildDocument } from '../utils/buildDocument';

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

vi.mock('../utils/buildDocument', () => ({
  buildDocument: vi.fn(() =>
    Promise.resolve(new Blob(['fake doc'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })),
  ),
}));

const extractRawTextMock = vi.mocked(mammoth.extractRawText);

describe('EcranRestauration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    URL.revokeObjectURL = vi.fn();
  });

  it('affiche les deux zones de dépôt', () => {
    render(<EcranRestauration />);
    expect(screen.getByText(/Rapport modifié/)).toBeInTheDocument();
    expect(screen.getByText(/Clé .key.json correspondante/)).toBeInTheDocument();
  });

  it('affiche le texte restauré après chargement du .docx et de la clé', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    render(<EcranRestauration />);

    const inputs = screen.getAllByTestId('input-fichier');

    // Charger le .docx
    fireEvent.change(inputs[0], {
      target: {
        files: [
          new File(['contenu'], 'modifié.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }),
        ],
      },
    });

    // Charger la clé
    fireEvent.change(inputs[1], {
      target: {
        files: [
          new File([JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] })], 'key.json', {
            type: 'application/json',
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Rapport pour Sophie Lambert')).toBeInTheDocument();
    });
  });

  it('affiche le bouton Télécharger quand le texte est restauré', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    render(<EcranRestauration />);

    const inputs = screen.getAllByTestId('input-fichier');

    fireEvent.change(inputs[0], {
      target: {
        files: [
          new File(['contenu'], 'modifié.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }),
        ],
      },
    });

    fireEvent.change(inputs[1], {
      target: {
        files: [
          new File([JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] })], 'key.json', {
            type: 'application/json',
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Télécharger le rapport restauré')).toBeInTheDocument();
    });
  });

  it('déclenche le téléchargement au clic', async () => {
    const buildDocumentMock = vi.mocked(buildDocument);

    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    render(<EcranRestauration />);

    const inputs = screen.getAllByTestId('input-fichier');

    fireEvent.change(inputs[0], {
      target: {
        files: [
          new File(['contenu'], 'modifié.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }),
        ],
      },
    });

    fireEvent.change(inputs[1], {
      target: {
        files: [
          new File([JSON.stringify({ '[PERSONNE]': ['Sophie Lambert'] })], 'key.json', {
            type: 'application/json',
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Télécharger le rapport restauré')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Télécharger le rapport restauré'));

    await waitFor(() => {
      expect(buildDocumentMock).toHaveBeenCalledTimes(1);
      expect(buildDocumentMock).toHaveBeenCalledWith('Rapport pour Sophie Lambert', 'docx');
    });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});