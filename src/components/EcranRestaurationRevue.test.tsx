import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { EcranRestaurationRevue } from './EcranRestaurationRevue';
import { renderAvecI18n } from '../test/renderAvecI18n';

const TEXTE_TAGS = 'Rapport pour [PERSONNE]';
const TEXTE_RESTAURE = 'Rapport pour Sophie Lambert';
const MAPPING = { '[PERSONNE]': ['Sophie Lambert'] };

describe('EcranRestaurationRevue', () => {
  it('affiche le tableau de mapping avec les tags', () => {
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByText('Pseudos (1)')).toBeInTheDocument();
    expect(screen.getAllByText('[PERSONNE]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le panneau Texte pseudonymisé', () => {
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByText('Texte pseudonymisé')).toBeInTheDocument();
    expect(screen.getAllByText(/\[PERSONNE\]/).length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le panneau Aperçu restauré', () => {
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByText('Aperçu restauré')).toBeInTheDocument();
    expect(screen.getAllByText(/Sophie Lambert/).length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les deux boutons d\'action', () => {
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByText('Recommencer')).toBeInTheDocument();
    expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
  });

  it('affiche les deux cases à cocher', () => {
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Scroll synchronisé')).toBeInTheDocument();
    expect(screen.getByLabelText('Recentrer auto')).toBeInTheDocument();
  });

  it('appelle onValider au clic sur Valider et continuer', () => {
    const onValider = vi.fn();

    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={onValider}
        onRetour={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Valider et continuer'));

    expect(onValider).toHaveBeenCalledTimes(1);
  });

  it('appelle onRetour au clic sur Recommencer', () => {
    const onRetour = vi.fn();

    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={onRetour}
      />,
    );

    fireEvent.click(screen.getByText('Recommencer'));

    expect(onRetour).toHaveBeenCalledTimes(1);
  });

  it('affiche tous les tags du mapping dans le tableau', () => {
    const mappingMulti = {
      '[PERSONNE]': ['Sophie Lambert'],
      '[EMAIL]': ['sophie@exemple.fr'],
    };

    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags="Rapport pour [PERSONNE] ([EMAIL])"
        texteRestauré="Rapport pour Sophie Lambert (sophie@exemple.fr)"
        mapping={mappingMulti}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByText('Pseudos (2)')).toBeInTheDocument();
    expect(screen.getAllByText('[PERSONNE]').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte pseudonymisé avec les tags', () => {
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByText('Texte pseudonymisé')).toBeInTheDocument();
    expect(screen.getAllByText(/\[PERSONNE\]/).length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les valeurs restaurées dans l\'aperçu restauré', () => {
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
      />,
    );

    expect(screen.getByText('Aperçu restauré')).toBeInTheDocument();
    expect(screen.getAllByText(/Sophie Lambert/).length).toBeGreaterThanOrEqual(1);
  });
});
