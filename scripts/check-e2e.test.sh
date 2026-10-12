#!/usr/bin/env bash
#
# check-e2e.test.sh — tests du gate e2e (scripts/check-e2e.sh).
#
# Chaque cas crée un dépôt git jetable (mktemp) avec un ref origin/main,
# puis lance le script depuis ce dépôt et vérifie le code de sortie.
#
# Usage : bash scripts/check-e2e.test.sh
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/check-e2e.sh"
PASS=0
FAIL=0

if [ ! -f "$SCRIPT" ]; then
  echo "❌ introuvable : $SCRIPT"
  exit 1
fi

# Crée un dépôt jetable, commit initial comme origin/main, et le rend actif.
# Usage : new_repo [fichiers déjà présents à la base] -> écho le chemin
#   Les fichiers optionnels sont créés dans le commit initial (= base),
#   ce qui permet de tester ensuite leur MODIFICATION (et non un ajout).
new_repo() {
  local dir
  dir="$(mktemp -d)"
  (
    cd "$dir"
    git init -q
    git config user.email "test@test.local"
    git config user.name "test"
    git checkout -q -b main
    echo "init" > Readme.md
    for f in "$@"; do
      mkdir -p "$(dirname "$f")"
      echo "version initiale $f" > "$f"
    done
    git add -A
    git commit -q -m "init"
    # simule origin/main = commit initial
    git update-ref refs/remotes/origin/main HEAD
  )
  echo "$dir"
}

# commit des fichiers passés en arguments (créés à la volée)
commit_files() {
  local dir="$1"; shift
  (
    cd "$dir"
    for f in "$@"; do
      mkdir -p "$(dirname "$f")"
      echo "contenu $f" > "$f"
      git add -A
    done
    git commit -q -m "changement"
  )
}

check_case() {
  local desc="$1" expected="$2" actual="$3" output="$4" want_log="${5:-}"
  if [ "$actual" -eq "$expected" ]; then
    if [ -n "$want_log" ] && ! printf '%s' "$output" | grep -q "$want_log"; then
      echo "❌ $desc — exit $actual OK mais log attendu absent ('$want_log')"
      FAIL=$((FAIL + 1))
      return
    fi
    echo "✅ $desc (exit $actual)"
    PASS=$((PASS + 1))
  else
    echo "❌ $desc — exit attendu $expected, obtenu $actual"
    printf '   sortie : %s\n' "$output"
    FAIL=$((FAIL + 1))
  fi
}

# --- Cas 1 : src/ + e2e/ → exit 0 --------------------------------------------
R="$(new_repo)"
commit_files "$R" src/app.ts e2e/app.spec.ts
OUT="$(cd "$R" && bash "$SCRIPT" 2>&1)"; RC=$?
check_case "Cas 1 : changement src/ + e2e/ → exit 0" 0 "$RC" "$OUT"
rm -rf "$R"

# --- Cas 2 : src/ seul → exit 1 ----------------------------------------------
R="$(new_repo)"
commit_files "$R" src/app.ts
OUT="$(cd "$R" && bash "$SCRIPT" 2>&1)"; RC=$?
check_case "Cas 2 : changement src/ seul → exit 1" 1 "$RC" "$OUT"
rm -rf "$R"

# --- Cas 2b : src/ seul, uniquement un *.test.ts → exit 0 (pas de prod) -------
R="$(new_repo)"
commit_files "$R" src/app.test.ts
OUT="$(cd "$R" && bash "$SCRIPT" 2>&1)"; RC=$?
check_case "Cas 2b : src/*.test.ts seul → exit 0" 0 "$RC" "$OUT"
rm -rf "$R"

# --- Cas 3 : src/ seul + SKIP_E2E=1 → exit 0 avec log ------------------------
R="$(new_repo)"
commit_files "$R" src/app.ts
OUT="$(cd "$R" && SKIP_E2E=1 bash "$SCRIPT" 2>&1)"; RC=$?
check_case "Cas 3 : src/ seul + SKIP_E2E=1 → exit 0" 0 "$RC" "$OUT" "contourné explicitement"
rm -rf "$R"

# --- Cas 3b : src/ seul + --sans-e2e → exit 0 avec log -----------------------
R="$(new_repo)"
commit_files "$R" src/app.ts
OUT="$(cd "$R" && bash "$SCRIPT" --sans-e2e 2>&1)"; RC=$?
check_case "Cas 3b : src/ seul + --sans-e2e → exit 0" 0 "$RC" "$OUT" "contourné explicitement"
rm -rf "$R"

# --- Cas 4 : scripts/ ou .github/ uniquement → exit 0 ------------------------
R="$(new_repo)"
commit_files "$R" scripts/outil.sh .github/workflows/ci.yml
OUT="$(cd "$R" && bash "$SCRIPT" 2>&1)"; RC=$?
check_case "Cas 4 : scripts/ + .github/ uniquement → exit 0" 0 "$RC" "$OUT"
rm -rf "$R"

# --- Cas 5 : e2e MODIFIÉ (pas ajouté) + src/ → exit 0 ------------------------
# Le fichier e2e existe déjà à la base (= origin/main) : il n'est donc pas
# nouvellement ajouté, seulement modifié. `git diff --name-only` (sans option
# de filtre de statut) liste indifféremment les fichiers ajoutés ET modifiés,
# et le grep '^e2e/' les attrape dans les deux cas.
R="$(new_repo e2e/parcours.spec.ts)"
commit_files "$R" src/app.ts
(
  cd "$R"
  echo "mise à jour du test e2e" >> e2e/parcours.spec.ts
  git add -A
  git commit -q -m "maj e2e existant (modification, pas ajout)"
)
OUT="$(cd "$R" && bash "$SCRIPT" 2>&1)"; RC=$?
check_case "Cas 5 : e2e MODIFIÉ (pas ajouté) + src/ → exit 0" 0 "$RC" "$OUT"
rm -rf "$R"

# --- Bilan -------------------------------------------------------------------
echo ""
echo "Résultat : $PASS réussis, $FAIL échoués."
if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
exit 0
