# MCP Server — Maskita Orchestrateur

## Qu'est-ce qu'un MCP ?

MCP (Model Context Protocol) est un standard qui permet à un agent IA (Hermes) d'utiliser des **outils externes** sans avoir à coder la logique dans le prompt. C'est comme des plugins : le MCP serveur expose des fonctions, Hermes les découvre et peut les appeler comme n'importe quel autre outil.

## Ce que fait ce MCP

Le serveur `maskita-orchestrateur` expose **6 outils** :

### 1. `create_subagent_task`
**Avant (manuel, 7 commandes) :**
```bash
git checkout -b fix/issue-34 main
git push origin fix/issue-34
git worktree add ../maskita-issue-34 origin/fix/issue-34
herdr pane split --current --direction right
herdr pane run wM:pX "cd ../maskita-issue-34"
herdr agent start fix-34 --kind hermes --pane wM:pX
herdr agent prompt fix-34 "$(cat /tmp/mission-34.txt)"
```

**Après (1 appel MCP) :**
```
mcp_maskita_orchestrateur_create_subagent_task(
    issue_number=34,
    mission_text="...",
    branch_name="fix/issue-34-parcours-vierge"  # optionnel
)
```

### 2. `add_to_project`
Ajoute une issue existante au Project #3 "Maskita — Chantier" avec le bon statut (Ready / Not Ready / In Progress / etc.)
- Contourne la limitation du GITHUB_TOKEN (scope `project` manquant)

### 3. `update_project_status`
Change le statut d'une US dans le kanban sans passer par l'UI GitHub

### 4. `get_project_status`
Lit le statut actuel d'une US

### 5. `list_project_items`
Liste toutes les US du kanban avec leur statut

### 6. `create_child_issues`
Crée des issues filles (US) depuis une issue mère, les ajoute au Project avec le bon statut (Ready si aucun prérequis, Not Ready sinon)

## Installation (déjà faite)

- Script : `/home/thomas/.hermes/scripts/mcp-server-maskita.py`
- Config : `~/.hermes/config.yaml` → `mcp_servers.maskita-orchestrateur`
- Dépendances : MCP SDK installé dans le venv Hermes

## Test

```bash
hermes mcp test maskita-orchestrateur
```

## Redémarrage nécessaire

Les outils MCP sont découverts au **démarrage du processus Hermes**. Pour qu'ils soient disponibles :
1. `/exit` dans la session Hermes
2. Relancer `hermes`

Les outils apparaîtront alors avec le préfixe `mcp_maskita_orchestrateur_*` dans la liste des outils.

## Flux de travail avec MCP

Une fois redémarré, au lieu de :

```
🔔 Wakeup → lead lit l'issue → crée branche → worktree → pane → agent → mission
```

Je pourrai faire :

```
🔔 Wakeup → lead lit l'issue → create_subagent_task(issue=34, mission=...) → tout est créé automatiquement
```

Et le kanban Project #3 sera utilisable directement depuis les outils MCP.
