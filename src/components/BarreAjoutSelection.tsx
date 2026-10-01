import { Bouton } from '@khaleeno/maskita-design-system';

interface BarreAjoutSelectionProps {
  onNouveauPseudo: () => void;
  onNouvelleValeur: () => void;
  libelleNouveauPseudo: string;
  libelleNouvelleValeur: string;
}

/**
 * Surcouche affichée au-dessus d'un aperçu texte quand on a surligné une valeur :
 * propose l'ajout rapide d'un nouveau pseudo ou l'ajout à un pseudo existant.
 */
export function BarreAjoutSelection({
  onNouveauPseudo,
  onNouvelleValeur,
  libelleNouveauPseudo,
  libelleNouvelleValeur,
}: BarreAjoutSelectionProps) {
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      display: 'flex', gap: 'var(--espacement-xs)',
      padding: 'var(--espacement-sm)', zIndex: 10,
    }}>
      <Bouton variante="primaire" taille="sm" onClick={onNouveauPseudo} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
        {libelleNouveauPseudo}
      </Bouton>
      <Bouton variante="primaire" taille="sm" onClick={onNouvelleValeur} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
        {libelleNouvelleValeur}
      </Bouton>
    </div>
  );
}
