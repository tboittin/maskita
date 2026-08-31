import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PseudoTableau } from './PseudoTableau';
import { renderAvecI18n } from '../test/renderAvecI18n';

const TAGS = [
  { tag: '[EMAIL]', valeurs: ['test@exemple.fr'], estNouveau: false },
  { tag: '[TEL]', valeurs: ['0612345678'], estNouveau: true },
  { tag: '[VIDE]', valeurs: [], estNouveau: false },
];

const CONFLITS = [
  { type: 'doublon' as const, tag: '[EMAIL]', message: '"test@exemple.fr" existe aussi dans [EMAIL2]' },
];

describe('PseudoTableau', () => {
  const props = {
    tags: TAGS,
    conflits: CONFLITS,
    tagSurbrillance: null,
    valeurSurbrillance: null,
    onTagClick: vi.fn(),
    onValeurClick: vi.fn(),
    onDeplacerValeur: vi.fn(),
    onReordonnerValeurs: vi.fn(),
    onRenommer: vi.fn(),
    onSupprimer: vi.fn(),
    onAjouterValeur: vi.fn(),
    onRetirerValeur: vi.fn(),
    onAjouterTag: vi.fn(),
  };

  it('affiche les tags', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('[TEL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les valeurs', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    expect(screen.getByText('test@exemple.fr')).toBeInTheDocument();
    expect(screen.getByText('0612345678')).toBeInTheDocument();
  });

  it('affiche "vide" pour un tag sans valeur', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    const vides = screen.getAllByText('vide');
    expect(vides.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les conflits', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    expect(screen.getByText(/existe aussi dans/)).toBeInTheDocument();
  });

  it('affiche le bouton + Ajouter un pseudo', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    expect(boutons.length).toBeGreaterThanOrEqual(1);
  });

  it('ouvre le formulaire au clic sur Ajouter un pseudo', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    fireEvent.click(boutons[0]);
    expect(screen.getAllByPlaceholderText('Type (ex: PERSONNE)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('Valeur').length).toBeGreaterThanOrEqual(1);
  });

  it('appelle onAjouterTag avec les valeurs saisies', () => {
    const onAjouterTag = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onAjouterTag={onAjouterTag} />);

    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    fireEvent.click(boutons[0]);

    const types = screen.getAllByPlaceholderText('Type (ex: PERSONNE)');
    const valeurs = screen.getAllByPlaceholderText('Valeur');
    fireEvent.change(types[0], { target: { value: 'PERSONNE' } });
    fireEvent.change(valeurs[0], { target: { value: 'Sophie' } });

    const ajouters = screen.getAllByText('Ajouter');
    fireEvent.click(ajouters[0]);

    expect(onAjouterTag).toHaveBeenCalledWith('PERSONNE', 'Sophie');
  });

  it('annule le formulaire d\'ajout manuel', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    fireEvent.click(boutons[0]);
    fireEvent.click(screen.getByText('Annuler'));
    expect(screen.queryByPlaceholderText('Type (ex: PERSONNE)')).not.toBeInTheDocument();
  });

  it('appelle onSupprimer au clic sur 🗑', () => {
    const onSupprimer = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onSupprimer={onSupprimer} />);
    const poubelles = screen.getAllByTitle('Supprimer');
    fireEvent.click(poubelles[0]);
    expect(onSupprimer).toHaveBeenCalledWith('[EMAIL]');
  });

  it('appelle onRetirerValeur au clic sur ✕', () => {
    const onRetirerValeur = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onRetirerValeur={onRetirerValeur} />);
    const retirerBtns = screen.getAllByTitle('Retirer');
    fireEvent.click(retirerBtns[0]);
    expect(onRetirerValeur).toHaveBeenCalledWith('[EMAIL]', 'test@exemple.fr');
  });

  it('ouvre l\'input d\'ajout de valeur au clic sur +valeur', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    const plusValeurs = screen.getAllByTitle('Ajouter une valeur');
    fireEvent.click(plusValeurs[0]);
    expect(screen.getByPlaceholderText('Nouvelle valeur…')).toBeInTheDocument();
  });

  it('appelle onAjouterValeur avec Enter dans l\'input', () => {
    const onAjouterValeur = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onAjouterValeur={onAjouterValeur} />);
    fireEvent.click(screen.getAllByTitle('Ajouter une valeur')[0]);
    const inputNouveau = screen.getByPlaceholderText('Nouvelle valeur…');
    fireEvent.change(inputNouveau, { target: { value: 'nouveau@email.fr' } });
    fireEvent.keyDown(inputNouveau, { key: 'Enter' });
    expect(onAjouterValeur).toHaveBeenCalledWith('[EMAIL]', 'nouveau@email.fr');
  });

  it('ferme l\'input d\'ajout de valeur avec Escape', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    fireEvent.click(screen.getAllByTitle('Ajouter une valeur')[0]);
    const inputNouveau = screen.getByPlaceholderText('Nouvelle valeur…');
    fireEvent.keyDown(inputNouveau, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('Nouvelle valeur…')).not.toBeInTheDocument();
  });

  it('appelle onTagClick au clic sur une ligne', () => {
    const onTagClick = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onTagClick={onTagClick} />);
    fireEvent.click(screen.getByText('[EMAIL]'));
    expect(onTagClick).toHaveBeenCalledWith('[EMAIL]');
  });

  it('ouvre l\'édition du tag au double-clic', () => {
    renderAvecI18n(<PseudoTableau {...props} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const inputs = screen.getAllByDisplayValue('[EMAIL]');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renomme le tag avec Enter', () => {
    const onRenommer = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onRenommer={onRenommer} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const input = screen.getByDisplayValue('[EMAIL]');
    fireEvent.change(input, { target: { value: '[EMAIL_MODIFIE]' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenommer).toHaveBeenCalledWith('[EMAIL]', '[EMAIL_MODIFIE]');
  });

  it('annule le renommage avec Escape', () => {
    const onRenommer = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onRenommer={onRenommer} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const input = screen.getByDisplayValue('[EMAIL]');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onRenommer).not.toHaveBeenCalled();
  });

  it('annule le renommage au blur si vide', () => {
    const onRenommer = vi.fn();
    renderAvecI18n(<PseudoTableau {...props} onRenommer={onRenommer} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const input = screen.getByDisplayValue('[EMAIL]');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onRenommer).not.toHaveBeenCalled();
  });
});