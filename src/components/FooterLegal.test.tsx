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
      // Le nom apparaît dans les sections Éditeur et EI
      expect(screen.getAllByText(/Thomas Fleuriel Boittin/).length).toBe(2);
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

  it('affiche les infos EI (SIREN, mention) dans la popup', () => {
    renderAvecI18n(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));

    // SIREN apparaît dans les sections Éditeur et EI
    expect(screen.getAllByText(/^SIREN/).length).toBe(2);
    // Entrepreneur individuel apparaît comme contenu et comme titre de section
    expect(screen.getAllByText('Entrepreneur individuel').length).toBe(2);
  });

  it('affiche le bouton "Afficher les coordonnées" dans la popup', () => {
    renderAvecI18n(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));

    expect(screen.getByText('Afficher les coordonnées')).toBeInTheDocument();
  });

  it('les coordonnées NE sont PAS dans le DOM avant le clic', () => {
    renderAvecI18n(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));

    expect(screen.getByText('Afficher les coordonnées')).toBeInTheDocument();
    expect(screen.queryByText(/06 12 34 56 78/)).not.toBeInTheDocument();
    expect(screen.queryByText(/tboittin@gmail\.com/)).not.toBeInTheDocument();
  });

  it('au clic sur "Afficher les coordonnées", les valeurs décodées apparaissent', () => {
    renderAvecI18n(<FooterLegal />);
    fireEvent.click(screen.getByText('Mentions légales'));

    fireEvent.click(screen.getByText('Afficher les coordonnées'));

    // Le téléphone n'apparaît que dans la section EI (pas dans Éditeur)
    expect(screen.getByText(/06 12 34 56 78/)).toBeInTheDocument();
    // L'email décodé n'apparaît que dans la section EI
    expect(screen.getByText(/tboittin@gmail\.com/)).toBeInTheDocument();
    // L'adresse décodée n'apparaît que dans la section EI
    expect(screen.getByText(/200, impasse des cerisiers/)).toBeInTheDocument();
    expect(screen.queryByText('Afficher les coordonnées')).not.toBeInTheDocument();
  });
});
