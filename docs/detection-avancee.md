# Détection avancée des noms (prototype MSK-004)

Seconde page, `ner.html`, qui ajoute à Maskita la détection des noms de
personnes, de lieux et d'établissements par un modèle local,
[CamemBERT-NER](https://huggingface.co/Xenova/camembert-ner) (licence MIT,
version quantifiée, environ 111 Mo). La page par défaut (`index.html`) ne
change pas : `connect-src 'none'`, aucune requête.

## Lancer en local

```bash
pnpm install
pnpm modele      # télécharge le modèle dans public/modeles/ et le moteur WebAssembly dans public/ort/
pnpm dev         # puis ouvrir http://localhost:5173/ner.html
```

Les dossiers `public/modeles/` et `public/ort/` sont ignorés par git : le
fichier du modèle dépasse la limite de 100 Mo de GitHub.

## Vérification du modèle

`scripts/telecharger-modele.sh` télécharge une **version figée** du modèle
(commit `8e19882…` du dépôt Hugging Face, pas `main`), puis vérifie l'empreinte
SHA-256 de chaque fichier avec `scripts/modele.sha256`. Si une empreinte ne
correspond pas, le script supprime les fichiers et échoue : la construction
Vercel échoue aussi, et rien n'est mis en ligne. L'empreinte du fichier ONNX
est celle que publie Hugging Face. Le moteur WebAssembly vient de npm, vérifié
par `pnpm-lock.yaml`.

Pour changer de version du modèle : mettre à jour `REVISION` dans le script
et les empreintes dans `scripts/modele.sha256`.

## Tests

- Tests unitaires (`pnpm test`) : le regroupement des entités, le hook et le
  panneau de suggestions sont testés sans le modèle.
- Tests e2e (`e2e/detection-avancee.spec.ts`) : deux tests tournent toujours
  (CSP des deux pages, aucun téléchargement avant le clic). Le troisième, le
  parcours complet avec le vrai modèle, **est sauté si le modèle est absent**
  de `public/modeles/`. Playwright l'affiche alors comme « skipped ».
  Pour le lancer : `pnpm modele` une fois, puis `pnpm test:e2e`.

## En ligne (Vercel)

Vercel lance le script `vercel-build` de `package.json` à la place de
`build` : il télécharge le modèle depuis Hugging Face **pendant la
construction**, puis construit le site. Le modèle est donc servi par
maskita.vercel.app lui-même, et la page ne contacte que son propre domaine.

## Fonctionnement

1. L'utilisateur clique sur « Activer la détection avancée ». Avant ce clic,
   aucun fichier n'est téléchargé.
2. Un Web Worker (`src/ner/worker.ts`) charge le modèle depuis `/modeles/` du
   site (`env.allowRemoteModels = false` : jamais depuis Hugging Face) et le
   moteur WebAssembly depuis `/ort/` (jamais depuis un CDN). Le navigateur garde
   le modèle en cache.
3. À l'analyse, le texte est découpé par paragraphes, et les paragraphes longs
   en morceaux d'au plus 1 000 caractères (CamemBERT lit au plus 512 jetons).
4. Les jetons renvoyés par le modèle sont replacés dans le texte et regroupés
   en entités (`src/ner/regroupement.ts`). PER devient PERSONNE, LOC devient
   LIEU, ORG devient ETABLISSEMENT ; MISC est écarté, ainsi que les entités de
   score moyen inférieur à 0,5.
5. Les entités arrivent dans l'écran de revue comme **suggestions** : rien
   n'entre dans la clé sans un clic « Accepter ». Une valeur acceptée devient
   un pseudo comme un ajout manuel : même format de clé `.key.json`.

## Mesures (pour MSK-005)

La console du navigateur affiche :

- `[Maskita NER] modèle chargé en … ms`
- `[Maskita NER] analyse : … ms, … morceaux, … entités`, suivi d'un tableau des
  entités (étiquette, valeur, score).

## CSP de `ner.html`

Par rapport à `index.html` : `connect-src 'self'`, `'wasm-unsafe-eval'` et
`blob:` dans `script-src`, `worker-src 'self' blob:`. Aucune origine extérieure.

Une balise `<meta>` CSP ne s'applique pas au Web Worker, qui suit les en-têtes
HTTP de son propre script. `vercel.json` envoie donc la même CSP en en-tête
HTTP pour `ner.html` et pour le script du worker (`/assets/ner-worker-*.js`,
nom fixé dans `vite.config.ts`). Le worker ne peut ainsi contacter que le site
lui-même, même si le code de transformers.js tentait d'appeler Hugging Face ou
un CDN.

