import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { FooterLegal } from './FooterLegal';
import { renderAvecI18n } from '../test/renderAvecI18n';

describe('FooterLegal', () => {
  it('affiche le bouton "Mentions légales"', () => {
    renderAvecI18n(<FooterLegal />);
    expect(screen.getByText('Mentions légales')).toBeInTheDocument();
  });

  it('ouvre la popup au clic sur le bouton', () => {
    renderAvecI18n(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));
    expect(screen.getByRole('dialog', { name: 'Mentions légales' })).toBeInTheDocument();
  });

  it('affiche les sections avec les données du fichier legal.json', () => {
      renderAvecI18n(<FooterLegal />);
      fireEvent.click(screen.getByText('Mentions légales'));

      expect(screen.getByText('Éditeur')).toBeInTheDocument();
      expect(screen.getByText('Hébergement')).toBeInTheDocument();
      expect(screen.getByText('Protection des données')).toBeInTheDocument();
      expect(screen.getByText('Propriété intellectuelle')).toBeInTheDocument();
      expect(screen.getByText('Responsabilité')).toBeInTheDocument();
      expect(screen.getByText('Thomas Fleuriel Boittin')).toBeInTheDocument();
      expect(screen.getByText(/licence MIT/)).toBeInTheDocument();
    });

  it('ferme la popup au clic sur "Fermer"', () => {
    renderAvecI18n(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Fermer'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ferme la popup au clic sur l\'overlay', () => {
    renderAvecI18n(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Cliquer sur l'overlay (fond sombre derrière la modale) le ferme
    const overlay = screen.getByRole('dialog').previousElementSibling as HTMLElement;
    fireEvent.click(overlay);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});