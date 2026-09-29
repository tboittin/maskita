import { useState, useCallback, useRef, useEffect } from 'react';
import { TexteApercu } from './TexteApercu';
import { useLangue } from '../i18n/context';
import {
  Bouton,
  Modal,
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

  const refAvecTags = useRef<HTMLDivElement>(null);
  const refRestauré = useRef<HTMLDivElement>(null);
  const refTableau = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  /* US-V03 — Modales d'ajout manuel d'un pseudo et de confirmation suppression */
  const [showAjoutManuel, setShowAjoutManuel] = useState(false);
  const [typeAjout, setTypeAjout] = useState('');
  const [valeurAjout, setValeurAjout] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [supprimerTag, setSupprimerTag] = useState<string | null>(null);
  const refAjoutType = useRef<HTMLSelectElement>(null);

  // Focus sur le premier champ de la modal d'ajout (contournement focus Modal DS)
  useEffect(() => {
    if (showAjoutManuel) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          refAjoutType.current?.focus();
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [showAjoutManuel]);

  // Construire les lignes pour le PseudoTableau DS
  const lignes: LignePseudo[] = Object.entries(mapping).map(([tag, valeurs]) => ({
    tag,
    statut: (valeurs.length === 0 ? 'vide' : 'existant') as ToneStatut,
    valeurs,
    isActive: tag === tagSurbrillance,
  }));

  const tagSupprime = supprimerTag
    ? lignes.find(l => l.tag === supprimerTag)
    : null;

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

  const handleConfirmerSuppression = useCallback(() => {
    if (!supprimerTag) return;
    onSupprimerTag(supprimerTag);
    setSupprimerTag(null);
  }, [supprimerTag, onSupprimerTag]);

  const handleAnnulerSuppression = useCallback(() => {
    setSupprimerTag(null);
  }, []);

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
            /* US-V03 — Édition du mapping dans le parcours Restauration */
            onAjouterPseudo={() => setShowAjoutManuel(true)}
            onDeplacerValeur={onDeplacerValeur}
            onReordonnerValeurs={onReordonnerValeurs}
            onRenommer={onRenommerTag}
            onRetirerValeur={onRetirerValeur}
            onViderTag={(tag) => setSupprimerTag(tag)}
            onAjouterValeur={onAjouterValeur}
            libelleAjouter={t('tableau.bouton.ajouterPseudo')}
            libelleAjouterValeur={t('tableau.tooltip.ajouterValeur')}
            libelleRetirerValeur={(v) => t('tableau.retirerValeur', v)}
            libelleViderTag={t('tableau.tooltip.supprimer')}
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
                  <Bouton variante="secondaire" onClick={() => { setShowCustomType(false); setShowAjoutManuel(false); }}>
                    {t('tableau.bouton.annuler')}
                  </Bouton>
                  <Bouton
                    variante="primaire"
                    onClick={() => {
                      if (typeAjout.trim() && valeurAjout.trim()) {
                        onAjouterTag(typeAjout.trim(), valeurAjout.trim());
                        setTypeAjout('');
                        setValeurAjout('');
                        setShowCustomType(false);
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
                <select
                  ref={refAjoutType}
                  value={showCustomType ? '__custom__' : typeAjout}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setShowCustomType(true);
                      setTypeAjout('');
                    } else {
                      setShowCustomType(false);
                      setTypeAjout(e.target.value);
                    }
                  }}
                  style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
                >
                  <option value="" disabled>{t('tableau.ajoutManuel.type.label')}</option>
                  <option value="PERSONNE">PERSONNE</option>
                  <option value="DATE">DATE</option>
                  <option value="LIEU">LIEU</option>
                  <option value="ADRESSE">ADRESSE</option>
                  <option value="PROFESSION">PROFESSION</option>
                  <option value="ETABLISSEMENT">ETABLISSEMENT</option>
                  <option value="TELEPHONE">TELEPHONE</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="__custom__">{t('tableau.ajoutManuel.type.custom')}</option>
                </select>
                {showCustomType && (
                  <input
                    value={typeAjout}
                    onChange={e => setTypeAjout(e.target.value.toUpperCase())}
                    placeholder={t('tableau.placeholder.type')}
                    style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
                  />
                )}
                <input
                  value={valeurAjout}
                  onChange={e => setValeurAjout(e.target.value)}
                  placeholder={t('tableau.placeholder.valeur')}
                  style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
                />
              </div>
            </Modal>
          )}
          {/* Popup confirmation suppression d'un pseudo */}
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
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--couleur-texte-secondaire)' }}>
                {t('revue.supprimer.message', supprimerTag)}
              </p>
              {tagSupprime.valeurs.length > 0 && (
                <div style={{ marginTop: 'var(--espacement-sm)', fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)' }}>
                  <p>{t('revue.supprimer.valeurs')}</p>
                  <ul style={{ marginLeft: '1rem', listStyle: 'disc' }}>
                    {tagSupprime.valeurs.map(v => <li key={v}>{v}</li>)}
                  </ul>
                </div>
              )}
              <p style={{ marginTop: 'var(--espacement-sm)', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--couleur-texte-secondaire)' }}>
                {t('revue.supprimer.note')}
              </p>
            </Modal>
          )}
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