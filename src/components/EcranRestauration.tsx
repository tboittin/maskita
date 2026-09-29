import { useEffect } from 'react';
import { FileDropZone } from './FileDropZone';
import { EcranRestaurationRevue } from './EcranRestaurationRevue';
import { EcranTelechargement } from './EcranTelechargement';
import { useRestauration, type EtapeRestauration } from '../hooks/useRestauration';
import { useLangue } from '../i18n/context';
import {
  Bouton,
  Panneau,
} from '@khaleeno/maskita-design-system';

interface EcranRestaurationProps {
  onEtapeChange?: (etape: EtapeRestauration) => void;
}

export function EcranRestauration({ onEtapeChange }: EcranRestaurationProps) {
  const { t } = useLangue();
  const {
    texteAvecTags,
    texteRestauré,
    chargement,
    erreur,
    fichierDocx,
    extension,
    mapping,
    nomFichierCle,
    etape,
    handleDocxChoisi,
    handleCleChoisie,
    handleLancerRestauration,
    handleValiderRevue,
    reinitialiser,
  } = useRestauration();

  // Synchroniser l'étape avec App.tsx pour les Jalons
  useEffect(() => {
    onEtapeChange?.(etape);
  }, [etape, onEtapeChange]);

  const estPret = texteRestauré !== null;
  const nomFichierBase = fichierDocx?.name.replace(/\.(docx|txt|md)$/i, '') ?? 'document';
  const ext = extension ?? 'docx';

  // Phase upload
  if (etape === 'upload') {
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
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Bouton variante="primaire" taille="lg" onClick={handleLancerRestauration}>
              {t('restauration.bouton.lancer')}
            </Bouton>
          </div>
        )}
      </div>
    );
  }

  // Phase revue
  if (etape === 'revue') {
    return (
      <EcranRestaurationRevue
        texteAvecTags={texteAvecTags ?? ''}
        texteRestauré={texteRestauré ?? ''}
        mapping={mapping ?? {}}
        onValider={handleValiderRevue}
        onRetour={reinitialiser}
      />
    );
  }

  // Phase telechargement
  return (
    <EcranTelechargement
      contenuDocument={texteRestauré ?? ''}
      mappingFinal={mapping ?? {}}
      nomFichierBase={nomFichierBase}
      extension={ext}
      onRetour={handleLancerRestauration}
      suffixeDocument="-restauré"
      titre={t('restaurationTelechargement.titre')}
      sousTitre={t('restaurationTelechargement.sousTitre')}
      libelleDocument={t('restaurationTelechargement.document')}
      libelleCle={t('restaurationTelechargement.cle')}
      boutonDocument={t('restaurationTelechargement.bouton.document')}
      boutonCle={t('restaurationTelechargement.bouton.cle')}
      succesDocument={t('restaurationTelechargement.succes.document')}
      succesCle={t('restaurationTelechargement.succes.cle')}
      boutonRetour={t('restaurationTelechargement.bouton.retour')}
    />
  );
}
