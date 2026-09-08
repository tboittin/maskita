# DESIGN-SYSTEM.md — Maskita

Design system **idéal** du projet Maskita.

Ce document ne décrit pas l'existant : il exprime la **vision** — l'identité
visuelle, les tokens, les composants et les comportements que Maskita mérite,
en cohérence avec sa philosophie. L'état actuel du code est mentionné en
"écart à combler" quand nécessaire, jamais comme contrainte.

---

## 1. Manifeste — la philosophie devient design

Maskita est un outil de pseudonymisation **100 % navigateur** : zéro serveur,
zéro donnée sortante, zéro trace. Il manipule des documents sensibles (rapports
de psychologie, données de santé) et rend leur traitement par des LLM sûr.

Mais Maskita n'est pas un bunker ni un cabinet : c'est un **service rendu avec
soin**. L'utilisateur fait déjà une chose stressante (préparer des données
sensibles pour un LLM) — l'outil doit le **détendre**, pas l'impressionner.

Le design system découle de cette identité :

| La philosophie dit… | …donc le design fait |
|---|---|
| "Aucune donnée ne quitte la machine" | Une interface **calme et fermée** : tout reste dans des panneaux nets, rien ne déborde, rien ne "part" |
| "La confidentialité d'abord" | Le **voile** comme métaphore douce : les données sensibles sont recouvertes d'un voile léger (`[PERSONNE]`), jamais exposées par le design |
| "L'utilisateur est seul garant" | **Transparence tranquille** : chaque action est visible, expliquée, réversible. Pas de jargon, des phrases courtes |
| "Outil de confiance" | Une esthétique **sobre et douce**, qui rassure par sa simplicité : peu de couleurs, beaucoup d'air, zéro effet inutile |
| "Simple : un npm install suffit" | **Zéro friction cognitive** : un chemin principal, des actions contextuelles, le moins de texte possible |
| "Les noms, adresses sont ajoutés à la main" | L'interface **récompense le travail humain** : la revue est agréable, calme, sans stress |

**Le ton :** celui d'un **collègue de confiance** — compétent, discret,
bienveillant. Pas d'emphase, pas de solennité, pas de clinique. On dit les
choses simplement, avec un sourire léger quand c'est utile.

---

## 2. Direction artistique — "Le Voile léger"

### 2.1 Concept

Le mot *maskita* (masque) reste l'idée directrice, mais interprétée en douceur :
un masque **léger**, pas une armure. Trois gestes visuels :

1. **Le voile** — les données pseudonymisées sont *derrière un voile* :
   surbrillance douce et translucide, jamais opaque. Le voile se pose et se
   retire sans effort.
2. **L'empreinte** — valider, c'est laisser une empreinte légère (un ✓ discret),
   pas sceller un document au fer. La confirmation est douce et positive.
3. **Le fil** — le parcours s'écrit comme un fil continu et apaisant :
   étapes discrètes, transitions fluides, tout est *cousu* d'un bout à l'autre.

### 2.2 Palette idéale

Trois familles, chacune avec un rôle. **Des teintes adoucies, jamais criardes :**

| Famille | Rôle | Couleurs |
|---|---|---|
| **Brume** (neutres) | Structure, texte, surfaces. Des gris chauds, pas froids | Stone : `#1c1917`, `#44403c`, `#78716c`, `#e7e5e4`, `#f5f5f4`, blanc |
| **Action** (primaire) | Actions principales, focus, liens. Un indigo **doux**, légèrement désaturé | Indigo doux : `#5b5bd6` (primaire), `#6d6de0` (hover), `#eef1ff` (fond sélection) |
| **Signal** (statuts) | Uniquement pour l'état des données, en version **pastel** | vert `#3f9142` (nouveau / sûr), rouge `#c4453c` (conflit / danger), ambre `#b47a2f` (attention) |

**Règle d'or : la couleur ne décore pas, elle informe.** Un élément n'est coloré
que s'il porte une information (état du tag, action primaire, erreur). Tout le
reste reste en brume — c'est ce qui rend l'interface *rassurante* : le calme
est la norme, la couleur est l'exception.

### 2.3 Typographie idéale

Le texte EST le produit (on manipule des rapports). La typographie doit être
**chaleureuse et confortable** :

- **Lecture** : une serif douce et ronde — *Source Serif 4* ou *Lora* — pour
  les aperçus de documents. Le rapport garde son caractère de document, mais
  la lecture reste agréable, jamais intimidante.
- **UI** : *Inter* (ou *Geist*) en graisses 400/500/600, tailles sereines
  (pas de gros titres martiaux).
