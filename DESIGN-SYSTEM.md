# DESIGN-SYSTEM.md — Maskita

Design system du projet Maskita : tokens, composants, patterns d'interaction
et règles d'accessibilité. Ce document décrit l'existant (ce qui est déjà en
place dans le code) et fixe les conventions pour la suite.

---

## 1. Principes directeurs

1. **La confidentialité se voit.** Maskita traite tout dans le navigateur, zéro
   donnée sortante. L'interface doit être sobre, lisible, sans chrome inutile :
   elle inspire confiance par sa clarté.
2. **Un seul bouton principal par écran.** À chaque étape, une action primaire
   dominante ("Lancer l'analyse", "Valider et télécharger"). Le reste est
   secondaire ou silencieux.
3. **Densité maîtrisée.** Les rapports sont longs : on privilégie des panneaux
   scrollables (maxHeight) plutôt que des pages interminables, et le texte reste
   lisible (interligne 1.6–1.7).
4. **Interaction directe.** Sélection de texte → actions inline ; glisser-déposer
   partout où c'est naturel ; double-clic pour renommer. Pas de menus cachés.
5. **Toujours un échappatoire.** Toute popup se ferme par le clic sur l'overlay
   (sauf confirmation destructive), par Annuler/Escape, et le bouton principal
   est toujours identifiable.
6. **Français dans l'interface et le code** (projet FR), avec i18n FR/EN complet
   pour les textes utilisateur.

---

## 2. Tokens de design

Les tokens vivent dans `src/index.css` sous `:root`. Ils portent des noms
français. **Aucune couleur, aucun espacement en dur dans les composants** :
toujours passer par les variables.

### 2.1 Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `--couleur-primaire` | `#4f46e5` (indigo) | Actions principales, liens, focus, onglet actif, drag-over fichier |
| `--couleur-secondaire` | `#6366f1` | Variante interactive plus claire (à réserver) |
| `--couleur-fond` | `#f8fafc` | Fond de page |
| `--couleur-surface` | `#ffffff` | Cartes, panneaux, tableaux, zones de texte |
| `--couleur-texte` | `#1e293b` (slate-800) | Texte principal |
| `--couleur-texte-secondaire` | `#64748b` (slate-500) | Sous-texte, libellés, boutons secondaires |
| `--couleur-bordure` | `#e2e8f0` (slate-200) | Bordures, séparateurs, boutons outline |
| `--couleur-succes` | `#22c55e` (green-500) | Tags nouveaux, succès |
| `--couleur-erreur` | `#ef4444` (red-500) | Erreurs, conflits, actions destructives |
| `--couleur-avertissement` | `#f59e0b` (amber-500) | Avertissements (réservé) |

**Règles :**
- Contraste AA vérifié : `--couleur-texte` et `--couleur-texte-secondaire` sur fond
  blanc passent 4.5:1. Ne pas utiliser `--couleur-texte-secondaire` sous 0.75rem.
- Les surbrillances utilisent des **variantes translucides** des couleurs, pas de
  nouveaux tokens :
  - tag actif : `rgba(79, 70, 229, 0.12)` (primaire)
  - valeur spécifique : `rgba(79, 70, 229, 0.35)`
  - autre tag : `rgba(34, 197, 94, 0.10)` (succès)
  - ligne de tableau active : `rgba(79, 70, 229, 0.08)`
  - drag-over de valeur : `rgba(34, 197, 94, 0.08)`
- Message de succès : fond `#f0fdf4`, texte `#166534`, bordure `--couleur-succes`.

### 2.2 Typographie

- `--police-principale: 'Inter', system-ui, -apple-system, sans-serif` — tout l'UI.
- `--police-mono: 'JetBrains Mono', 'Fira Code', monospace` — **uniquement** pour
  les tags (`[EMAIL]`, `[PERSONNE]`) et les valeurs de mapping.
- Taille de base : 16px (`html { font-size: 16px }`).
- Interligne : 1.6 (corps global), 1.7 (aperçus de texte).

