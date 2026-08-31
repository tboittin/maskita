import { useState, useRef, useCallback, useEffect } from 'react';
import { PseudoTableau } from './PseudoTableau';
import { TexteApercu } from './TexteApercu';
import { PopupConfirmation } from './PopupConfirmation';
import { useRevue } from '../hooks/useRevue';
import { useLangue } from '../i18n/context';
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
  const [popupOuverte, setPopupOuverte] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [recentrer, setRecentrer] = useState(true);

  const [selection, setSelection] = useState<{ valeur: string; source: 'pseudo' | 'lisible' } | null>(null);
  const [pickerPayload, setPickerPayload] = useState<{ valeur: string; tagSource?: string } | null>(null);
  const [supprimerTag, setSupprimerTag] = useState<string | null>(null);

  const refPseudonymise = useRef<HTMLDivElement>(null);
  const refLisible = useRef<HTMLDivElement>(null);
  const refTableau = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const selectionRef = useRef<string>('');
  const occurrenceIdx = useRef<Record<string, number>>({});

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

  const handleScroll = useCallback(
    (source: 'pseudo' | 'lisible') =>
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll || syncing.current) return;
        syncing.current = true;

        const sourceEl = e.currentTarget;
        const ratio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);

        const cible =
          source === 'pseudo' ? refLisible.current : refPseudonymise.current;
        if (cible) {
          cible.scrollTop = ratio * (cible.scrollHeight - cible.clientHeight || 1);
        }

        requestAnimationFrame(() => { syncing.current = false; });
      },
    [syncScroll],
  );

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
    if (matchTag) {
      revue.ajouterTag(matchTag[1], v);
    } else {
      revue.ajouterTag('NOUVELLE_VALEUR', v);
    }
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
      // Déplacer une valeur existante
      revue.deplacerValeur(pickerPayload.valeur, pickerPayload.tagSource, tag);
      revue.mettreSurbrillanceValeur(tag, pickerPayload.valeur);
    } else {
      // Ajouter comme nouvelle valeur
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
    // Ne pas effacer selection quand c'est un déplacement depuis la table
    // (l'utilisateur peut réessayer)
  }, []);

  const handleSupprimer = useCallback((tag: string) => {
    setSupprimerTag(tag);
  }, []);

  const handleConfirmerSuppression = useCallback(() => {
    if (!supprimerTag) return;
    revue.supprimerTag(supprimerTag);
    setSupprimerTag(null);
  }, [supprimerTag, revue]);

  const handleAnnulerSuppression = useCallback(() => {
    setSupprimerTag(null);
  }, []);

  const handleClicValider = () => {
    if (revue.mappingModifie) {
      setPopupOuverte(true);
    } else {
      onValider(revue.mappingFinal, revue.textePseudonymise);
    }
  };

  const handleContinuer = () => {
    setPopupOuverte(false);
    onValider(revue.mappingFinal, revue.textePseudonymise);
  };

  const handleRelancer = () => {
    setPopupOuverte(false);
    revue.reinitialiserMapping();
  };

  const handleTagClick = useCallback((tag: string) => {
    revue.mettreSurbrillance(tag);
  }, [revue]);

  const handleValeurClick = useCallback((tag: string, valeur: string) => {
    revue.mettreSurbrillanceValeur(tag, valeur);
    defilerTableauVers(tag);
    // Scroll to the value in the lisible view
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

  const handleDeplacerValeur = useCallback((valeur: string, tagSource: string) => {
    setPickerPayload({ valeur, tagSource });
  }, []);

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

  const tagsExistants = Object.keys(revue.mappingFinal);

  const tagSupprime = supprimerTag
    ? revue.tags.find(t => t.tag === supprimerTag)
    : null;

  const pickerTitre = pickerPayload?.tagSource
    ? t('revue.picker.titre.deplacer', pickerPayload.valeur)
    : t('revue.picker.titre.ajouter');

  const valeurSelectionnee = revue.valeurSurbrillance
    ? { tag: revue.tagSurbrillance!, valeur: revue.valeurSurbrillance }
    : null;

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
            tags={revue.tags}
            conflits={revue.conflits}
            tagSurbrillance={revue.tagSurbrillance}
            valeurSurbrillance={revue.valeurSurbrillance}
            onTagClick={handleTagClick}
            onValeurClick={handleValeurClick}
            onDeplacerValeur={revue.deplacerValeur}
            onReordonnerValeurs={revue.reordonnerValeurs}
            onRenommer={revue.renommerTag}
            onSupprimer={handleSupprimer}
            onAjouterValeur={revue.ajouterValeur}
            onRetirerValeur={revue.retirerValeur}
            onAjouterTag={revue.ajouterTag}
          />
        </div>

        {/* Volet droit : aperçus texte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <TexteApercu
              titre={t('revue.titre.pseudo')}
              texte={revue.textePseudonymise}
              mapping={revue.mappingFinal}
              tagSurbrillance={revue.tagSurbrillance}
              surlignerTags
              containerRef={refPseudonymise}
              onScroll={handleScroll('pseudo')}
              onTagClick={handleTexteTagClick}
              onSelection={handleSelectionPseudo}
            />
            {selection && selection.source === 'pseudo' && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                display: 'flex', gap: 'var(--espacement-xs)',
                padding: 'var(--espacement-sm)', zIndex: 10,
              }}>
                <BoutonAction label={t('revue.bouton.nouveauTag')} onClick={handleNouveauTag} />
                <BoutonAction label={t('revue.bouton.nouvelleValeur')} onClick={handleNouvelleValeur} />
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <TexteApercu
              titre={t('revue.titre.lisible')}
              texte={texteOriginal}
              mapping={revue.mappingFinal}
              tagSurbrillance={revue.tagSurbrillance}
              valeurSurbrillance={revue.valeurSurbrillance}
              surlignerValeurs
              containerRef={refLisible}
              onScroll={handleScroll('lisible')}
              onValeurClick={handleTexteValeurClick}
              onSelection={handleSelection}
            />
            {selection && selection.source === 'lisible' && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                display: 'flex', gap: 'var(--espacement-xs)',
                padding: 'var(--espacement-sm)', zIndex: 10,
              }}>
                <BoutonAction label={t('revue.bouton.nouveauTag')} onClick={handleNouveauTag} />
                <BoutonAction label={t('revue.bouton.nouvelleValeur')} onClick={handleNouvelleValeur} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bouton déplacer si une valeur est sélectionnée dans la table */}
      {valeurSelectionnee && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-8px' }}>
          <button
            onClick={() => handleDeplacerValeur(valeurSelectionnee.valeur, valeurSelectionnee.tag)}
            style={{
              padding: '4px 12px',
              background: 'none',
              border: '1px solid var(--couleur-bordure)',
              borderRadius: 'var(--rayon-bordure)',
              cursor: 'pointer',
              color: 'var(--couleur-texte-secondaire)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {t('revue.bouton.deplacer', valeurSelectionnee.valeur)}
          </button>
        </div>
      )}

      {/* Barre d'outils */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--espacement-md)', alignItems: 'center' }}>
          <CheckboxInput checked={syncScroll} onChange={setSyncScroll} label={t('revue.checkbox.sync')} />
          <CheckboxInput checked={recentrer} onChange={setRecentrer} label={t('revue.checkbox.recentrer')} />
        </div>
        <button onClick={handleClicValider} style={{
          padding: 'var(--espacement-sm) var(--espacement-lg)',
          background: 'var(--couleur-primaire)', color: 'white',
          border: 'none', borderRadius: 'var(--rayon-bordure)',
          cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
        }}>
          {t('revue.bouton.valider')}
        </button>
      </div>

      {/* Picker tag pour Nouvelle valeur / Déplacer */}
      {pickerPayload && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
          onClick={handlePickerAnnuler}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: 'var(--rayon-bordure)',
            padding: 'var(--espacement-lg)', maxWidth: '400px', width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)', color: 'var(--couleur-texte)' }}>
              {pickerTitre}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', marginBottom: 'var(--espacement-md)' }}>
              {t('revue.picker.valeur', pickerPayload.valeur)}
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--espacement-xs)' }}>
              {tagsExistants
                .filter(t => t !== pickerPayload.tagSource)
                .map((tag) => (
                  <button key={tag} onClick={() => handlePickerSelect(tag)}
                    style={{
                      padding: 'var(--espacement-sm) var(--espacement-md)',
                      background: 'var(--couleur-surface)', border: '1px solid var(--couleur-bordure)',
                      borderRadius: 'var(--rayon-bordure)', cursor: 'pointer', textAlign: 'left',
                      fontSize: '0.875rem', fontFamily: 'var(--police-mono)', color: 'var(--couleur-texte)',
                    }}
                  >{tag}</button>
                ))}
              {tagsExistants.filter(t => t !== pickerPayload.tagSource).length === 0 && (
                <p style={{ color: 'var(--couleur-texte-secondaire)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                  {t('revue.picker.aucun')}
                </p>
              )}
            </div>
            <div style={{ marginTop: 'var(--espacement-md)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handlePickerAnnuler} style={{
                padding: 'var(--espacement-sm) var(--espacement-md)',
                background: 'none', border: '1px solid var(--couleur-bordure)',
                borderRadius: 'var(--rayon-bordure)', cursor: 'pointer',
                color: 'var(--couleur-texte-secondaire)', fontSize: '0.875rem',
              }}>{t('revue.picker.annuler')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup confirmation suppression */}
      {supprimerTag && tagSupprime && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
          onClick={handleAnnulerSuppression}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: 'var(--rayon-bordure)',
            padding: 'var(--espacement-lg)', maxWidth: '480px', width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)', color: 'var(--couleur-texte)' }}>
              {t('revue.supprimer.titre')}
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--couleur-texte-secondaire)', lineHeight: 1.6, marginBottom: 'var(--espacement-md)' }}>
              {t('revue.supprimer.message', supprimerTag)}
            </p>
            {tagSupprime.valeurs.length > 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', marginBottom: 'var(--espacement-md)' }}>
                <p style={{ marginBottom: 'var(--espacement-xs)' }}>{t('revue.supprimer.valeurs')}</p>
                <ul style={{ margin: 0, paddingLeft: 'var(--espacement-md)' }}>
                  {tagSupprime.valeurs.map(v => <li key={v}>{v}</li>)}
                </ul>
              </div>
            )}
            <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', marginBottom: 'var(--espacement-lg)', fontStyle: 'italic' }}>
              {t('revue.supprimer.note')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--espacement-sm)' }}>
              <button onClick={handleAnnulerSuppression} style={{
                padding: 'var(--espacement-sm) var(--espacement-md)',
                background: 'none', border: '1px solid var(--couleur-bordure)',
                borderRadius: 'var(--rayon-bordure)', cursor: 'pointer',
                color: 'var(--couleur-texte-secondaire)', fontSize: '0.875rem',
              }}>{t('revue.supprimer.annuler')}</button>
              <button onClick={handleConfirmerSuppression} style={{
                padding: 'var(--espacement-sm) var(--espacement-md)',
                background: 'var(--couleur-erreur)', color: 'white',
                border: 'none', borderRadius: 'var(--rayon-bordure)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              }}>{t('revue.supprimer.confirmer')}</button>
            </div>
          </div>
        </div>
      )}

      {popupOuverte && (
        <PopupConfirmation
          titre={t('revue.modifs.titre')}
          message={t('revue.modifs.message')}
          boutonConfirmer={t('revue.modifs.confirmer')}
          boutonAnnuler={t('revue.modifs.relancer')}
          onConfirmer={handleContinuer}
          onAnnuler={handleRelancer}
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

function BoutonAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{
      padding: '4px 10px', background: 'var(--couleur-primaire)', color: 'white',
      border: 'none', borderRadius: 'var(--rayon-bordure)', cursor: 'pointer',
      fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    }}>{label}</button>
  );
}