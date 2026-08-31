import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EcranRevue } from './EcranRevue';

const TEXTE = 'Contact : test@exemple.fr ou 0612345678';
const MAPPING = { '[EMAIL]': ['test@exemple.fr'] };

describe('EcranRevue', () => {
  it('affiche le tableau des tags', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte pseudonymisé', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte pseudonymisé/)).toBeInTheDocument();
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte lisible', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte lisible/)).toBeInTheDocument();
  });

  it('affiche le bouton Valider', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('Valider et télécharger')).toBeInTheDocument();
  });

  it('appelle onValider au clic sur le bouton (mapping inchangé)', () => {
    const onValider = vi.fn();
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.click(screen.getByText('Valider et télécharger'));

    expect(onValider).toHaveBeenCalledTimes(1);
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr'] }),
      expect.stringContaining('[EMAIL]'),
    );
  });

  it('affiche une popup si mapping modifié', () => {
    const onValider = vi.fn();
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={{}} onValider={onValider} />);

    // Ajouter une valeur pour modifier le mapping
    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    // La popup d'ajout apparaît — on remplit le champ type puis valeur
    const inputType = screen.getByPlaceholderText('Type (ex: PERSONNE)');
    const inputValeur = screen.getByPlaceholderText('Valeur');
    fireEvent.change(inputType, { target: { value: 'EMAIL' } });
    fireEvent.change(inputValeur, { target: { value: 'test@exemple.fr' } });
    fireEvent.click(screen.getByText('Ajouter'));

    // Maintenant le mapping est modifié → clic Valider doit montrer la popup
    fireEvent.click(screen.getByText('Valider et télécharger'));

    expect(screen.getByText('Modifications détectées')).toBeInTheDocument();
    expect(screen.getByText('Relancer l\'analyse')).toBeInTheDocument();
    expect(onValider).not.toHaveBeenCalled();
  });

  it('appelle onValider après avoir cliqué Continuer dans la popup', () => {
    const onValider = vi.fn();
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={{}} onValider={onValider} />);

    // Ajouter une valeur pour modifier le mapping
    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    const inputType = screen.getByPlaceholderText('Type (ex: PERSONNE)');
    const inputValeur = screen.getByPlaceholderText('Valeur');
    fireEvent.change(inputType, { target: { value: 'EMAIL' } });
    fireEvent.change(inputValeur, { target: { value: 'test@exemple.fr' } });
    fireEvent.click(screen.getByText('Ajouter'));

    fireEvent.click(screen.getByText('Valider et télécharger'));
    expect(screen.getByText('Modifications détectées')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Continuer'));
    expect(onValider).toHaveBeenCalledTimes(1);
  });

  it('relance l\'analyse au clic sur Relancer dans la popup', () => {
    const onValider = vi.fn();
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={{}} onValider={onValider} />);

    // Ajouter une valeur pour modifier le mapping
    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    const inputType = screen.getByPlaceholderText('Type (ex: PERSONNE)');
    const inputValeur = screen.getByPlaceholderText('Valeur');
    fireEvent.change(inputType, { target: { value: 'EMAIL' } });
    fireEvent.change(inputValeur, { target: { value: 'test@exemple.fr' } });
    fireEvent.click(screen.getByText('Ajouter'));

    fireEvent.click(screen.getByText('Valider et télécharger'));
    expect(screen.getByText('Modifications détectées')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Relancer l\'analyse'));
    // La popup doit disparaître
    expect(screen.queryByText('Modifications détectées')).not.toBeInTheDocument();
    // onValider n'a pas été appelé (on a relancé, pas validé)
    expect(onValider).not.toHaveBeenCalled();
  });

  it('affiche le bouton + Ajouter un pseudo', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('+ Ajouter un pseudo')).toBeInTheDocument();
  });
});