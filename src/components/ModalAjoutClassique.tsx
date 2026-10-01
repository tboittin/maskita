import { useState, useEffect, useRef, useMemo } from 'react';
import { Bouton, Modal } from '@khaleeno/maskita-design-system';
import { estValeurValide } from '../utils/mapping';
import {
  extraireMots,
  filtrerParPrefixe,
  existeCorrespondanceExacte,
} from '../utils/tokenisation';

interface ModalAjoutClassiqueProps {
  ouvert: boolean;
  valeurInitiale: string;
  /** Texte lisible original du document, pour les suggestions d'autocomplétion */
  texteOriginal?: string;
  onValider: (type: string, valeur: string) => void;
  onAnnuler: () => void;
  titre: string;
  labelType: string;
  labelValeur: string;
  libelleType: string;
  libelleTypeCustom: string;
  libelleAjouter: string;
  libelleAnnuler: string;
  placeholderType: string;
  placeholderValeur: string;
  alerteCrochet: string;
}

const TYPES_SUGGERES = [
  'PERSONNE',
  'DATE',
  'LIEU',
  'ADRESSE',
  'PROFESSION',
  'ETABLISSEMENT',
  'TELEPHONE',
  'EMAIL',
];

/**
 * Modale d'ajout classique d'un pseudo (type + valeur), ouverte depuis la
 * BarreAjoutSelection quand l'utilisateur a surligné du texte.
 * La valeur est préremplie depuis la sélection ; le type n'est pas présélectionné.
 *
 * SUG-C — Autocomplétion du champ Valeur à partir des mots du texte original.
 */
export function ModalAjoutClassique({
  ouvert,
  valeurInitiale,
  texteOriginal,
  onValider,
  onAnnuler,
  titre,
  labelType,
  labelValeur,
  libelleType,
  libelleTypeCustom,
  libelleAjouter,
  libelleAnnuler,
  placeholderType,
  placeholderValeur,
  alerteCrochet,
}: ModalAjoutClassiqueProps) {
  const [type, setType] = useState('');
  const [valeur, setValeur] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const refType = useRef<HTMLSelectElement>(null);

  // Mots du texte original, calculés une fois
  const mots = useMemo(() => (texteOriginal ? extraireMots(texteOriginal) : []), [texteOriginal]);

  // Réinitialiser les champs à l'ouverture avec la valeurInitiale
  useEffect(() => {
    if (ouvert) {
      setType('');
      setValeur(valeurInitiale);
      setShowCustomType(false);
      setSuggestions([]);
    }
  }, [ouvert, valeurInitiale]);

  // Focus sur le champ Type (contournement du focus Modal DS)
  useEffect(() => {
    if (ouvert) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          refType.current?.focus();
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [ouvert]);

  /** Met à jour les suggestions d'autocomplétion selon la valeur saisie. */
  function mettreAJourSuggestions(v: string) {
    const trimmed = v.trim();
    if (trimmed === '' || mots.length === 0) {
      setSuggestions([]);
      return;
    }

    // ⚠️ Si le texte tapé correspond exactement à un mot du texte,
    // les suggestions ne sont pas utiles.
    if (existeCorrespondanceExacte(mots, trimmed)) {
      setSuggestions([]);
      return;
    }

    const filtrees = filtrerParPrefixe(mots, trimmed, 8);
    setSuggestions(filtrees);
  }

  /** Sélectionne une suggestion et ferme la liste. */
  function choisirSuggestion(s: string) {
    setValeur(s);
    setSuggestions([]);
  }

  const valeurEstInvalide = valeur.trim() !== '' && !estValeurValide(valeur);
  const peutValider = type.trim() !== '' && valeur.trim() !== '' && !valeurEstInvalide;

  const handleValider = () => {
    if (!peutValider) return;
    onValider(type.trim(), valeur.trim());
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__custom__') {
      setShowCustomType(true);
      setType('');
    } else {
      setShowCustomType(false);
      setType(e.target.value);
    }
  };

  const handleValeurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nouvelleValeur = e.target.value;
    setValeur(nouvelleValeur);
    mettreAJourSuggestions(nouvelleValeur);
  };

  const handleValeurKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab quand des suggestions sont visibles → sélectionner la première
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      choisirSuggestion(suggestions[0]);
    }

    // Escape → fermer la liste de suggestions
    if (e.key === 'Escape' && suggestions.length > 0) {
      e.preventDefault();
      setSuggestions([]);
    }
  };

  return (
    <Modal
      ouvert={ouvert}
      titre={titre}
      onFermer={onAnnuler}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onAnnuler}>
            {libelleAnnuler}
          </Bouton>
          <Bouton
            variante="primaire"
            onClick={handleValider}
            disabled={!peutValider}
          >
            {libelleAjouter}
          </Bouton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-sm)' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 'var(--espacement-xs)' }}>
          <span>{labelType}</span>
          <select
            ref={refType}
            value={showCustomType ? '__custom__' : type}
            onChange={handleTypeChange}
            style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
          >
            <option value="" disabled>{libelleType}</option>
            {TYPES_SUGGERES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="__custom__">{libelleTypeCustom}</option>
          </select>
        </label>
        {showCustomType && (
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 'var(--espacement-xs)' }}>
            <span>{labelType}</span>
            <input
              value={type}
              onChange={e => setType(e.target.value.toUpperCase())}
              placeholder={placeholderType}
              style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
            />
          </label>
        )}
        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 'var(--espacement-xs)', position: 'relative' }}>
          <span>{labelValeur}</span>
          <input
            value={valeur}
            onChange={handleValeurChange}
            onKeyDown={handleValeurKeyDown}
            placeholder={placeholderValeur}
            autoComplete="off"
            style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
          />
          {suggestions.length > 0 && (
            <div
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'var(--couleur-surface, #fff)',
                border: '1px solid var(--couleur-bordure, #ccc)',
                borderRadius: 'var(--rayon, 0.375rem)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                marginTop: '2px',
              }}
            >
              {suggestions.map((s) => (
                <div
                  key={s}
                  role="option"
                  onClick={() => choisirSuggestion(s)}
                  style={{
                    padding: 'var(--espacement-xs) var(--espacement-sm)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--couleur-surface-survol, #f0f0f0)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = '';
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
          {valeurEstInvalide && (
            <span style={{ color: 'var(--couleur-erreur, #d32f2f)', fontSize: '0.8rem', marginTop: 'var(--espacement-xs)' }}>
              {alerteCrochet}
            </span>
          )}
        </label>
      </div>
    </Modal>
  );
}