import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderAvecI18n } from '../test/renderAvecI18n';
import { PanneauApercus } from './PanneauApercus';

const MAPPING = { '[PERSONNE]': ['Sophie Lambert'] };

function rendu(overrides: Partial<Parameters<typeof PanneauApercus>[0]> = {}) {
  return renderAvecI18n(
    <PanneauApercus
      mapping={MAPPING}
      tagSurbrillance={null}
      valeurSurbrillance={null}
      syncScroll
      voletHaut={{ titre: 'Volet haut', texte: 'Texte [PERSONNE]', surlignerTags: true }}
      voletBas={{ titre: 'Volet bas', texte: 'Texte Sophie Lambert', surlignerValeurs: true }}
      {...overrides}
    />,
  );
}

describe('PanneauApercus (composant neutre partagé)', () => {
  it('affiche les deux volets texte', () => {
    rendu();
    expect(screen.getByText('Volet haut')).toBeInTheDocument();
    expect(screen.getByText('Volet bas')).toBeInTheDocument();
  });

  it('appelle onClicTag du volet haut quand on clique sur un tag', () => {
    const onClicTag = vi.fn();
    rendu({
      tagSurbrillance: '[PERSONNE]',
      voletHaut: { titre: 'Volet haut', texte: '[PERSONNE]', surlignerTags: true, onClicTag },
    });
    fireEvent.click(screen.getAllByText(/\[PERSONNE\]/)[0]);
    expect(onClicTag).toHaveBeenCalledWith('[PERSONNE]');
  });

  it('appelle onClicValeur du volet bas quand on clique sur une valeur', () => {
    const onClicValeur = vi.fn();
    rendu({
      tagSurbrillance: '[PERSONNE]',
      voletBas: { titre: 'Volet bas', texte: 'Sophie Lambert', surlignerValeurs: true, onClicValeur },
    });
    fireEvent.click(screen.getAllByText(/Sophie Lambert/)[0]);
    expect(onClicValeur).toHaveBeenCalledWith('[PERSONNE]', 'Sophie Lambert');
  });

  it('affiche les surcouches toolbar fournies', () => {
    rendu({
      voletHaut: { titre: 'Volet haut', texte: 'x', toolbar: <button type="button">Action</button> },
    });
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('synchronise le défilement sans erreur', () => {
    rendu();
    const scrollables = document.querySelectorAll('div[style*="max-height"]');
    for (const el of scrollables) {
      fireEvent.scroll(el);
    }
  });
});