| Usage | Taille | Poids |
|---|---|---|
| Titre de page (h1) | 1.75rem | 700 |
| Titre de popup | 1.125rem | 600 |
| Titre de tableau / picker | 1rem | 600 |
| Bouton principal, "Lancer l'analyse" | 1rem | 600 |
| Onglets | 0.9375rem | 400 / 600 (actif) |
| Corps UI, tableaux, aperçus | 0.875rem | 400 |
| Footer, badge GitHub | 0.8125rem | 400 |
| Erreurs, tooltips, boutons flottants | 0.75–0.78rem | 500 / 600 |

### 2.3 Espacements

Échelle de 4px, toujours via les tokens :

| Token | Valeur | Usage typique |
|---|---|---|
| `--espacement-xs` | 4px | Gaps serrés (icônes), paddings de boutons mini |
| `--espacement-sm` | 8px | Padding boutons, gaps d'onglets, marges sous titres |
| `--espacement-md` | 16px | Gap entre sections/cartes, padding panneaux |
| `--espacement-lg` | 24px | Padding page (maxWidth 1200px), padding popups |
| `--espacement-xl` | 32px | Zone de dépôt (FileDropZone) |

### 2.4 Rayons et ombres

- `--rayon-bordure: 8px` — défaut (boutons, cartes, inputs, popups).
- `4px` — inputs compacts et boutons inline du tableau.
- Ombres :
  - popup modale : `0 8px 32px rgba(0,0,0,0.15)`
  - boutons flottants sur aperçu : `0 2px 6px rgba(0,0,0,0.15)`
  - pas d'ombre sur les cartes statiques (flat design).

### 2.5 Z-index

| Valeur | Usage |
|---|---|
| 10 | Boutons flottants superposés aux aperçus |
| 1000 | Overlays modaux (popup, picker, suppression) |

### 2.6 Transitions et durées

- `0.15s ease` — hover, couleurs, bordures, onglets.
- `0.2s ease` — zones de drag & drop (fond + bordure).
- `smooth` pour les défilements déclenchés (scrollIntoView).
- Message de succès : affiché 5 s puis disparaît.

---

## 3. Layout

- **Conteneur principal** : `max-width: 1200px`, centré, `padding: var(--espacement-lg)`,
  colonne flex, gap `--espacement-lg`. La page scrolle verticalement.
- **Header** : centré. Le toggle de langue est en **position absolute top-right**
  (le header reste centré mais les actions utiles sont aux coins).
- **Navigation** : barre d'onglets avec `border-bottom: 2px` — primaire si actif,
  transparent sinon ; `nowrap` + `overflow-x: auto` (mobile).
- **Écran de revue (split)** : grille `grid-template-columns: 1fr 1fr` avec gap md.
  - Gauche : tableau des pseudos (maxHeight 500px, scroll Y interne).
  - Droite : deux aperçus empilés (chacun maxHeight 200px, scroll Y interne).
  - Barre d'outils sous les volets : checkboxes (scroll sync, recentrer) à gauche,
    bouton "Valider et télécharger" à droite.
