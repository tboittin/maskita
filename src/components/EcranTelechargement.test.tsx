import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { EcranTelechargement } from './EcranTelechargement';
import { renderAvecI18n } from '../test/renderAvecI18n';
import { buildDocument } from '../utils/buildDocument';
import { nomContientValeursMapping } from '../utils/mapping';
import { declencherTelechargement } from '../utils/telechargement';
import type { Mapping } from '../utils/mapping';

vi.mock('../utils/buildDocument', () => ({
  buildDocument: vi.fn(() =>
    Promise.resolve(new Blob(['fake doc'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })),
  ),
}));

vi.mock('../utils/telechargement', () => ({
  declencherTelechargement: vi.fn(),
}));

vi.mock('../utils/mapping', async () => {
  const actual = await vi.importActual<typeof import('../utils/mapping')>('../utils/mapping');
  return {
    ...actual,
    nomContientValeursMapping: vi.fn(),
  };
});

const buildDocumentMock = vi.mocked(buildDocument);
const declencherTelechargementMock = vi.mocked(declencherTelechargement);
const nomContientValeursMappingMock = vi.mocked(nomContientValeursMapping);

const MAPPING: Mapping = { '[EMAIL]': ['test@exemple.fr'] };
const TEXTE_PSEUDO = 'Contact : [EMAIL]';
const PROPS_DEFAUT = {
  contenuDocument: TEXTE_PSEUDO,
  mappingFinal: MAPPING,
  nomFichierBase: 'mon-rapport',
  extension: 'docx' as const,
  onRetour: vi.fn(),
  suffixeDocument: '-pseudonymise',
  titre: 'Télécharger les fichiers',
  sousTitre: 'Téléchargez chaque fichier indépendamment.',
  libelleDocument: 'Document pseudonymisé',
  libelleCle: 'Clé .key.json',
  boutonDocument: 'Télécharger le document',
  boutonCle: 'Télécharger la clé',
  succesDocument: 'Document téléchargé ✓',
  succesCle: 'Clé téléchargée ✓',
  boutonRetour: '← Modifier les pseudos',
};

