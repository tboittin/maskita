import { useCallback, useRef, type ReactNode } from 'react';
import { TexteApercu } from './TexteApercu';
import type { Mapping } from '../utils/mapping';

export interface ApercuConfig {
  titre: string;
  texte: string;
  surlignerTags?: boolean;
  surlignerValeurs?: boolean;
  onClicTag?: (tag: string) => void;
  onClicValeur?: (tag: string, valeur: string) => void;
  onSelection?: (valeur: string) => void;
  /** Surcouche d'actions affichée au-dessus du volet (ex: sélection de texte). */
  toolbar?: ReactNode;
  /** Réf du conteneur scrollable du volet (optionnelle — interne sinon). */
  containerRef?: React.RefObject<HTMLDivElement>;
}

interface PanneauApercusProps {
  mapping: Mapping;
  tagSurbrillance: string | null;
  valeurSurbrillance: string | null;
  syncScroll: boolean;
  voletHaut: ApercuConfig;
  voletBas: ApercuConfig;
}

/**
 * Composant neutre partagé entre les parcours Pseudonymisation et Restauration :
 * le volet droit de la revue — deux aperçus texte (texte avec tags / texte
 * restauré ou lisible) avec synchronisation de défilement et surbrillance croisée.
 */
export function PanneauApercus({
  mapping,
  tagSurbrillance,
  valeurSurbrillance,
  syncScroll,
  voletHaut,
  voletBas,
}: PanneauApercusProps) {
  const refHautInterne = useRef<HTMLDivElement>(null);
  const refBasInterne = useRef<HTMLDivElement>(null);
  const refHaut = voletHaut.containerRef ?? refHautInterne;
  const refBas = voletBas.containerRef ?? refBasInterne;
  const syncing = useRef(false);

  const handleScroll = useCallback(
    (source: 'haut' | 'bas') =>
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll || syncing.current) return;
        syncing.current = true;

        const sourceEl = e.currentTarget;
        const ratio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);

        const cible = source === 'haut' ? refBas.current : refHaut.current;
        if (cible) {
          cible.scrollTop = ratio * (cible.scrollHeight - cible.clientHeight || 1);
        }

        requestAnimationFrame(() => { syncing.current = false; });
      },
    [syncScroll, refHaut, refBas],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <div style={{ position: 'relative' }}>
        <TexteApercu
          titre={voletHaut.titre}
          texte={voletHaut.texte}
          mapping={mapping}
          tagSurbrillance={tagSurbrillance}
          surlignerTags={voletHaut.surlignerTags}
          containerRef={refHaut}
          onScroll={handleScroll('haut')}
          onTagClick={voletHaut.onClicTag}
          onSelection={voletHaut.onSelection}
        />
        {voletHaut.toolbar}
      </div>
      <div style={{ position: 'relative' }}>
        <TexteApercu
          titre={voletBas.titre}
          texte={voletBas.texte}
          mapping={mapping}
          tagSurbrillance={tagSurbrillance}
          valeurSurbrillance={valeurSurbrillance}
          surlignerValeurs={voletBas.surlignerValeurs}
          containerRef={refBas}
          onScroll={handleScroll('bas')}
          onValeurClick={voletBas.onClicValeur}
          onSelection={voletBas.onSelection}
        />
        {voletBas.toolbar}
      </div>
    </div>
  );
}