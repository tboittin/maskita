import { describe, it, expect } from 'vitest';
import { cheminsLocaux, verifierCompatibilite } from './compatibilite';

const okWasm = { validate: () => true };
function FauxWorker() {}

describe('verifierCompatibilite', () => {
  it('accepte un navigateur récent', () => {
    expect(verifierCompatibilite({ WebAssembly: okWasm, Worker: FauxWorker, navigator: { deviceMemory: 8 } }))
      .toEqual({ ok: true, memoireFaible: false });
  });

  it('refuse sans WebAssembly (Mode Isolement, navigateur ancien)', () => {
    expect(verifierCompatibilite({ Worker: FauxWorker })).toMatchObject({ ok: false, raison: 'webassembly' });
  });

  it('refuse sans SIMD', () => {
    expect(verifierCompatibilite({ WebAssembly: { validate: () => false }, Worker: FauxWorker }))
      .toMatchObject({ ok: false, raison: 'simd' });
  });

  it('refuse si la validation lève une erreur', () => {
    const casse = { validate: () => { throw new Error('x'); } };
    expect(verifierCompatibilite({ WebAssembly: casse, Worker: FauxWorker })).toMatchObject({ ok: false, raison: 'simd' });
  });

  it('refuse sans Web Worker', () => {
    expect(verifierCompatibilite({ WebAssembly: okWasm })).toMatchObject({ ok: false, raison: 'worker' });
  });

  it('signale une mémoire faible sans bloquer', () => {
    expect(verifierCompatibilite({ WebAssembly: okWasm, Worker: FauxWorker, navigator: { deviceMemory: 2 } }))
      .toEqual({ ok: true, memoireFaible: true });
  });

  it('valide vraiment le module SIMD avec le WebAssembly de Node', () => {
    expect(verifierCompatibilite({ WebAssembly, Worker: FauxWorker }).ok).toBe(true);
  });
});

describe('cheminsLocaux', () => {
  it('garde la variante choisie par la bibliothèque mais sert depuis /ort/', () => {
    const cdn = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0/dist/';
    expect(cheminsLocaux({ mjs: cdn + 'ort-wasm-simd-threaded.mjs', wasm: cdn + 'ort-wasm-simd-threaded.wasm' }))
      .toEqual({ mjs: '/ort/ort-wasm-simd-threaded.mjs', wasm: '/ort/ort-wasm-simd-threaded.wasm' });
  });

  it('prend la variante asyncify par défaut', () => {
    expect(cheminsLocaux(undefined)).toEqual({
      mjs: '/ort/ort-wasm-simd-threaded.asyncify.mjs',
      wasm: '/ort/ort-wasm-simd-threaded.asyncify.wasm',
    });
  });
});