describe('EcranTelechargement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nomContientValeursMappingMock.mockReturnValue([]);
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    URL.revokeObjectURL = vi.fn();
  });

  it('affiche le titre et le sous-titre', () => {
    renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);
    expect(screen.getByText('Télécharger les fichiers')).toBeInTheDocument();
    expect(screen.getByText('Téléchargez chaque fichier indépendamment.')).toBeInTheDocument();
  });

  it('affiche les deux panneaux avec les noms de fichiers dans les champs', () => {
    renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);
    expect(screen.getByText('Document pseudonymisé')).toBeInTheDocument();
    expect(screen.getByText('Clé .key.json')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mon-rapport-pseudonymise.docx')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mon-rapport.key.json')).toBeInTheDocument();
  });

  it('affiche les deux boutons de téléchargement', () => {
    renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);
    expect(screen.getByText('Télécharger le document')).toBeInTheDocument();
    expect(screen.getByText('Télécharger la clé')).toBeInTheDocument();
  });

  it('affiche le bouton retour', () => {
    renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);
    expect(screen.getByText('← Modifier les pseudos')).toBeInTheDocument();
  });

  it('appelle onRetour au clic sur le bouton retour', () => {
    const onRetour = vi.fn();
    renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} onRetour={onRetour} />);
    fireEvent.click(screen.getByText('← Modifier les pseudos'));
    expect(onRetour).toHaveBeenCalledTimes(1);
  });

  describe('téléchargement du document', () => {
    it('déclenche buildDocument et le téléchargement au clic', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      fireEvent.click(screen.getByText('Télécharger le document'));

      await waitFor(() => {
        expect(buildDocumentMock).toHaveBeenCalledTimes(1);
        expect(buildDocumentMock).toHaveBeenCalledWith(TEXTE_PSEUDO, 'docx');
      });

      expect(declencherTelechargementMock).toHaveBeenCalledTimes(1);
      expect(declencherTelechargementMock).toHaveBeenCalledWith(
        expect.any(Blob),
        'mon-rapport-pseudonymise.docx',
      );
    });

    it('affiche "Document téléchargé ✓" après téléchargement', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      fireEvent.click(screen.getByText('Télécharger le document'));

      await waitFor(() => {
        expect(screen.getByText('Document téléchargé ✓')).toBeInTheDocument();
      });
    });

    it('reste cliquable après téléchargement du document', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      const boutonDoc = screen.getByText('Télécharger le document').closest('button');
      expect(boutonDoc).not.toBeDisabled();

      fireEvent.click(screen.getByText('Télécharger le document'));

      await waitFor(() => {
        expect(screen.getByText('Document téléchargé ✓')).toBeInTheDocument();
      });

      // Le bouton change de label mais reste cliquable
      const boutonDocAfter = screen.getByText('Document téléchargé ✓').closest('button');
      expect(boutonDocAfter).not.toBeDisabled();
    });

    it('affiche un warning inline quand le nom contient des valeurs sensibles et bloque le téléchargement', async () => {
      nomContientValeursMappingMock.mockReturnValue(['Jean Dupont']);

      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      // Le message d'erreur inline est visible
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/Jean Dupont/);

      // Aucun dialog/modal de warning
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Le téléchargement est bloqué
      fireEvent.click(screen.getByText('Télécharger le document'));
      expect(buildDocumentMock).not.toHaveBeenCalled();
      expect(declencherTelechargementMock).not.toHaveBeenCalled();
    });

    it("met aria-invalid sur l'input du document quand des valeurs sensibles sont détectées", () => {
      nomContientValeursMappingMock.mockReturnValue(['Jean Dupont']);

      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      const inputDoc = screen.getByDisplayValue('mon-rapport-pseudonymise.docx');
      expect(inputDoc).toHaveAttribute('aria-invalid', 'true');
    });

    it('le warning inline disparaît quand le nom est corrigé', async () => {
      nomContientValeursMappingMock.mockReturnValue(['Jean Dupont']);

      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      // Le warning est visible
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Simuler un retour à un nom sain
      nomContientValeursMappingMock.mockReturnValue([]);
      const inputDoc = screen.getByDisplayValue('mon-rapport-pseudonymise.docx');
      fireEvent.change(inputDoc, { target: { value: 'rapport-safe.docx' } });

      // Le warning a disparu
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // aria-invalid est retiré
      expect(inputDoc).toHaveAttribute('aria-invalid', 'false');
    });

    it('permet de télécharger une fois le nom corrigé', async () => {
      // D'abord, le nom est sensible
      nomContientValeursMappingMock.mockReturnValue(['Jean Dupont']);

      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      // Tenter de télécharger → bloqué
      fireEvent.click(screen.getByText('Télécharger le document'));
      expect(buildDocumentMock).not.toHaveBeenCalled();

      // Corriger le nom
      nomContientValeursMappingMock.mockReturnValue([]);
      const inputDoc = screen.getByDisplayValue('mon-rapport-pseudonymise.docx');
      fireEvent.change(inputDoc, { target: { value: 'rapport-propre.docx' } });

      // Maintenant le téléchargement fonctionne
      fireEvent.click(screen.getByText('Télécharger le document'));
      await waitFor(() => {
        expect(buildDocumentMock).toHaveBeenCalledTimes(1);
        expect(declencherTelechargementMock).toHaveBeenCalledWith(
          expect.any(Blob),
          'rapport-propre.docx',
        );
      });
    });

    it('ne montre pas de warning quand verifierNomSensible=false et télécharge directement', async () => {
      nomContientValeursMappingMock.mockReturnValue(['Jean Dupont']);

      renderAvecI18n(
        <EcranTelechargement {...PROPS_DEFAUT} verifierNomSensible={false} />,
      );

      // Aucun warning inline
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Télécharger le document'));

      await waitFor(() => {
        expect(buildDocumentMock).toHaveBeenCalledTimes(1);
        expect(declencherTelechargementMock).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Document téléchargé ✓')).toBeInTheDocument();
      });

      // Aucune modale de warning non plus
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Télécharger quand même')).not.toBeInTheDocument();
    });
  });

  describe('téléchargement de la clé', () => {
    it('déclenche le téléchargement de la clé au clic', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      fireEvent.click(screen.getByText('Télécharger la clé'));

      await waitFor(() => {
        expect(declencherTelechargementMock).toHaveBeenCalledTimes(1);
      });

      // Vérifie que le nom du fichier de clé est correct
      expect(declencherTelechargementMock).toHaveBeenCalledWith(
        expect.any(Blob),
        'mon-rapport.key.json',
      );
    });

    it('affiche "Clé téléchargée ✓" après téléchargement', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      fireEvent.click(screen.getByText('Télécharger la clé'));

      await waitFor(() => {
        expect(screen.getByText('Clé téléchargée ✓')).toBeInTheDocument();
      });
    });

    it('reste cliquable après téléchargement de la clé', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      fireEvent.click(screen.getByText('Télécharger la clé'));

      await waitFor(() => {
        const bouton = screen.getByText('Clé téléchargée ✓').closest('button');
        expect(bouton).not.toBeDisabled();
      });
    });
  });

  describe('indépendance des états', () => {
    it('permet de télécharger la clé sans avoir téléchargé le document', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      // Télécharger uniquement la clé
      fireEvent.click(screen.getByText('Télécharger la clé'));

      await waitFor(() => {
        expect(screen.getByText('Clé téléchargée ✓')).toBeInTheDocument();
      });

      // Le bouton document est toujours actif
      expect(screen.getByText('Télécharger le document')).toBeInTheDocument();
      const boutonDoc = screen.getByText('Télécharger le document').closest('button');
      expect(boutonDoc).not.toBeDisabled();
    });

    it('permet de télécharger le document sans avoir téléchargé la clé', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      // Télécharger uniquement le document
      fireEvent.click(screen.getByText('Télécharger le document'));

      await waitFor(() => {
        expect(screen.getByText('Document téléchargé ✓')).toBeInTheDocument();
      });

      // Le bouton clé est toujours actif
      expect(screen.getByText('Télécharger la clé')).toBeInTheDocument();
      const boutonCle = screen.getByText('Télécharger la clé').closest('button');
      expect(boutonCle).not.toBeDisabled();
    });

    it('permet de télécharger les deux fichiers indépendamment', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      // Télécharger le document
      fireEvent.click(screen.getByText('Télécharger le document'));
      await waitFor(() => {
        expect(screen.getByText('Document téléchargé ✓')).toBeInTheDocument();
      });

      // Puis la clé
      fireEvent.click(screen.getByText('Télécharger la clé'));
      await waitFor(() => {
        expect(screen.getByText('Clé téléchargée ✓')).toBeInTheDocument();
      });

      // Les deux sont marqués comme téléchargés
      expect(screen.getByText('Document téléchargé ✓')).toBeInTheDocument();
      expect(screen.getByText('Clé téléchargée ✓')).toBeInTheDocument();
    });
  });

  describe('nom de fichier différent', () => {
    it('affiche le nom du document basé sur nomFichierBase, suffixeDocument et extension', () => {
      renderAvecI18n(
        <EcranTelechargement
          {...PROPS_DEFAUT}
          nomFichierBase="compte-rendu"
          extension="txt"
        />,
      );
      expect(screen.getByDisplayValue('compte-rendu-pseudonymise.txt')).toBeInTheDocument();
      expect(screen.getByDisplayValue('compte-rendu.key.json')).toBeInTheDocument();
    });

    it('génère le bon nom pour les fichiers .md', () => {
      renderAvecI18n(
        <EcranTelechargement
          {...PROPS_DEFAUT}
          nomFichierBase="notes"
          extension="md"
        />,
      );
      expect(screen.getByDisplayValue('notes-pseudonymise.md')).toBeInTheDocument();
      expect(screen.getByDisplayValue('notes.key.json')).toBeInTheDocument();
    });
  });

  describe('édition du nom de fichier', () => {
    it('permet de modifier le nom du document dans le champ texte', () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);
      const inputDoc = screen.getByDisplayValue('mon-rapport-pseudonymise.docx');
      fireEvent.change(inputDoc, { target: { value: 'mon-rapport-modifie.docx' } });
      expect(inputDoc).toHaveValue('mon-rapport-modifie.docx');
    });

    it('permet de modifier le nom de la clé dans le champ texte', () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);
      const inputCle = screen.getByDisplayValue('mon-rapport.key.json');
      fireEvent.change(inputCle, { target: { value: 'ma-cle-personnalisee.key.json' } });
      expect(inputCle).toHaveValue('ma-cle-personnalisee.key.json');
    });

    it('télécharge le document avec le nom modifié', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      const inputDoc = screen.getByDisplayValue('mon-rapport-pseudonymise.docx');
      fireEvent.change(inputDoc, { target: { value: 'rapport-final.docx' } });

      fireEvent.click(screen.getByText('Télécharger le document'));

      await waitFor(() => {
        expect(declencherTelechargementMock).toHaveBeenCalledWith(
          expect.any(Blob),
          'rapport-final.docx',
        );
      });
    });

    it('télécharge la clé avec le nom modifié', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      const inputCle = screen.getByDisplayValue('mon-rapport.key.json');
      fireEvent.change(inputCle, { target: { value: 'mes-cles.key.json' } });

      fireEvent.click(screen.getByText('Télécharger la clé'));

      await waitFor(() => {
        expect(declencherTelechargementMock).toHaveBeenCalledWith(
          expect.any(Blob),
          'mes-cles.key.json',
        );
      });
    });

    it('reste éditable après téléchargement du document', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      const inputDoc = screen.getByDisplayValue('mon-rapport-pseudonymise.docx');
      expect(inputDoc).not.toBeDisabled();

      fireEvent.click(screen.getByText('Télécharger le document'));

      await waitFor(() => {
        expect(inputDoc).not.toBeDisabled();
      });
    });

    it('reste éditable après téléchargement de la clé', async () => {
      renderAvecI18n(<EcranTelechargement {...PROPS_DEFAUT} />);

      const inputCle = screen.getByDisplayValue('mon-rapport.key.json');
      expect(inputCle).not.toBeDisabled();

      fireEvent.click(screen.getByText('Télécharger la clé'));

      await waitFor(() => {
        expect(inputCle).not.toBeDisabled();
      });
    });
  });

  describe('personnalisation via props (labels)', () => {
    it('affiche les labels personnalisés pour la restauration', () => {
      renderAvecI18n(
        <EcranTelechargement
          {...PROPS_DEFAUT}
          titre="Télécharger les fichiers restaurés"
          sousTitre="Téléchargez chaque fichier indépendamment."
          libelleDocument="Document restauré"
          libelleCle="Clé .key.json"
          boutonDocument="Télécharger le document restauré"
          boutonCle="Télécharger la clé"
          succesDocument="Document restauré téléchargé ✓"
          succesCle="Clé téléchargée ✓"
          suffixeDocument="-restauré"
          boutonRetour="← Modifier les pseudos"
        />,
      );
      expect(screen.getByText('Télécharger les fichiers restaurés')).toBeInTheDocument();
      expect(screen.getByText('Document restauré')).toBeInTheDocument();
      expect(screen.getByText('Télécharger le document restauré')).toBeInTheDocument();
      expect(screen.getByDisplayValue('mon-rapport-restauré.docx')).toBeInTheDocument();
    });
  });
});
