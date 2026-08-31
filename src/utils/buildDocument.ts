import { Document, Packer, Paragraph, TextRun } from 'docx';
import type { ExtensionFichier } from './extraction';

/**
 * Construit un Blob du bon format à partir d'un texte.
 * - .docx → document Word via la librairie docx
 * - .txt  → Blob text/plain
 * - .md   → Blob text/markdown
 */
export async function buildDocument(
  texte: string,
  format: ExtensionFichier,
): Promise<Blob> {
  switch (format) {
    case 'docx': {
      // Réduire les suites de 3+ lignes vides consécutives à une seule ligne vide
      const normalise = texte.replace(/\n{3,}/g, '\n\n');
      const lignes = normalise.split('\n');

      const children = lignes.map(
        (ligne) => new Paragraph({ children: [new TextRun(ligne)] }),
      );

      const doc = new Document({ sections: [{ children }] });
      return await Packer.toBlob(doc);
    }

    case 'txt':
      return new Blob([texte], { type: 'text/plain;charset=utf-8' });

    case 'md':
      return new Blob([texte], { type: 'text/markdown;charset=utf-8' });
  }
}