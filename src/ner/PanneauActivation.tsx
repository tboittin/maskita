/**
 * MSK-004 — Panneau d'activation de la détection avancée (écran de dépôt).
 * Rien n'est téléchargé tant que l'utilisateur n'a pas cliqué.
 */
import { Bouton, Panneau } from '@khaleeno/maskita-design-system';
import { useLangue } from '../i18n/context';
import type { DetectionAvancee } from './useDetectionAvancee';

export function PanneauActivation({ detection }: { detection: DetectionAvancee }) {
  const { t } = useLangue();
  const { etat, progression, erreur, activer } = detection;
  return (
    <Panneau title={t('ner.titre')}>
      <div style={{ padding: 'var(--espacement-md)', display: 'flex', flexDirection: 'column', gap: 'var(--espacement-sm)' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)' }}>
          {t('ner.description')}
        </p>
        {(etat === 'inactif' || etat === 'erreur') && (
          <div>
            <Bouton variante="secondaire" onClick={activer}>{t('ner.bouton.activer')}</Bouton>
          </div>
        )}
        {etat === 'chargement' && (
          <div role="status">
            <progress value={progression} max={100} style={{ width: '100%' }} />
            <span style={{ fontSize: '0.875rem' }}>{t('ner.chargement', progression)}</span>
          </div>
        )}
        {etat === 'pret' && <p role="status" style={{ margin: 0, fontSize: '0.875rem' }}>✓ {t('ner.pret')}</p>}
        {etat === 'erreur' && erreur && <p role="alert" style={{ margin: 0, fontSize: '0.875rem' }}>{t('ner.erreur', erreur)}</p>}
      </div>
    </Panneau>
  );
}
