import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileDropZone } from './FileDropZone';

function creerFichierMock(nom = 'rapport.docx'): File {
  return new File(['contenu'], nom, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

describe('FileDropZone', () => {
  it('affiche le message par défaut', () => {
    const onFichierChoisi = vi.fn();
    render(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    expect(screen.getByText(/glisser-déposer.*\.docx/i)).toBeInTheDocument();
  });

  it('affiche le nom du fichier courant', () => {
    const onFichierChoisi = vi.fn();
    render(
      <FileDropZone onFichierChoisi={onFichierChoisi} fichierCourant="mon-rapport.docx" />,
    );

    expect(screen.getByText('mon-rapport.docx')).toBeInTheDocument();
  });

  it('affiche une erreur', () => {
    const onFichierChoisi = vi.fn();
    render(
      <FileDropZone onFichierChoisi={onFichierChoisi} erreur="Format invalide" />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Format invalide');
  });

  it('affiche un état de chargement', () => {
    const onFichierChoisi = vi.fn();
    render(<FileDropZone onFichierChoisi={onFichierChoisi} chargement />);

    expect(screen.getByText(/extraction en cours/i)).toBeInTheDocument();
  });

  it('appelle onFichierChoisi quand on sélectionne un fichier', () => {
    const onFichierChoisi = vi.fn();
    render(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    const input = screen.getByTestId('input-fichier') as HTMLInputElement;
    const fichier = creerFichierMock();

    fireEvent.change(input, { target: { files: [fichier] } });

    expect(onFichierChoisi).toHaveBeenCalledTimes(1);
    expect(onFichierChoisi).toHaveBeenCalledWith(fichier);
  });

  it('change de style au drag over', () => {
    const onFichierChoisi = vi.fn();
    const { container } = render(
      <FileDropZone onFichierChoisi={onFichierChoisi} />,
    );

    const zone = container.firstElementChild!;
    fireEvent.dragOver(zone);

    const style = zone.getAttribute('style');
    // La bordure doit utiliser la variable primaire en drag over
    expect(style).toContain('var(--couleur-primaire)');
    // Le fond doit passer en rgba primaire
    expect(style).toContain('rgba(79, 70, 229');
  });

  it('appelle onFichierChoisi au drop', () => {
    const onFichierChoisi = vi.fn();
    const { container } = render(
      <FileDropZone onFichierChoisi={onFichierChoisi} />,
    );

    const zone = container.firstElementChild!;
    const fichier = creerFichierMock();

    fireEvent.drop(zone, { dataTransfer: { files: [fichier] } });

    expect(onFichierChoisi).toHaveBeenCalledWith(fichier);
  });

  it('contient un input fichier avec accept .docx', () => {
    const onFichierChoisi = vi.fn();
    render(<FileDropZone onFichierChoisi={onFichierChoisi} />);

    const input = screen.getByTestId('input-fichier') as HTMLInputElement;

    expect(input.type).toBe('file');
    expect(input.accept).toBe('.docx');
  });
});