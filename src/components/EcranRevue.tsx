import { useState, useRef, useCallback, useEffect } from 'react';
import { useRevue } from '../hooks/useRevue';
import { useLangue } from '../i18n/context';
import { Bouton, Modal, type ToneStatut } from '@khaleeno/maskita-design-system';
import { PanneauTableauPseudos } from './PanneauTableauPseudos';
import { PanneauApercus } from './PanneauApercus';
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
  const selectionRef = useRef<string>('');
  const occurrenceIdx = useRef<Record<string, number>>({});

  const [selection, setSelection] = useState<{ valeur: string; source: 'pseudo' | 'lisible' } | null>(null);
  const [pickerPayload, setPickerPayload] = useState<{ valeur: string; tagSource?: string } | null>(null);
  const [focusNouveauTag, setFocusNouveauTag] = useState<string | null>(null);

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
        setSelection(null);
      }
    };
    window.addEventListener('mouseup', handleClick);
    return () => window.removeEventListener('mouseup', handleClick);
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

  const handleSelection = useCallback((valeur: string) => {
    selectionRef.current = valeur;
    setSelection({ valeur, source: 'lisible' });
  }, []);

  const handleSelectionPseudo = useCallback((valeur: string) => {
    selectionRef.current = valeur;
    setSelection({ valeur, source: 'pseudo' });
  }, []);

  const handleNouveauTag = useCallback(() => {
    const v = selectionRef.current;
    if (!v) return;
    const matchTag = v.match(/^\[(\w+(?:_\d+)?)\]$/);
    const tagName = matchTag ? matchTag[1] : 'NOUVELLE_VALEUR';
    revue.ajouterTag(tagName, v);
    setFocusNouveauTag(`[${tagName}]`);
    setSelection(null);
    selectionRef.current = '';
  }, [revue]);

  const handleNouvelleValeur = useCallback(() => {
    const v = selectionRef.current;
    if (!v) return;
    setPickerPayload({ valeur: v });
  }, []);

  const handlePickerSelect = useCallback((tag: string) => {
    if (!pickerPayload) return;
    if (pickerPayload.tagSource) {
      revue.deplacerValeur(pickerPayload.valeur, pickerPayload.tagSource, tag);
      revue.mettreSurbrillanceValeur(tag, pickerPayload.valeur);
    } else {
      revue.ajouterValeur(tag, pickerPayload.valeur);
      revue.mettreSurbrillanceValeur(tag, pickerPayload.valeur);
    }
    defilerTableauVers(tag);
    setPickerPayload(null);
    setSelection(null);
    selectionRef.current = '';
  }, [pickerPayload, revue, defilerTableauVers]);

  const handlePickerAnnuler = useCallback(() => {
    setPickerPayload(null);
  }, []);

  const handleDeplacerValeur = useCallback((valeur: string, tagSource: string) => {
    setPickerPayload({ valeur, tagSource });
  }, []);

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
    setSelection(null);
    selectionRef.current = '';
    revue.mettreSurbrillance(tag);
    defilerTableauVers(tag);
    defilerTexteVers(tag, 'next');
  }, [revue, defilerTableauVers, defilerTexteVers]);

  const handleTexteValeurClick = useCallback((tag: string, valeur: string) => {
    setSelection(null);
    selectionRef.current = '';
    revue.mettreSurbrillanceValeur(tag, valeur);
    defilerTableauVers(tag);
    if (recentrer) {
      defilerTexteVers(tag);
    }
  }, [revue, defilerTableauVers, recentrer, defilerTexteVers]);

  const handleConflitVoir = useCallback((tag: string) => {
    revue.mettreSurbrillance(tag);
    defilerTexteVers(tag);
    defilerTableauVers(tag);
  }, [revue, defilerTexteVers, defilerTableauVers]);

  const tagsExistants = Object.keys(revue.mappingFinal);

  const pickerTitre = pickerPayload?.tagSource
    ? t('revue.picker.titre.deplacer', pickerPayload.valeur)
    : t('revue.picker.titre.ajouter');

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
            onSelection: handleSelectionPseudo,
            containerRef: refPseudonymise,
            toolbar: selection && selection.source === 'pseudo' && (
              <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 'var(--espacement-xs)', padding: 'var(--espacement-sm)', zIndex: 10 }}>
                <Bouton variante="primaire" taille="sm" onClick={handleNouveauTag} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  {t('revue.bouton.nouveauTag')}
                </Bouton>
                <Bouton variante="primaire" taille="sm" onClick={handleNouvelleValeur} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  {t('revue.bouton.nouvelleValeur')}
                </Bouton>
              </div>
            ),
          }}
          voletBas={{
            titre: t('revue.titre.lisible'),
            texte: texteOriginal,
            surlignerValeurs: true,
            onClicValeur: handleTexteValeurClick,
            onSelection: handleSelection,
            containerRef: refLisible,
            toolbar: selection && selection.source === 'lisible' && (
              <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 'var(--espacement-xs)', padding: 'var(--espacement-sm)', zIndex: 10 }}>
                <Bouton variante="primaire" taille="sm" onClick={handleNouveauTag} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  {t('revue.bouton.nouveauTag')}
                </Bouton>
                <Bouton variante="primaire" taille="sm" onClick={handleNouvelleValeur} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  {t('revue.bouton.nouvelleValeur')}
                </Bouton>
              </div>
            ),
          }}
        />
      </div>

      {/* Bouton déplacer si une valeur est sélectionnée dans la table */}
      {valeurSelectionnee && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-8px' }}>
          <Bouton variante="ghost" taille="sm" onClick={() => handleDeplacerValeur(valeurSelectionnee.valeur, valeurSelectionnee.tag)}>
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
      {pickerPayload && (
        <Modal
          ouvert={!!pickerPayload}
          titre={pickerTitre}
          onFermer={handlePickerAnnuler}
          pied={
            <Bouton variante="secondaire" onClick={handlePickerAnnuler}>
              {t('revue.picker.annuler')}
            </Bouton>
          }
        >
          <p className="mb-3 text-sm text-brume-500">
            {t('revue.picker.valeur', pickerPayload.valeur)}
          </p>
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {tagsExistants
              .filter(t => t !== pickerPayload.tagSource)
              .map((tag) => (
                <Bouton
                  key={tag}
                  variante="secondaire"
                  onClick={() => handlePickerSelect(tag)}
                  className="justify-start font-donnees text-[13px]"
                >
                  {tag}
                </Bouton>
              ))}
            {tagsExistants.filter(t => t !== pickerPayload.tagSource).length === 0 && (
              <p className="text-sm italic text-brume-500">
                {t('revue.picker.aucun')}
              </p>
            )}
          </div>
        </Modal>
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