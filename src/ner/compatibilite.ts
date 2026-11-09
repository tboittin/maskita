/**
 * MSK-004 — Ce que le navigateur doit savoir faire pour la détection avancée,
 * vérifié AVANT tout téléchargement, et chemins du moteur WebAssembly.
 */

/**
 * Plus petit module WebAssembly utilisant une instruction SIMD (même test que
 * la bibliothèque wasm-feature-detect). Le moteur d'onnxruntime-web l'exige.
 */
const MODULE_SIMD = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
]);

export type RaisonIncompatibilite = 'webassembly' | 'simd' | 'worker';

export interface Compatibilite {
  /** Faux si la détection avancée ne peut pas tourner du tout. */
  ok: boolean;
  raison?: RaisonIncompatibilite;
  /** Vrai si l'appareil annonce peu de mémoire (risque de plantage de l'onglet). */
  memoireFaible: boolean;
}

/** Environnement à examiner (remplaçable dans les tests). */
export interface Environnement {
  WebAssembly?: { validate: (octets: BufferSource) => boolean };
  Worker?: unknown;
  navigator?: { deviceMemory?: number };
}

export function verifierCompatibilite(envt: Environnement = globalThis as Environnement): Compatibilite {
  const memoire = envt.navigator?.deviceMemory;
  const memoireFaible = typeof memoire === 'number' && memoire < 4;
  // WebAssembly absent : navigateur ancien, ou Mode Isolement d'Apple
  if (!envt.WebAssembly || typeof envt.WebAssembly.validate !== 'function') {
    return { ok: false, raison: 'webassembly', memoireFaible };
  }
  let simd = false;
  try {
    simd = envt.WebAssembly.validate(MODULE_SIMD);
  } catch {
    simd = false;
  }
  if (!simd) return { ok: false, raison: 'simd', memoireFaible };
  if (typeof envt.Worker !== 'function') return { ok: false, raison: 'worker', memoireFaible };
  return { ok: true, memoireFaible };
}

/**
 * Moteur WebAssembly servi par le site. transformers.js choisit lui-même la
 * variante adaptée au navigateur (« asyncify » en général, la variante simple
 * pour Safari < 26) et pointe vers un CDN : on garde son choix de fichier,
 * mais on remplace le CDN par /ort/ (les deux variantes y sont copiées par
 * scripts/telecharger-modele.sh).
 */
export function cheminsLocaux(chemins: unknown): { mjs: string; wasm: string } {
  const nom = (url: unknown, defaut: string) =>
    typeof url === 'string' && url.length > 0 ? url.split('/').pop()! : defaut;
  const c = (chemins ?? {}) as { mjs?: unknown; wasm?: unknown };
  return {
    mjs: '/ort/' + nom(c.mjs, 'ort-wasm-simd-threaded.asyncify.mjs'),
    wasm: '/ort/' + nom(c.wasm, 'ort-wasm-simd-threaded.asyncify.wasm'),
  };
}
