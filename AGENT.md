# AGENT.md — Maskita

Instructions pour l'agent travaillant sur ce projet.

## Contexte

Maskita est un outil de pseudonymisation de rapports de psychologue (.docx)
**100% dans le navigateur**. Aucun serveur, aucune donnée sortante.

Voir `Spec.md` pour l'architecture complète, `Readme.md` pour la présentation.

## Règles de travail

1. **Français uniquement** — tout le code, les commentaires, les messages utilisateur
   et les échanges avec l'agent sont en français.
2. **Toujours présenter un plan avant d'implémenter.** L'utilisateur dit
   explicitement "oui" avant la première ligne de code. Ne jamais coder
   sans accord préalable.
3. **Préférer les questions ciblées sur l'intention** quand l'utilisateur
   propose une idée conceptuelle ("je pensais à", "est-ce que ça vaudrait le coup").
   Ne pas partir dans une implémentation complète sans avoir validé le design.
4. **Action directe** — si l'outil permet de lire/écrire/exécuter, le faire.
   Ne pas décrire ce qu'on ferait, ne pas dire "tu devrais run X".
5. **Ne pas persister les données utilisateur** — pas de fichiers temporaires
   sur le serveur, pas de base de données. Tout en mémoire, tout est téléchargé
   explicitement par l'utilisateur.
6. **Sécurité avant tout** — Maskita est conçu pour que zéro donnée ne quitte
   la machine. Aucune décision d'architecture ne doit compromettre ce principe.

## Conventions

- **Langue** : français (noms de fonctions, commentaires, variables, messages)
- **Types** : TypeScript strict, interfaces plutôt que types
- **Tests** : vitest, chaque fonction exportée a son fichier de test dédié.
  Les tests importent les vraies fonctions (pas de copie du code métier).
- **Monorepo** : pnpm avec `node-linker=hoisted` (`.npmrc`)
- **Commits** : messages en français, préfixés par type (`feat:`, `fix:`, `docs:`)
- **Composants** : React fonctionnel, hooks, pas de classes

## Qualité

- couverture de test maximale. Chaque composant, fonction utilitaire doit avoir des tests unitaires associés
- `npm test` doit passer avant chaque commit
- `tsc --noEmit` doit passer avant chaque commit
- Les bugs signalés par l'utilisateur sont prioritaires sur les nouvelles
  fonctionnalités

## Décisions déjà prises

- Pas de LLM, pas de NER spaCy, pas de serveur Python
- Détection uniquement par regex (email, téléphone, NIR, ADELI, IBAN, SIRET, URL, IP)
- Les noms, adresses, professions sont ajoutés manuellement par l'utilisateur
- Fichier de mapping non chiffré (`.key.json`), utilisateur seul garant
- Une table de mapping par patient, pas de persistance
- mammoth pour l'extraction .docx, docx (npm) pour la reconstruction
- Interface split : tableau des pseudos (gauche) / aperçus texte (droite)
- Fabriquer un plan, demander, puis coder