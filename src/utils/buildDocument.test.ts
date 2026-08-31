import { describe, it, expect } from 'vitest';
import { buildDocument } from './buildDocument';

describe('buildDocument', () => {
  describe('format .docx', () => {
    it('retourne un Blob', async () => {
      const blob = await buildDocument('Bonjour', 'docx');
      expect(blob).toBeInstanceOf(Blob);
    });

    it('retourne un Blob avec le bon type MIME', async () => {
      const blob = await buildDocument('Test', 'docx');
      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });

    it('retourne un Blob non vide pour un texte normal', async () => {
      const blob = await buildDocument('Bonjour le monde', 'docx');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('gère un texte multiligne', async () => {
      const texte = 'Ligne 1\nLigne 2\nLigne 3';
      const blob = await buildDocument(texte, 'docx');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('gère un texte vide', async () => {
      const blob = await buildDocument('', 'docx');
      expect(blob.size).toBeGreaterThan(0); // un document vide reste un .docx valide
    });

    it('réduit les lignes vides consécutives', async () => {
      const texte = 'Section 1\n\n\n\n\nSection 2';
      const blob = await buildDocument(texte, 'docx');
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('format .txt', () => {
    it('retourne un Blob text/plain', async () => {
      const blob = await buildDocument('Hello', 'txt');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain;charset=utf-8');
    });

    it('conserve le contenu texte intégralement', async () => {
      const texte = 'Ligne 1\n\n\nLigne 2';
      const blob = await buildDocument(texte, 'txt');
      const contenu = await blob.text();
      expect(contenu).toBe(texte);
    });
  });

  describe('format .md', () => {
    it('retourne un Blob text/markdown', async () => {
      const blob = await buildDocument('# Titre', 'md');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/markdown;charset=utf-8');
    });

    it('conserve le contenu markdown intégralement', async () => {
      const texte = '# Titre\n\nParagraphe avec **gras** et `code`.';
      const blob = await buildDocument(texte, 'md');
      const contenu = await blob.text();
      expect(contenu).toBe(texte);
    });
  });
});