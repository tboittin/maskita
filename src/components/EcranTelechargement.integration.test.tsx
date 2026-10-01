import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { EcranTelechargement } from './EcranTelechargement';
import { renderAvecI18n } from '../test/renderAvecI18n';
import { buildDocument } from '../utils/buildDocument';
import { declencherTelechargement } from '../utils/telechargement';
import type { Mapping } from '../utils/mapping';

vi.mock('../utils/buildDocument', () => ({
  buildDocument: vi.fn(() =>
    Promise.resolve(new Blob(['fake doc'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
  )),
}));

vi.mock('../utils/telechargement', () => ({
  declencherTelechargement: vi.fn(),
}));

// NOTE: ne PAS mocker nomContientValeursMapping — on teste l'intégration réelle

const buildDocumentMock = vi.mocked(buildDocument);
const declencherTelechargementMock = vi.mocked(declencherTelechargement);

const MAPPING: Mapping = { '[PERSONNE]': ['Henri Lefevre'] };
const TEXTE_PSEUDO = 'Contact : [PERSONNE]';
const PROPS_DEFAUT = {
  contenuDocument: TEXTE_PSEUDO,
  mappingFinal: MAPPING,
  nomFichierBase: 'rapport',
  extension: 'docx' as const,
  onRetour: vi.fn(),
  suffixeDocument: '-pseudonymise',
  titre: 'Télécharger les fichiers',
  sousTitre: 'Sous-titre',
  libelleDocument: 'Document pseudonymisé',
  libelleCle: 'Clé .key.json',
  boutonDocument: 'Télécharger le document',
  boutonCle: 'Télécharger la clé',
  succesDocument: 'Document téléchargé ✓',
  succesCle: 'Clé téléchargée ✓',
  boutonRetour: '← Modifier les pseudos',
  verifierNomSensible: true,
};

describe('Intégration — détection token dans le titre (nomContientValeursMapping réel)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    URL.revokeObjectURL = vi.fn();
  });

  it('alerte quand on saisit un token sensible dans le nom (scénario user : Lefevre)', async () => {
    renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

    // 1. Le nom initial "rapport-pseudonymise.docx" ne déclenche PAS l'alerte
    const champDoc = screen.getByDisplayValue('rapport-pseudonymise.docx');
    expect(champDoc).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // 2. L'utilisateur renomme en "rapport Lefevre-pseudonymise.docx"
    //    "Lefevre" est un token de la valeur "Henri Lefevre" du mapping
    fireEvent.change(champDoc, { target: { value: 'rapport Lefevre-pseudonymise.docx' } });

    // 3. Le warning inline doit apparaître — le token "Lefevre" est détecté
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Henri Lefevre/);
    expect(champDoc).toHaveAttribute('aria-invalid', 'true');

    // 4. Le téléchargement est bloqué
    fireEvent.click(screen.getByText('Télécharger le document'));
    expect(buildDocumentMock).not.toHaveBeenCalled();
    expect(declencherTelechargementMock).not.toHaveBeenCalled();
  });

  it('permet le téléchargement après avoir corrigé le nom', async () => {
    renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

    const champDoc = screen.getByDisplayValue('rapport-pseudonymise.docx');

    // 1. Renommer avec token sensible → warning
    fireEvent.change(champDoc, { target: { value: 'rapport Lefevre-pseudonymise.docx' } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // 2. Corriger le nom → warning disparaît
    fireEvent.change(champDoc, { target: { value: 'rapport-propre.docx' } });
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // 3. Téléchargement fonctionne
    fireEvent.click(screen.getByText('Télécharger le document'));
    await waitFor(() => {
      expect(buildDocumentMock).toHaveBeenCalledTimes(1);
      expect(declencherTelechargementMock).toHaveBeenCalledWith(
        expect.any(Blob),
        'rapport-propre.docx',
      );
    });
  });

  it("n'affiche pas de warning avec verifierNomSensible=false", async () => {
    renderAvecI18n(
      <EcranTelechargement {...PROPS_DEFAUT} verifierNomSensible={false} />,
    );

    const champDoc = screen.getByDisplayValue('rapport-pseudonymise.docx');
    // Même avec un nom sensible, aucun warning
    fireEvent.change(champDoc, { target: { value: 'rapport Lefevre-pseudonymise.docx' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Le téléchargement n'est pas bloqué
    fireEvent.click(screen.getByText('Télécharger le document'));
    await waitFor(() => {
      expect(buildDocumentMock).toHaveBeenCalledTimes(1);
    });
  });
});
