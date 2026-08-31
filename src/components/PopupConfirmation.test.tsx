import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PopupConfirmation } from './PopupConfirmation';

describe('PopupConfirmation', () => {
  it('affiche le titre et le message', () => {
    render(
      <PopupConfirmation
        titre="Attention"
        message="Voulez-vous continuer ?"
        onConfirmer={vi.fn()}
        onAnnuler={vi.fn()}
      />,
    );
    expect(screen.getByText('Attention')).toBeInTheDocument();
    expect(screen.getByText('Voulez-vous continuer ?')).toBeInTheDocument();
  });

  it('affiche les boutons par défaut', () => {
    render(
      <PopupConfirmation
        titre="Test"
        message="Message"
        onConfirmer={vi.fn()}
        onAnnuler={vi.fn()}
      />,
    );
    expect(screen.getByText('Continuer')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('permet de personnaliser les boutons', () => {
    render(
      <PopupConfirmation
        titre="Test"
        message="Message"
        boutonConfirmer="Oui"
        boutonAnnuler="Non"
        onConfirmer={vi.fn()}
        onAnnuler={vi.fn()}
      />,
    );
    expect(screen.getByText('Oui')).toBeInTheDocument();
    expect(screen.getByText('Non')).toBeInTheDocument();
  });

  it('appelle onConfirmer au clic sur Continuer', () => {
    const onConfirmer = vi.fn();
    render(
      <PopupConfirmation
        titre="Test"
        message="Message"
        onConfirmer={onConfirmer}
        onAnnuler={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Continuer'));
    expect(onConfirmer).toHaveBeenCalledTimes(1);
  });

  it('appelle onAnnuler au clic sur Annuler', () => {
    const onAnnuler = vi.fn();
    render(
      <PopupConfirmation
        titre="Test"
        message="Message"
        onConfirmer={vi.fn()}
        onAnnuler={onAnnuler}
      />,
    );
    fireEvent.click(screen.getByText('Annuler'));
    expect(onAnnuler).toHaveBeenCalledTimes(1);
  });

  it('appelle onAnnuler au clic sur l\'overlay', () => {
    const onAnnuler = vi.fn();
    render(
      <PopupConfirmation
        titre="Test"
        message="Message"
        onConfirmer={vi.fn()}
        onAnnuler={onAnnuler}
      />,
    );
    // Clic sur l'overlay (l'arrière-plan)
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onAnnuler).toHaveBeenCalledTimes(1);
  });

  it('a le rôle dialog avec aria-modal', () => {
    render(
      <PopupConfirmation
        titre="Test"
        message="Message"
        onConfirmer={vi.fn()}
        onAnnuler={vi.fn()}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test');
  });
});