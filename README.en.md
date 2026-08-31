# Maskita

Document pseudonymisation (.docx) — **100% in the browser.**

No server, no Python or LLM installation, no data leaving your machine.

## Why Maskita?

You have a psychology report containing sensitive data. You want to use an LLM (ChatGPT, Claude…) to analyse it, but you can't send the raw data to it.

Maskita **pseudonymises** the report in your browser: it lets you replace names, addresses, numbers and other PII with readable tags (`[PERSON]`, `[ADDRESS]`, `[PHONE]`…). You can then send the pseudonymised report to an LLM without exposing the real data.

Once the LLM processing is done, Maskita **restores** the modified report by replacing the tags with their original values.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Usage

### 1. Anonymise

1. Click the **Anonymise** tab
2. Select or drag & drop a `.docx` file
3. (Optional) provide a `.key.json` key if you already have an existing mapping
4. Click **Run analysis**
5. Fixed-structure PII are detected automatically (email, phone, NIR, ADELI…)
6. Review detections in the review screen
7. Add/Edit missing values:
   - Click in the readable text → select a value → create a tag
   - "+ Add a pseudo" button in the table
8. Click **Validate and download**
9. Two files are available for download:
   - The pseudonymised report (`.docx`)
   - The reversibility key (`.key.json`) — **keep it safe**

### 2. Restore

1. Click the **Restore** tab
2. Upload the modified report (with tags)
3. Upload the corresponding `.key.json` key
4. Download the restored version

## Security

- **Everything happens in the browser.** No data is sent to any server.
- Uploaded .docx files are never persisted.
- The mapping key is an unencrypted `.key.json` file — the user is solely responsible for keeping it safe.

## Limitations

- Only fixed-structure PII are detected (email, phone, ADELI, NIR…).
- Names, addresses, professions must be added manually via the review screen.
- No embedded LLM: no automatic validation of detections.

## Stack

React 18 / TypeScript / Vite / mammoth / docx (npm) / vitest

## Licence

MIT