import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      // MSK-004 — deux pages : index.html (sans aucune requête) et
      // ner.html (détection avancée, modèle chargé depuis le site).
      input: {
        main: resolve(__dirname, 'index.html'),
        ner: resolve(__dirname, 'ner.html'),
      },
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        // Nom stable : vercel.json applique sa CSP au worker par ce préfixe.
        entryFileNames: 'assets/ner-worker-[hash].js',
      },
    },
  },
  optimizeDeps: {
    // transformers.js embarque onnxruntime-web : le pré-bundling casse ses
    // imports dynamiques du moteur WebAssembly.
    exclude: ['@huggingface/transformers'],
  },
});
