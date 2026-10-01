import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderAvecI18n } from '../test/renderAvecI18n';
import { ModalAjoutClassique } from './ModalAjoutClassique';

function rendu(overrides: Partial<Parameters<typeof ModalAjoutClassique>[0]> = {}) {
  const onValider = vi.fn();
  const onAnnuler = vi.fn();
  const result = renderAvecI18n(
    <ModalAjoutClassique
      ouvert={true}
      valeurInitiale=""
      texteOriginal="M. Lefevre est médecin. Lefevre habite à Paris."
      onValider={onValider}
      onAnnuler={onAnnuler}
      titre="Ajouter un pseudo"
      labelType="Pseudo"
      labelValeur="Valeur"
      libelleType="Type de pseudo…"
      libelleTypeCustom="Autre…"
      libelleAjouter="Ajouter"
      libelleAnnuler="Annuler"
      placeholderType="Type (ex: PERSONNE)"
      placeholderValeur="Valeur"
      alerteCrochet="Alerte crochet"
      {...overrides}
    />,
  );
  return { onValider, onAnnuler, ...result };
}

describe('SUG-C — Autocomplétion du champ Valeur', () => {
  it('affiche des suggestions quand on tape un préfixe', () => {
    rendu();
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'L' } });
    // "Lefevre" et "Lefevre" (dédoublonné) mais pas "M." ni "est" ni "médecin"
    const suggestions = screen.getByRole('listbox');
    expect(suggestions).toBeInTheDocument();
    const options = suggestions.querySelectorAll('[role="option"]');
    // options: "Lefevre" (1ère occurrence), "Lefevre" (dédupliquée → absente)
    // After dedup in extraireMots, only one "Lefevre"
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent('Lefevre');
  });

  it("n'affiche pas de suggestions quand le champ est vide", () => {
    rendu();
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it("n'affiche pas de suggestions quand la valeur tapée existe exactement dans le texte", () => {
    rendu();
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    // "Lefevre" existe exactement dans le texte original
    fireEvent.change(input, { target: { value: 'Lefevre' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('remplit la valeur au clic sur une suggestion', () => {
    rendu();
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'L' } });
    const suggestion = screen.getByRole('option', { name: 'Lefevre' });
    fireEvent.click(suggestion);
    expect(input.value).toBe('Lefevre');
    // La liste est fermée après sélection
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('sélectionne la première suggestion avec Tab', () => {
    rendu();
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'L' } });
    // Tab avec suggestions visibles
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(input.value).toBe('Lefevre');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('ferme les suggestions avec Escape', () => {
    rendu();
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'L' } });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    // La valeur saisie est conservée
    expect(input.value).toBe('L');
  });

  it("n'affiche pas de suggestions quand texteOriginal est vide", () => {
    rendu({ texteOriginal: '' });
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'L' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('suggère des mots insensibles à la casse', () => {
    rendu();
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'PAR' } });
    const suggestions = screen.getByRole('listbox');
    const options = suggestions.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThanOrEqual(1);
    expect(options[0]).toHaveTextContent('Paris');
  });

  it('préremplit toujours la valeur depuis valeurInitiale (SUG-B)', () => {
    rendu({ valeurInitiale: 'Sophie Lambert' });
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    expect(input.value).toBe('Sophie Lambert');
  });

  it("désactive le bouton si la valeur contient des crochets (INT-2)", () => {
    rendu({ valeurInitiale: '[TEST]' });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERSONNE' } });
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
    expect(screen.getByText('Alerte crochet')).toBeInTheDocument();
  });
});
describe('ModalAjoutClassique', () => {
  it('affiche la modale avec le titre et les champs', () => {
    rendu();
    expect(screen.getByRole('dialog', { name: 'Ajouter un pseudo' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Valeur')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('préremplit le champ Valeur depuis valeurInitiale', () => {
    rendu({ valeurInitiale: 'Sophie Lambert' });
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    expect(input.value).toBe('Sophie Lambert');
  });

  it('désactive le bouton Ajouter quand les champs sont vides', () => {
    rendu({ valeurInitiale: '' });
    const boutonAjouter = screen.getByRole('button', { name: 'Ajouter' });
    expect(boutonAjouter).toBeDisabled();
  });

  it('active le bouton Ajouter quand Type et Valeur sont remplis', () => {
    rendu({ valeurInitiale: 'Sophie Lambert' });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERSONNE' } });
    const boutonAjouter = screen.getByRole('button', { name: 'Ajouter' });
    expect(boutonAjouter).not.toBeDisabled();
  });

  it('appelle onValider avec le type et la valeur sélectionnés', () => {
    const { onValider } = rendu({ valeurInitiale: 'Sophie Lambert' });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERSONNE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(onValider).toHaveBeenCalledWith('PERSONNE', 'Sophie Lambert');
  });

  it('appelle onAnnuler au clic sur Annuler', () => {
    const { onAnnuler } = rendu();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onAnnuler).toHaveBeenCalledTimes(1);
  });

  it('permet la saisie d\'un type personnalisé', () => {
    rendu({ valeurInitiale: 'Paris' });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '__custom__' } });
    const customInput = screen.getByPlaceholderText('Type (ex: PERSONNE)') as HTMLInputElement;
    expect(customInput).toBeInTheDocument();
    fireEvent.change(customInput, { target: { value: 'VILLE' } });
    expect(customInput.value).toBe('VILLE');
    // Le bouton doit être actif
    const boutonAjouter = screen.getByRole('button', { name: 'Ajouter' });
    expect(boutonAjouter).not.toBeDisabled();
  });

  it('appelle onValider avec un type personnalisé', () => {
    const { onValider } = rendu({ valeurInitiale: 'Paris' });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '__custom__' } });
    const customInput = screen.getByPlaceholderText('Type (ex: PERSONNE)');
    fireEvent.change(customInput, { target: { value: 'VILLE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(onValider).toHaveBeenCalledWith('VILLE', 'Paris');
  });

  it('affiche une alerte et désactive le bouton quand la valeur contient des crochets', () => {
    const { onValider } = rendu({ valeurInitiale: '[ADRESSE]' });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERSONNE' } });
    // L'alerte est visible
    expect(screen.getByText('Alerte crochet')).toBeInTheDocument();
    // Le bouton est désactivé
    const boutonAjouter = screen.getByRole('button', { name: 'Ajouter' });
    expect(boutonAjouter).toBeDisabled();
    fireEvent.click(boutonAjouter);
    expect(onValider).not.toHaveBeenCalled();
  });

  it('réactive le bouton quand la valeur est corrigée (plus de crochet)', () => {
    rendu({ valeurInitiale: '[ADRESSE]' });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERSONNE' } });
    const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
    expect(input.value).toBe('[ADRESSE]');
    expect(screen.getByText('Alerte crochet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled();

    // Corriger la valeur : enlever les crochets
    fireEvent.change(input, { target: { value: '12 rue de Paris' } });
    expect(screen.queryByText('Alerte crochet')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ajouter' })).not.toBeDisabled();
  });

  it("n'affiche pas d'alerte pour une valeur préremplie valide", () => {
    rendu({ valeurInitiale: 'Sophie Lambert' });
    expect(screen.queryByText('Alerte crochet')).toBeNull();
    const boutonAjouter = screen.getByRole('button', { name: 'Ajouter' });
    expect(boutonAjouter).toBeDisabled(); // type vide encore
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PERSONNE' } });
    expect(boutonAjouter).not.toBeDisabled();
  });
});
