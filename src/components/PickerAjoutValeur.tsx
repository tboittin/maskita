import { Bouton, Modal } from '@khaleeno/maskita-design-system';

interface PickerAjoutValeurProps {
  ouvert: boolean;
  titre: string;
  /** Tag exclu de la liste (cas d'un déplacement). */
  tagSource?: string | null;
  /** Tous les tags proposables. */
  tags: string[];
  onChoisir: (tag: string) => void;
  onAnnuler: () => void;
  libelleValeur: string;
  libelleAucun: string;
  libelleAnnuler: string;
}

/**
 * Modale de choix d'un pseudo : ajout d'une nouvelle valeur ou déplacement.
 * Partagée entre Pseudonymisation et Restauration.
 */
export function PickerAjoutValeur({
  ouvert,
  titre,
  tagSource,
  tags,
  onChoisir,
  onAnnuler,
  libelleValeur,
  libelleAucun,
  libelleAnnuler,
}: PickerAjoutValeurProps) {
  const choix = tags.filter(t => t !== tagSource);
  return (
    <Modal
      ouvert={ouvert}
      titre={titre}
      onFermer={onAnnuler}
      pied={
        <Bouton variante="secondaire" onClick={onAnnuler}>
          {libelleAnnuler}
        </Bouton>
      }
    >
      <p className="mb-3 text-sm text-brume-500">{libelleValeur}</p>
      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {choix.map(tag => (
          <Bouton
            key={tag}
            variante="secondaire"
            onClick={() => onChoisir(tag)}
            className="justify-start font-donnees text-[13px]"
          >
            {tag}
          </Bouton>
        ))}
        {choix.length === 0 && (
          <p className="text-sm italic text-brume-500">{libelleAucun}</p>
        )}
      </div>
    </Modal>
  );
}
