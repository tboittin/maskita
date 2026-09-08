# DESIGN-SYSTEM.md — Maskita

Design system **idéal** du projet Maskita.

Ce document ne décrit pas l'existant : il exprime la **vision** — l'identité
visuelle, les tokens, les composants et les comportements que Maskita mérite,
en cohérence avec sa philosophie. L'état actuel du code est mentionné en
"écart à combler" quand nécessaire, jamais comme contrainte.

---

## 1. Manifeste — la philosophie devient design

Maskita est un outil de pseudonymisation **100 % navigateur** : zéro serveur,
zéro donnée sortante, zéro trace. Il manipule les documents les plus sensibles
qui existent (rapports de psychologie, données de santé) et rend leur traitement
par des LLM sûrs.

Le design system découle de cette identité, mot par mot :

| La philosophie dit… | …donc le design fait |
|---|---|
| "Aucune donnée ne quitte la machine" | Une interface **calme, fermée, sans fuite visuelle** : pas de fenêtres qui débordent, pas d'éléments qui "s'échappent", tout reste à l'intérieur de panneaux nets |
| "La confidentialité d'abord" | Le **masque** comme métaphore centrale : les données sensibles sont *voilées* (tags), jamais exposées par le design lui-même |
| "L'utilisateur est seul garant" | **Transparence radicale** : chaque action est visible, explicable, réversible. Le design rend le pipeline lisible (étapes, états, confirmations) |
| "Outil de confiance" | Une esthétique **sobre et haut de gamme**, type cabinet de confiance (1Password, Proton, Signal) : pas de gadgets, de la matière et du soin |
| "Simple : un npm install suffit" | **Zéro friction cognitive** : un seul chemin principal, des actions contextuelles, le moins de jargon possible |
| "Les noms, adresses sont ajoutés à la main" | L'interface récompense le **travail humain** : la revue est le cœur, elle doit être agréable, pas une corvée |

**Le ton :** confident, pas clinique. Le design doit faire penser "cabinet
médical haut de gamme + outil développeur soigné". Sombre-léger, précis,
chaleureux à la marge.

---

## 2. Direction artistique — "Le Masque"

### 2.1 Concept

Le mot *maskita* (masque) est l'idée directrice. Un masque :
- **protège** (confidentialité),
- **transforme** (le visible devient anonyme) tout en restant **reconnaissable**
  (le tag `[PERSONNE]` garde la forme du texte),
- se **retire** (la restauration).

Trois gestes visuels à décliner partout :

1. **Le voile** — les données pseudonymisées sont *derrière un voile* :
   surbrillance douce, fond translucide, jamais de noir opaque sur du texte.
2. **Le sceau** — la validation est un acte solennel : le bouton principal
   scelle le document (état "scellé" après téléchargement, succès avec cachet).
3. **Le fil** — le parcours s'écrit comme un fil continu : étapes numérotées,
   transitions horizontales, tout est *cousu* d'un bout à l'autre.

### 2.2 Palette idéale

Trois familles, chacune avec un rôle :

| Famille | Rôle | Couleurs |
|---|---|---|
| **Encre** (neutres) | Structure, texte, surfaces. Le "marbre" du cabinet | Slate/zinc profond : `#0f172a`, `#334155`, `#64748b`, `#e2e8f0`, `#f8fafc`, blanc |
| **Sceau** (primaire) | Actions principales, focus, liens. L'indigo actuel est bon mais doit gagner en profondeur | Indigo : `#4338ca` (primaire), `#6366f1` (hover), `#eef2ff` (fond subtil) |
| **Signal** (statuts) | Uniquement pour l'état des données, jamais pour décorer | vert `#16a34a` (nouveau / sûr), rouge `#dc2626` (conflit / danger), ambre `#d97706` (attention), bleu info `#2563eb` (information) |

**Règle d'or : la couleur ne décore pas, elle informe.** Un élément n'est coloré
que s'il porte une information (état du tag, action primaire, erreur). Tout le
reste reste en encre.

### 2.3 Typographie idéale

Le texte EST le produit (on manipule des rapports). La typographie doit être
exceptionnelle :

- **Lecture** : une serif moderne et chaleureuse pour les aperçus de documents —
  *Source Serif 4* ou *Newsreader* — pour que le rapport conserve son caractère
  de document, même pseudonymisé. C'est le point le plus transformateur du
  design system.
- **UI** : *Inter* (ou *Geist*) en graisses 400/500/600, tailles resserrées
  mais lisibles.
