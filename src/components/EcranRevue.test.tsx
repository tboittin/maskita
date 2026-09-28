import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { EcranRevue } from './EcranRevue';
import { renderAvecI18n } from '../test/renderAvecI18n';

const TEXTE = 'Contact : test@exemple.fr ou 0612345678';
const MAPPING = { '[EMAIL]': ['test@exemple.fr'] };

describe('EcranRevue', () => {
  it('affiche le tableau des tags', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte pseudonymisé', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte pseudonymisé/)).toBeInTheDocument();
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte lisible', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte lisible/)).toBeInTheDocument();
  });

  it('affiche le bouton Valider', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
  });

  it('appelle onValider au clic sur le bouton (mapping inchangé)', () => {
    const onValider = vi.fn();
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.click(screen.getByText('Valider et continuer'));

    expect(onValider).toHaveBeenCalledTimes(1);
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr'] }),
      expect.stringContaining('[EMAIL]'),
    );
  });

  it('appelle onValider avec le mapping modifié au clic sur Valider', () => {
    const onValider = vi.fn();
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={{}} onValider={onValider} />);

    // Ajouter une valeur pour modifier le mapping
    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    const selectType = screen.getByRole('combobox');
    const inputValeur = screen.getByPlaceholderText('Valeur');
    fireEvent.change(selectType, { target: { value: 'EMAIL' } });
    fireEvent.change(inputValeur, { target: { value: 'test@exemple.fr' } });
    fireEvent.click(screen.getByText('Ajouter'));

    // Le mapping est modifié → clic Valider appelle onValider avec les bonnes données
    fireEvent.click(screen.getByText('Valider et continuer'));

    expect(onValider).toHaveBeenCalledTimes(1);
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr'] }),
      expect.stringContaining('[EMAIL]'),
    );

    // Aucune modale de confirmation ne s'affiche
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('affiche le bouton + Ajouter un pseudo', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('+ Ajouter un pseudo')).toBeInTheDocument();
  });

  describe('Affichage du résultat de la vérification initiale', () => {
    it('affiche tous les tags du mapping dans le tableau', () => {
      const mappingComplet = {
        '[EMAIL]': ['test@exemple.fr'],
        '[TELEPHONE]': ['0612345678'],
      };
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={mappingComplet} onValider={vi.fn()} />);
      expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('[TELEPHONE]').length).toBeGreaterThanOrEqual(1);
    });

    it('affiche le texte pseudonymisé avec les tags', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText(/Texte pseudonymisé/)).toBeInTheDocument();
      expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
    });

    it('affiche le texte lisible avec les valeurs originales', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText(/Texte lisible/)).toBeInTheDocument();
    });

    it('affiche le compte des pseudos dans le titre du tableau', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText('Pseudos (1)')).toBeInTheDocument();
    });

    it('affiche le bouton Valider et continuer', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
    });
  });
});