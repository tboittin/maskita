import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as mammoth from 'mammoth';
import { buildDocument } from './utils/buildDocument';

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

vi.mock('./utils/buildDocument', () => ({
  buildDocument: vi.fn(() =>
    Promise.resolve(new Blob(['fake doc'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })),
  ),
}));

const buildDocumentMock = vi.mocked(buildDocument);
const extractRawTextMock = vi.mocked(mammoth.extractRawText);

function creerFichier(nom = 'rapport.docx', contenu = 'contenu'): File {
  return new File([contenu], nom, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function creerCle(mapping: Record<string, string[]>, nom = 'key.json'): File {
  return new File([JSON.stringify(mapping)], nom, { type: 'application/json' });
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom n'implémente pas createObjectURL — on le mocke
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    URL.revokeObjectURL = vi.fn();
  });

  it('affiche le titre et la description', () => {
    render(<App />);
    expect(screen.getByText('Maskita')).toBeInTheDocument();
    expect(
      screen.getByText(/pseudonymisation.*100% dans le navigateur/i),
    ).toBeInTheDocument();
  });

  it('affiche la zone de dépôt au démarrage', () => {
    render(<App />);
    const inputs = screen.getAllByTestId('input-fichier');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    // Le premier input accepte .docx, .txt, .md
    expect(inputs[0]).toHaveAttribute('accept', '.docx,.txt,.md');
  });

  it('affiche le titre "Rapport (.docx, .txt, .md)"', () => {
    render(<App />);
    const titres = screen.getAllByText(/Rapport.*.docx.*.txt.*.md/i);
    expect(titres.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche une zone optionnelle pour la clé .key.json', () => {
    render(<App />);
    const elements = screen.getAllByText(/clé .key.json/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('passe à l\'écran de revue après upload d\'un .docx', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Contact : test@exemple.fr ou 0612345678',
      messages: [],
    });

    render(<App />);

    const inputs = screen.getAllByTestId('input-fichier');
    const inputDocx = inputs[0] as HTMLInputElement;
    fireEvent.change(inputDocx, { target: { files: [creerFichier()] } });

    await waitFor(() => {
      expect(screen.getByText('Lancer l\'analyse')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Lancer l\'analyse'));

    await waitFor(() => {
      expect(screen.getByText(/Valider et télécharger/)).toBeInTheDocument();
    });
  });

  it('intègre le mapping existant lors de l\'analyse', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Mme Sophie Lambert, contact : test@exemple.fr',
      messages: [],
    });

    render(<App />);

    // Charger une clé existante (deuxième input)
    const inputs = screen.getAllByTestId('input-fichier');
    const inputCle = inputs[1] as HTMLInputElement;
    fireEvent.change(inputCle, {
      target: { files: [creerCle({ '[EMAIL]': ['test@exemple.fr'] })] },
    });

    // Charger le .docx (premier input)
    const inputDocx = inputs[0] as HTMLInputElement;
    fireEvent.change(inputDocx, { target: { files: [creerFichier()] } });

    await waitFor(() => {
      expect(screen.getByText('Lancer l\'analyse')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Lancer l\'analyse'));

    await waitFor(() => {
      expect(screen.getByText(/Valider et télécharger/)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si fichier invalide', async () => {
    render(<App />);

    const inputs = screen.getAllByTestId('input-fichier');
    const inputDocx = inputs[0] as HTMLInputElement;
    fireEvent.change(inputDocx, { target: { files: [new File(['hi'], 'photo.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Format accepté : .docx, .txt, .md',
      );
    });
  });

  it('déclenche les téléchargements au clic sur Valider', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Contact : test@exemple.fr',
      messages: [],
    });

    render(<App />);

    const inputs = screen.getAllByTestId('input-fichier');
    fireEvent.change(inputs[0], { target: { files: [creerFichier('mon-rapport.docx')] } });

    await waitFor(() => {
      expect(screen.getByText('Lancer l\'analyse')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Lancer l\'analyse'));

    await waitFor(() => {
      expect(screen.getByText('Valider et télécharger')).toBeInTheDocument();
    });

    // Clic sur Valider
    fireEvent.click(screen.getByText('Valider et télécharger'));

    await waitFor(() => {
      // buildDocument a été appelé avec le texte pseudonymisé + le format
      expect(buildDocumentMock).toHaveBeenCalledTimes(1);
      expect(buildDocumentMock).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL]'),
        'docx',
      );
    });

    // createObjectURL a été appelé 2 fois : doc + .key.json
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('affiche un message de succès après téléchargement', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Contact : test@exemple.fr',
      messages: [],
    });

    render(<App />);

    const inputs = screen.getAllByTestId('input-fichier');
    fireEvent.change(inputs[0], { target: { files: [creerFichier('mon-rapport.docx')] } });

    await waitFor(() => {
      expect(screen.getByText('Lancer l\'analyse')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Lancer l\'analyse'));

    await waitFor(() => {
      expect(screen.getByText('Valider et télécharger')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Valider et télécharger'));

    await waitFor(() => {
      expect(screen.getByText('Fichiers téléchargés avec succès ✓')).toBeInTheDocument();
    });
  });

  it('affiche les onglets de navigation', () => {
    render(<App />);
    expect(screen.getByText('🔒 Anonymiser')).toBeInTheDocument();
    expect(screen.getByText('🔓 Restaurer')).toBeInTheDocument();
  });

  it('affiche le contenu Restaurer en cliquant sur l\'onglet', () => {
    render(<App />);
    fireEvent.click(screen.getByText('🔓 Restaurer'));
    expect(screen.getByText(/Rapport modifié/)).toBeInTheDocument();
    expect(screen.getByText(/Clé .key.json correspondante/)).toBeInTheDocument();
  });

  it('revient à l\'écran d\'upload Anonymiser en cliquant sur l\'onglet Anonymiser', () => {
    render(<App />);

    // Passer en Restaurer
    fireEvent.click(screen.getByText('🔓 Restaurer'));
    expect(screen.getByText(/Rapport modifié/)).toBeInTheDocument();

    // Revenir en Anonymiser
    fireEvent.click(screen.getByText('🔒 Anonymiser'));
    expect(screen.getByText(/Rapport.*\.docx/)).toBeInTheDocument();
  });
});