import { useCallback, useState } from 'react';
import { FileDropZone } from './FileDropZone';
import { useRestauration } from '../hooks/useRestauration';
import { buildDocument } from '../utils/buildDocument';
import { declencherTelechargement } from '../utils/telechargement';
import { nomContientValeursMapping } from '../utils/mapping';
import { useLangue } from '../i18n/context';
import {
  Bouton,
  Modal,
  Panneau,
  TelechargerIcon,
} from '@khaleeno/maskita-design-system';
import type { Mapping } from '../utils/mapping';

export function EcranRestauration() {
  const { t } = useLangue();
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
      <Panneau title={t('restauration.titre.rapport')}>
        <div style={{ padding: 'var(--espacement-md)' }}>
          <FileDropZone
            onFichierChoisi={handleDocxChoisi}
            chargement={chargement}
            erreur={erreur}
            fichierCourant={fichierDocx?.name ?? null}
            accept=".docx,.txt,.md"
          />
        </div>
      </Panneau>

      <Panneau title={`${t('restauration.titre.cle')} ${t('restauration.obligatoire')}`}>
        <div style={{ padding: 'var(--espacement-md)' }}>
          <FileDropZone
            onFichierChoisi={handleCleChoisie}
            fichierCourant={nomFichierCle}
            accept=".json"
            libelle=".key.json"
          />
        </div>
      </Panneau>

      {estPret && (
        <Panneau title={t('restauration.apercu')}>
          <div
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: 'var(--espacement-md)',
              color: 'var(--couleur-texte)',
            }}
            className="font-lecture"
          >
            {texteRestauré}
          </div>
        </Panneau>
      )}

      {estPret && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--espacement-sm)' }}>
          <Bouton variante="secondaire" onClick={reinitialiser}>
            {t('restauration.bouton.recommencer')}
          </Bouton>
          <Bouton variante="primaire" taille="lg" onClick={handleTelecharger} iconeDroite={<TelechargerIcon className="size-5" />}>
            {t('restauration.bouton.telecharger')}
          </Bouton>
        </div>
      )}

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
                onClick={() => {
                  setWarningNom(null);
                  executerTelechargement();
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