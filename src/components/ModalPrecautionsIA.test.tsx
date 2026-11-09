import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ModalPrecautionsIA } from './ModalPrecautionsIA';
import { renderAvecI18n } from '../test/renderAvecI18n';

describe('ModalPrecautionsIA', () => {
  it("n'affiche rien quand elle est fermée", () => {
    renderAvecI18n(<ModalPrecautionsIA ouvert={false} onFermer={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('affiche les sections de la notice', () => {
    renderAvecI18n(<ModalPrecautionsIA ouvert onFermer={vi.fn()} />);
    for (const titre of [
      'Ce que fait Maskita',
      "Ce qu'il ne fait pas",
      "Avant de l'envoyer, relisez-le",
      'Choisissez un service adapté',
      'Gardez la clé pour vous',
      'Préserver les pseudos',
    ]) {
      expect(screen.getByText(titre)).toBeInTheDocument();
    }
    expect(screen.getByText(/secret professionnel le cas échéant/)).toBeInTheDocument();
    expect(screen.getByText(/hébergeur certifié HDS/)).toBeInTheDocument();
  });

  it('se ferme au clic sur "Fermer"', () => {
    const onFermer = vi.fn();
    renderAvecI18n(<ModalPrecautionsIA ouvert onFermer={onFermer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onFermer).toHaveBeenCalled();
  });
});
