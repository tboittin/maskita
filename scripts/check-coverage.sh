#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COVERAGE_FILE="$ROOT_DIR/coverage/coverage-summary.json"
REF_FILE="$ROOT_DIR/coverage-ref.txt"

UPDATE_REF=0
if [[ "${1:-}" == "--update-ref" ]]; then
  UPDATE_REF=1
fi

if [ ! -f "$REF_FILE" ] && [ "$UPDATE_REF" -eq 0 ]; then
  echo "❌ coverage-ref.txt introuvable. Exécute d'abord bash scripts/check-coverage.sh --update-ref pour créer la référence."
  exit 1
fi

echo "📊 Exécution du coverage..."
pnpm exec vitest run --coverage

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "❌ coverage/coverage-summary.json non généré."
  exit 1
fi

# Lire les valeurs actuelles depuis le résumé (total → statements/lines/functions/branches)
get_total() {
  node -e "
    const c = require('$COVERAGE_FILE');
    console.log(c.total.$1.pct);
  "
}

STATEMENTS=$(get_total statements)
LINES=$(get_total lines)
FUNCTIONS=$(get_total functions)
BRANCHES=$(get_total branches)

echo ""
echo "📈 Coverage actuel :"
echo "  statements: $STATEMENTS%"
echo "  lines:      $LINES%"
echo "  functions:  $FUNCTIONS%"
echo "  branches:   $BRANCHES%"

# Modèle de sortie la référence
ref_line() {
  local label="$1"
  local current="$2"
  # Marge de 1 pt pour absorber la variance non-déterministe de v8 entre runs
  echo "${label}=$(echo "$current - 1.0" | bc -l)"
}

# Mode mise à jour de la référence
if [ "$UPDATE_REF" -eq 1 ]; then
  # Format sourceable par bash (clé=valeur) pour pouvoir faire `source` plus tard.
  {
    ref_line "statements" "$STATEMENTS"
    ref_line "lines" "$LINES"
    ref_line "functions" "$FUNCTIONS"
    ref_line "branches" "$BRANCHES"
  } > "$REF_FILE"
  echo ""
  echo "✅ Référence coverage mise à jour (coverage-ref.txt) :"
  cat "$REF_FILE"
  exit 0
fi

# Lire la référence
# shellcheck disable=SC1090
source "$REF_FILE"

echo ""
echo "📉 Référence (coverage-ref.txt) :"
echo "  statements: ${statements:-N/A}%"
echo "  lines:      ${lines:-N/A}%"
echo "  functions:  ${functions:-N/A}%"
echo "  branches:   ${branches:-N/A}%"

FAIL=0

check() {
  local label="$1"
  local current="$2"
  local ref="$3"
  if [ -z "$ref" ]; then
    echo "❌ $label : référence absente dans coverage-ref.txt"
    FAIL=1
    return
  fi
  if [ "$(echo "$current < $ref" | bc -l)" -eq 1 ]; then
    echo "❌ $label a baissé : $current% < $ref%"
    FAIL=1
  else
    echo "✅ $label : $current% >= $ref%"
  fi
}

check "statements" "$STATEMENTS" "${statements:-}"
check "lines" "$LINES" "${lines:-}"
check "functions" "$FUNCTIONS" "${functions:-}"
check "branches" "$BRANCHES" "${branches:-}"

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "❌ Coverage en baisse — merci de notifier le lead."
  exit 1
else
  echo "✅ Coverage stable ou en hausse."
  exit 0
fi
