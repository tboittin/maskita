/** MSK-004 — Messages échangés entre la page et le Web Worker NER. */
import type { EntiteNer } from './regroupement';

export type MessageVersWorker =
  | { type: 'charger' }
  | { type: 'analyser'; id: number; texte: string };

export type MessageDuWorker =
  | { type: 'progression'; fichier: string; charge: number; total: number }
  | { type: 'pret'; dureeMs: number }
  | { type: 'resultat'; id: number; entites: EntiteNer[]; morceaux: number; dureeMs: number }
  | { type: 'erreur'; id?: number; message: string };
