import { useState, useEffect, useRef } from 'react';
import { Bouton, Modal, PseudoTableau, type LignePseudo } from '@khaleeno/maskita-design-system';
import { useLangue } from '../i18n/context';
import type { Mapping } from '../utils/mapping';

interface PanneauTableauPseudosProps {
  mapping: Mapping;
  /** Tag actif (surbrillance croisée). */
  activeTag: string | null;
  onSelectTag: (tag: string) => void;
  onClicValeur: (tag: string, valeur: string) => void;
  /* US-V03 — Édition du mapping (ajouter/supprimer/modifier pseudo et valeurs) */
  onAjouterValeur: (tag: string, valeur: string) => void;
  onRetirerValeur: (tag: string, valeur: string) => void;
  onDeplacerValeur: (valeur: string, tagSource: string, tagCible: string) => void;
  onReordonnerValeurs: (tag: string, debut: number, fin: number) => void;
  onRenommerTag: (ancien: string, nouveau: string) => void;
  onSupprimerTag: (tag: string) => void;
  onAjouterTag: (type: string, valeur: string) => void;
  /** Lien « voir » d'un conflit (sync-scroll vers l'aperçu) — pseudonymisation. */
  onConflitVoir?: (tag: string) => void;
  /**
   * Callback externe pour le bouton « + Ajouter un pseudo » du tableau.
   * Quand défini, remplace la modale d'ajout manuel interne.
   */
  onAjoutPseudoExterne?: () => void;
  /**
   * Enrichit une ligne du tableau (ex: statut, message de conflit, « nouveau »)
   * propre à chaque parcours. La valeur par défaut marque « vide » ou « existant ».
   */
  construireLigne?: (tag: string, valeurs: string[]) => Partial<LignePseudo>;
  /** Réf du conteneur scrollable (pour faire défiler vers un tag depuis l'extérieur). */
  refTableau?: React.RefObject<HTMLDivElement>;
}

const STATUT_PARDEFAUT: (tag: string, valeurs: string[]) => Partial<LignePseudo> =
  (_tag, valeurs) => ({ statut: valeurs.length === 0 ? 'vide' : 'existant' });

/**
 * Composant neutre partagé entre les parcours Pseudonymisation et Restauration :
 * le volet gauche de la revue — le PseudoTableau du DS avec l'édition complète
 * (ajout / suppression de pseudo, ajout / retrait / déplacement / réordonnement /
 * renommage de valeurs) ainsi que les modales d'ajout manuel et de confirmation
 * de suppression.
 */
export function PanneauTableauPseudos({
  mapping,
  activeTag,
  onSelectTag,
  onClicValeur,
  onAjouterValeur,
  onRetirerValeur,
  onDeplacerValeur,
  onReordonnerValeurs,
  onRenommerTag,
  onSupprimerTag,
  onAjouterTag,
  onConflitVoir,
  onAjoutPseudoExterne,
  construireLigne = STATUT_PARDEFAUT,
  refTableau,
}: PanneauTableauPseudosProps) {
  const { t } = useLangue();

  const [showAjoutManuel, setShowAjoutManuel] = useState(false);
  const [typeAjout, setTypeAjout] = useState('');
  const [valeurAjout, setValeurAjout] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [supprimerTag, setSupprimerTag] = useState<string | null>(null);
  const refAjoutType = useRef<HTMLSelectElement>(null);

  const lignes: LignePseudo[] = Object.entries(mapping).map(([tag, valeurs]) => {
    const extra = construireLigne(tag, valeurs);
    return {
      tag,
      valeurs,
      ...extra,
      statut: extra.statut ?? (valeurs.length === 0 ? 'vide' : 'existant'),
      isActive: tag === activeTag,
    };
  });

  const tagSupprime = supprimerTag ? lignes.find(l => l.tag === supprimerTag) : null;

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

  return (
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
        activeTag={activeTag ?? ''}
        onSelect={onSelectTag}
        onValeurClick={onClicValeur}
        libelleTitre={t('tableau.titre', Object.keys(mapping).length)}
        libelleAucun={t('tableau.aucun')}
        libelleVoir={t('tableau.voir')}
        libelleValeursVides={t('tableau.vide')}
        onAjouterPseudo={onAjoutPseudoExterne ?? (() => setShowAjoutManuel(true))}
        onDeplacerValeur={onDeplacerValeur}
        onReordonnerValeurs={onReordonnerValeurs}
        onRenommer={onRenommerTag}
        onRetirerValeur={onRetirerValeur}
        onViderTag={(tag) => setSupprimerTag(tag)}
        onAjouterValeur={onAjouterValeur}
        onConflitVoir={onConflitVoir ? (tag) => onConflitVoir(tag) : undefined}
        libelleAjouter={t('tableau.bouton.ajouterPseudoClassique')}
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
          onFermer={() => setSupprimerTag(null)}
          pied={
            <>
              <Bouton variante="secondaire" onClick={() => setSupprimerTag(null)}>
                {t('revue.supprimer.annuler')}
              </Bouton>
              <Bouton
                variante="danger"
                onClick={() => {
                  if (supprimerTag) onSupprimerTag(supprimerTag);
                  setSupprimerTag(null);
                }}
              >
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
  );
}
