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

export const REGLES: Regle[] = [
  { type: 'EMAIL',     pattern: /[\w.-]+@[\w.-]+\.\w+/g },
  { type: 'TEL',       pattern: /(0[1-9])([\s.-]?\d{2}){4}/g },
  { type: 'ADELI',     pattern: /\b\d{9}\b/g },
  { type: 'NIR',       pattern: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g },
  { type: 'SIRET',     pattern: /\b\d{14}\b/g },
  { type: 'IBAN',      pattern: /FR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}/g },
  { type: 'IP',        pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
  { type: 'URL',       pattern: /https?:\/\/[^\s]+/g },
  { type: 'CARTE_BANCAIRE', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
];