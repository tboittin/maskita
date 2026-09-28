import { useState, useCallback, useRef } from 'react';
import { TexteApercu } from './TexteApercu';
import { useLangue } from '../i18n/context';
import {
  Bouton,
  PseudoTableau,
  TelechargerIcon,
  type LignePseudo,
  type ToneStatut,
} from '@khaleeno/maskita-design-system';
import type { Mapping } from '../utils/mapping';

interface EcranRestaurationRevueProps {
  texteAvecTags: string;
  texteRestauré: string;
  mapping: Mapping;
  onValider: () => void;
  onRetour: () => void;
}

export function EcranRestaurationRevue({
  texteAvecTags,
  texteRestauré,
  mapping,
  onValider,
  onRetour,
}: EcranRestaurationRevueProps) {
  const { t } = useLangue();
  const [tagSurbrillance, setTagSurbrillance] = useState<string | null>(null);
  const [valeurSurbrillance, setValeurSurbrillance] = useState<string | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const [recentrer, setRecentrer] = useState(true);

  const refAvecTags = useRef<HTMLDivElement>(null);
  const refRestauré = useRef<HTMLDivElement>(null);
  const refTableau = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  // Construire les lignes pour le PseudoTableau DS
  const lignes: LignePseudo[] = Object.entries(mapping).map(([tag, valeurs]) => ({
    tag,
    statut: 'existant' as ToneStatut,
    valeurs,
    isActive: tag === tagSurbrillance,
  }));

  const handleTagClick = useCallback((tag: string) => {
    setTagSurbrillance(prev => prev === tag ? null : tag);
    setValeurSurbrillance(null);
  }, []);

  const handleValeurClick = useCallback((tag: string, valeur: string) => {
    setTagSurbrillance(tag);
    setValeurSurbrillance(v => v === valeur ? null : valeur);
  }, []);

  const handleScroll = useCallback(
    (source: 'tags' | 'restauré') =>
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll || syncing.current) return;
        syncing.current = true;

        const sourceEl = e.currentTarget;
        const ratio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);

        const cible =
          source === 'tags' ? refRestauré.current : refAvecTags.current;
        if (cible) {
          cible.scrollTop = ratio * (cible.scrollHeight - cible.clientHeight || 1);
        }

        requestAnimationFrame(() => { syncing.current = false; });
      },
    [syncScroll],
  );

  const defilerTableauVers = useCallback((tag: string) => {
    const tableau = refTableau.current;
    if (tableau) {
      const lignes = tableau.querySelectorAll('tr[data-tag]');
      for (const ligne of lignes) {
        if (ligne.getAttribute('data-tag') === tag) {
          ligne.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  }, []);

  const handleTexteTagClick = useCallback((tag: string) => {
    setTagSurbrillance(tag);
    setValeurSurbrillance(null);
    defilerTableauVers(tag);
  }, [defilerTableauVers]);

  const handleTexteValeurClick = useCallback((tag: string, valeur: string) => {
    setTagSurbrillance(tag);
    setValeurSurbrillance(v => v === valeur ? null : valeur);
    defilerTableauVers(tag);
  }, [defilerTableauVers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacement-md)' }}>
        {/* Volet gauche : tableau des pseudos */}
        <div
          ref={refTableau}
          style={{
            background: 'var(--couleur-surface)',
            border: '1px solid var(--couleur-bordure)',
            borderRadius: 'var(--rayon-bordure)',
            padding: 'var(--espacement-md)',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          <PseudoTableau
            lignes={lignes}
            activeTag={tagSurbrillance ?? ''}
            onSelect={handleTagClick}
            onValeurClick={handleValeurClick}
            libelleTitre={t('tableau.titre', Object.keys(mapping).length)}
            libelleAucun={t('tableau.aucun')}
            libelleVoir={t('tableau.voir')}
            libelleValeursVides={t('tableau.vide')}
            // Read-only — callbacks vides pour éviter les erreurs TS
            onAjouterPseudo={() => {}}
            onDeplacerValeur={() => {}}
            onReordonnerValeurs={() => {}}
            onRenommer={() => {}}
            onRetirerValeur={() => {}}
            onViderTag={() => {}}
            onAjouterValeur={() => {}}
            libelleAjouter=""
            libelleAjouterValeur=""
            libelleRetirerValeur={() => ''}
            libelleViderTag=""
            placeholderNouvelleValeur=""
          />
        </div>

        {/* Volet droit : aperçus texte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
          <TexteApercu
            titre={t('revue.titre.pseudo')}
            texte={texteAvecTags}
            mapping={mapping}
            tagSurbrillance={tagSurbrillance}
            surlignerTags
            containerRef={refAvecTags}
            onScroll={handleScroll('tags')}
            onTagClick={handleTexteTagClick}
          />
          <TexteApercu
            titre={t('restaurationRevue.titre.restaure')}
            texte={texteRestauré}
            mapping={mapping}
            tagSurbrillance={tagSurbrillance}
            valeurSurbrillance={valeurSurbrillance}
            surlignerValeurs
            containerRef={refRestauré}
            onScroll={handleScroll('restauré')}
            onValeurClick={handleTexteValeurClick}
          />
        </div>
      </div>

      {/* Barre d'outils */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--espacement-md)', alignItems: 'center' }}>
          <CheckboxInput checked={syncScroll} onChange={setSyncScroll} label={t('revue.checkbox.sync')} />
          <CheckboxInput checked={recentrer} onChange={setRecentrer} label={t('revue.checkbox.recentrer')} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--espacement-sm)' }}>
          <Bouton variante="secondaire" onClick={onRetour}>
            {t('restauration.bouton.recommencer')}
          </Bouton>
          <Bouton variante="primaire" taille="lg" onClick={onValider} iconeDroite={<TelechargerIcon className="size-5" />}>
            {t('revue.bouton.valider')}
          </Bouton>
        </div>
      </div>
    </div>
  );
}

function CheckboxInput({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 'var(--espacement-sm)',
      fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)',
      cursor: 'pointer', userSelect: 'none',
    }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ cursor: 'pointer' }} />
      {label}
    </label>
  );
}
