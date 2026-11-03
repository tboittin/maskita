#!/usr/bin/env bash
#
# check-e2e.sh — Gate e2e.
#
# Rend exécutable l'exigence : « tout changement de code de production (src/)
# doit venir avec un test e2e (e2e/) ».
#
# Règle :
#   - Aucun fichier de production modifié                    → exit 0 (e2e non requis)
#   - Fichiers de production modifiés + un e2e (ajouté ou
#     mis à jour — les deux comptent)                        → exit 0
#   - Fichiers de production modifiés, AUCUN e2e             → exit 1
#     (sauf échappatoire explicite, voir plus bas)
#
# Échappatoire « sans-e2e » (déclarée par le lead, jamais par le subagent) :
#   - variable d'environnement  SKIP_E2E=1
#   - ou argument               --sans-e2e
#   Dans ce cas : exit 0 avec un log explicite de contournement.
#
# Usage :
#   bash scripts/check-e2e.sh [--sans-e2e]
#   SKIP_E2E=1 bash scripts/check-e2e.sh
#
# Le script ne dépend PAS du réseau : aucune requête `gh` n'est faite.
# Il doit être lancé depuis la racine du dépôt (ou n'importe quel sous-dossier,
# les chemins de `git diff` étant toujours relatifs à la racine).
#
# Variables d'environnement (tests) :
#   CHECK_E2E_BASE  force la base de comparaison au lieu de origin/main.
set -euo pipefail

SANS_E2E=0
for arg in "$@"; do
  case "$arg" in
    --sans-e2e) SANS_E2E=1 ;;
    -h|--help)
      echo "Usage: bash scripts/check-e2e.sh [--sans-e2e]"
      echo "  --sans-e2e   déclare l'exception e2e (contournement explicite)"
      exit 0
      ;;
    *)
      echo "❌ argument inconnu : $arg" >&2
      exit 2
      ;;
  esac
done

if [ "${SKIP_E2E:-0}" = "1" ]; then
  SANS_E2E=1
fi

# --- 1. Détermination de la base de comparaison ------------------------------
if [ -n "${CHECK_E2E_BASE:-}" ]; then
  BASE="$CHECK_E2E_BASE"
elif git rev-parse --verify -q origin/main >/dev/null 2>&1; then
  BASE="$(git merge-base origin/main HEAD 2>/dev/null || echo "origin/main")"
else
  echo "ℹ️  origin/main introuvable — impossible de déterminer la base."
  echo "✅ Aucune comparaison possible : e2e non requis."
  exit 0
fi

# --- 2. Fichiers changés entre BASE et HEAD ----------------------------------
if ! CHANGED="$(git diff --name-only "$BASE"...HEAD 2>/dev/null)"; then
  CHANGED="$(git diff --name-only "$BASE" HEAD)"
fi

# --- 3. Classification -------------------------------------------------------
# Fichiers de production : sous src/, hors fichiers de test (*.test.ts[x]).
PROD_FILES="$(printf '%s\n' "$CHANGED" | grep -E '^src/' | grep -Ev '\.test\.tsx?$' || true)"
# Fichiers e2e : sous e2e/. `git diff --name-only` ne filtre PAS par statut :
# il liste aussi bien les fichiers ajoutés (A) que modifiés (M), donc un test
# e2e simplement mis à jour est bien compté ici.
E2E_FILES="$(printf '%s\n' "$CHANGED" | grep -E '^e2e/' || true)"

echo "🔍 check-e2e : base=$BASE"
echo "   fichiers de production modifiés : $(printf '%s' "$PROD_FILES" | grep -c . || true)"
echo "   fichiers e2e modifiés           : $(printf '%s' "$E2E_FILES" | grep -c . || true)"

# --- 4. Application de la règle ----------------------------------------------
if [ -z "$PROD_FILES" ]; then
  echo "✅ Pas de changement src/ : e2e non requis."
  exit 0
fi

if [ -n "$E2E_FILES" ]; then
  echo "✅ Changement src/ accompagné d'un test e2e (ajouté ou mis à jour) : OK."
  exit 0
fi

# Changement de production SANS e2e.
if [ "$SANS_E2E" -eq 1 ]; then
  echo "⚠️  e2e contourné explicitement (sans-e2e)."
  echo "   Le code de production a changé sans test e2e — exception déclarée par le lead."
  exit 0
fi

echo "" >&2
echo "❌ Changement de production détecté sans test e2e." >&2
echo "" >&2
echo "Fichiers de production modifiés :" >&2
printf '   - %s\n' $PROD_FILES >&2
echo "" >&2
echo "Pour corriger, au choix :" >&2
echo "   1. Ajouter/mettre à jour un test e2e sous e2e/ couvrant le nouveau comportement." >&2
echo "   2. Déclarer l'exception explicitement : SKIP_E2E=1 bash scripts/check-e2e.sh" >&2
echo "      (ou : bash scripts/check-e2e.sh --sans-e2e)" >&2
echo "" >&2
exit 1
