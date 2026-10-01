import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarreAjoutSelection } from './BarreAjoutSelection';

describe('BarreAjoutSelection', () => {
  it('affiche les libellés des trois boutons', () => {
    render(
      <BarreAjoutSelection
        onNouveauPseudo={() => {}}
        onNouvelleValeur={() => {}}
        onAjoutClassique={() => {}}
        libelleNouveauPseudo="Nouveau pseudo"
        libelleNouvelleValeur="Nouvelle valeur"
        libelleAjoutClassique="Ajouter un pseudo…"
      />,
    );
    expect(screen.getByText('Nouveau pseudo')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle valeur')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un pseudo…')).toBeInTheDocument();
  });

  it('rend 3 boutons dont l\'ajout classique : les 3 onClic sont appelés', () => {
    const onNouveauPseudo = vi.fn();
    const onNouvelleValeur = vi.fn();
    const onAjoutClassique = vi.fn();

    render(
      <BarreAjoutSelection
        onNouveauPseudo={onNouveauPseudo}
        onNouvelleValeur={onNouvelleValeur}
        onAjoutClassique={onAjoutClassique}
        libelleNouveauPseudo="Nouveau pseudo"
        libelleNouvelleValeur="Nouvelle valeur"
        libelleAjoutClassique="Ajouter un pseudo…"
      />,
    );

    // Les 3 boutons sont présents
    const boutons = screen.getAllByRole('button');
    expect(boutons).toHaveLength(3);

    // Le 3e bouton (ajout classique) est bien rendu et déclenche son callback
    fireEvent.click(screen.getByText('Ajouter un pseudo…'));
    expect(onAjoutClassique).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nouveau pseudo'));
    expect(onNouveauPseudo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nouvelle valeur'));
    expect(onNouvelleValeur).toHaveBeenCalledTimes(1);
  });
});
