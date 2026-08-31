import * as mammoth from 'mammoth';

export type ExtensionFichier = 'docx' | 'txt' | 'md';

const EXTENSIONS_AUTORISEES = ['.docx', '.txt', '.md'] as const;

export type ExtensionAutorisee = (typeof EXTENSIONS_AUTORISEES)[number];

export function extensionDepuisNom(nom: string): ExtensionAutorisee | null {
  const nomMinuscule = nom.toLowerCase();
  for (const ext of EXTENSIONS_AUTORISEES) {
    if (nomMinuscule.endsWith(ext)) return ext;
  }
  return null;
}

export function extensionSansPoint(nom: string): ExtensionFichier | null {
  const ext = extensionDepuisNom(nom);
  if (!ext) return null;
  return ext.slice(1) as ExtensionFichier; // '.docx' → 'docx'
}

export async function extraireTexte(file: File): Promise<string> {
  const ext = extensionDepuisNom(file.name);

  if (!ext) {
    throw new Error(`Format non supporté : ${file.name}`);
  }

  if (ext === '.docx') {
    const buffer = await file.arrayBuffer();
    const resultat = await mammoth.extractRawText({ arrayBuffer: buffer });
    if (resultat.messages.length > 0) {
      console.warn('Avertissements mammoth :', resultat.messages);
    }
    return resultat.value;
  }

  // .txt ou .md — lecture directe
  return await file.text();
}