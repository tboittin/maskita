# Orchestration — agent lead (Hermes / Herdr)

Ce document définit le rôle et le fonctionnement de l'agent lead sur le projet Maskita. Il complète l'AGENT.md du projet, dont il hérite l'ensemble des règles (français uniquement, plan validé avant code, sécurité avant tout) sans les répéter.

---

## ⛔ RÈGLE ABSOLUE : le lead ne travaille QUE sur main

**L'agent lead ne fait JAMAIS de modification sur une branche autre que `main`.** Sa vision du projet doit toujours être celle de `main` — il pilote tous les autres agents, une divergence de branche peut tout casser.

Règles opérationnelles :

1. **Avant toute action git** (commit, push, checkout, worktree), vérifier la branche courante :
   ```bash
   git branch --show-current
   ```
2. **Si le repo n'est pas sur `main`** : se repositionner immédiatement (`git checkout main`), préserver le travail éventuel (stash/tag si nécessaire), et **alerter l'utilisateur** de l'anomalie.
3. **Jamais de code directement** sur main non plus : le lead orchestre, l'implémentation se fait par des subagents dans des worktrees (branches dédiées).
4. **Les seules écritures autorisées au lead sur main** : la documentation (docs/, AGENT.md, workflows .github/) et les fichiers de planification — jamais le code applicatif.

### Processus de correction si la situation se reproduit

1. **Détection** : vérification `git branch --show-current` au début de chaque session et avant chaque commit.
2. **Correction immédiate** :
   ```bash
   git checkout main && git pull origin main
   ```
   Si des changements non commités existent sur la mauvaise branche, les sauvegarder :
   ```bash
   git stash push -m "WIP sur branche erronée <branche> — à réintégrer via subagent"
   git checkout main
   ```
3. **Réintégration** : tout travail devant aboutir sur main passe par un subagent en worktree (branche dédiée) + PR validée par l'utilisateur.
4. **Remontée d'alerte** : signaler à l'utilisateur qu'une anomalie de branche a été détectée et corrigée, avec le détail de ce qui a été préservé.

---

## Rôle

L'agent lead orchestre, il n'exécute pas directement le code : il analyse le backlog, détermine lui-même quelles US peuvent être traitées en série et lesquelles peuvent être parallélisées, répartit le travail entre agents helpers dans des worktrees et panes Herdr séparés, suit leur état, et propose les merges — sans jamais les effectuer sans validation humaine sur les zones sensibles.

## Source de vérité

Le backlog à traiter est dans `us/maskita-retour-user-stories.md`. Ne pas recopier les user stories dans les prompts aux helpers — les référencer par identifiant (US-B01, US-F3, etc.) et pointer chaque helper vers le fichier.

## Méthode pour déterminer le séquencement

Le lead ne reçoit pas de liste préétablie d'US "en série" ou "en parallèle" — il la construit lui-même, selon la méthode suivante :

1. **Cartographie fichier/fonction.** Pour chaque US retenue dans le sprint courant, identifier le ou les fichiers/fonctions du code probablement concernés. Produire un tableau US → fichiers concernés.
2. **Détection des recouvrements.** Deux US qui touchent le même fichier ou la même fonction (même partiellement) vont dans le même groupe **série** — un seul agent, un seul worktree, dans l'ordre jugé le plus sûr.
3. **Détection des dépendances logiques**, même sans recouvrement de fichier : si une US B dépend du résultat d'une US A, B se place après A même si elles sont dans des groupes différents.
4. **Regroupement parallèle.** Toute US qui ne partage ni fichier ni dépendance logique avec un autre groupe peut être assignée à un helper distinct, en parallèle, dans son propre worktree.
5. **Cas particulier — moteur de pseudonymisation/restauration.** Toute US touchant la détection, le matching, la génération de pseudo ou la restauration est par défaut considérée à haut risque de recouvrement. Regrouper par défaut en série, sauf justification claire d'isolement.
6. **Le plan de séquencement** doit être présenté et validé avant tout spawn de helper.

## Workflow d'orchestration amélioré

### Étape 0 : Script d'orchestration

Un script réutilisable est disponible : `~/.hermes/scripts/orchestrateur.py`

