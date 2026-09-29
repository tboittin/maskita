import { useCallback, useState } from 'react';
import { buildDocument } from '../utils/buildDocument';
import { declencherTelechargement } from '../utils/telechargement';
import { genererCleJson, nomContientValeursMapping } from '../utils/mapping';
import { useLangue } from '../i18n/context';
import type { Mapping } from '../utils/mapping';
import {
  Bouton,
  Modal,
  Panneau,
  TelechargerIcon,
  ValiderIcon,
} from '@khaleeno/maskita-design-system';

interface EcranTelechargementProps {
  contenuDocument: string;
  mappingFinal: Mapping;
  nomFichierBase: string;
  extension: string;
  onRetour: () => void;
  /** Suffixe ajouté au nom du document (ex: "-pseudonymisé" ou "-restauré") */
  suffixeDocument: string;
  /** Titre de l'écran */
  titre: string;
  /** Sous-titre de l'écran */
  sousTitre: string;
  /** Libellé du panneau document */
  libelleDocument: string;
  /** Libellé du panneau clé */
  libelleCle: string;
  /** Texte du bouton de téléchargement du document */
  boutonDocument: string;
  /** Texte du bouton de téléchargement de la clé */
  boutonCle: string;
  /** Texte de succès après téléchargement du document */
  succesDocument: string;
  /** Texte de succès après téléchargement de la clé */
  succesCle: string;
  /** Texte du bouton retour */
  boutonRetour: string;
}

export function EcranTelechargement({
  contenuDocument,
  mappingFinal,
  nomFichierBase,
  extension,
  onRetour,
  suffixeDocument,
  titre,
  sousTitre,
  libelleDocument,
  libelleCle,
  boutonDocument,
  boutonCle,
  succesDocument,
  succesCle,
  boutonRetour,
}: EcranTelechargementProps) {
  const { t } = useLangue();
  const [docTelecharge, setDocTelecharge] = useState(false);
  const [cleTelechargee, setCleTelechargee] = useState(false);
  const [warningNom, setWarningNom] = useState<{
    mappingFinal: Mapping;
    nomFichier: string;
    valeursSuspectes: string[];
  } | null>(null);

  const nomDocInitial = `${nomFichierBase}${suffixeDocument}.${extension}`;
  const nomCleInitial = `${nomFichierBase}.key.json`;

  const [nomDocEdite, setNomDocEdite] = useState(nomDocInitial);
  const [nomCleEdite, setNomCleEdite] = useState(nomCleInitial);

  const handleTelechargerDocument = useCallback(async () => {
    const suspectes = nomContientValeursMapping(nomFichierBase, mappingFinal);
    if (suspectes.length > 0) {
      setWarningNom({
        mappingFinal,
        nomFichier: nomDocEdite,
        valeursSuspectes: suspectes,
      });
      return;
    }

    const blobDoc = await buildDocument(contenuDocument, extension as 'docx' | 'txt' | 'md');
    declencherTelechargement(blobDoc, nomDocEdite);
    setDocTelecharge(true);
  }, [contenuDocument, mappingFinal, nomFichierBase, nomDocEdite, extension]);

  const handleTelechargerCle = useCallback(async () => {
    const contenuCle = genererCleJson(mappingFinal);
    const blobCle = new Blob([contenuCle], { type: 'application/json' });
    declencherTelechargement(blobCle, nomCleEdite);
    setCleTelechargee(true);
  }, [mappingFinal, nomCleEdite]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--couleur-texte)' }}>
          {titre}
        </h2>
        <p style={{ color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
          {sousTitre}
        </p>
      </div>

      {/* Ligne 1 : Document */}
      <Panneau title={libelleDocument}>
        <div
          style={{
            padding: 'var(--espacement-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--espacement-md)',
          }}
        >
          <input
            type="text"
            value={nomDocEdite}
            onChange={(e) => setNomDocEdite(e.target.value)}
            aria-label={libelleDocument}
            style={{
              flex: 1,
              fontSize: '0.875rem',
              color: 'var(--couleur-texte)',
              fontFamily: 'var(--police-donnees, monospace)',
              background: 'transparent',
              border: '1px solid var(--couleur-bord, #ccc)',
              borderRadius: '4px',
              padding: '4px 8px',
              outline: 'none',
            }}
          />
          <Bouton
            variante={docTelecharge ? 'secondaire' : 'primaire'}
            taille="md"
            onClick={handleTelechargerDocument}
            iconeDroite={docTelecharge ? <ValiderIcon className="size-5" /> : <TelechargerIcon className="size-5" />}
          >
            {docTelecharge
              ? succesDocument
              : boutonDocument}
          </Bouton>
        </div>
      </Panneau>

      {/* Ligne 2 : Clé .key.json */}
      <Panneau title={libelleCle}>
        <div
          style={{
            padding: 'var(--espacement-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--espacement-md)',
          }}
        >
          <input
            type="text"
            value={nomCleEdite}
            onChange={(e) => setNomCleEdite(e.target.value)}
            aria-label={libelleCle}
            style={{
              flex: 1,
              fontSize: '0.875rem',
              color: 'var(--couleur-texte)',
              fontFamily: 'var(--police-donnees, monospace)',
              background: 'transparent',
              border: '1px solid var(--couleur-bord, #ccc)',
              borderRadius: '4px',
              padding: '4px 8px',
              outline: 'none',
            }}
          />
          <Bouton
            variante={cleTelechargee ? 'secondaire' : 'primaire'}
            taille="md"
            onClick={handleTelechargerCle}
            iconeDroite={cleTelechargee ? <ValiderIcon className="size-5" /> : <TelechargerIcon className="size-5" />}
          >
            {cleTelechargee
              ? succesCle
              : boutonCle}
          </Bouton>
        </div>
      </Panneau>

      {/* Bouton retour */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Bouton variante="secondaire" onClick={onRetour}>
          {boutonRetour}
        </Bouton>
      </div>

      {/* Warning nom de fichier sensible */}
      {warningNom && (
        <Modal
          ouvert={!!warningNom}
          titre={t('app.warning.titre')}
          onFermer={() => setWarningNom(null)}
          pied={
            <>
              <Bouton variante="secondaire" onClick={() => setWarningNom(null)}>
                {t('app.warning.annuler')}
              </Bouton>
              <Bouton
                variante="danger"
                onClick={async () => {
                  const w = warningNom;
                  setWarningNom(null);
                  const blobDoc = await buildDocument(contenuDocument, extension as 'docx' | 'txt' | 'md');
                  declencherTelechargement(blobDoc, w.nomFichier);
                  setDocTelecharge(true);
                }}
              >
                {t('app.warning.confirmer')}
              </Bouton>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-brume-500" style={{ whiteSpace: 'pre-wrap' }}>
            {t('app.warning.message', warningNom.valeursSuspectes.join(', '), warningNom.nomFichier)}
          </p>
        </Modal>
      )}
    </div>
  );
}
