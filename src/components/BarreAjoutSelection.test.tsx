import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarreAjoutSelection } from './BarreAjoutSelection';

describe('BarreAjoutSelection', () => {
  it('affiche les libellés des deux boutons rapides', () => {
    render(
      <BarreAjoutSelection
        onNouveauPseudo={() => {}}
        onNouvelleValeur={() => {}}
        libelleNouveauPseudo="Nouveau pseudo"
        libelleNouvelleValeur="Nouvelle valeur"
      />,
    );
    expect(screen.getByText('Nouveau pseudo')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle valeur')).toBeInTheDocument();
  });

  it('rend 2 boutons (plus de bouton ajout classique)', () => {
    const onNouveauPseudo = vi.fn();
    const onNouvelleValeur = vi.fn();

    render(
      <BarreAjoutSelection
        onNouveauPseudo={onNouveauPseudo}
        onNouvelleValeur={onNouvelleValeur}
        libelleNouveauPseudo="Nouveau pseudo"
        libelleNouvelleValeur="Nouvelle valeur"
      />,
    );

    // Seulement 2 boutons
    const boutons = screen.getAllByRole('button');
    expect(boutons).toHaveLength(2);

    fireEvent.click(screen.getByText('Nouveau pseudo'));
    expect(onNouveauPseudo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nouvelle valeur'));
    expect(onNouvelleValeur).toHaveBeenCalledTimes(1);
  });
});