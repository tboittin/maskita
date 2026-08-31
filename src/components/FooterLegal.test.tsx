import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FooterLegal } from './FooterLegal';

describe('FooterLegal', () => {
  it('affiche le bouton "Mentions légales"', () => {
    render(<FooterLegal />);
    expect(screen.getByText('Mentions légales')).toBeInTheDocument();
  });

  it('ouvre la popup au clic sur le bouton', () => {
    render(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));
    expect(screen.getByRole('dialog', { name: 'Mentions légales' })).toBeInTheDocument();
  });

  it('affiche les sections avec les données du fichier legal.json', () => {
      render(<FooterLegal />);
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
    render(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Fermer'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ferme la popup au clic sur l\'overlay', () => {
    render(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Cliquer sur l'overlay (le role="dialog" lui-même) le ferme
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});