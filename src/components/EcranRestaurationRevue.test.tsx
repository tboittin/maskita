import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { EcranRestaurationRevue } from './EcranRestaurationRevue';
import { renderAvecI18n } from '../test/renderAvecI18n';

const TEXTE_TAGS = 'Rapport pour [PERSONNE]';
const TEXTE_RESTAURE = 'Rapport pour Sophie Lambert';
const MAPPING = { '[PERSONNE]': ['Sophie Lambert'] };

function rendu(overrides: Partial<Parameters<typeof EcranRestaurationRevue>[0]> = {}) {
  return renderAvecI18n(
    <EcranRestaurationRevue
      texteAvecTags={TEXTE_TAGS}
      texteRestauré={TEXTE_RESTAURE}
      mapping={MAPPING}
      onValider={vi.fn()}
      onRetour={vi.fn()}
      onAjouterValeur={vi.fn()}
      onRetirerValeur={vi.fn()}
      onDeplacerValeur={vi.fn()}
      onReordonnerValeurs={vi.fn()}
      onRenommerTag={vi.fn()}
      onSupprimerTag={vi.fn()}
      onAjouterTag={vi.fn()}
      {...overrides}
    />,
  );
}

describe('EcranRestaurationRevue', () => {
  it('affiche le tableau de mapping avec les tags', () => {
    rendu();
    expect(screen.getByText('Pseudos (1)')).toBeInTheDocument();
    expect(screen.getAllByText('[PERSONNE]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le panneau Texte pseudonymisé', () => {
    rendu();
    expect(screen.getByText('Texte pseudonymisé')).toBeInTheDocument();
    expect(screen.getAllByText(/\[PERSONNE\]/).length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le panneau Aperçu restauré', () => {
    rendu();
    expect(screen.getByText('Aperçu restauré')).toBeInTheDocument();
    expect(screen.getAllByText(/Sophie Lambert/).length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les deux boutons d\'action', () => {
    rendu();
    expect(screen.getByText('Recommencer')).toBeInTheDocument();
    expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
  });

  it('affiche les deux cases à cocher', () => {
    rendu();
    expect(screen.getByLabelText('Scroll synchronisé')).toBeInTheDocument();
    expect(screen.getByLabelText('Recentrer auto')).toBeInTheDocument();
  });

  it('appelle onValider au clic sur Valider et continuer', () => {
    const onValider = vi.fn();
    rendu({ onValider });
    fireEvent.click(screen.getByText('Valider et continuer'));
    expect(onValider).toHaveBeenCalledTimes(1);
  });

  it('appelle onRetour au clic sur Recommencer', () => {
    const onRetour = vi.fn();
    rendu({ onRetour });
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
        onAjouterValeur={vi.fn()}
        onRetirerValeur={vi.fn()}
        onDeplacerValeur={vi.fn()}
        onReordonnerValeurs={vi.fn()}
        onRenommerTag={vi.fn()}
        onSupprimerTag={vi.fn()}
        onAjouterTag={vi.fn()}
      />,
    );
    expect(screen.getByText('Pseudos (2)')).toBeInTheDocument();
    expect(screen.getAllByText('[PERSONNE]').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte pseudonymisé avec les tags', () => {
    rendu();
    expect(screen.getByText('Texte pseudonymisé')).toBeInTheDocument();
    expect(screen.getAllByText(/\[PERSONNE\]/).length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les valeurs restaurées dans l\'aperçu restauré', () => {
    rendu();
    expect(screen.getByText('Aperçu restauré')).toBeInTheDocument();
    expect(screen.getAllByText(/Sophie Lambert/).length).toBeGreaterThanOrEqual(1);
  });

  describe('US-V03 — Édition du mapping à l\'étape Restauration', () => {
    it('affiche le bouton « + Ajouter un pseudo » (onAjouterPseudo)', () => {
      rendu();
      expect(screen.getByText('+ Ajouter un pseudo')).toBeInTheDocument();
    });

    it('appelle onRetirerValeur au clic sur le bouton de retrait d\'une valeur', () => {
      const onRetirerValeur = vi.fn();
      rendu({ onRetirerValeur });
      fireEvent.click(screen.getByLabelText('Retirer Sophie Lambert'));
      expect(onRetirerValeur).toHaveBeenCalledWith('[PERSONNE]', 'Sophie Lambert');
    });

    it('appelle onAjouterValeur après saisie d\'une nouvelle valeur', () => {
      const onAjouterValeur = vi.fn();
      rendu({ onAjouterValeur });
      // Ouvrir le champ d'ajout inline
      fireEvent.click(screen.getByLabelText('Ajouter une valeur'));
      const input = screen.getByPlaceholderText('Nouvelle valeur…');
      fireEvent.change(input, { target: { value: 'Martin Dupont' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(onAjouterValeur).toHaveBeenCalledWith('[PERSONNE]', 'Martin Dupont');
    });

    it('ouvre la modale d\'ajout manuel et appelle onAjouterTag à la validation', () => {
      const onAjouterTag = vi.fn();
      rendu({ onAjouterTag });
      fireEvent.click(screen.getByText('+ Ajouter un pseudo'));

      // La modale est ouverte
      expect(screen.getByText('Ajouter un pseudo')).toBeInTheDocument();

      // Choisir un type (PERSONNE est pré-sélectionné par défaut dans les options non vides)
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'LIEU' } });
      const inputValeur = screen.getAllByPlaceholderText('Valeur')[0];
      fireEvent.change(inputValeur, { target: { value: 'Paris' } });

      fireEvent.click(screen.getByText('Ajouter'));
      expect(onAjouterTag).toHaveBeenCalledWith('LIEU', 'Paris');
    });

    it('ouvre la popup de confirmation et appelle onSupprimerTag à la validation', () => {
      const onSupprimerTag = vi.fn();
      rendu({ onSupprimerTag });
      // Ouvre la popup de suppression (bouton supprimer/poubelle)
      fireEvent.click(screen.getByLabelText('Supprimer'));

      // La popup de confirmation est affichée
      expect(screen.getByText('Supprimer le pseudo ?')).toBeInTheDocument();

      // Désambiguïser : la poubelle (aria-label « Supprimer ») est déjà présente,
      // le bouton danger « Supprimer » de la modale est le dernier bouton de ce nom.
      const boutonsSupprimer = screen.getAllByRole('button', { name: 'Supprimer' });
      const boutonConfirmer = boutonsSupprimer[boutonsSupprimer.length - 1];
      fireEvent.click(boutonConfirmer);
      expect(onSupprimerTag).toHaveBeenCalledWith('[PERSONNE]');
    });

    it('annule la suppression sans appeler onSupprimerTag', () => {
      const onSupprimerTag = vi.fn();
      rendu({ onSupprimerTag });
      fireEvent.click(screen.getByLabelText('Supprimer'));
      expect(screen.getByText('Supprimer le pseudo ?')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Annuler'));
      expect(onSupprimerTag).not.toHaveBeenCalled();
    });

    it('annule l\'ajout manuel sans appeler onAjouterTag', () => {
      const onAjouterTag = vi.fn();
      rendu({ onAjouterTag });
      fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
      expect(screen.getByText('Ajouter un pseudo')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Annuler'));
      expect(onAjouterTag).not.toHaveBeenCalled();
    });

    it('ajoute un pseudo avec un type personnalisé', () => {
      const onAjouterTag = vi.fn();
      rendu({ onAjouterTag });
      fireEvent.click(screen.getByText('+ Ajouter un pseudo'));

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '__custom__' } });
      const inputType = screen.getByPlaceholderText('Type (ex: PERSONNE)');
      fireEvent.change(inputType, { target: { value: 'OBJECTIF' } });
      const inputValeur = screen.getAllByPlaceholderText('Valeur')[0];
      fireEvent.change(inputValeur, { target: { value: 'Objectif clinique' } });

      fireEvent.click(screen.getByText('Ajouter'));
      expect(onAjouterTag).toHaveBeenCalledWith('OBJECTIF', 'Objectif clinique');
    });
  });
});