- **Données** : *JetBrains Mono* / *IBM Plex Mono* pour les tags `[PERSONNE]`,
  les valeurs de mapping et tout ce qui est "machine" (clés, fichiers).
  Le mono = "ceci est une donnée protégée".
- Échelle modulaire 1.25 (major third) : 16 / 20 / 25 / 31px…, interligne 1.6,
  mesure de texte 60–70 caractères.

### 2.4 Espace, géométrie

- Grille **4px** (token) ; marges de page 24–32px ; conteneur 1100px (la lecture
  prime sur le remplissage).
- **Rayons** : 6px (contrôles), 12px (panneaux), 16px (modales) — un rayon
  unique 8px aplatit le relief ; trois niveaux donnent de la hiérarchie.
- **Ombres** : uniquement pour élever (modales, menus, drag) ; les panneaux de
  lecture ne portent **pas** d'ombre mais une fine bordure 1px — la donnée doit
  sembler posée, pas flottante.

---

## 3. Principes de design (checklist de toute décision)

1. **Une action principale par écran.** Tout le reste est secondaire ou invisible.
2. **Jamais de données affichées par accident.** Miniatures de texte toujours
   floutées/voilées ; le nom du fichier n'apparaît jamais en clair s'il est
   suspect (le warning existant devient un réflexe visuel : le voile se trouble).
3. **Le pipeline est visible.** Trois étapes (Déposer → Vérifier → Sceller) avec
   un stepper discret. L'utilisateur sait toujours où il est et ce qui va se passer.
4. **Tout est réversible.** Annuler, Escape, clic hors zone : chaque action a un
   retour ; les actions destructives demandent un second geste précis (taper le
   tag à vider, pas juste cliquer "Vider").
5. **Le détail fait la confiance.** Micro-interactions propres, focus visibles,
   états cohérents : c'est le soin du détail qui dit "vos données sont entre de
   bonnes mains".
6. **Performance = respect.** Le bundle doit rester léger (l'app est déjà
   ~276 kB gzip) : chaque ajout visuel se paie en octets, on choisit en
   connaissance de cause.

---

## 4. Tokens idéaux

```css
:root {
  /* Couleurs — encre */
  --encre-900: #0f172a;
  --encre-700: #334155;
  --encre-500: #64748b;
  --encre-300: #cbd5e1;
  --encre-200: #e2e8f0;
  --encre-100: #f1f5f9;
  --encre-50:  #f8fafc;

  /* Couleurs — sceau (indigo profond) */
  --sceau-600: #4338ca;   /* primaire */
  --sceau-500: #4f46e5;   /* hover */
  --sceau-100: #eef2ff;   /* fond sélection */

  /* Couleurs — signal */
  --signal-succes: #16a34a;
  --signal-erreur: #dc2626;
  --signal-attention: #d97706;
  --signal-info: #2563eb;

  /* Typographie */
  --police-ui: 'Inter', system-ui, sans-serif;
  --police-lecture: 'Source Serif 4', Georgia, serif;
  --police-donnees: 'JetBrains Mono', monospace;

  /* Espace 4px */
  --espace-1: 4px; --espace-2: 8px; --espace-3: 12px;
  --espace-4: 16px; --espace-6: 24px; --espace-8: 32px;

  /* Géométrie */
  --rayon-controle: 6px;
  --rayon-panneau: 12px;
  --rayon-modale: 16px;

  /* Ombres */
  --ombre-elevee: 0 12px 32px rgba(15, 23, 42, 0.16);
  --ombre-flottante: 0 4px 12px rgba(15, 23, 42, 0.10);

  /* Motion */
  --duree-rapide: 120ms;
  --duree-base: 200ms;
  --courbe: cubic-bezier(0.2, 0, 0, 1);
}
```

(decorum : les tokens actuels `--couleur-*` sont conservés comme alias dépréciés
durant la migration, puis supprimés.)

---

## 5. Layout

- **Stepper global** : trois jalons discrets en haut de la zone de travail —
  `Déposer` → `Vérifier` → `Sceller`. Les jalons passés sont cliquables (retour
  en arrière), le jalon actif porte le sceau.
- **Écran de revue (le cœur)** :
  - Tableau des pseudos à gauche (colonne 320–380px), aperçus à droite,
    grille 1fr / 1.6fr — le texte a faim de place.
  - Les deux aperçus sont **côte à côte sur desktop** (pseudonymisé / lisible),
    pas empilés : la comparaison est le geste principal de la revue. Sur mobile,
    bascule par onglets "Masqué / Lisible".
  - Barre d'actions flottante en bas à droite (comme un éditeur) : "Sceller et
    télécharger" toujours visible, même quand on a défilé.
