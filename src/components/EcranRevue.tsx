import { useState, useRef, useCallback, useEffect } from 'react';
import { TexteApercu } from './TexteApercu';
import { useRevue } from '../hooks/useRevue';
import { useLangue } from '../i18n/context';
import {
  Bouton,
  Modal,
  PseudoTableau,
  type LignePseudo,
  type ToneStatut,
} from '@khaleeno/maskita-design-system';
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
  const [showAjoutManuel, setShowAjoutManuel] = useState(false);
  const [typeAjout, setTypeAjout] = useState('');
  const [valeurAjout, setValeurAjout] = useState('');

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

  // Construire les lignes pour le PseudoTableau DS
  const conflitsParTag = revue.conflits.reduce<Record<string, string[]>>((acc, c) => {
    if (!acc[c.tag]) acc[c.tag] = [];
    acc[c.tag].push(c.message);
    return acc;
  }, {});

  const lignes: LignePseudo[] = revue.tags.map(entry => {
    const conflits = conflitsParTag[entry.tag] ?? [];
    let statut: ToneStatut = 'existant';
    if (conflits.length > 0) statut = 'conflit';
    else if (entry.valeurs.length === 0) statut = 'vide';
    else if (entry.estNouveau) statut = 'nouveau';
    return {
      tag: entry.tag,
      statut,
      valeurs: entry.valeurs,
      conflitMessage: conflits.length > 0 ? conflits[conflits.length - 1] : undefined,
      isActive: entry.tag === revue.tagSurbrillance,
    };
  });

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
            activeTag={revue.tagSurbrillance ?? ''}
            onSelect={handleTagClick}
            onAjouterPseudo={() => setShowAjoutManuel(true)}
            onDeplacerValeur={revue.deplacerValeur}
            onReordonnerValeurs={revue.reordonnerValeurs}
            onRenommer={revue.renommerTag}
            onValeurClick={handleValeurClick}
            onRetirerValeur={revue.retirerValeur}
            onViderTag={handleSupprimer}
            onAjouterValeur={revue.ajouterValeur}
            onConflitVoir={(tag) => {
              revue.mettreSurbrillance(tag);
              defilerTexteVers(tag);
              defilerTableauVers(tag);
            }}
            libelleTitre={t('tableau.titre', revue.tags.length)}
            libelleAjouter={t('tableau.bouton.ajouterPseudo')}
            libelleAucun={t('tableau.aucun')}
            libelleVoir={t('tableau.voir')}
            libelleAjouterValeur={t('tableau.tooltip.ajouterValeur')}
            libelleRetirerValeur={(v) => t('tableau.retirerValeur', v)}
            libelleViderTag={t('tableau.tooltip.supprimer')}
            libelleValeursVides={t('tableau.vide')}
            placeholderNouvelleValeur={t('tableau.placeholder.nouvelleValeur')}
          />
          {/* Formulaire d'ajout manuel d'un pseudo */}
          {showAjoutManuel && (
            <Modal
              ouvert={showAjoutManuel}
              titre={t('tableau.ajoutManuel.titre')}
              onFermer={() => setShowAjoutManuel(false)}
              pied={
                <>
                  <Bouton variante="secondaire" onClick={() => setShowAjoutManuel(false)}>
                    {t('tableau.bouton.annuler')}
                  </Bouton>
                  <Bouton
                    variante="primaire"
                    onClick={() => {
                      if (typeAjout.trim() && valeurAjout.trim()) {
                        revue.ajouterTag(typeAjout.trim(), valeurAjout.trim());
                        setTypeAjout('');
                        setValeurAjout('');
                        setShowAjoutManuel(false);
                      }
                    }}
                  >
                    {t('tableau.bouton.ajouter')}
                  </Bouton>
                </>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-sm)' }}>
                <input
                  value={typeAjout}
                  onChange={e => setTypeAjout(e.target.value.toUpperCase())}
                  placeholder={t('tableau.placeholder.type')}
                  style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
                />
                <input
                  value={valeurAjout}
                  onChange={e => setValeurAjout(e.target.value)}
                  placeholder={t('tableau.placeholder.valeur')}
                  style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
                />
              </div>
            </Modal>
          )}
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
              .filter(t => t !== pickerPayload.tagSource) // ne pas proposer le tag source
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

      {/* Popup confirmation suppression */}
      {supprimerTag && tagSupprime && (
        <Modal
          ouvert={!!supprimerTag}
          titre={t('revue.supprimer.titre')}
          onFermer={handleAnnulerSuppression}
          pied={
            <>
              <Bouton variante="secondaire" onClick={handleAnnulerSuppression}>
                {t('revue.supprimer.annuler')}
              </Bouton>
              <Bouton variante="danger" onClick={handleConfirmerSuppression}>
                {t('revue.supprimer.confirmer')}
              </Bouton>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-brume-500">
            {t('revue.supprimer.message', supprimerTag)}
          </p>
          {tagSupprime.valeurs.length > 0 && (
            <div className="mt-3 text-sm text-brume-500">
              <p className="mb-1">{t('revue.supprimer.valeurs')}</p>
              <ul className="ml-4 list-disc">
                {tagSupprime.valeurs.map(v => <li key={v}>{v}</li>)}
              </ul>
            </div>
          )}
          <p className="mt-3 text-xs italic text-brume-500">
            {t('revue.supprimer.note')}
          </p>
        </Modal>
      )}

      {popupOuverte && (
        <Modal
          ouvert={popupOuverte}
          titre={t('revue.modifs.titre')}
          onFermer={handleRelancer}
          pied={
            <>
              <Bouton variante="secondaire" onClick={handleRelancer}>
                {t('revue.modifs.relancer')}
              </Bouton>
              <Bouton variante="primaire" onClick={handleContinuer}>
                {t('revue.modifs.confirmer')}
              </Bouton>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-brume-500">
            {t('revue.modifs.message')}
          </p>
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