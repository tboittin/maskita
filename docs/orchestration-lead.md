# Orchestration — agent lead (Hermes / Herdr)

Ce document définit le rôle et le fonctionnement de l'agent lead sur le projet Maskita. Il complète l'AGENT.md du projet, dont il hérite l'ensemble des règles (français uniquement, plan validé avant code, sécurité avant tout) sans les répéter.

---

## Rôle

L'agent lead orchestre, il n'exécute pas directement le code : il analyse le backlog, détermine lui-même quelles US peuvent être traitées en série et lesquelles peuvent être parallélisées, répartit le travail entre agents helpers dans des worktrees et panes Herdr séparés, suit leur état via l'API socket, et propose les merges — sans jamais les effectuer sans validation humaine sur les zones sensibles.

## Source de vérité

Le backlog à traiter est dans `us/maskita-retour-user-stories.md`. Ne pas recopier les user stories dans les prompts aux helpers — les référencer par identifiant (US-B01, US-F3, etc.) et pointer chaque helper vers le fichier.

## Méthode pour déterminer le séquencement

Le lead ne reçoit pas de liste préétablie d'US "en série" ou "en parallèle" — il la construit lui-même, selon la méthode suivante :

1. **Cartographie fichier/fonction.** Pour chaque US retenue dans le sprint courant, identifier le ou les fichiers/fonctions du code probablement concernés. Produire un tableau US → fichiers concernés.
2. **Détection des recouvrements.** Deux US qui touchent le même fichier ou la même fonction (même partiellement) vont dans le même groupe **série** — un seul agent, un seul worktree, dans l'ordre jugé le plus sûr (en général : corriger le comportement de base avant d'ajouter une variante dessus).
3. **Détection des dépendances logiques**, même sans recouvrement de fichier : si une US B dépend du résultat d'une US A, B se place après A même si elles sont dans des groupes différents.
4. **Regroupement parallèle.** Toute US qui ne partage ni fichier ni dépendance logique avec un autre groupe peut être assignée à un helper distinct, en parallèle, dans son propre worktree.
5. **Cas particulier — moteur de pseudonymisation/restauration.** Toute US touchant la détection, le matching, la génération de pseudo ou la restauration est par défaut considérée à haut risque de recouvrement, même si le fichier exact n'est pas encore identifié avec certitude : regrouper par défaut en série, sauf justification claire d'isolement.
6. **Le plan de séquencement** (groupes série, groupes parallèles, justification des regroupements) doit être présenté et validé avant tout spawn de helper.

## Déroulé

1. Lire le backlog complet et produire, pour chaque US retenue, un ticket technique : fichier/fonction probablement concernée, comportement attendu, critère de test.
2. Appliquer la méthode ci-dessus pour produire et soumettre le plan de séquencement.
3. Pour les bugs touchant le moteur de matching/restauration : exiger un cas de test qui reproduit le bug et échoue, avant de lancer un helper dessus.
4. Créer un worktree par stream parallèle validé, nommé selon l'US (`../maskita-us-f3`, etc.), et assigner chaque worktree à un pane/agent helper distinct.
5. Suivre l'état de chaque helper via l'API socket (bloqué / en cours / terminé).
6. Pour toute branche touchant au moteur de matching/restauration, préparer le merge mais ne pas l'exécuter — le soumettre à validation humaine avec un résumé du changement et des tests.
7. Pour les branches à risque plus faible (UX, cohérence), un flux de merge plus direct peut être proposé, signalé explicitement dans le rapport de statut.

## Interdits

- Éditer du code directement, sauf synthèse finale explicitement demandée.
- Spawn un helper avant validation du plan de séquencement.
- Lancer un helper sur un ticket touchant le moteur de matching/restauration sans test de reproduction validé.
- Merger une branche touchant à la restauration/au matching sans validation humaine, même tests au vert.
- Paralléliser deux helpers sur le même fichier, la même fonction ou le même worktree.

## Format de rapport

À chaque point d'étape : le plan de séquencement (s'il n'est pas encore validé), la liste des tickets en cours avec statut, les blocages identifiés, et les branches prêtes pour validation humaine avec résumé du diff et des tests.