- **Breakpoints** : la grille 2 colonnes doit passer à 1 colonne sous ~900px
  (recommandation à implémenter — aujourd'hui les volets se compressent).

---

## 4. Composants

### 4.1 Boutons

| Variante | Style |
|---|---|
| **Primaire** | fond `--couleur-primaire`, texte blanc, rayon 8, padding `sm lg`, weight 600 |
| **Secondaire / outline** | fond none, bordure 1px `--couleur-bordure`, texte secondaire, rayon 8 |
| **Ghost (lien)** | fond none, bordure none, texte secondaire (ex. "Mentions légales") |
| **Danger / destructif** | fond `--couleur-erreur`, texte blanc (ex. "Vider" dans la popup) |
| **Inline / mini** | 0.8rem, padding 4px 8–12px, pour les actions du tableau |

**États requis :**
- `hover` : assombrir légèrement le fond (`filter: brightness(0.95)` ou une
  variante plus sombre — à définir une fois, centralisée).
- `focus-visible` : anneau `2px solid var(--couleur-primaire)` + offset 2px
  (à généraliser — aujourd'hui incohérent).
- `disabled` : opacité 0.5, curseur `not-allowed`.

### 4.2 FileDropZone

Zone cliquable entière (label + input file caché `data-testid="input-fichier"`).

| État | Bordure (2px dashed) | Fond |
|---|---|---|
| Normal | `--couleur-bordure` | `--couleur-surface` |
| Drag-over | `--couleur-primaire` | `rgba(79,70,229,0.05)` |
| Erreur | `--couleur-erreur` | — |
| Chargement | — | — (texte primaire "Extraction en cours…") |

Libellés : titre en weight 600, sous-texte en 0.875rem secondaire.
`aria-label` descriptif (localisé).

### 4.3 PseudoTableau

- Titre : "Pseudos (N)" en 1rem/600.
- En-têtes : **Tag** / **Valeurs** (0.875rem/600), séparés par bordure basse.
- **Code couleur des tags** (le tag lui-même, pas la ligne) :
  - vert `--couleur-succes` → nouveau tag (détecté à l'analyse)
  - texte normal → tag existant (clé importée)
  - gris secondaire → tag vide
  - rouge / ⚠ sous le tag → conflit (message détaillé en 0.75rem)
- Valeurs : liste à puces, draggable (grabbing), bouton ✕ rouge (title localisé),
  bouton ➕ d'ajout inline ; input d'ajout "Nouvelle valeur…" (0.8rem).
- Ajout manuel : bouton "+ Ajouter un pseudo" (bordure dashed, texte primaire) →
  deux inputs (Type / Valeur) + boutons Ajouter / Annuler.
- Interactions : clic ligne → surbrillance tag ; double-clic tag → édition
  (input mono, Enter valide, Escape annule) ; drag & drop valeur entre tags ou
  pour réordonner.

### 4.4 TexteApercu

- Carte `--couleur-surface`, bordure, rayon 8, padding md, `maxHeight: 200px`,
  scroll Y, `white-space: pre-wrap`.
- Tags en `--police-mono`.
- Surbrillances (voir 2.1) : tag cliqué = bleu ; valeur ciblée = bleu foncé ;
  autre tag = vert translucide. Transition 0.15s.
- Sélection de texte → `onMouseUp` → les boutons flottants "Nouveau tag" /
  "Nouvelle valeur" apparaissent en haut à droite du panneau (z-index 10).

### 4.5 Popups modales (PopupConfirmation, picker, suppression)

Structure commune :
- Overlay `rgba(0,0,0,0.4)` en `position: fixed; inset: 0`, z-index 1000,
  centrage flex. **Clic sur l'overlay = annuler** ; la carte stoppe la propagation.
- Carte : blanc, rayon 8, padding lg, ombre `0 8px 32px rgba(0,0,0,0.15)`,
  `max-width: 400–600px`, `width: 90%`, `max-height: 70vh` + scroll si besoin.
- Titre 1.125rem/600, message 0.9375rem secondaire interligne 1.6, boutons alignés
  à droite (Annuler outline + Confirmer primaire ; Confirmer danger si destructif).
- Accessibilité : `role="dialog"`, `aria-modal="true"`, `aria-label` = titre.

### 4.6 CheckboxInput (barre d'outils revue)

Label inline (0.875rem secondaire) avec checkbox native ; cliquable dans son
ensemble (`user-select: none`). État persistant pendant la session.

### 4.7 Header, badge GitHub, footer

- Header : h1 Maskita 1.75rem/700, sous-titre secondaire, badge GitHub en dessous
  (pill border, icône SVG 16px, texte "Open source — GitHub", hover → primaire).
- Footer : bordure haute, texte secondaire 0.8125rem, bouton "Mentions légales".

---

## 5. Patterns d'interaction

| Pattern | Comportement |
|---|---|
| Glisser-déposer fichier | Drop sur la zone → extraction immédiate ; changement possible ensuite |
| Drag & drop valeurs | Réordonner dans un tag / déplacer vers un autre tag (drop ciblé, fond vert) |
| Sélection de texte | Sélection dans l'aperçu → actions flottantes contextuelles |
| Highlight croisé | Clic tag → surbrillance bleue dans les 2 aperçus + scroll du tableau (smooth, centré) |
| Scroll synchronisé | Checkbox activée par défaut ; les 2 aperçus défilent en ratio |
| Recentrage auto | Clic valeur → scroll du texte vers l'occurrence (checkbox) |
| Double-clic | Renommer un tag |
| Escape | Ferme les popups / annule les éditions inline |
| Clic hors zone | Ferme popup, picker, sélection courante |
| Détection de conflits | Même valeur dans 2 tags, sous-chaînes → ⚠ rouge, blocage au download (popup) |

---

## 6. États globaux et retour utilisateur

- **Chargement extraction** : texte primaire "Extraction en cours…" + invite.
- **Succès téléchargement** : bandeau vert centré (fond `#f0fdf4`, texte `#166534`,
  bordure succes), `role="status"`, disparaît après 5 s.
- **Erreurs de fichier** : `role="alert"`, texte erreur sous la zone.
- **Avertissement nom de fichier** : popup avec valeurs suspectes listées, conseil,
  bouton "Télécharger quand même" (dangereux) + "Annuler".

---

## 7. Accessibilité

- `<html lang>` synchronisé avec la langue active ; `document.title` fixé.
- `aria-label` sur les zones de drop ; `role="alert"` sur les erreurs ;
  `role="status"` sur les succès ; `role="dialog"` + `aria-modal` sur les popups.
- Cibles tactiles : boutons mini du tableau ≥ 28px, boutons principaux ≥ 36px.
- Navigation clavier : focus visible à généraliser (anneau primaire), Escape
  gère les popups/éditions.
- Le texte ne doit jamais être la seule information : les icônes (✕, 🗑, ➕) ont
  toutes un `title` localisé.
- **Contraste** : ne pas écrire de texte secondaire sur fond primaire, ni de
  texte blanc sur `--couleur-avertissement`.

---

## 8. i18n

- Tous les textes utilisateur passent par `t('cle')` (dictionnaires `fr.ts` /
  `en.ts`) — aucun texte en dur dans les composants.
- Les libellés qui incluent une valeur utilisent des fonctions de traduction
  (`'tableau.titre': (n) => ...`).
- Les `title`, `aria-label`, placeholders et messages de popup sont localisés.
- **Longueurs** : prévoir des libellés EN plus courts mais complets ; ne pas
  casser la mise en page (badges, boutons `white-space: nowrap` si besoin).
- Langue persistée en `localStorage` (`maskita-langue`), défaut = détection
  navigateur puis français.

---

## 9. Recommandations d'évolution (à faire lorsque pertinent)

1. **Centraliser les styles inline récurrents** : les boutons (4 variantes),
   les popups et les inputs sont dupliqués entre `EcranRevue`, `PseudoTableau`,
   `FileDropZone`, `FooterLegal`. Extraire des composants `Bouton`, `Modal`,
   `Input` ou des classes utilitaires CSS — sans changer le rendu actuel.
2. **Définir les états manquants** : hover des boutons primaires, `focus-visible`
   global, `disabled` — aujourd'hui incohérents entre composants.
3. **Responsive** : la grille 2 colonnes de l'écran de revue doit passer à 1
   colonne sous ~900px ; vérifier les panneaux à 200/500px sur mobile.
4. **Mode sombre** : les tokens sont déjà en variables CSS ; ajouter
   `data-theme="dark"` et redéfinir les tokens suffira.
5. **Accessibilité** : audit `focus-visible` et navigation clavier des popups
   (focus trap) quand le temps le permet.

---

## 10. Vérification

Toute évolution du design system doit respecter :

```bash
pnpm test        # toute la suite (148 tests)
pnpm typecheck   # tsc --noEmit
```

Et les règles du projet : français, plan avant implémentation, zéro donnée
sortante, tests pour chaque nouveau composant.