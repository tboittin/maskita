import { useCallback, useState } from 'react';
import { FileDropZone } from './FileDropZone';
import { useRestauration } from '../hooks/useRestauration';
import { buildDocument } from '../utils/buildDocument';
import { declencherTelechargement } from '../utils/telechargement';
import { PopupConfirmation } from './PopupConfirmation';
import { nomContientValeursMapping } from '../utils/mapping';
import type { Mapping } from '../utils/mapping';

export function EcranRestauration() {
  const {
    texteRestauré,
    chargement,
    erreur,
    fichierDocx,
    extension,
    mapping,
    nomFichierCle,
    handleDocxChoisi,
    handleCleChoisie,
    reinitialiser,
  } = useRestauration();

  const [warningNom, setWarningNom] = useState<{
    mappingFinal: Mapping;
    nomFichier: string;
    valeursSuspectes: string[];
  } | null>(null);

  const executerTelechargement = useCallback(async () => {
    if (!texteRestauré || !fichierDocx) return;
    const ext = extension ?? 'docx';
    const nomBase = fichierDocx.name.replace(/\.(docx|txt|md)$/i, '') + '-restauré';
    const blob = await buildDocument(texteRestauré, ext);
    declencherTelechargement(blob, `${nomBase}.${ext}`);
  }, [texteRestauré, fichierDocx, extension]);

  const handleTelecharger = useCallback(async () => {
    if (!texteRestauré || !fichierDocx || !mapping) return;
    const ext = extension ?? 'docx';
    const nomBase = fichierDocx.name.replace(/\.(docx|txt|md)$/i, '');

    const suspectes = nomContientValeursMapping(nomBase, mapping);
    if (suspectes.length > 0) {
      setWarningNom({
        mappingFinal: mapping,
        nomFichier: `${nomBase}-restauré.${ext}`,
        valeursSuspectes: suspectes,
      });
      return;
    }

    await executerTelechargement();
  }, [texteRestauré, fichierDocx, extension, mapping, executerTelechargement]);

  const estPret = texteRestauré !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)' }}>
          Rapport modifié (avec des tags)
        </h3>
        <FileDropZone
          onFichierChoisi={handleDocxChoisi}
          chargement={chargement}
          erreur={erreur}
          fichierCourant={fichierDocx?.name ?? null}
          accept=".docx,.txt,.md"
        />
      </div>

      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)', color: 'var(--couleur-texte-secondaire)' }}>
          Clé .key.json correspondante <span style={{ fontWeight: 400 }}>(obligatoire)</span>
        </h3>
        <FileDropZone
          onFichierChoisi={handleCleChoisie}
          fichierCourant={nomFichierCle}
          accept=".json"
          libelle=".key.json"
        />
      </div>

      {estPret && (
        <div
          style={{
            background: 'var(--couleur-surface)',
            border: '1px solid var(--couleur-bordure)',
            borderRadius: 'var(--rayon-bordure)',
            padding: 'var(--espacement-md)',
          }}
        >
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 var(--espacement-sm) 0' }}>
            Aperçu du texte restauré
          </h4>
          <div
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: 'var(--espacement-sm)',
              background: 'white',
              border: '1px solid var(--couleur-bordure)',
              borderRadius: 'var(--rayon-bordure)',
              color: 'var(--couleur-texte)',
            }}
          >
            {texteRestauré}
          </div>
        </div>
      )}

      {estPret && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--espacement-sm)' }}>
          <button
            onClick={reinitialiser}
            style={{
              padding: 'var(--espacement-sm) var(--espacement-md)',
              background: 'none',
              border: '1px solid var(--couleur-bordure)',
              borderRadius: 'var(--rayon-bordure)',
              cursor: 'pointer',
              color: 'var(--couleur-texte-secondaire)',
              fontSize: '0.875rem',
            }}
          >
            Recommencer
          </button>
          <button
            onClick={handleTelecharger}
            style={{
              padding: 'var(--espacement-sm) var(--espacement-lg)',
              background: 'var(--couleur-primaire)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--rayon-bordure)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Télécharger le rapport restauré
          </button>
        </div>
      )}

      {warningNom && (
        <PopupConfirmation
          titre="Nom de fichier sensible"
          message={`Le nom du fichier source contient des données potentiellement identifiantes : ${warningNom.valeursSuspectes.join(', ')}.\n\nFichier concerné : ${warningNom.nomFichier}\n\nConseil : renommez le fichier source avant de le traiter pour éviter toute fuite via le nom du fichier téléchargé.\n\nVoulez-vous télécharger quand même ?`}
          boutonConfirmer="Télécharger quand même"
          boutonAnnuler="Annuler"
          onConfirmer={() => {
            setWarningNom(null);
            executerTelechargement();
          }}
          onAnnuler={() => setWarningNom(null)}
        />
      )}
    </div>
  );
}