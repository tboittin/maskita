import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { FileDropZone } from './FileDropZone';
import { renderAvecI18n } from '../test/renderAvecI18n';

function creerFichierMock(nom = 'rapport.docx'): File {
  return new File(['contenu'], nom, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function inputFichier(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (!input) throw new Error('input[type=file] introuvable');
  return input;
}

describe('FileDropZone', () => {
  it('affiche le libellé par défaut', () => {
    const onFichierChoisi = vi.fn();
    renderAvecI18n(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    expect(screen.getByText(/Glisser-déposer un fichier .docx ici/)).toBeInTheDocument();
  });

  it('affiche le nom du fichier courant', () => {
    const onFichierChoisi = vi.fn();
    renderAvecI18n(
      <FileDropZone onFichierChoisi={onFichierChoisi} fichierCourant="mon-rapport.docx" />,
    );

    expect(screen.getByText('mon-rapport.docx')).toBeInTheDocument();
  });

  it('affiche une erreur', () => {
    const onFichierChoisi = vi.fn();
    renderAvecI18n(
      <FileDropZone onFichierChoisi={onFichierChoisi} erreur="Format invalide" />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Format invalide');
  });

  it('affiche un état de chargement', () => {
    const onFichierChoisi = vi.fn();
    renderAvecI18n(<FileDropZone onFichierChoisi={onFichierChoisi} chargement />);

    expect(screen.getByText(/Extraction en cours/)).toBeInTheDocument();
  });

  it('appelle onFichierChoisi quand on sélectionne un fichier', () => {
    const onFichierChoisi = vi.fn();
    renderAvecI18n(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    const input = inputFichier();
    const fichier = creerFichierMock();

    fireEvent.change(input, { target: { files: [fichier] } });

    expect(onFichierChoisi).toHaveBeenCalledTimes(1);
    expect(onFichierChoisi).toHaveBeenCalledWith(fichier);
  });

  it('change de style au drag over', () => {
    const onFichierChoisi = vi.fn();
    const { container } = renderAvecI18n(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    const zone = container.querySelector('label')!;
    fireEvent.dragOver(zone);

    const className = zone.getAttribute('class') ?? '';
    // Le DS passe sur la teinte action au survol
    expect(className).toContain('action');
  });

  it('appelle onFichierChoisi au drop', () => {
    const onFichierChoisi = vi.fn();
    const { container } = renderAvecI18n(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    const zone = container.querySelector('label')!;
    const fichier = creerFichierMock();

    fireEvent.drop(zone, { dataTransfer: { files: [fichier] } });

    expect(onFichierChoisi).toHaveBeenCalledWith(fichier);
  });

  it('contient un input fichier avec accept .docx', () => {
    const onFichierChoisi = vi.fn();
    renderAvecI18n(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    const input = inputFichier();
    expect(input.type).toBe('file');
    expect(input.accept).toContain('.docx');
  });
});