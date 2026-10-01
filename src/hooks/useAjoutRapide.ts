import { useRef, useState } from 'react';

export type SourceApercu = 'haut' | 'bas';

export interface SelectionApercu {
  valeur: string;
  source: SourceApercu;
}

interface OptionsAjoutRapide {
  onAjouterPseudo: (type: string, valeur: string) => void;
  onAjouterValeur: (tag: string, valeur: string) => void;
  /** Déplacement (parcours pseudonymisation, via la table). */
  onDeplacerValeur?: (valeur: string, tagSource: string, tagCible: string) => void;
  /** Focus du nouveau pseudo pour renommage inline (optionnel). */
  onFocusNouveauPseudo?: (tag: string) => void;
}

/**
 * Ajout rapide sans modal : lorsqu'on surligne du texte dans un aperçu,
 * on peut créer un nouveau pseudo ou ajouter la valeur à un pseudo existant.
 * Partagé entre Pseudonymisation et Restauration.
 */
export function useAjoutRapide({
  onAjouterPseudo,
  onAjouterValeur,
  onDeplacerValeur,
  onFocusNouveauPseudo,
}: OptionsAjoutRapide) {
  const [selection, setSelection] = useState<SelectionApercu | null>(null);
  const [picker, setPicker] = useState<{ valeur: string; tagSource?: string } | null>(null);
  const [valeurAjoutClassique, setValeurAjoutClassique] = useState('');
  const [showAjoutClassique, setShowAjoutClassique] = useState(false);
  const selectionRef = useRef('');

  const gererSelection = (source: SourceApercu) => (valeur: string) => {
    selectionRef.current = valeur;
    setSelection({ valeur, source });
  };

  const nouveauPseudo = () => {
    const v = selectionRef.current;
    if (!v) return;
    const m = v.match(/^\[(\w+(?:_\d+)?)\]$/);
    const type = m ? m[1] : 'NOUVELLE_VALEUR';
    onAjouterPseudo(type, v);
    onFocusNouveauPseudo?.(`[${type}]`);
    setSelection(null);
    selectionRef.current = '';
  };

  const nouvelleValeur = () => {
    const v = selectionRef.current;
    if (!v) return;
    setPicker({ valeur: v });
  };

  const ouvrirDeplacement = (valeur: string, tagSource: string) => {
    setPicker({ valeur, tagSource });
  };

  const choisirTag = (tag: string) => {
    if (!picker) return;
    if (picker.tagSource && onDeplacerValeur) {
      onDeplacerValeur(picker.valeur, picker.tagSource, tag);
    } else {
      onAjouterValeur(tag, picker.valeur);
    }
    setPicker(null);
    setSelection(null);
    selectionRef.current = '';
  };

  const annulerPicker = () => setPicker(null);

  const effacerSelection = () => {
    setSelection(null);
    selectionRef.current = '';
  };

  const ouvrirAjoutClassique = () => {
    setValeurAjoutClassique(selectionRef.current);
    setShowAjoutClassique(true);
  };

  const annulerAjoutClassique = () => {
    setValeurAjoutClassique('');
    setShowAjoutClassique(false);
  };

  return {
    selection,
    gererSelection,
    nouveauPseudo,
    nouvelleValeur,
    ouvrirDeplacement,
    choixTag: choisirTag,
    annulerPicker,
    effacerSelection,
    picker,
    valeurAjoutClassique,
    ouvrirAjoutClassique,
    annulerAjoutClassique,
    showAjoutClassique,
  };
}
