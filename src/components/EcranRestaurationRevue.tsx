import { useState, useCallback, useRef } from 'react';
import { useLangue } from '../i18n/context';
import { Bouton, TelechargerIcon } from '@khaleeno/maskita-design-system';
import { PanneauTableauPseudos } from './PanneauTableauPseudos';
import { PanneauApercus } from './PanneauApercus';
import type { Mapping } from '../utils/mapping';

interface EcranRestaurationRevueProps {
  texteAvecTags: string;
  texteRestauré: string;
  mapping: Mapping;
  onValider: () => void;
  onRetour: () => void;
  /* US-V03 — Modification du mapping à l'étape Restauration */
  onAjouterValeur: (tag: string, valeur: string) => void;
  onRetirerValeur: (tag: string, valeur: string) => void;
  onDeplacerValeur: (valeur: string, tagSource: string, tagCible: string) => void;
  onReordonnerValeurs: (tag: string, debut: number, fin: number) => void;
  onRenommerTag: (ancien: string, nouveau: string) => void;
  onSupprimerTag: (tag: string) => void;
  onAjouterTag: (type: string, valeur: string) => void;
}

export function EcranRestaurationRevue({
  texteAvecTags,
  texteRestauré,
  mapping,
  onValider,
  onRetour,
  onAjouterValeur,
  onRetirerValeur,
  onDeplacerValeur,
  onReordonnerValeurs,
  onRenommerTag,
  onSupprimerTag,
  onAjouterTag,
}: EcranRestaurationRevueProps) {
  const { t } = useLangue();
  const [tagSurbrillance, setTagSurbrillance] = useState<string | null>(null);
  const [valeurSurbrillance, setValeurSurbrillance] = useState<string | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const [recentrer, setRecentrer] = useState(true);

  const refTableau = useRef<HTMLDivElement>(null);

  const handleTagClick = useCallback((tag: string) => {
    setTagSurbrillance(prev => prev === tag ? null : tag);
    setValeurSurbrillance(null);
  }, []);

  const handleValeurClick = useCallback((tag: string, valeur: string) => {
    setTagSurbrillance(tag);
    setValeurSurbrillance(v => v === valeur ? null : valeur);
  }, []);

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
        {/* Volet gauche : tableau des pseudos (composant neutre partagé) */}
        <PanneauTableauPseudos
          mapping={mapping}
          activeTag={tagSurbrillance}
          onSelectTag={handleTagClick}
          onClicValeur={handleValeurClick}
          onAjouterValeur={onAjouterValeur}
          onRetirerValeur={onRetirerValeur}
          onDeplacerValeur={onDeplacerValeur}
          onReordonnerValeurs={onReordonnerValeurs}
          onRenommerTag={onRenommerTag}
          onSupprimerTag={onSupprimerTag}
          onAjouterTag={onAjouterTag}
          refTableau={refTableau}
        />

        {/* Volet droit : aperçus texte (composant neutre partagé) */}
        <PanneauApercus
          mapping={mapping}
          tagSurbrillance={tagSurbrillance}
          valeurSurbrillance={valeurSurbrillance}
          syncScroll={syncScroll}
          voletHaut={{
            titre: t('revue.titre.pseudo'),
            texte: texteAvecTags,
            surlignerTags: true,
            onClicTag: handleTexteTagClick,
          }}
          voletBas={{
            titre: t('restaurationRevue.titre.restaure'),
            texte: texteRestauré,
            surlignerValeurs: true,
            onClicValeur: handleTexteValeurClick,
          }}
        />
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