import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { PanneauIA } from './PanneauIA';
import { renderAvecI18n } from '../test/renderAvecI18n';
import { fr } from '../i18n/fr';

function simulerPressePapier(writeText: (texte: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PanneauIA', () => {
  it("affiche l'avertissement court et les deux actions", () => {
    renderAvecI18n(<PanneauIA />);
    expect(screen.getByText('Et ensuite ? Utiliser une IA')).toBeInTheDocument();
    expect(screen.getByText(/il peut rester une donnée de santé couverte par le secret professionnel/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier le prompt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Précautions avant d'utiliser une IA" })).toBeInTheDocument();
  });

  it('copie le prompt dans le presse-papier et le confirme', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    simulerPressePapier(writeText);
    renderAvecI18n(<PanneauIA />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier le prompt' }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Prompt copié/ })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(fr['ia.prompt']);
    expect(screen.getByText(/Collez ce prompt dans l'IA/)).toBeInTheDocument();
  });

  it('affiche le prompt à copier à la main si le presse-papier échoue', async () => {
    simulerPressePapier(vi.fn().mockRejectedValue(new Error('refusé')));
    renderAvecI18n(<PanneauIA />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier le prompt' }));

    const zone = await screen.findByRole('textbox', { name: 'Prompt à copier' });
    expect(zone).toHaveValue(fr['ia.prompt']);
    expect(screen.getByText(/Copie automatique impossible/)).toBeInTheDocument();
  });

  it('ouvre les précautions dans une modale', () => {
    renderAvecI18n(<PanneauIA />);
    fireEvent.click(screen.getByRole('button', { name: "Précautions avant d'utiliser une IA" }));
    expect(screen.getByRole('dialog', { name: "Précautions avant d'utiliser une IA" })).toBeInTheDocument();
  });
});
