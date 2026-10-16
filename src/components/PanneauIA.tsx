import { useCallback, useState } from 'react';
import { useLangue } from '../i18n/context';
import { ModalPrecautionsIA } from './ModalPrecautionsIA';
import { Bouton, Panneau, ValiderIcon } from '@khaleeno/maskita-design-system';

type EtatCopie = 'attente' | 'copie' | 'echec';

/**
 * Panneau « Et ensuite ? » de l'écran Télécharger : avertissement court,
 * copie du prompt de préservation des pseudos, accès aux précautions.
 */
export function PanneauIA() {
  const { t } = useLangue();
  const [etatCopie, setEtatCopie] = useState<EtatCopie>('attente');
  const [precautionsOuvertes, setPrecautionsOuvertes] = useState(false);
  const prompt = t('ia.prompt');

  const handleCopier = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setEtatCopie('copie');
    } catch {
      // Presse-papier indisponible (contexte non sécurisé, permission refusée)
      setEtatCopie('echec');
    }
  }, [prompt]);

  return (
    <Panneau title={t('ia.panneau.titre')}>
      <div
        style={{
          padding: 'var(--espacement-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--espacement-sm)',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', lineHeight: 1.6 }}>
          {t('ia.panneau.texte')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--espacement-sm)' }}>
          <Bouton
            variante="secondaire"
            taille="md"
            onClick={handleCopier}
            iconeDroite={etatCopie === 'copie' ? <ValiderIcon className="size-5" /> : undefined}
          >
            {etatCopie === 'copie' ? t('ia.bouton.copie') : t('ia.bouton.copier')}
          </Bouton>
          <Bouton variante="ghost" taille="md" onClick={() => setPrecautionsOuvertes(true)}>
            {t('ia.bouton.precautions')}
          </Bouton>
        </div>
        {etatCopie === 'copie' && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--couleur-texte-secondaire)' }}>
            {t('ia.prompt.aide')}
          </p>
        )}
        {etatCopie === 'echec' && (
          <>
            <p style={{ fontSize: '0.8125rem', color: 'var(--couleur-texte-secondaire)' }}>
              {t('ia.copie.echec')}
            </p>
            <textarea
              readOnly
              value={prompt}
              aria-label={t('ia.prompt.libelle')}
              rows={8}
              onFocus={(e) => e.currentTarget.select()}
              style={{
                width: '100%',
                fontSize: '0.8125rem',
                fontFamily: 'var(--police-donnees, monospace)',
                border: '1px solid var(--couleur-bord, #ccc)',
                borderRadius: '4px',
                padding: '8px',
              }}
            />
          </>
        )}
      </div>
      <ModalPrecautionsIA ouvert={precautionsOuvertes} onFermer={() => setPrecautionsOuvertes(false)} />
    </Panneau>
  );
}