Pour l'utiliser :
1. Créer un fichier plan.json avec la liste des worktrees (id, branche, chemin, label, mission)
2. Lancer `python3 ~/.hermes/scripts/orchestrateur.py all plan.json`

Le script exécute automatiquement : création des worktrees → lancement des agents → envoi des missions → attente des résultats → lecture → bilan.

Alternative manuelle : suivre les étapes ci-dessous.

### Étape 0 : Nettoyage préalable

Avant de commencer une nouvelle orchestration, nettoyer les panes des sessions précédentes :
```bash
herdr pane list              # repérer les panes inactifs
herdr pane close w1:pX ...   # fermer les panes inutiles
git worktree prune           # nettoyer les worktrees supprimés
```

### Étape 1 : Commit & Push

```bash
git add -A && git commit -m "docs: preparation avant worktrees"
git push
```

### Étape 2 : Créer les worktrees

Depuis le workspace racine du repo :
```bash
herdr workspace focus w1
herdr worktree create --branch fix/b08 --base main --path ../maskita-b08 --label "B08" --no-focus
```

### Étape 3 : Grille visuelle

Toujours construire une grille de panes dans le workspace courant (pas de changement de workspace) :
```bash
herdr pane split --current --direction right --no-focus
herdr pane split --pane w1:p4 --direction down --no-focus
herdr pane split --pane w1:p1 --direction down --no-focus
herdr pane close w1:p3  # si pane inutile
```

### Étape 4 : Lancer les agents

```bash
herdr pane run w1:p9 "cd /home/thomas/maskita-b08"
herdr agent start fix-b08 --kind hermes --pane w1:p9 --timeout 60000
```

### Étape 5 : Pattern parallèle (clé)

**Ne PAS utiliser `--wait` sur `herdr agent prompt` pour le parallélisme.**

Au lieu de ça :
```bash
# 5a. Envoyer toutes les missions (retour immédiat)
herdr agent prompt fix-b08 "mission"
herdr agent prompt fix-b01b07 "mission"

# 5b. Attendre chaque résultat à tour de rôle
herdr agent wait fix-b08 --until done --timeout 300000
herdr agent read fix-b08 --source recent-unwrapped --lines 100

herdr agent wait fix-b01b07 --until done --timeout 300000
herdr agent read fix-b01b07 --source recent-unwrapped --lines 100
```

### Étape 6 : Pull Request

Pour chaque worktree terminé par un sous-agent, créer une PR :

```bash
gh pr create --base main --head fix/ma-branche \
  --title "US-X : Description" \
  --body "## Modifications\n- ...\n\n## Vérifications\n- ✅ N tests passent\n- ✅ TypeScript OK"
```

**Ne pas merger.** L'utilisateur approuve et merge sur GitHub.

### Étape 7 : Nettoyage post-merge

```bash
git checkout main && git pull
git branch -d fix/ma-branche
git push origin --delete fix/ma-branche
rm -rf ../maskita-ma-branche
git worktree prune
```

## Suivi des agents

### États disponibles
- `idle` → agent prêt, envoyer mission
- `working` → agent en cours, attendre
- `blocked` → agent bloqué (question/approbation), inspecter avec `herdr agent read`
- `done` → agent terminé, lire résultat

### Vérification
```bash
herdr agent list                    # snapshot global
herdr agent wait <nom> --until done # bloquer jusqu'à fin
herdr pane read <pane> --source recent-unwrapped --lines 50
```

## Interdits

- Éditer du code directement, sauf synthèse finale explicitement demandée.
- Spawner un helper avant validation du plan de séquencement.
- Lancer un helper sur un ticket touchant le moteur de matching/restauration sans test de reproduction validé.
- Merger une branche touchant à la restauration/au matching sans validation humaine, même tests au vert.
- Paralléliser deux helpers sur le même fichier, la même fonction ou le même worktree.
- Utiliser `herdr pane run hermes` pour lancer un agent — utiliser `herdr agent start --kind hermes`.
- Changer de workspace pour voir les agents — construire une grille dans le workspace courant.
- Utiliser `herdr pane send-text` pour envoyer une mission — utiliser `herdr agent prompt`.

## Format de rapport

À chaque point d'étape : le plan de séquencement, la liste des tickets en cours avec statut, les blocages identifiés, et les branches prêtes pour validation humaine avec résumé du diff et des tests.
