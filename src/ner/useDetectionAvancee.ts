/**
 * MSK-004 — Hook de la détection avancée (page ner.html uniquement).
 *
 * Crée le Web Worker à l'activation (jamais avant : tant que l'utilisateur
 * n'a pas cliqué, aucune requête), suit le téléchargement du modèle et
 * renvoie les entités trouvées sous forme de `Detection` Maskita.
 * Les durées sont écrites dans la console pour la mesure de MSK-005.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Detection } from '../utils/regex';
import type { MessageDuWorker, MessageVersWorker } from './messages';
import { versDetections } from './regroupement';
import { verifierCompatibilite, type Compatibilite } from './compatibilite';

export type EtatDetectionAvancee = 'inactif' | 'incompatible' | 'chargement' | 'pret' | 'erreur';

export interface DetectionAvancee {
  etat: EtatDetectionAvancee;
  /** Avancement du téléchargement, de 0 à 100. */
  progression: number;
  erreur: string | null;
  /** Résultat de la vérification du navigateur, faite avant tout téléchargement. */
  compatibilite: Compatibilite;
  activer: () => void;
  analyser: (texte: string) => Promise<Detection[]>;
}

/** Fabrique du worker, remplaçable dans les tests. */
export type FabriqueWorker = () => Pick<Worker, 'postMessage' | 'terminate' | 'addEventListener'>;

const fabriqueParDefaut: FabriqueWorker = () =>
  new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

export function useDetectionAvancee(
  fabrique: FabriqueWorker = fabriqueParDefaut,
  verifier: () => Compatibilite = verifierCompatibilite,
): DetectionAvancee {
  const [compatibilite] = useState(verifier);
  const [etat, setEtat] = useState<EtatDetectionAvancee>(compatibilite.ok ? 'inactif' : 'incompatible');
  const [progression, setProgression] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const worker = useRef<ReturnType<FabriqueWorker> | null>(null);
  const attentes = useRef(new Map<number, { resoudre: (d: Detection[]) => void; rejeter: (e: Error) => void }>());
  const prochainId = useRef(1);
  const fichiers = useRef(new Map<string, { charge: number; total: number }>());

  useEffect(() => () => worker.current?.terminate(), []);

  const surMessage = useCallback((e: MessageEvent<MessageDuWorker>) => {
    const msg = e.data;
    switch (msg.type) {
      case 'progression': {
        fichiers.current.set(msg.fichier, { charge: msg.charge, total: msg.total });
        let charge = 0;
        let total = 0;
        fichiers.current.forEach(f => { charge += f.charge; total += f.total; });
        setProgression(total > 0 ? Math.min(100, Math.round((charge / total) * 100)) : 0);
        break;
      }
      case 'pret':
        console.info(`[Maskita NER] modèle chargé en ${msg.dureeMs} ms`);
        setProgression(100);
        setEtat('pret');
        break;
      case 'resultat': {
        console.info(
          `[Maskita NER] analyse : ${msg.dureeMs} ms, ${msg.morceaux} morceaux, ${msg.entites.length} entités`,
        );
        console.table(msg.entites.map(en => ({ etiquette: en.etiquette, valeur: en.valeur, score: en.score.toFixed(2) })));
        const attente = attentes.current.get(msg.id);
        attentes.current.delete(msg.id);
        attente?.resoudre(versDetections(msg.entites));
        break;
      }
      case 'erreur': {
        console.error('[Maskita NER]', msg.message);
        if (msg.id !== undefined) {
          const attente = attentes.current.get(msg.id);
          attentes.current.delete(msg.id);
          attente?.rejeter(new Error(msg.message));
        } else {
          setErreur(msg.message);
          setEtat('erreur');
        }
        break;
      }
    }
  }, []);

  const obtenirWorker = useCallback(() => {
    if (!worker.current) {
      worker.current = fabrique();
      worker.current.addEventListener('message', surMessage as EventListener);
    }
    return worker.current;
  }, [fabrique, surMessage]);

  const activer = useCallback(() => {
    if (!compatibilite.ok) return; // rien n'est téléchargé
    setErreur(null);
    setEtat('chargement');
    const message: MessageVersWorker = { type: 'charger' };
    obtenirWorker().postMessage(message);
  }, [obtenirWorker, compatibilite.ok]);

  const analyser = useCallback((texte: string) => {
    const id = prochainId.current++;
    return new Promise<Detection[]>((resoudre, rejeter) => {
      attentes.current.set(id, { resoudre, rejeter });
      const message: MessageVersWorker = { type: 'analyser', id, texte };
      obtenirWorker().postMessage(message);
    });
  }, [obtenirWorker]);

  return { etat, progression, erreur, compatibilite, activer, analyser };
}
