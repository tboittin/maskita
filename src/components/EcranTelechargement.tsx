import { useCallback, useMemo, useState } from 'react';
import { buildDocument } from '../utils/buildDocument';
import { declencherTelechargement } from '../utils/telechargement';
import { genererCleJson, nomContientValeursMapping } from '../utils/mapping';
import { useLangue } from '../i18n/context';
import type { Mapping } from '../utils/mapping';
import {
  Bouton,
  MessageErreur,
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
  /** Active la vérification du nom du fichier pour les données sensibles (pseudonymisation uniquement) */
  verifierNomSensible?: boolean;
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
  verifierNomSensible = true,
}: EcranTelechargementProps) {
  const { t } = useLangue();
  const [docTelecharge, setDocTelecharge] = useState(false);
  const [cleTelechargee, setCleTelechargee] = useState(false);

  const nomDocInitial = `${nomFichierBase}${suffixeDocument}.${extension}`;
  const nomCleInitial = `${nomFichierBase}.key.json`;

  const [nomDocEdite, setNomDocEdite] = useState(nomDocInitial);
  const [nomCleEdite, setNomCleEdite] = useState(nomCleInitial);

  // Réévaluation en direct : le warning dépend du nom édité courant
  const valeursSuspectes = useMemo(
    () =>
      verifierNomSensible
        ? nomContientValeursMapping(nomDocEdite, mappingFinal)
        : [],
    [verifierNomSensible, nomDocEdite, mappingFinal],
  );

  const handleTelechargerDocument = useCallback(async () => {
    // Bloqué tant que le nom contient des données sensibles
    if (valeursSuspectes.length > 0) return;

    const blobDoc = await buildDocument(contenuDocument, extension as 'docx' | 'txt' | 'md');
    declencherTelechargement(blobDoc, nomDocEdite);
    setDocTelecharge(true);
  }, [contenuDocument, extension, nomDocEdite, valeursSuspectes]);

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
            aria-invalid={valeursSuspectes.length > 0}
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
            {docTelecharge ? succesDocument : boutonDocument}
          </Bouton>
        </div>

        {/* Warning inline : nom de fichier sensible */}
        {valeursSuspectes.length > 0 && (
          <div style={{ padding: '0 var(--espacement-md) var(--espacement-md)' }}>
            <MessageErreur>
              {t('app.warning.message', valeursSuspectes.join(', '), nomDocEdite)}
            </MessageErreur>
          </div>
        )}
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
            {cleTelechargee ? succesCle : boutonCle}
          </Bouton>
        </div>
      </Panneau>

      {/* Bouton retour */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Bouton variante="secondaire" onClick={onRetour}>
          {boutonRetour}
        </Bouton>
      </div>
    </div>
  );
}
