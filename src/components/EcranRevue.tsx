import { useState, useRef, useCallback, useEffect } from 'react';
import { useRevue } from '../hooks/useRevue';
import { useAjoutRapide } from '../hooks/useAjoutRapide';
import { useLangue } from '../i18n/context';
import { Bouton, type ToneStatut } from '@khaleeno/maskita-design-system';
import { PanneauTableauPseudos } from './PanneauTableauPseudos';
import { PanneauApercus } from './PanneauApercus';
import { BarreAjoutSelection } from './BarreAjoutSelection';
import { PickerAjoutValeur } from './PickerAjoutValeur';
import type { Mapping } from '../utils/mapping';

interface EcranRevueProps {
  texteOriginal: string;
  mappingInitial: Mapping;
  onValider: (mappingFinal: Mapping, textePseudonymise: string) => void;
}

export function EcranRevue({
  texteOriginal,
  mappingInitial,
  onValider,
}: EcranRevueProps) {
  const { t } = useLangue();
  const revue = useRevue(texteOriginal, mappingInitial);
  const [syncScroll, setSyncScroll] = useState(true);
  const [recentrer, setRecentrer] = useState(true);

  const refPseudonymise = useRef<HTMLDivElement>(null);
  const refLisible = useRef<HTMLDivElement>(null);
  const refTableau = useRef<HTMLDivElement>(null);
  const occurrenceIdx = useRef<Record<string, number>>({});

  const [focusNouveauTag, setFocusNouveauTag] = useState<string | null>(null);
  const [montrerAjoutClassique, setMontrerAjoutClassique] = useState(false);
  // Flag réservé à l'US-SUG-B : le formulaire complet d'ajout classique
  // n'est pas encore rendu. On lit la valeur pour éviter un dead code (TS6133).
  void montrerAjoutClassique;

  const ajout = useAjoutRapide({
    onAjouterPseudo: revue.ajouterTag,
    onAjouterValeur: revue.ajouterValeur,
    onDeplacerValeur: revue.deplacerValeur,
    onFocusNouveauPseudo: setFocusNouveauTag,
  });

  // Focus/édition inline du nouveau tag créé via sélection de texte → "Nouveau tag"
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

  const defilerTexteVers = useCallback((tag: string, sens?: 'next') => {
    const pseudo = refPseudonymise.current;
    if (!pseudo) return;

    const spans = Array.from(pseudo.querySelectorAll('span'));
    const occurrences = spans.filter(s => s.textContent === tag);

    if (occurrences.length === 0) return;

    if (sens === 'next') {
      const idx = (occurrenceIdx.current[tag] ?? -1) + 1;
      const cible = idx >= occurrences.length ? 0 : idx;
      occurrenceIdx.current[tag] = cible;
      occurrences[cible].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      occurrenceIdx.current[tag] = 0;
      occurrences[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleChoisirTag = useCallback((tag: string) => {
    const valeur = ajout.picker?.valeur;
    ajout.choixTag(tag);
    if (valeur) {
      revue.mettreSurbrillanceValeur(tag, valeur);
      defilerTableauVers(tag);
    }
  }, [ajout, revue, defilerTableauVers]);

  const handleClicValider = () => {
    onValider(revue.mappingFinal, revue.textePseudonymise);
  };

  const handleTagClick = useCallback((tag: string) => {
    revue.mettreSurbrillance(tag);
  }, [revue]);

  const handleValeurClick = useCallback((tag: string, valeur: string) => {
    revue.mettreSurbrillanceValeur(tag, valeur);
    defilerTableauVers(tag);
    const lisible = refLisible.current;
    if (lisible) {
      const spans = Array.from(lisible.querySelectorAll('span'));
      for (const span of spans) {
        if (span.textContent === valeur) {
          span.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  }, [revue, defilerTableauVers]);

  const handleTexteTagClick = useCallback((tag: string) => {
    ajout.effacerSelection();
    revue.mettreSurbrillance(tag);
    defilerTableauVers(tag);
    defilerTexteVers(tag, 'next');
  }, [ajout, revue, defilerTableauVers, defilerTexteVers]);

  const handleTexteValeurClick = useCallback((tag: string, valeur: string) => {
    ajout.effacerSelection();
    revue.mettreSurbrillanceValeur(tag, valeur);
    defilerTableauVers(tag);
    if (recentrer) {
      defilerTexteVers(tag);
    }
  }, [ajout, revue, defilerTableauVers, recentrer, defilerTexteVers]);

  const handleConflitVoir = useCallback((tag: string) => {
    revue.mettreSurbrillance(tag);
    defilerTexteVers(tag);
    defilerTableauVers(tag);
  }, [revue, defilerTexteVers, defilerTableauVers]);

  const tagsExistants = Object.keys(revue.mappingFinal);

  const valeurSelectionnee = revue.valeurSurbrillance
    ? { tag: revue.tagSurbrillance!, valeur: revue.valeurSurbrillance }
    : null;

  const conflitsParTag = revue.conflits.reduce<Record<string, string[]>>((acc, c) => {
    if (!acc[c.tag]) acc[c.tag] = [];
    acc[c.tag].push(c.message);
    return acc;
  }, {});

  const construireLigne = (tag: string, valeurs: string[]): Partial<import('@khaleeno/maskita-design-system').LignePseudo> => {
    const conflits = conflitsParTag[tag] ?? [];
    let statut: ToneStatut = 'existant';
    if (conflits.length > 0) statut = 'conflit';
    else if (valeurs.length === 0) statut = 'vide';
    else if (revue.tags.find(entry => entry.tag === tag)?.estNouveau) statut = 'nouveau';
    return {
      statut,
      conflitMessage: conflits.length > 0 ? conflits[conflits.length - 1] : undefined,
    };
  };

  const barreAjout = () => (
    <BarreAjoutSelection
      onNouveauPseudo={ajout.nouveauPseudo}
      onNouvelleValeur={ajout.nouvelleValeur}
      onAjoutClassique={() => setMontrerAjoutClassique(true)}
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
          mapping={revue.mappingFinal}
          activeTag={revue.tagSurbrillance}
          onSelectTag={handleTagClick}
          onClicValeur={handleValeurClick}
          onAjouterValeur={revue.ajouterValeur}
          onRetirerValeur={revue.retirerValeur}
          onDeplacerValeur={revue.deplacerValeur}
          onReordonnerValeurs={revue.reordonnerValeurs}
          onRenommerTag={revue.renommerTag}
          onSupprimerTag={revue.supprimerTag}
          onAjouterTag={revue.ajouterTag}
          onConflitVoir={handleConflitVoir}
          construireLigne={construireLigne}
          refTableau={refTableau}
        />

        {/* Volet droit : aperçus texte (composant neutre partagé) */}
        <PanneauApercus
          mapping={revue.mappingFinal}
          tagSurbrillance={revue.tagSurbrillance}
          valeurSurbrillance={revue.valeurSurbrillance}
          syncScroll={syncScroll}
          voletHaut={{
            titre: t('revue.titre.pseudo'),
            texte: revue.textePseudonymise,
            surlignerTags: true,
            onClicTag: handleTexteTagClick,
            onSelection: ajout.gererSelection('haut'),
            containerRef: refPseudonymise,
            toolbar: ajout.selection?.source === 'haut' ? barreAjout() : undefined,
          }}
          voletBas={{
            titre: t('revue.titre.lisible'),
            texte: texteOriginal,
            surlignerValeurs: true,
            onClicValeur: handleTexteValeurClick,
            onSelection: ajout.gererSelection('bas'),
            containerRef: refLisible,
            toolbar: ajout.selection?.source === 'bas' ? barreAjout() : undefined,
          }}
        />
      </div>

      {/* Bouton déplacer si une valeur est sélectionnée dans la table */}
      {valeurSelectionnee && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-8px' }}>
          <Bouton variante="ghost" taille="sm" onClick={() => ajout.ouvrirDeplacement(valeurSelectionnee.valeur, valeurSelectionnee.tag)}>
            {t('revue.bouton.deplacer', valeurSelectionnee.valeur)}
          </Bouton>
        </div>
      )}

      {/* Barre d'outils */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--espacement-md)', alignItems: 'center' }}>
          <CheckboxInput checked={syncScroll} onChange={setSyncScroll} label={t('revue.checkbox.sync')} />
          <CheckboxInput checked={recentrer} onChange={setRecentrer} label={t('revue.checkbox.recentrer')} />
        </div>
        <Bouton variante="primaire" taille="lg" onClick={handleClicValider}>
          {t('revue.bouton.valider')}
        </Bouton>
      </div>

      {/* Picker tag pour Nouvelle valeur / Déplacer */}
      {ajout.picker && (
        <PickerAjoutValeur
          ouvert={!!ajout.picker}
          titre={ajout.picker.tagSource
            ? t('revue.picker.titre.deplacer', ajout.picker.valeur)
            : t('revue.picker.titre.ajouter')}
          tagSource={ajout.picker.tagSource}
          tags={tagsExistants}
          onChoisir={handleChoisirTag}
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