- **Responsive** : passage 1 colonne sous 900px, actions repliées dans un
  bottom-bar fixe.
- **Header** : titre centré, badge GitHub + toggle langue en haut à droite,
  alignés sur une même ligne (plus de chevauchement absolu).

---

## 6. Composants idéaux

### 6.1 Boutons
- **Primaire (sceller)** : fond sceau, texte blanc, rayon 6, hauteur 40px,
  weight 500. Au clic de validation : micro-animation de "sceau" (petit cachet
  ✓ qui s'imprime).
- **Secondaire** : fond encre-50, bordure encre-200, texte encre-700.
- **Ghost** : texte encre-500, hover encre-900.
- **Danger** : fond signal-erreur, uniquement dans les modales.
- États : hover = sceau-500 ; `focus-visible` = anneau 2px sceau-500 offset 2px
  **partout** ; disabled = opacité .45 + `aria-disabled` + message pourquoi
  (tooltip) quand c'est un blocage métier (ex. "chargez un fichier d'abord").

### 6.2 FileDropZone
Repensée comme un **portique de sécurité** :
- Zone en pointillés (4px, `--rayon-panneau`), icône centrée, texte :
  "Déposez votre rapport ici".
- Au survol/drag : la zone s'illumine en sceau-100, la bordure devient continue.
- **Un fichier déposé = une carte de prévisualisation** (nom, taille, type,
  risque du nom de fichier évalué immédiatement) — pas juste un label.
- L'état "extraction" montre un voile animé (pulsation douce) sur la zone.

### 6.3 PseudoTableau
- En-têtes sticky dans le panneau scrollable.
- Ligne de tag : tag mono + pastille d'état (vert flèche ↑ = nouveau,
  blanc = existant, rouge ⚠ = conflit, gris = vide) — le code couleur reste
  mais devient une **pastille** plutôt qu'une couleur de texte (accessibilité).
- Conflit : la ligne tremble légèrement à l'apparition, message expliqué sous
  le tag + lien "voir le conflit" qui sync-scrolle les deux aperçus.
