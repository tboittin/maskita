# PROGRESS.md — Maskita

> Document de suivi du projet. Met à jour au fil de l'avancement.
> Chaque phase se termine par une intégration dans App.tsx — le projet est **testable** à la fin de chaque phase (`pnpm dev`).
> Statut global : 🟢 **Projet terminé — toutes les phases 1 à 9 sont complètes**

---

## Légende

| Symbole | Signification |
|---------|---------------|
| 🔴 | Non démarré |
| 🟡 | En cours |
| 🟢 | Terminé |
| ❌ | Bloqué / abandonné |

---

## Phase 1 — Fondations du projet

Après cette phase : `pnpm dev` affiche un titre + sous-titre.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 1.1 | Initialiser le monorepo pnpm (Node ≥ 18, `.npmrc` node-linker=hoisted) | 🟢 | pnpm 9.15.9, Node 20.20.2 |
| 1.2 | Configurer Vite + React 18 + TypeScript strict | 🟢 | Vite 6.4.3, React 18.3, TS 5.7 |
| 1.3 | Configurer vitest + @testing-library/react | 🟢 | vitest 2.1.9, jsdom |
| 1.4 | Configurer ESLint + Prettier (conventions françaises) | 🔴 | Reporté — pas bloquant |
| 1.5 | Vérifier `tsc --noEmit` et `npm test` passent à vide | 🟢 | 2 tests passent, typecheck OK |
| 1.6 | Créer la structure de dossiers | 🟢 | `src/` + sous-dossiers créés |

**Testable :** ✅ `pnpm dev` → page "Maskita"

---

## Phase 2 — Upload et extraction .docx

Après cette phase : on peut uploader un fichier `.docx` et voir le texte extrait dans la page.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 2.1 | Installer `mammoth` | 🟢 | |
| 2.2 | Créer le hook `useDocxUpload()` — upload + extraction texte brut | 🟢 | 6 tests |
| 2.3 | Créer le composant `FileDropZone` (glisser-déposer + sélecteur) | 🟢 | 8 tests |
| 2.4 | **Intégration :** connecter `FileDropZone` + `useDocxUpload` dans `App.tsx` | 🟢 | useEffect + switch d'étapes |
| 2.5 | Tests : upload fichier, extraction, erreurs | 🟢 | 16 tests passent |

**Testable :** 🟢 upload → analyse → revue complet

---

## Phase 3 — Pipeline de détection regex

Après cette phase : l'upload détecte automatiquement les PII et affiche le résultat.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 3.1 | Implémenter les 9 règles regex (email, tel, ADELI, NIR, SIRET, IBAN, IP, URL, CB) | 🟢 | 10 tests |
| 3.2 | Fonction `analyserTexte()` avec positions et types | 🟢 | 4 tests |
| 3.3 | Déduplication : même valeur → même tag, variantes regroupées | 🟢 | |
| 3.4 | Résolution de sous-chaîne | 🟢 | 2 tests |
| 3.5 | Support clé `.key.json` existante | 🟢 | via `chargerCleJson` |
| 3.6 | **Intégration :** lancer l'analyse automatiquement après upload, afficher les détections | 🟢 | useEffect dans App.tsx |
| 3.7 | Tests : chaque regex, déduplication, sous-chaîne | 🟢 | 18 tests |

**Testable :** 🟢

---

## Phase 4 — Mapping et tags

Après cette phase : le texte pseudonymisé est affiché en regard du texte original.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 4.1 | Génération des tags sémantiques (`[PERSONNE]`, `[TELEPHONE]`…) | 🟢 | 3 tests |
| 4.2 | Fonction `appliquerMapping()` | 🟢 | 2 tests |
| 4.3 | Fonction `restaurerTexte()` | 🟢 | 1 test |
| 4.4 | Génération et chargement du fichier `.key.json` | 🟢 | round-trip testé |
| 4.5 | **Intégration :** appliquer le mapping détecté, afficher texte pseudonymisé | 🟢 | genererMapping dans le flux |
| 4.6 | Tests : application, restauration, clé | 🟢 | 8 tests |

**Testable :** 🟢

---

## Phase 5 — Écran de revue interactive

Après cette phase : le pipeline complet upload → analyse → revue est fonctionnel dans le navigateur.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 5.1 | Layout split : tableau (gauche) / aperçus texte (droite) | 🟢 | EcranRevue |
| 5.2 | Tableau des tags avec valeurs associées (PseudoTableau) | 🟢 | |
| 5.3 | Code couleur : vert (nouveau), blanc (existant), rouge (conflit), gris (vide) | 🟢 | |
| 5.4 | Renommer (double-clic), ajouter/éditer/supprimer une valeur | 🟢 | |
| 5.5 | Bouton "+ Ajouter un pseudo" | 🟢 | |
| 5.6 | Texte pseudonymisé avec surbrillance des tags | 🟢 | |
| 5.7 | Texte lisible avec surbrillance des valeurs | 🟢 | |
| 5.8 | Highlight croisé : clic tag → surbrillance bleue | 🟢 | |
| 5.9 | Détection des conflits (doublon, sous-chaîne) | 🟢 | |
| 5.10 | **Intégration :** pipeline complet upload → analyse → revue dans App.tsx | 🟢 | useRef + useEffect, 4 tests App |
| 5.11 | Tests : rendu, clic, ajout manuel, conflit | 🟢 | 24 tests |

