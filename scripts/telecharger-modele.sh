#!/usr/bin/env bash
# MSK-004 — Prépare les fichiers du mode « détection avancée » (ner.html) :
#  1. télécharge le modèle Xenova/camembert-ner (quantifié, ~111 Mo) depuis
#     Hugging Face dans public/modeles/ ;
#  2. copie le moteur WebAssembly d'onnxruntime-web dans public/ort/.
# Les deux dossiers sont ignorés par git : le modèle dépasse la limite de
# GitHub (100 Mo par fichier). La page ner.html ne contacte que son propre
# domaine (connect-src 'self') : sans ce script, elle ne trouve pas le modèle.
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
MODELE="Xenova/camembert-ner"
DEST="$RACINE/public/modeles/$MODELE"
FICHIERS="config.json tokenizer.json tokenizer_config.json special_tokens_map.json onnx/model_quantized.onnx"

mkdir -p "$DEST/onnx"
for f in $FICHIERS; do
  if [ -s "$DEST/$f" ]; then
    echo "déjà présent : $f"
  else
    echo "téléchargement : $f"
    curl -fL --retry 3 -o "$DEST/$f" "https://huggingface.co/$MODELE/resolve/main/$f"
  fi
done

# onnxruntime-web est une dépendance de @huggingface/transformers : avec pnpm,
# il se trouve à côté du paquet réel (lien symbolique résolu).
TRANSFORMERS="$(realpath "$RACINE/node_modules/@huggingface/transformers")"
ORT_DIST="$(dirname "$(dirname "$TRANSFORMERS")")/onnxruntime-web/dist"
mkdir -p "$RACINE/public/ort"
cp "$ORT_DIST"/ort-wasm-simd-threaded.asyncify.{mjs,wasm} "$RACINE/public/ort/"
echo "moteur WebAssembly copié depuis $ORT_DIST"