- **Données** : *JetBrains Mono* / *IBM Plex Mono* pour les tags `[PERSONNE]`
  et les valeurs de mapping. Le mono = "ceci est une donnée protégée".
- Échelle douce (1.2) : 16 / 19 / 23 / 28px…, interligne **1.7** (aéré),
  mesure de texte 60–70 caractères.

### 2.4 Espace, géométrie

- Grille **4px** ; marges de page 24–32px ; conteneur 1100px (la lecture prime).
- **Rayons généreux** : 8px (contrôles), 14px (panneaux), 20px (modales) —
  des angles doux, rien d'agressif.
- **Ombres très légères et diffuses** : `0 1px 3px rgba(0,0,0,0.06)` pour les
  panneaux, `0 8px 24px rgba(0,0,0,0.08)` pour les modales. La donnée semble
  posée sur la table, pas suspendue.

---

## 3. Principes de design (checklist de toute décision)

1. **Une action principale par écran.** Tout le reste est secondaire ou invisible.
2. **Jamais de données affichées par accident.** Le nom du fichier suspect est
   signalé calmement (voile qui se trouble + message clair), pas avec une
   alarme rouge.
3. **Le pipeline est visible, mais discret.** Trois étapes (Déposer → Vérifier →
   Récupérer) affichées en petits jalons. L'utilisateur sait où il en est, sans
   pression.
4. **Tout est réversible.** Annuler, Escape, clic hors zone. Les actions
   destructives demandent une confirmation claire et explicite — sans
   cérémonie inutile ni friction excessive.
5. **Le détail fait la confiance.** Micro-interactions propres, focus visibles,
   états cohérents : c'est la régularité qui rassure.
6. **Performance = respect.** Le bundle doit rester léger (l'app est déjà
   ~276 kB gzip) : chaque ajout visuel se paie en octets, on choisit en
   connaissance de cause.
7. **Les erreurs sont des invitations, pas des punitions.** Chaque message
   dit quoi faire, en une phrase, sur un ton neutre.

---

## 4. Tokens idéaux

