import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { EcranRestauration } from './EcranRestauration';
import { renderAvecI18n } from '../test/renderAvecI18n';
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

/** Les inputs file du DS n'ont plus data-testid — on les trouve par type. */
function inputsFichier(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));
}

describe('EcranRestauration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    URL.revokeObjectURL = vi.fn();
  });

  it('affiche les deux zones de dépôt', () => {
    renderAvecI18n(<EcranRestauration />);
    expect(screen.getByText(/Rapport modifié/)).toBeInTheDocument();
    expect(screen.getByText(/Clé .key.json correspondante/)).toBeInTheDocument();
  });

  it('affiche le bouton Lancer la restauration après chargement du .docx et de la clé', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    renderAvecI18n(<EcranRestauration />);

    const inputs = inputsFichier();

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
      expect(screen.getByText('Lancer la restauration')).toBeInTheDocument();
    });
  });

  it('affiche la revue avec le texte restauré après avoir cliqué sur Lancer la restauration', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    renderAvecI18n(<EcranRestauration />);

    const inputs = inputsFichier();

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

    // Cliquer sur "Lancer la restauration"
    await waitFor(() => {
      expect(screen.getByText('Lancer la restauration')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Lancer la restauration'));

    // Vérifier que la vue revue est affichée
    await waitFor(() => {
      expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
    });
  });

  it('déclenche le téléchargement après validation dans la revue', async () => {
    const buildDocumentMock = vi.mocked(buildDocument);

    extractRawTextMock.mockResolvedValue({
      value: 'Rapport pour [PERSONNE]',
      messages: [],
    });

    renderAvecI18n(<EcranRestauration />);

    const inputs = inputsFichier();

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

    // Cliquer sur "Lancer la restauration"
    await waitFor(() => {
      expect(screen.getByText('Lancer la restauration')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Lancer la restauration'));

    // Cliquer sur "Valider et continuer"
    await waitFor(() => {
      expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Valider et continuer'));

    await waitFor(() => {
      expect(buildDocumentMock).toHaveBeenCalledTimes(1);
      expect(buildDocumentMock).toHaveBeenCalledWith('Rapport pour Sophie Lambert', 'docx');
    });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});
