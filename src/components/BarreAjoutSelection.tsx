import { Bouton } from '@khaleeno/maskita-design-system';

interface BarreAjoutSelectionProps {
  onNouveauPseudo: () => void;
  onNouvelleValeur: () => void;
  onAjoutClassique: () => void;
  libelleNouveauPseudo: string;
  libelleNouvelleValeur: string;
  libelleAjoutClassique: string;
}

/**
 * Surcouche affichée au-dessus d'un aperçu texte quand on a surligné une valeur :
 * propose l'ajout rapide d'un nouveau pseudo, l'ajout à un pseudo existant,
 * ou l'ajout classique (formulaire complet).
 */
export function BarreAjoutSelection({
  onNouveauPseudo,
  onNouvelleValeur,
  onAjoutClassique,
  libelleNouveauPseudo,
  libelleNouvelleValeur,
  libelleAjoutClassique,
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
      <Bouton variante="secondaire" taille="sm" onClick={onAjoutClassique} style={{ padding: '4px 10px', fontSize: '0.78rem', marginLeft: 'var(--espacement-sm)' }}>
        {libelleAjoutClassique}
      </Bouton>
    </div>
  );
}
