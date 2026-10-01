import { useState, useCallback, useRef, useEffect } from 'react';
import { useLangue } from '../i18n/context';
import { Bouton, TelechargerIcon } from '@khaleeno/maskita-design-system';
import { PanneauTableauPseudos } from './PanneauTableauPseudos';
import { PanneauApercus } from './PanneauApercus';
import { BarreAjoutSelection } from './BarreAjoutSelection';
import { PickerAjoutValeur } from './PickerAjoutValeur';
import { useAjoutRapide } from '../hooks/useAjoutRapide';
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

  const [focusNouveauTag, setFocusNouveauTag] = useState<string | null>(null);

  const ajout = useAjoutRapide({
    onAjouterPseudo: onAjouterTag,
    onAjouterValeur,
    onFocusNouveauPseudo: setFocusNouveauTag,
  });

  // Focus/édition inline du nouveau pseudo créé via sélection de texte
  useEffect(() => {
    if (!focusNouveauTag || !refTableau.current) return;
    const raf = requestAnimationFrame(() => {
      const tableau = refTableau.current;
      if (!tableau) return;
      const spans = tableau.querySelectorAll('span');
      for (const span of spans) {
        if (span.textContent?.trim() === focusNouveauTag) {
          const btn = span.closest('button[type="button"]');
          if (btn) {
            btn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
          }
          break;
        }
      }
      setFocusNouveauTag(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [focusNouveauTag]);

  // Nettoyer la sélection si l'utilisateur clique ailleurs
  useEffect(() => {
    const handleClick = () => {
      const sel = window.getSelection();
      if (!sel || sel.toString().trim() === '') {
        ajout.effacerSelection();
      }
    };
    window.addEventListener('mouseup', handleClick);
    return () => window.removeEventListener('mouseup', handleClick);
  }, [ajout]);

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
    ajout.effacerSelection();
    setTagSurbrillance(tag);
    setValeurSurbrillance(null);
    defilerTableauVers(tag);
  }, [ajout, defilerTableauVers]);

  const handleTexteValeurClick = useCallback((tag: string, valeur: string) => {
    ajout.effacerSelection();
    setTagSurbrillance(tag);
    setValeurSurbrillance(v => v === valeur ? null : valeur);
    defilerTableauVers(tag);
  }, [ajout, defilerTableauVers]);

  const barreAjout = () => (
    <BarreAjoutSelection
      onNouveauPseudo={ajout.nouveauPseudo}
      onNouvelleValeur={ajout.nouvelleValeur}
      onAjoutClassique={() => {}}
      libelleNouveauPseudo={t('revue.bouton.nouveauTag')}
      libelleNouvelleValeur={t('revue.bouton.nouvelleValeur')}
      libelleAjoutClassique={t('revue.bouton.ajoutClassique')}
    />
  );

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
            onSelection: ajout.gererSelection('haut'),
            toolbar: ajout.selection?.source === 'haut' ? barreAjout() : undefined,
          }}
          voletBas={{
            titre: t('restaurationRevue.titre.restaure'),
            texte: texteRestauré,
            surlignerValeurs: true,
            onClicValeur: handleTexteValeurClick,
            onSelection: ajout.gererSelection('bas'),
            toolbar: ajout.selection?.source === 'bas' ? barreAjout() : undefined,
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

      {/* Picker tag pour ajouter la valeur surlignée à un pseudo existant */}
      {ajout.picker && (
        <PickerAjoutValeur
          ouvert={!!ajout.picker}
          titre={t('revue.picker.titre.ajouter')}
          tagSource={null}
          tags={Object.keys(mapping)}
          onChoisir={ajout.choixTag}
          onAnnuler={ajout.annulerPicker}
          libelleValeur={t('revue.picker.valeur', ajout.picker.valeur)}
          libelleAucun={t('revue.picker.aucun')}
          libelleAnnuler={t('revue.picker.annuler')}
        />
      )}
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