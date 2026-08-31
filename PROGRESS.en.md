# PROGRESS.en.md — Maskita

> Project tracking document. Updated as work progresses.
> Each phase ends with an integration into App.tsx — the project is **testable** at the end of each phase (`pnpm dev`).
> Global status: 🟢 **Project complete — all phases 1 through 9 are done**

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | Not started |
| 🟡 | In progress |
| 🟢 | Complete |
| ❌ | Blocked / abandoned |

---

## Phase 1 — Project foundations

After this phase: `pnpm dev` displays a title + subtitle.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Initialise pnpm monorepo (Node ≥ 18, `.npmrc` node-linker=hoisted) | 🟢 | pnpm 9.15.9, Node 20.20.2 |
| 1.2 | Configure Vite + React 18 + strict TypeScript | 🟢 | Vite 6.4.3, React 18.3, TS 5.7 |
| 1.3 | Configure vitest + @testing-library/react | 🟢 | vitest 2.1.9, jsdom |
| 1.4 | Configure ESLint + Prettier (French conventions) | 🔴 | Deferred — not blocking |
| 1.5 | Verify `tsc --noEmit` and `npm test` pass empty | 🟢 | 2 tests pass, typecheck OK |
| 1.6 | Create folder structure | 🟢 | `src/` + subfolders created |

**Testable:** ✅ `pnpm dev` → "Maskita" page

---

## Phase 2 — Upload and .docx extraction

After this phase: you can upload a `.docx` file and see extracted text on the page.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Install `mammoth` | 🟢 | |
| 2.2 | Create `useDocxUpload()` hook — upload + raw text extraction | 🟢 | 6 tests |
| 2.3 | Create `FileDropZone` component (drag & drop + selector) | 🟢 | 8 tests |
| 2.4 | **Integration:** connect `FileDropZone` + `useDocxUpload` in `App.tsx` | 🟢 | useEffect + step switch |
| 2.5 | Tests: file upload, extraction, errors | 🟢 | 16 tests pass |

**Testable:** 🟢 upload → analysis → review complete

---

## Phase 3 — Regex detection pipeline

After this phase: upload automatically detects PII and displays the result.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Implement 9 regex rules (email, tel, ADELI, NIR, SIRET, IBAN, IP, URL, CB) | 🟢 | 10 tests |
| 3.2 | `analyserTexte()` function with positions and types | 🟢 | 4 tests |
| 3.3 | Deduplication: same value → same tag, variants grouped | 🟢 | |
| 3.4 | Substring resolution | 🟢 | 2 tests |
| 3.5 | Existing `.key.json` support | 🟢 | via `chargerCleJson` |
| 3.6 | **Integration:** auto-run analysis after upload, display detections | 🟢 | useEffect in App.tsx |
| 3.7 | Tests: each regex, dedup, substring | 🟢 | 18 tests |

**Testable:** 🟢

---

## Phase 4 — Mapping and tags

After this phase: pseudonymised text is displayed alongside the original text.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Generate semantic tags (`[PERSONNE]`, `[TELEPHONE]`…) | 🟢 | 3 tests |
| 4.2 | `appliquerMapping()` function | 🟢 | 2 tests |
| 4.3 | `restaurerTexte()` function | 🟢 | 1 test |
| 4.4 | Generate and load `.key.json` file | 🟢 | round-trip tested |
| 4.5 | **Integration:** apply detected mapping, display pseudonymised text | 🟢 | genererMapping in the flow |
| 4.6 | Tests: application, restoration, key | 🟢 | 8 tests |

**Testable:** 🟢

---

## Phase 5 — Interactive review screen

After this phase: the complete pipeline upload → analysis → review works in the browser.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Split layout: table (left) / text previews (right) | 🟢 | EcranRevue |
| 5.2 | Tag table with associated values (PseudoTableau) | 🟢 | |
| 5.3 | Colour code: green (new), white (existing), red (conflict), grey (empty) | 🟢 | |
| 5.4 | Rename (double-click), add/edit/delete a value | 🟢 | |
| 5.5 | "+ Add a pseudo" button | 🟢 | |
| 5.6 | Pseudonymised text with tag highlighting | 🟢 | |
| 5.7 | Readable text with value highlighting | 🟢 | |
| 5.8 | Cross-highlight: click tag → blue highlight | 🟢 | |
| 5.9 | Conflict detection (duplicate, substring) | 🟢 | |
| 5.10 | **Integration:** full pipeline upload → analysis → review in App.tsx | 🟢 | useRef + useEffect, 4 App tests |
| 5.11 | Tests: rendering, click, manual add, conflict | 🟢 | 24 tests |