```css
:root {
  /* Couleurs — brume (gris chauds) */
  --brume-900: #1c1917;
  --brume-700: #44403c;
  --brume-500: #78716c;
  --brume-300: #d6d3d1;
  --brume-200: #e7e5e4;
  --brume-100: #f5f5f4;
  --brume-50:  #fafaf9;

  /* Couleurs — action (indigo doux) */
  --action-600: #5b5bd6;   /* primaire */
  --action-500: #6d6de0;   /* hover */
  --action-100: #eef1ff;   /* fond sélection */

  /* Couleurs — signal (pastels) */
  --signal-succes: #3f9142;
  --signal-erreur: #c4453c;
  --signal-attention: #b47a2f;
  --signal-info: #4a72b8;

  /* Typographie */
  --police-ui: 'Inter', system-ui, sans-serif;
  --police-lecture: 'Source Serif 4', 'Lora', Georgia, serif;
  --police-donnees: 'JetBrains Mono', monospace;

  /* Espace 4px */
  --espace-1: 4px; --espace-2: 8px; --espace-3: 12px;
  --espace-4: 16px; --espace-6: 24px; --espace-8: 32px;

  /* Géométrie douce */
  --rayon-controle: 8px;
  --rayon-panneau: 14px;
  --rayon-modale: 20px;

  /* Ombres légères */
  --ombre-posee: 0 1px 3px rgba(0, 0, 0, 0.06);
  --ombre-elevee: 0 8px 24px rgba(0, 0, 0, 0.08);

  /* Motion */
  --duree-rapide: 150ms;
  --duree-base: 250ms;
  --courbe: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

(les tokens actuels `--couleur-*` sont conservés comme alias dépréciés durant
la migration, puis supprimés.)

---

## 5. Layout

- **Jalons discrets** : trois petites étapes en haut de la zone de travail —
  `Déposer` → `Vérifier` → `Récupérer`. Passées = cliquables (retour en
  arrière), active = légèrement marquée. Aucune emphase, juste un fil.
- **Écran de revue (le cœur)** :
  - Tableau des pseudos à gauche (colonne 320–380px), aperçus à droite,
    grille 1fr / 1.6fr — le texte a faim de place.
  - Les deux aperçus **côte à côte sur desktop** (pseudonymisé / lisible) :
    la comparaison est le geste principal. Sur mobile, bascule par onglets
    "Masqué / Lisible".
  - La barre "Valider et télécharger" reste en bas, toujours visible, mais
    calme (pas de gros bloc qui domine).
- **Responsive** : passage 1 colonne sous 900px, actions regroupées en
  bottom-bar fixe.
- **Header** : titre centré, badge GitHub + toggle langue alignés à droite sur
  une même ligne (plus de chevauchement absolu).

---

## 6. Composants idéaux

### 6.1 Boutons
- **Primaire** : fond action-600, texte blanc, rayon 8, hauteur 40px, poids 500.
  Libellés simples ("Lancer l'analyse", "Valider et télécharger").
- **Secondaire** : fond brume-100, bordure brume-200, texte brume-700.
- **Ghost** : texte brume-500, hover brume-900.
- **Danger** : fond signal-erreur, uniquement dans les modales.
- États : hover = action-500 ; `focus-visible` = anneau 2px action-500 offset
  2px **partout** ; disabled = opacité .45 avec message *pourquoi* quand c'est
  un blocage métier (ex. "chargez d'abord un fichier").

### 6.2 FileDropZone
Une **invitation accueillante**, pas un portique :
- Zone en pointillés doux (3px), angles 14px, icône simple, texte :
  "Déposez votre rapport ici" + sous-texte "tout reste sur votre machine".
- Au survol/drag : la zone se teinte doucement (action-100), bordure continue.
- **Un fichier déposé = une petite carte** (nom, taille, type, et une évaluation
  discrète du nom de fichier : ✓ ou "à renommer").
- L'état "extraction" montre un voile léger qui pulse très doucement.

### 6.3 PseudoTableau
- En-têtes sticky dans le panneau scrollable.
- Ligne de tag : tag mono + **petite pastille ronde** d'état (vert = nouveau,
  blanc = existant, rouge ⚠ = conflit, gris = vide). L'état se lit d'un coup
  d'œil, sans cri.
- Conflit : le message s'affiche sous le tag, en rouge doux, avec un lien
  "voir" qui sync-scrolle les aperçus. Pas d'alarme.
- Ajout manuel : petit formulaire dans un popover ancré au bouton
  "+ Ajouter un pseudo" (pas d'expansion qui pousse le tableau).
- Drag & drop conservé, avec zone de drop qui s'élargit doucement.

### 6.4 TexteApercu
- Police de lecture (serif) dans les deux aperçus.
- Toolbar flottante (Nouveau tag / Nouvelle valeur) en **fond blanc translucide**
  (blur léger) — les actions n'écrasent jamais le texte.
- Surbrillances en voile doux : tag actif = fond action-100 + bordure gauche
  2px action ; valeur ciblée = fond action-100 + contour léger ; autre tag =
  fond vert 8%. Jamais de surbrillance opaque.

### 6.5 Modales
- Angles 20px, ombre diffuse, `max-width: 480px`, beaucoup d'air intérieur.
- **Confirmation destructive simple et claire** : le message dit exactement ce
  qui va se passer ("Les valeurs de [EMAIL] seront retirées du tag"),
  boutons "Annuler" / "Retirer" bien séparés. Pas de saisie obligatoire —
  la clarté suffit à la réflexion.
- Focus trap + retour focus à l'élément déclencheur.

### 6.6 Jalons & états
- Composant `Jalons` (3 étapes) discret, style fil.
- Succès : un **petit ✓ vert** + message, animé en douceur (fondu), disparaît
  à 5 s ou au clic.
- Erreur : fond blanc, bordure rouge douce, icône, une phrase claire
  ("Ce format n'est pas pris en charge. Utilisez .docx, .txt ou .md.").

### 6.7 Badge GitHub / confiance
- Le badge actuel devient une **petite carte de confiance** discrète :
  "Open source — MIT — zéro collecte de données", trois puces, zéro emphase.
  Toujours visible, jamais criarde : la confiance se montre par la constance,
  pas par la taille.

---

## 7. Icônes

- Jeu d'icônes **ligne fine 1.5px** (Lucide), remplaçant les emojis actuels :
  - Anonymiser = **voile/masque doux** ; Restaurer = **voile relevé / clé** ;
  - Télécharger = flèche posée ; Valider = ✓ léger ;
  - Confiance = bouclier discret avec ✓.
- Les icônes sont des gestes, pas des illustrations. Toujours accompagnées
  d'un `title`/`aria-label` localisé.

---

## 8. Motion

| Usage | Animation | Durée / courbe |
|---|---|---|
| Apparition de tag / valeur | fondu doux + 3px vers le bas | 150ms |
| Surbrillance croisée | fondu de fond | 150ms |
| Conflit détecté | léger fondu rouge (pas de tremblement) | 250ms |
| Validation | ✓ qui apparaît en fondu + léger scale | 250ms |
| Drag over zone | bordure + teinte en fondu | 250ms |
| Changement d'étape | fondu + translation 6px | 250ms, `--courbe` |

**Règle :** chaque animation a un sens (état, confirmation, attention).
Pas d'animation décorative ; `prefers-reduced-motion` désactive tout sauf les
fondu d'état. Le calme est la signature : rien ne saute, tout glisse.

---

## 9. Accessibilité (non négociable)

- Contraste AA minimum ; le signal d'état n'est **jamais** la couleur seule
  (pastille + texte/icône).
- Focus visible partout, focus trap dans les modales, retour focus.
- Le texte pseudo/lisible est navigable au clavier ; les tags sont des
  `button` (Enter/Space).
- Zone de drop : `role="button"`, drag & drop **et** sélecteur natif.
- Les emojis disparaissent de l'UI → les `title`/`aria-label` portent le sens.
- Taille cible tactile ≥ 40px sur mobile, ≥ 24px desktop pour les mini-boutons.

---

## 10. i18n — la langue fait partie du design

- Les textes courts sont conçus **pour les deux langues dès l'écriture**
  (limite de caractères par jalon).
- Les messages de sécurité utilisent un vocabulaire cohérent et doux :
  "voile", "récupérer", "clef" — traduit, pas transposé.
- Les jalons, tooltips et `aria-label` sont localisés comme le corps de l'UI.
- Le ton des messages est le même en FR et EN : simple, neutre, bienveillant.

---

## 11. Marque et confiance

- **Couleur comportementale** : l'interface ne devient "verte" que quand les
  données sont sûres (aucun nom suspect, aucun conflit) — le vert est une
  récompense discrète, pas un décor.
- **Transparence tranquille** : un petit espace "Comment ça marche" (3 lignes :
  tout est local, aucune donnée sortante, pas de compte) accessible depuis le
  footer — le design system prévoit l'emplacement.
- **Erreurs bienveillantes** : chaque erreur explique *pourquoi* et *quoi
  faire*, en une phrase ("Ce fichier contient un nom suspect dans son titre.
  Renommez-le puis redéposez").
- Le badge open source est un engagement visuel : présent en permanence,
  discret mais jamais oublié.

---

## 12. Migration depuis l'existant (progressive, sans refonte)

L'ordre recommandé, chaque étape livrée et testée :

1. **Tokens** : introduire les nouvelles variables en alias des existantes,
   zéro changement visuel. (1 commit)
2. **Typographie de lecture** : passer les deux aperçus en serif douce —
   l'effet est immédiat. (1 commit + tests)
3. **Boutons** : extraire le composant `Bouton` (4 variantes) et remplacer les
   usages dupliqués. (1 commit)
4. **Jalons** : ajouter "Déposer → Vérifier → Récupérer" en discret. (1 commit)
5. **FileDropZone** : carte de prévisualisation + évaluation du nom. (1 commit)
6. **Pastilles de statut** dans le tableau (remplace la couleur de texte seule). (1 commit)
7. **Modales** : focus trap + messages clairs et doux. (1 commit)
8. **Icônes Lucide** en remplacement des emojis. (1-2 commits)
9. **Carte de confiance** (badge GitHub enrichi). (1 commit)
10. Nettoyage des alias de tokens et suppression des styles morts. (1 commit)

Chaque étape : `pnpm test` + `pnpm typecheck` + commit `feat:`/`refactor:`/`style:`
en français. La couverture reste ≥ 90 % — le design ne se paie pas sur les tests.

---

## 13. Vérification du design system

- **Tests** : chaque nouveau composant (Bouton, Jalons, Modal, pastilles) a
  son fichier de test ; les tests d'accessibilité (rôles, aria) font partie
  des critères d'acceptation.
- **Typecheck** strict avant chaque commit.
- **Audit manuel** avant release : parcours complet déposer → vérifier →
  récupérer → restaurer, en FR et EN, clavier seul + souris, avec
  `prefers-reduced-motion` activé.
- **Zéro donnée sortante** : le design system n'introduit ni police distante
  (Google Fonts = requête externe !), ni CDN, ni tracker. Les polices serif
  idéales doivent être embarquées dans le bundle ou listées en
  `font-display: swap` avec fallback local. **Contrainte CSP :
  `connect-src 'none'` — toute police doit être self-hosted.**

> *Le masque protège ce qui compte, sans se faire remarquer.
> Le design system est le voile de Maskita : une protection douce,
> posée avec soin, qui inspire confiance par son calme.*