- Ajout manuel : petit formulaire inline dans un *popover* ancré au bouton
  "+ Ajouter un pseudo" (pas d'expansion qui pousse le tableau).
- Drag & drop conservé, avec zone de drop qui s'agrandit visuellement.

### 6.4 TexteApercu
- Police de lecture (serif) dans les deux aperçus.
- Toolbar flottante (Nouveau tag / Nouvelle valeur) avec **fond glass**
  (blanc 80% + blur 8px) — les actions contextuelles ne recouvrent jamais le
  texte entièrement.
- Surbrillances en voile : tag actif = fond sceau-100 + bordure gauche 2px
  sceau ; valeur ciblée = fond sceau-100 + contour ; autre tag = fond
  signal-succes 10%. Jamais de surbrillance opaque sur le texte.

### 6.5 Modales
- Trois rayons de profondeur (voir 2.4), ombre élevée, `max-width: 520px`.
- **Action destructive explicite : taper confirme.** Pour "vider un tag",
  l'utilisateur tape le tag à vider (`[EMAIL]`) ou le nombre de valeurs.
  Un seul clic sur "Vider" ne suffit plus — c'est le geste qui impose le
  temps de la réflexion, en cohérence avec "l'utilisateur est seul garant".
- Focus trap + retour focus à l'élément déclencheur.

### 6.6 Stepper & états
- Composant `Stepper` (3 jalons) avec état complet/actif/futur.
- Bandeau de succès : petit "cachet" vert avec ✓ imprimé + animation de
  tampon ; disparaît à 5 s ou au clic.
- Bandeau d'erreur : fond encre-50, bordure signal-erreur, icône, libellé en
  clair (jamais de code technique).

### 6.7 Badge GitHub / confiance
- Le badge actuel devient une **carte de confiance** dans le footer ou le
  header : "Open source — MIT — zéro collecte de données", avec 3 pastilles
  (Vercel, GitHub, Licence MIT). Trois signaux de transparence, pas un seul.

---

## 7. Icônes

- Jeu d'icônes **ligne 1.5px** (Lucide) — cohérent, pas d'emojis dans l'UI
  (les emojis actuels 🔒🔓📦✕🗑 sont remplacés par des pictos dessinés) :
  - Anonymiser = **masque** ; Restaurer = **masque relevé / clé** ;
  - Télécharger = flèche dans un socle ; Sceller = cachet ;
  - Confiance = bouclier avec ✓.
- Les icônes sont des métaphores du masque, pas des illustrations.

---

## 8. Motion

| Usage | Animation | Durée / courbe |
|---|---|---|
| Apparition de tag / valeur | fondu + 4px vers le bas | 120ms, sortie douce |
| Surbrillance croisée | fondu de fond | 120ms |
| Conflit détecté | micro-tremblement (1 oscillation) | 200ms |
| Validation / sceau | cachet ✓ qui s'imprime (scale .8→1 + fondu) | 200ms |
| Drag over zone | bordure pointillée→continue + fond | 200ms |
| Changement d'étape | glissement horizontal 8px + fondu | 200ms, `--courbe` |

**Règle :** chaque animation a un sens (état, confirmation, attention).
Pas d'animation décorative ; `prefers-reduced-motion` désactive tout sauf les
fondu d'état.

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

- Les textes courts ("Lancer l'analyse", "Sceller et télécharger") sont conçus
  **pour les deux langues dès l'écriture** (limite de caractères par jalon).
- Les messages de sécurité (warning nom de fichier) utilisent un vocabulaire
  cohérent : "voile", "sceller", "clef" — le lexique du masque est traduit,
  pas transposé.
- Le stepper, les tooltips, les `aria-label` sont localisés comme le corps de
  l'UI.

---

## 11. Marque et confiance

- **Couleur comportementale** : l'interface ne devient "verte" que quand les
  données sont sûres (aucun nom suspect, aucun conflit) — le vert est une
  récompense, pas un décor.
- **Transparence radicale** : un petit espace "Comment ça marche" (3 lignes :
  tout est local, aucune donnée sortante, pas de compte) accessible depuis le
  footer — le design system prévoit l'emplacement, le texte est à écrire.
- **Erreurs bienveillantes** : chaque erreur explique *pourquoi* et *quoi faire*
  ("Ce fichier contient un nom suspect dans son titre. Renommez-le puis
  redéposez").
- Le badge open source est un engagement visuel : toujours présent, jamais
  relégué dans un coin oublié.

---

## 12. Migration depuis l'existant (progressive, sans refonte)

L'ordre recommandé, chaque étape livrée et testée :

1. **Tokens** : introduire les nouvelles variables en alias des existantes,
   zéro changement visuel. (1 commit)
2. **Typographie de lecture** : passer les deux aperçus en serif — l'effet est
   immédiat et transformateur. (1 commit + tests snapshot)
3. **Boutons** : extraire le composant `Bouton` (4 variantes) et remplacer les
   usages dupliqués. (1 commit)
4. **Stepper** : ajouter le jalon discret "Déposer → Vérifier → Sceller"
   au-dessus de la zone de travail. (1 commit)
5. **FileDropZone** : carte de prévisualisation + évaluation du nom de fichier. (1 commit)
6. **Pastilles de statut** dans le tableau (remplace la couleur de texte seule). (1 commit)
7. **Modales** : focus trap + action destructive à saisie du tag. (1 commit)
8. **Icônes Lucide** en remplacement des emojis. (1-2 commits)
9. **Carte de confiance** (badge GitHub enrichi). (1 commit)
10. Nettoyage des alias de tokens et suppression des styles morts. (1 commit)

Chaque étape : `pnpm test` + `pnpm typecheck` + commit `feat:`/`refactor:`/`style:`
en français. La couverture reste ≥ 90 % — le design ne se paie pas sur les tests.

---

## 13. Vérification du design system

- **Tests** : chaque nouveau composant (Bouton, Stepper, Modal, pastilles) a
  son fichier de test ; les tests d'accessibilité (rôles, aria) font partie
  des critères d'acceptation.
- **Typecheck** strict avant chaque commit.
- **Audit manuel** avant release : parcours complet déposer → vérifier →
  sceller → restaurer, en FR et EN, clavier seul + souris, avec
  `prefers-reduced-motion` activé.
- **Zéro donnée sortante** : le design system n'introduit ni police distante
  (Google Fonts = requête externe !), ni CDN, ni tracker. Les polices serif
  idéales doivent être soit embarquées dans le bundle, soit listées en
  `font-display: swap` avec fallback local. **Contrainte CSP : `connect-src 'none'` —
  toute police doit être self-hosted.**

> *Le masque protège ce qui compte. Le design system est le masque de Maskita :
> il protège la confiance que l'utilisateur place dans l'outil.*