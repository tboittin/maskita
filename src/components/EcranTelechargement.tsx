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
  textePseudonymise: string;
  mappingFinal: Mapping;
  nomFichierBase: string;
  extension: string;
  onRetour: () => void;
}

export function EcranTelechargement({
  textePseudonymise,
  mappingFinal,
  nomFichierBase,
  extension,
  onRetour,
}: EcranTelechargementProps) {
  const { t } = useLangue();
  const [docTelecharge, setDocTelecharge] = useState(false);
  const [cleTelechargee, setCleTelechargee] = useState(false);
  const [warningNom, setWarningNom] = useState<{
    mappingFinal: Mapping;
    nomFichier: string;
    valeursSuspectes: string[];
  } | null>(null);

  const nomDocInitial = `${nomFichierBase}-pseudonymise.${extension}`;
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

    const blobDoc = await buildDocument(textePseudonymise, extension as 'docx' | 'txt' | 'md');
    declencherTelechargement(blobDoc, nomDocEdite);
    setDocTelecharge(true);
  }, [textePseudonymise, mappingFinal, nomFichierBase, nomDocEdite, extension]);

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
          {t('telechargement.titre')}
        </h2>
        <p style={{ color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
          {t('telechargement.sousTitre')}
        </p>
      </div>

      {/* Ligne 1 : Document pseudonymisé */}
      <Panneau title={t('telechargement.document')}>
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
            disabled={docTelecharge}
            aria-label={t('telechargement.document')}
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
            disabled={docTelecharge}
          >
            {docTelecharge
              ? t('telechargement.succes.document')
              : t('telechargement.bouton.document')}
          </Bouton>
        </div>
      </Panneau>

      {/* Ligne 2 : Clé .key.json */}
      <Panneau title={t('telechargement.cle')}>
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
            disabled={cleTelechargee}
            aria-label={t('telechargement.cle')}
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
            disabled={cleTelechargee}
          >
            {cleTelechargee
              ? t('telechargement.succes.cle')
              : t('telechargement.bouton.cle')}
          </Bouton>
        </div>
      </Panneau>

      {/* Bouton retour */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Bouton variante="secondaire" onClick={onRetour}>
          {t('telechargement.bouton.retour')}
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
                  const blobDoc = await buildDocument(textePseudonymise, extension as 'docx' | 'txt' | 'md');
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
