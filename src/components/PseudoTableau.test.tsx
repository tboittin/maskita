import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PseudoTableau } from './PseudoTableau';

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
    render(<PseudoTableau {...props} />);
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('[TEL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les valeurs', () => {
    render(<PseudoTableau {...props} />);
    expect(screen.getByText('test@exemple.fr')).toBeInTheDocument();
    expect(screen.getByText('0612345678')).toBeInTheDocument();
  });

  it('affiche "vide" pour un tag sans valeur', () => {
    render(<PseudoTableau {...props} />);
    const vides = screen.getAllByText('vide');
    expect(vides.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les conflits', () => {
    render(<PseudoTableau {...props} />);
    expect(screen.getByText(/existe aussi dans/)).toBeInTheDocument();
  });

  it('affiche le bouton + Ajouter un pseudo', () => {
    render(<PseudoTableau {...props} />);
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    expect(boutons.length).toBeGreaterThanOrEqual(1);
  });

  it('ouvre le formulaire au clic sur Ajouter un pseudo', () => {
    render(<PseudoTableau {...props} />);
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    fireEvent.click(boutons[0]);
    expect(screen.getAllByPlaceholderText('Type (ex: PERSONNE)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('Valeur').length).toBeGreaterThanOrEqual(1);
  });

  it('appelle onAjouterTag avec les valeurs saisies', () => {
    const onAjouterTag = vi.fn();
    render(<PseudoTableau {...props} onAjouterTag={onAjouterTag} />);

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
    render(<PseudoTableau {...props} />);
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    fireEvent.click(boutons[0]);
    fireEvent.click(screen.getByText('Annuler'));
    expect(screen.queryByPlaceholderText('Type (ex: PERSONNE)')).not.toBeInTheDocument();
  });

  it('appelle onSupprimer au clic sur 🗑', () => {
    const onSupprimer = vi.fn();
    render(<PseudoTableau {...props} onSupprimer={onSupprimer} />);
    const poubelles = screen.getAllByTitle('Supprimer');
    fireEvent.click(poubelles[0]);
    expect(onSupprimer).toHaveBeenCalledWith('[EMAIL]');
  });

  it('appelle onRetirerValeur au clic sur ✕', () => {
    const onRetirerValeur = vi.fn();
    render(<PseudoTableau {...props} onRetirerValeur={onRetirerValeur} />);
    const retirerBtns = screen.getAllByTitle('Retirer');
    fireEvent.click(retirerBtns[0]);
    expect(onRetirerValeur).toHaveBeenCalledWith('[EMAIL]', 'test@exemple.fr');
  });

  it('ouvre l\'input d\'ajout de valeur au clic sur +valeur', () => {
    render(<PseudoTableau {...props} />);
    const plusValeurs = screen.getAllByTitle('Ajouter une valeur');
    fireEvent.click(plusValeurs[0]);
    expect(screen.getByPlaceholderText('Nouvelle valeur…')).toBeInTheDocument();
  });

  it('appelle onAjouterValeur avec Enter dans l\'input', () => {
    const onAjouterValeur = vi.fn();
    render(<PseudoTableau {...props} onAjouterValeur={onAjouterValeur} />);
    fireEvent.click(screen.getAllByTitle('Ajouter une valeur')[0]);
    const inputNouveau = screen.getByPlaceholderText('Nouvelle valeur…');
    fireEvent.change(inputNouveau, { target: { value: 'nouveau@email.fr' } });
    fireEvent.keyDown(inputNouveau, { key: 'Enter' });
    expect(onAjouterValeur).toHaveBeenCalledWith('[EMAIL]', 'nouveau@email.fr');
  });

  it('ferme l\'input d\'ajout de valeur avec Escape', () => {
    render(<PseudoTableau {...props} />);
    fireEvent.click(screen.getAllByTitle('Ajouter une valeur')[0]);
    const inputNouveau = screen.getByPlaceholderText('Nouvelle valeur…');
    fireEvent.keyDown(inputNouveau, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('Nouvelle valeur…')).not.toBeInTheDocument();
  });

  it('appelle onTagClick au clic sur une ligne', () => {
    const onTagClick = vi.fn();
    render(<PseudoTableau {...props} onTagClick={onTagClick} />);
    fireEvent.click(screen.getByText('[EMAIL]'));
    expect(onTagClick).toHaveBeenCalledWith('[EMAIL]');
  });

  it('ouvre l\'édition du tag au double-clic', () => {
    render(<PseudoTableau {...props} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const inputs = screen.getAllByDisplayValue('[EMAIL]');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renomme le tag avec Enter', () => {
    const onRenommer = vi.fn();
    render(<PseudoTableau {...props} onRenommer={onRenommer} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const input = screen.getByDisplayValue('[EMAIL]');
    fireEvent.change(input, { target: { value: '[EMAIL_MODIFIE]' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenommer).toHaveBeenCalledWith('[EMAIL]', '[EMAIL_MODIFIE]');
  });

  it('annule le renommage avec Escape', () => {
    const onRenommer = vi.fn();
    render(<PseudoTableau {...props} onRenommer={onRenommer} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const input = screen.getByDisplayValue('[EMAIL]');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onRenommer).not.toHaveBeenCalled();
  });

  it('annule le renommage au blur si vide', () => {
    const onRenommer = vi.fn();
    render(<PseudoTableau {...props} onRenommer={onRenommer} />);
    fireEvent.doubleClick(screen.getByText('[EMAIL]'));
    const input = screen.getByDisplayValue('[EMAIL]');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onRenommer).not.toHaveBeenCalled();
  });
});