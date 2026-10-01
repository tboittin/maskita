import { useState, useEffect, useRef } from 'react';
import { Bouton, Modal } from '@khaleeno/maskita-design-system';

interface ModalAjoutClassiqueProps {
  ouvert: boolean;
  valeurInitiale: string;
  onValider: (type: string, valeur: string) => void;
  onAnnuler: () => void;
  titre: string;
  libelleType: string;
  libelleTypeCustom: string;
  libelleAjouter: string;
  libelleAnnuler: string;
  placeholderType: string;
  placeholderValeur: string;
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
 */
export function ModalAjoutClassique({
  ouvert,
  valeurInitiale,
  onValider,
  onAnnuler,
  titre,
  libelleType,
  libelleTypeCustom,
  libelleAjouter,
  libelleAnnuler,
  placeholderType,
  placeholderValeur,
}: ModalAjoutClassiqueProps) {
  const [type, setType] = useState('');
  const [valeur, setValeur] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const refType = useRef<HTMLSelectElement>(null);

  // Réinitialiser les champs à l'ouverture avec la valeurInitiale
  useEffect(() => {
    if (ouvert) {
      setType('');
      setValeur(valeurInitiale);
      setShowCustomType(false);
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

  const peutValider = type.trim() !== '' && valeur.trim() !== '';

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
        {showCustomType && (
          <input
            value={type}
            onChange={e => setType(e.target.value.toUpperCase())}
            placeholder={placeholderType}
            style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
          />
        )}
        <input
          value={valeur}
          onChange={e => setValeur(e.target.value)}
          placeholder={placeholderValeur}
          style={{ fontSize: '0.875rem', padding: 'var(--espacement-sm)' }}
        />
      </div>
    </Modal>
  );
}
