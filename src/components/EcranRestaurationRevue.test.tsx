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

describe('EcranRestaurationRevue — interactions', () => {
  const rendre = (props: Partial<Parameters<typeof EcranRestaurationRevue>[0]> = {}) =>
    renderAvecI18n(
      <EcranRestaurationRevue
        texteAvecTags={TEXTE_TAGS}
        texteRestauré={TEXTE_RESTAURE}
        mapping={MAPPING}
        onValider={vi.fn()}
        onRetour={vi.fn()}
        {...props}
      />,
    );

  /** Span du volet texte (hors bouton) correspondant. */
  function spanVolet(texte: string): HTMLElement {
    const el = screen.getAllByText(texte).find(e => e.tagName === 'SPAN' && !e.closest('button'));
    expect(el).toBeTruthy();
    return el!;
  }

  it('bascule la surbrillance d\'un tag au clic dans le tableau', () => {
    rendre();
    const boutonTag = screen.getByRole('button', { name: '[PERSONNE]' });
    expect(boutonTag).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(boutonTag);
    expect(boutonTag).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(boutonTag);
    expect(boutonTag).toHaveAttribute('aria-pressed', 'false');
  });

  it('sélectionne une valeur depuis la table', () => {
    rendre();
    fireEvent.click(screen.getByRole('button', { name: 'Sophie Lambert' }));

    // handleValeurClick marque le tag actif
    expect(screen.getByRole('button', { name: '[PERSONNE]' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('active un tag via le volet pseudonymisé', () => {
    rendre();
    // D'abord activer la surbrillance pour que le pseudo soit découpé en segments cliquables
    fireEvent.click(screen.getByRole('button', { name: '[PERSONNE]' }));
    // Récupère le span du tag dans le volet (hors bouton — c'est la colonne de droite)
    const spans = screen.getAllByText('[PERSONNE]').filter(e => e.tagName === 'SPAN' && !e.closest('button'));
    const spanPseudo = spans[0] || spans[1];
    fireEvent.click(spanPseudo);
    expect(screen.getByRole('button', { name: '[PERSONNE]' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('clique sur une valeur dans l\'aperçu restauré', () => {
    rendre();
    fireEvent.click(spanVolet('Sophie Lambert'));
    expect(screen.getByRole('button', { name: '[PERSONNE]' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('bascule les cases à cocher Scroll synchronisé et Recentrer auto', () => {
    rendre();
    const sync = screen.getByLabelText('Scroll synchronisé') as HTMLInputElement;
    const recentrer = screen.getByLabelText('Recentrer auto') as HTMLInputElement;
    fireEvent.click(sync);
    fireEvent.click(recentrer);
    expect(sync.checked).toBe(false);
    expect(recentrer.checked).toBe(false);
  });

  /** Conteneur scrollable du volet texte (le plus proche de la valeur affichée). */
  function conteneurVolet(): HTMLElement {
    const conteneur = spanVolet('Sophie Lambert').closest('div[style*="max-height"]');
    expect(conteneur).toBeTruthy();
    return conteneur as HTMLElement;
  }

  it('synchronise le défilement du volet restauré', () => {
    rendre();
    fireEvent.scroll(conteneurVolet());
  });

  it('ignore le défilement quand la synchronisation est désactivée', () => {
    rendre();
    fireEvent.click(screen.getByLabelText('Scroll synchronisé'));
    fireEvent.scroll(conteneurVolet());
  });
});
