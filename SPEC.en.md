# Maskita — Spec

Report pseudonymisation tool (.docx, .txt, .md) **100% client-side**.
No server, no outgoing data, no Python or LLM installation.

---

## Why?

Psychology reports contain sensitive data that prevents their use
on frontier LLMs (OpenAI, Claude, Gemini). Maskita allows you to:

1. **Pseudonymise** the report: replace identifying data with readable tags
2. **Process** the pseudonymised report with a frontier LLM
3. **Restore** the modified report by replacing tags with their original values

All without ever exposing data to a third-party server.

---

## Architecture

All processing happens in the user's browser.

```
┌─────────────────────────────────────────────────┐
│                  Browser                         │
│                                                  │
│  ┌─────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Upload  │──▶│ Pipeline │──▶│ Review       │ │
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

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| .docx reading | mammoth |
| .docx writing | docx (npm) |
| Analysis | Pure regex rules (JS) |
| Tests | vitest + @testing-library/react |

---

## Pipeline

### Step 1: Extraction

The uploaded `.docx` file is parsed in the browser via `mammoth.extractRawText()`.
Raw text is extracted. No data is sent to any server.

### Step 2: Analysis

Ten regex rules detect fixed-structure PII:

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

**Names, addresses, professions, institutions are not detected automatically.**
They must be added manually via the review screen.

If an optional mapping is provided (`.key.json` from a previous session), the values
it contains are considered known. Only new detections are added.

### Step 3: Mapping

Each detection receives a semantic tag:

| Entity | Tag |
|---|---|
| Person | `[PERSONNE]`, `[PERSONNE_2]`… |
| Address | `[ADRESSE]`… |
| Phone | `[TELEPHONE]`… |
| Email | `[EMAIL]`… |
| NIR | `[NIR]`… |
| ADELI | `[ADELI]`… |

If the same identity is detected under multiple variants (e.g. "Sophie Lambert" and
"Mme Lambert"), it is deduplicated under the same tag.

An automatic resolution pass removes substring conflicts
(e.g. "rue Gambetta" inside "15 rue Gambetta, 24000" → the shorter one is removed).

### Step 4: Interactive review

Split layout:

- **Left pane**: pseudos table (tag / associated values)
  - Colour code: green (new), white (existing), red (conflict), grey (empty)
  - Rename a tag (double-click), add / edit / delete a value
  - Conflict detection (same value in two tags, substring)
  - Manual "Add a pseudo" button
- **Top-right pane**: pseudonymised text with tag highlighting
- **Bottom-right pane**: readable text with value highlighting
- Cross-highlight: click a tag → blue highlight of all occurrences in both texts
- Conflicts: red highlight + error message

### Step 5: Reconstruction

```typescript
import * as docx from 'docx';

const sections = paragraphs.map(text => ({
  children: [new docx.Paragraph({ text })],
}));

const doc = new docx.Document({ sections });
const blob = await docx.Packer.toBlob(doc);
```

The pseudonymised `.docx` file is downloaded automatically.
The mapping key (`.key.json`) is downloaded simultaneously.

### Step 6: Restoration

The user uploads the modified document + key. The pipeline walks through the XML text
and replaces each `[PERSONNE]` tag with its original value.

```typescript
const restored = rawText.replaceAll(/\[(\w+(?:_\d+)?)\]/g, (_, tag) => {
  return mapping[tag] || `[${tag}]`;
});
```

---

## Submission

A global "Validate and download" button at the bottom-right of the review screen.

If a modification of the readable text has been detected (manual editing), a popup
proposes to re-run analysis or continue with existing data.

---

## Tests

Unit tests for components ensure quality is maintained throughout the project.

```bash
npm test
```

---

## Limitations

- **No contextual detection**: names, addresses, professions, institutions
  are not detected. The user must add them manually.
- **No LLM**: No automatic validation.
- **No RAG**: no examples to guide detection.

These limitations are intentional: Maskita prioritises **maximum security**
(zero outgoing data) and **simplicity** (one `npm install` is enough).

---

## Roadmap

1. **Native .docx parser** — replace mammoth with a direct XML parser to
   preserve layout (bold, lists, tables).
2. **PDF export** — generate a pseudonymised PDF alongside the .docx.
3. **Customisable rules** — the user can add their own regex
   (case numbers, internal codes).
4. **Instant mode** — bypass the review screen for one-click processing.