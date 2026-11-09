import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PanneauSuggestions, regrouperSuggestions } from './PanneauSuggestions';
import { renderAvecI18n } from '../test/renderAvecI18n';
import type { Detection } from '../utils/regex';

const det = (valeur: string, type: Detection['type'] = 'PERSONNE'): Detection =>
  ({ valeur, type, position: 0, longueur: valeur.length });

describe('regrouperSuggestions', () => {
  it('regroupe les doublons (casse ignorée) et compte les occurrences', () => {
    const s = regrouperSuggestions([det('Lambert'), det('lambert'), det('Paris', 'LIEU'), det('Lambert')]);
    expect(s).toEqual([
      { type: 'PERSONNE', valeur: 'Lambert', occurrences: 3 },
      { type: 'LIEU', valeur: 'Paris', occurrences: 1 },
    ]);
  });
});

describe('PanneauSuggestions', () => {
  it('masque les valeurs déjà présentes dans le mapping', () => {
    renderAvecI18n(
      <PanneauSuggestions
        suggestions={[det('Sophie Lambert'), det('Paris', 'LIEU')]}
        mapping={{ '[PERSONNE]': ['sophie lambert'] }}
        onAccepter={() => {}}
      />,
    );
    expect(screen.queryByText('Sophie Lambert')).toBeNull();
    expect(screen.getByText('Paris')).toBeTruthy();
  });

  it('n’ajoute rien sans clic, puis accepte une suggestion', () => {
    const onAccepter = vi.fn();
    renderAvecI18n(<PanneauSuggestions suggestions={[det('Sophie Lambert')]} mapping={{}} onAccepter={onAccepter} />);
    expect(onAccepter).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Accepter Sophie Lambert' }));
    expect(onAccepter).toHaveBeenCalledWith('PERSONNE', 'Sophie Lambert');
  });

  it('ignore une suggestion', () => {
    renderAvecI18n(<PanneauSuggestions suggestions={[det('Anamnèse', 'LIEU')]} mapping={{}} onAccepter={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ignorer Anamnèse' }));
    expect(screen.queryByText('Anamnèse')).toBeNull();
    expect(screen.getByText('Plus aucune suggestion.')).toBeTruthy();
  });

  it('accepte tout', () => {
    const onAccepter = vi.fn();
    renderAvecI18n(
      <PanneauSuggestions suggestions={[det('Sophie Lambert'), det('Lyon', 'LIEU')]} mapping={{}} onAccepter={onAccepter} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tout accepter' }));
    expect(onAccepter).toHaveBeenCalledTimes(2);
    expect(onAccepter).toHaveBeenCalledWith('LIEU', 'Lyon');
  });
});
