#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COVERAGE_FILE="$ROOT_DIR/coverage/coverage-summary.json"
REF_FILE="$ROOT_DIR/coverage-ref.txt"

if [ ! -f "$REF_FILE" ]; then
  echo "❌ coverage-ref.txt introuvable. Exécute d'abord pnpm exec vitest run --coverage et crée coverage-ref.txt."
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

# Lire la référence (format "<nom>: <valeur>" ligne par ligne, sans la sourcer)
get_ref() {
  sed -n "s/^$1:[[:space:]]*//p" "$REF_FILE"
}

REF_STATEMENTS=$(get_ref statements)
REF_LINES=$(get_ref lines)
REF_FUNCTIONS=$(get_ref functions)
REF_BRANCHES=$(get_ref branches)

echo ""
echo "📈 Coverage actuel :"
echo "  statements: $STATEMENTS%"
echo "  lines:      $LINES%"
echo "  functions:  $FUNCTIONS%"
echo "  branches:   $BRANCHES%"
echo ""
echo "📉 Référence (coverage-ref.txt) :"
echo "  statements: ${REF_STATEMENTS:-N/A}%"
echo "  lines:      ${REF_LINES:-N/A}%"
echo "  functions:  ${REF_FUNCTIONS:-N/A}%"
echo "  branches:   ${REF_BRANCHES:-N/A}%"

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

check "statements" "$STATEMENTS" "$REF_STATEMENTS"
check "lines" "$LINES" "$REF_LINES"
check "functions" "$FUNCTIONS" "$REF_FUNCTIONS"
check "branches" "$BRANCHES" "$REF_BRANCHES"

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "❌ Coverage en baisse — merci de notifier le lead."
  exit 1
else
  echo "✅ Coverage stable ou en hausse."
  exit 0
fi
