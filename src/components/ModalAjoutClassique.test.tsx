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
