import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderAvecI18n } from '../test/renderAvecI18n';
import { PanneauTableauPseudos } from './PanneauTableauPseudos';

const MAPPING = { '[PERSONNE]': ['Sophie Lambert'] };

function rendu(overrides: Partial<Parameters<typeof PanneauTableauPseudos>[0]> = {}) {
  return renderAvecI18n(
    <PanneauTableauPseudos
      mapping={MAPPING}
      activeTag={null}
      onSelectTag={vi.fn()}
      onClicValeur={vi.fn()}
      onAjouterValeur={vi.fn()}
      onRetirerValeur={vi.fn()}
      onDeplacerValeur={vi.fn()}
      onReordonnerValeurs={vi.fn()}
      onRenommerTag={vi.fn()}
      onSupprimerTag={vi.fn()}
      onAjouterTag={vi.fn()}
      {...overrides}
    />,
  );
}

describe('PanneauTableauPseudos (composant neutre partagé)', () => {
  it('affiche le tableau avec les tags et le nombre de pseudos', () => {
    rendu();
    expect(screen.getByText('Pseudos (1)')).toBeInTheDocument();
    expect(screen.getAllByText('[PERSONNE]').length).toBeGreaterThanOrEqual(1);
  });

  it('enrichit les lignes via construireLigne (statut "conflit")', () => {
    rendu({ construireLigne: () => ({ statut: 'conflit', conflitMessage: 'Doublon' }) });
    expect(screen.getByText('Doublon')).toBeInTheDocument();
  });

  it('appelle onRetirerValeur au clic sur le bouton de retrait', () => {
    const onRetirerValeur = vi.fn();
    rendu({ onRetirerValeur });
    fireEvent.click(screen.getByLabelText('Retirer Sophie Lambert'));
    expect(onRetirerValeur).toHaveBeenCalledWith('[PERSONNE]', 'Sophie Lambert');
  });

  it('appelle onAjouterValeur après saisie inline', () => {
    const onAjouterValeur = vi.fn();
    rendu({ onAjouterValeur });
    fireEvent.click(screen.getByLabelText('Ajouter une valeur'));
    const input = screen.getByPlaceholderText('Nouvelle valeur…');
    fireEvent.change(input, { target: { value: 'Martin' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onAjouterValeur).toHaveBeenCalledWith('[PERSONNE]', 'Martin');
  });

  it('ouvre la modale d\'ajout manuel et appelle onAjouterTag', () => {
    const onAjouterTag = vi.fn();
    rendu({ onAjouterTag });
    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'LIEU' } });
    fireEvent.change(screen.getAllByPlaceholderText('Valeur')[0], { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Ajouter'));
    expect(onAjouterTag).toHaveBeenCalledWith('LIEU', 'Paris');
  });

  it('confirme la suppression d\'un pseudo via la modale', () => {
    const onSupprimerTag = vi.fn();
    rendu({ onSupprimerTag });
    fireEvent.click(screen.getByLabelText('Supprimer'));
    expect(screen.getByText('Supprimer le pseudo ?')).toBeInTheDocument();
    const boutons = screen.getAllByRole('button', { name: 'Supprimer' });
    fireEvent.click(boutons[boutons.length - 1]);
    expect(onSupprimerTag).toHaveBeenCalledWith('[PERSONNE]');
  });

  it('transmet onConflitVoir au lien de conflit', () => {
    const onConflitVoir = vi.fn();
    rendu({ construireLigne: () => ({ statut: 'conflit', conflitMessage: 'Doublon' }), onConflitVoir });
    fireEvent.click(screen.getByRole('button', { name: 'voir' }));
    expect(onConflitVoir).toHaveBeenCalledWith('[PERSONNE]');
  });
});