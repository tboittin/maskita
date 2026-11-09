/// <reference lib="webworker" />
/**
 * MSK-004 — Web Worker de la détection avancée.
 *
 * Charge CamemBERT-NER (Xenova/camembert-ner, quantifié) avec
 * @huggingface/transformers et analyse le texte morceau par morceau, sans
 * bloquer l'interface. Tout vient du site lui-même :
 *  - le modèle depuis /modeles/ (allowRemoteModels = false : jamais Hugging Face) ;
 *  - le moteur WebAssembly depuis /ort/ (jamais un CDN).
 * Après le premier chargement, le navigateur garde le modèle en cache (Cache API).
 */
import { pipeline, env, type TokenClassificationPipeline } from '@huggingface/transformers';
import { decouperTexte, regrouperEntites, type EntiteNer, type JetonNer } from './regroupement';
import type { MessageVersWorker, MessageDuWorker } from './messages';
import { cheminsLocaux } from './compatibilite';

export const MODELE = 'Xenova/camembert-ner';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = '/modeles/';
// Moteur WebAssembly servi par le site : voir cheminsLocaux (compatibilite.ts).
if (env.backends.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = cheminsLocaux(env.backends.onnx.wasm.wasmPaths);
}

let ner: Promise<TokenClassificationPipeline> | null = null;

function envoyer(message: MessageDuWorker) {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(message);
}

function charger(): Promise<TokenClassificationPipeline> {
  if (!ner) {
    const debut = performance.now();
    ner = (pipeline('token-classification', MODELE, {
      dtype: 'q8',
      progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status === 'progress' && p.file && p.total) {
          envoyer({ type: 'progression', fichier: p.file, charge: p.loaded ?? 0, total: p.total });
        }
      },
    }) as Promise<TokenClassificationPipeline>).then(
      (pipe) => {
        envoyer({ type: 'pret', dureeMs: Math.round(performance.now() - debut) });
        return pipe;
      },
      (err: unknown) => {
        ner = null;
        throw err;
      },
    );
  }
  return ner;
}

async function analyser(id: number, texte: string) {
  const pipe = await charger();
  const debut = performance.now();
  const morceaux = decouperTexte(texte);
  const entites: EntiteNer[] = [];
  for (const morceau of morceaux) {
    const jetons = (await pipe(morceau.texte, { ignore_labels: [] })) as unknown as JetonNer[];
    entites.push(...regrouperEntites(morceau, jetons));
  }
  envoyer({
    type: 'resultat',
    id,
    entites,
    morceaux: morceaux.length,
    dureeMs: Math.round(performance.now() - debut),
  });
}

self.addEventListener('message', (e: MessageEvent<MessageVersWorker>) => {
  const msg = e.data;
  const echec = (err: unknown) =>
    envoyer({ type: 'erreur', id: msg.type === 'analyser' ? msg.id : undefined, message: String(err instanceof Error ? err.message : err) });
  if (msg.type === 'charger') charger().catch(echec);
  else if (msg.type === 'analyser') analyser(msg.id, msg.texte).catch(echec);
});
