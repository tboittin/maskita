export type TypePII =
  | 'EMAIL'
  | 'TEL'
  | 'ADELI'
  | 'NIR'
  | 'SIRET'
  | 'IBAN'
  | 'IP'
  | 'URL'
  | 'CARTE_BANCAIRE';

export interface Detection {
  valeur: string;
  type: TypePII;
  position: number;
  longueur: number;
}

export interface Regle {
  type: TypePII;
  pattern: RegExp;
}

// REGEX-02 : en JavaScript, `\b` et `\w` (sans flag `u`) ne reconnaissent que
// l'ASCII `[a-zA-Z0-9_]`. Un accent adjacent (é, è, ê, à, ç...) n'est donc pas
// vu comme un caractère de mot, ce qui crée de fausses frontières (`\b`) et
// casse les détections. On remplace `\b` par des lookarounds Unicode
// `(?<![\p{L}\p{N}])` / `(?![\p{L}\p{N}])` avec le flag `u`. On autorise aussi
// `\p{N}` pour préserver les frontières numériques existantes (ici on encadre
// des CHIFFRES). Le flag `u` est OBLIGATOIRE dès qu'on utilise `\p{...}`,
// sinon une SyntaxError est levée.
export const REGLES: Regle[] = [
  { type: 'EMAIL',     pattern: /[\p{L}\p{N}._-]+@[\p{L}\p{N}._-]+\.[\p{L}\p{N}]+/gu },
  { type: 'TEL',       pattern: /(0[1-9])([\s.-]?\d{2}){4}/g },
  { type: 'ADELI',     pattern: /(?<![\p{L}\p{N}])\d{9}(?![\p{L}\p{N}])/gu },
  { type: 'NIR',       pattern: /(?<![\p{L}\p{N}])[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}(?![\p{L}\p{N}])/gu },
  { type: 'SIRET',     pattern: /(?<![\p{L}\p{N}])\d{14}(?![\p{L}\p{N}])/gu },
  { type: 'IBAN',      pattern: /FR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}/g },
  { type: 'IP',        pattern: /(?<![\p{L}\p{N}])\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?![\p{L}\p{N}])/gu },
  { type: 'URL',       pattern: /https?:\/\/[^\s]+/g },
  { type: 'CARTE_BANCAIRE', pattern: /(?<![\p{L}\p{N}])\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}(?![\p{L}\p{N}])/gu },
];