**Testable:** 🟢

---

## Phase 6 — Reconstruction and download

After this phase: you can pseudonymise a report, download the pseudonymised .docx + .key.json key.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Install `docx` (npm) | 🟢 | Already in package.json |
| 6.2 | `buildDocx(text: string): Blob` function | 🟢 | `src/utils/buildDocx.ts`, 5 tests |
| 6.3 | Simultaneous .docx + .key.json download | 🟢 | `declencherTelechargement` in `src/utils/telechargement.ts` |
| 6.4 | **Integration:** wire download to "Validate and download" button | 🟢 | `handleValider` async in App.tsx, 1 test |
| 6.5 | Tests: valid .docx blob, round-trip | 🟢 | 5 buildDocx tests + 1 App test = 6 new tests |

**Testable:** 🟢 upload → review → download (.docx + .key.json)

---

## Phase 7 — Restoration

After this phase: you can restore a modified report with its key.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Upload modified report (`.docx` with tags) | 🟢 | via `useRestauration` hook, reuses mammoth |
| 7.2 | Upload `.key.json` key | 🟢 | integrated in the hook |
| 7.3 | `[TAG]` → original value replacement pipeline | 🟢 | `restaurerTexte()` exists in mapping.ts, triggered automatically |
| 7.4 | Download restored report | 🟢 | `buildDocx` + `declencherTelechargement` |
| 7.5 | **Integration:** Restore screen in App.tsx | 🟢 | tab navigation Anonymise / Restore |
| 7.6 | Tests: complete round-trip | 🟢 | 8 hook tests + 4 component tests + 3 navigation tests = 15 new tests |

**Testable:** 🟢 Restore tab → upload .docx + key → download restored version

---

## Phase 8 — Navigation and global UI

After this phase: the interface is complete with navigation, popups, states.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Tab navigation: Anonymise / Restore | 🟢 | Done in phase 7 |
| 8.2 | Confirmation popup if mapping modified | 🟢 | `PopupConfirmation` component + integration in `EcranRevue` |
| 8.3 | Error / empty / loading states in App.tsx | 🟢 | Green success message after download, disappears after 5s |
| 8.4 | Tests: navigation, popup, states | 🟢 | 7 PopupConfirmation tests + 3 EcranRevue popup tests + 1 App success test = 11 new tests |

**Testable:** 🟢

---

## Phase 9 — Polish and quality

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Security audit: zero outgoing data confirmed | 🟢 | No fetch/XMLHttpRequest/axios in source code |
| 9.2 | Full user test: upload → review → download → restore | 🟢 | 122 tests pass, end-to-end pipeline tested |
| 9.3 | Verify test coverage (target ≥ 80%) | 🟢 | **96.13%** statements, 88.14% branch, 93.87% functions |
| 9.4 | Production build `npm run build` | 🟢 | ✅ dist/ generated (994kB, ~276kB gzip) |

---

## Future roadmap (Spec.md § Roadmap)

| # | Task | Status |
|---|------|--------|
| R1 | Native .docx parser (replace mammoth, preserve layout) | 🔴 |
| R2 | Pseudonymised PDF export | 🔴 |
| R3 | User-customisable rules | 🔴 |
| R4 | Instant mode (bypass review) | 🔴 |

---

## Summary

| Phase | Status |
|-------|--------|
| Phase 1 — Foundations | 🟢 |
| Phase 2 — Upload .docx | 🟢 |
| Phase 3 — Regex detection | 🟢 |
| Phase 4 — Mapping/Tags | 🟢 |
| Phase 5 — Interactive review | 🟢 |
| Phase 6 — Reconstruction .docx | 🟢 |
| Phase 7 — Restoration | 🟢 |
| Phase 8 — Navigation/UI | 🟢 |
| Phase 9 — Polish | 🟢 |