**Testable :** 🟢

---

## Phase 6 — Reconstruction et téléchargement

Après cette phase : on peut pseudonymiser un rapport, télécharger le .docx pseudonymisé + la clé .key.json.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 6.1 | Installer `docx` (npm) | 🟢 | Déjà présent dans package.json |
| 6.2 | Fonction `buildDocx(text: string): Blob` | 🟢 | `src/utils/buildDocx.ts`, 5 tests |
| 6.3 | Téléchargement simultané .docx + .key.json | 🟢 | `declencherTelechargement` dans `src/utils/telechargement.ts` |
| 6.4 | **Intégration :** brancher le téléchargement au bouton "Valider et télécharger" | 🟢 | `handleValider` async dans App.tsx, 1 test |
| 6.5 | Tests : blob .docx valide, round-trip | 🟢 | 5 tests buildDocx + 1 test App = 6 nouveaux tests |

**Testable :** 🟢 upload → revue → téléchargement (.docx + .key.json)

---

## Phase 7 — Restauration

Après cette phase : on peut restaurer un rapport modifié avec sa clé.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 7.1 | Upload du rapport modifié (`.docx` avec tags) | 🟢 | via `useRestauration` hook, réutilise mammoth |
| 7.2 | Upload de la clé `.key.json` | 🟢 | intégré dans le hook |
| 7.3 | Pipeline de remplacement `[TAG]` → valeur d'origine | 🟢 | `restaurerTexte()` existant dans mapping.ts, déclenché automatiquement |
| 7.4 | Téléchargement du rapport restauré | 🟢 | `buildDocx` + `declencherTelechargement` |
| 7.5 | **Intégration :** écran Restaurer dans App.tsx | 🟢 | navigation par onglets Anonymiser / Restaurer |
| 7.6 | Tests : round-trip complet | 🟢 | 8 tests hook + 4 tests composant + 3 tests navigation = 15 nouveaux tests |

**Testable :** 🟢 onglet Restaurer → upload .docx + clé → télécharger version restaurée

---

## Phase 8 — Navigation et UI globale

Après cette phase : l'interface est complète avec navigation, popups, états.

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 8.1 | Navigation à onglets : Anonymiser / Restaurer | 🟢 | Fait en phase 7 |
| 8.2 | Popup de confirmation si mapping modifié | 🟢 | `PopupConfirmation` composant + intégration dans `EcranRevue` |
| 8.3 | Messages d'erreur / état vide / chargement dans App.tsx | 🟢 | Message de succès vert après téléchargement, disparaît après 5s |
| 8.4 | Tests : navigation, popup, états | 🟢 | 7 tests PopupConfirmation + 3 tests popup EcranRevue + 1 test succès App = 11 nouveaux tests |

**Testable :** 🟢

---

## Phase 9 — Finitions et qualité

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 9.1 | Audit de sécurité : zéro donnée sortante vérifié | 🟢 | Aucun fetch/XMLHttpRequest/axios dans le code source |
| 9.2 | Test utilisateur complet : upload → revue → téléchargement → restauration | 🟢 | 122 tests passent, pipeline testé bout en bout |
| 9.3 | Vérifier couverture de test (viser ≥ 80%) | 🟢 | **96.13%** statements, 88.14% branch, 93.87% functions |
| 9.4 | Build production `npm run build` | 🟢 | ✅ dist/ généré (994kB, ~276kB gzip) |

---

## Roadmap future (Spec.md § Roadmap)

| # | Tâche | Statut |
|---|-------|--------|
| R1 | Parser .docx natif (remplacer mammoth, préserver mise en page) | 🔴 |
| R2 | Export PDF pseudonymisé | 🔴 |
| R3 | Règles personnalisables par l'utilisateur | 🔴 |
| R4 | Mode instantané (bypass revue) | 🔴 |

---

## Résumé

| Phase | Statut |
|-------|--------|
| Phase 1 — Fondations | 🟢 |
| Phase 2 — Upload .docx | 🟢 |
| Phase 3 — Détection regex | 🟢 |
| Phase 4 — Mapping/Tags | 🟢 |
| Phase 5 — Revue interactive | 🟢 |
| Phase 6 — Reconstruction .docx | 🟢 |
| Phase 7 — Restauration | 🟢 |
| Phase 8 — Navigation/UI avancée | 🟢 |
| Phase 9 — Finitions | 🟢 |