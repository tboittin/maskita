# Maskita — Spec

Outil de pseudonymisation de rapports de psychologue (.docx) **100% côté navigateur**.
Aucun serveur, aucune donnée sortante, aucune installation Python ou LLM.

---

## Pourquoi ?

Les rapports de psychologie contiennent des données sensibles qui empêchent leur utilisation
sur des LLM frontières (OpenAI, Claude, Gemini). Maskita permet de :

1. **Pseudonymiser** le rapport : remplacer les données identifiantes par des tags lisibles
2. **Traiter** le rapport pseudonymisé avec un LLM frontière
3. **Restaurer** le rapport modifié en remplaçant les tags par leurs valeurs d'origine

Le tout sans jamais exposer les données à un serveur tiers.

---

## Architecture

Tout le traitement se déroule dans le navigateur de l'utilisateur.

```
┌─────────────────────────────────────────────────┐
│                  Navigateur                      │
│                                                  │
│  ┌─────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Upload  │──▶│ Pipeline │──▶│ Revue        │ │
│  │ .docx   │   │ (regex)  │   │ interactive  │ │
│  │ .key    │   │          │   │              │ │
│  └─────────┘   └──────────┘   └──────┬───────┘ │
│                                       │         │
│                               ┌───────▼───────┐ │
│                               │ Reconstruction│ │
│                               │ .docx + .key  │ │
│                               └───────────────┘ │
└─────────────────────────────────────────────────┘
```

### Stack

| Couche | Technologie |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Lecture .docx | mammoth |
| Écriture .docx | docx (npm) |
| Analyse | Règles regex pures (JS) |
| Tests | vitest + @testing-library/react |

---

## Pipeline

### Étape 1 : Extraction

Le fichier `.docx` uploadé est parsé dans le navigateur via `mammoth.extractRawText()`.
Le texte brut est extrait. Aucune donnée n'est envoyée à un serveur.

### Étape 2 : Analyse

Dix règles regex détectent les PII à structure fixe :

| Type | Pattern |
|---|---|
| EMAIL | `[\w.-]+@[\w.-]+\.\w+` |
| TEL | `(0[1-9])([\s.-]?\d{2}){4}` |
| ADELI | `\b\d{9}\b` |
| NIR | `\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b` |
| SIRET | `\b\d{14}\b` |
| IBAN | `FR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}` |
| IP | `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b` |
| URL | `https?://[^\s]+` |
| CARTE_BANCAIRE | `\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b` |

**Les noms, adresses, professions, établissements ne sont pas détectés automatiquement.**
Ils doivent être ajoutés manuellement via l'écran de revue.

Si un mapping optionnel est fourni (`.key.json` d'une session précédente), les valeurs
qu'il contient sont considérées comme connues. Seules les nouvelles détections sont ajoutées.

### Étape 3 : Mapping

Chaque détection reçoit un tag sémantique :

| Entité | Tag |
|---|---|
| Personne | `[PERSONNE]`, `[PERSONNE_2]`… |
| Adresse | `[ADRESSE]`… |
| Téléphone | `[TELEPHONE]`… |
| Email | `[EMAIL]`… |
| NIR | `[NIR]`… |
| ADELI | `[ADELI]`… |

Si une même identité est détectée sous plusieurs variantes (ex: "Sophie Lambert" et
"Mme Lambert"), elle est dédupliquée sous le même tag.

Une passe de résolution automatique supprime les conflits de sous-chaîne
(ex: "rue Gambetta" dans "15 rue Gambetta, 24000" → la plus courte est supprimée).

### Étape 4 : Revue interactive

Layout split :

- **Volet gauche** : tableau des pseudos (tag / valeurs associées)
  - Code couleur : vert (nouveau), blanc (existant), rouge (conflit), gris (vide)
  - Renommer un tag (double-clic), ajouter / éditer / supprimer une valeur
  - Détection de conflits (même valeur dans deux tags, sous-chaîne)
  - Bouton d'ajout manuel d'un nouveau tag
- **Volet droit haut** : texte pseudonymisé avec surbrillance des tags
- **Volet droit bas** : texte lisible avec surbrillance des valeurs
- Highlight croisé : clic sur un tag → surbrillance bleue des occurrences dans les deux textes
- Conflits : surbrillance rouge + message d'erreur

### Étape 5 : Reconstruction

```typescript
import * as docx from 'docx';

const sections = paragraphs.map(text => ({
  children: [new docx.Paragraph({ text })],
}));

const doc = new docx.Document({ sections });
const blob = await docx.Packer.toBlob(doc);
```

Le fichier `.docx` pseudonymisé est téléchargé automatiquement.
La clé de mapping (`.key.json`) est téléchargée simultanément.

### Étape 6 : Restauration

L'utilisateur upload le document modifié + la clé. Le pipeline parcourt le texte XML
et remplace chaque tag `[PERSONNE]` par sa valeur d'origine.

```typescript
const restored = rawText.replaceAll(/\[(\w+(?:_\d+)?)\]/g, (_, tag) => {
  return mapping[tag] || `[${tag}]`;
});
```

---

## Écran de soumission

Un bouton global "Valider et télécharger" en bas à droite de l'écran de revue.

Si une modification du texte lisible a été détectée (édition manuelle), une popup
propose de relancer l'analyse ou de poursuivre avec les données existantes.

---

## Tests

Des test unitaires relatifs aux composants garantissent que la qualité est maintenu durant le projet.

```bash
npm test
```

---

## Limitations

- **Pas de détection contextuelle** : les noms, adresses, professions, établissements
  ne sont pas détectés. L'utilisateur doit les ajouter manuellement.
- **Pas de LLM** : Pas de validation automatique.
- **Pas de RAG** : pas d'exemples pour guider la détection.

Ces limitations sont assumées : Maskita privilégie la **sécurité maximale**
(zéro donnée sortante) et la **simplicité** (un `npm install` suffit).

---

## Roadmap

1. **Parser .docx natif** — remplacer mammoth par un parseur XML direct pour
   préserver la mise en page (gras, listes, tableaux).
2. **Export PDF** — générer un PDF pseudonymisé en sus du .docx.
3. **Règles personnalisables** — l'utilisateur peut ajouter ses propres regex
   (numéros de dossier, codes interne à son cabinet).
4. **Mode instantané** — bypasser l'écran de revue pour un traitement en un clic.