import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarreAjoutSelection } from './BarreAjoutSelection';

describe('BarreAjoutSelection', () => {
  it('affiche les libellés des deux boutons', () => {
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

  it('rend 2 boutons dont les onClic sont appelés', () => {
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

    const boutons = screen.getAllByRole('button');
    expect(boutons).toHaveLength(2);

    fireEvent.click(screen.getByText('Nouveau pseudo'));
    expect(onNouveauPseudo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nouvelle valeur'));
    expect(onNouvelleValeur).toHaveBeenCalledTimes(1);
  });
});