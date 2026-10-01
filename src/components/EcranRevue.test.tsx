import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { EcranRevue } from './EcranRevue';
import { renderAvecI18n } from '../test/renderAvecI18n';

const TEXTE = 'Contact : test@exemple.fr ou 0612345678';
const MAPPING = { '[EMAIL]': ['test@exemple.fr'] };

// Simule une sélection de texte dans le volet via window.getSelection
function simulerSelection(texte: string) {
  vi.spyOn(window, 'getSelection')
    .mockReturnValue({ toString: () => texte } as unknown as Selection);
}

function restaurerSelection() {
  vi.restoreAllMocks();
}

/** Récupère un élément <span> (hors bouton) dont le texte correspond. */
function spanParTexte(texte: string | RegExp): HTMLElement {
  const elements = screen.getAllByText(texte);
  const span = elements.find(el => el.tagName === 'SPAN' && !el.closest('button'));
  expect(span).toBeTruthy();
  return span!;
}

afterEach(() => {
  restaurerSelection();
});

describe('EcranRevue', () => {
  it('affiche le tableau des tags', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte pseudonymisé', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte pseudonymisé/)).toBeInTheDocument();
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le texte lisible', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte lisible/)).toBeInTheDocument();
  });

  it('affiche le bouton Valider', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
  });

  it('appelle onValider au clic sur le bouton (mapping inchangé)', () => {
    const onValider = vi.fn();
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.click(screen.getByText('Valider et continuer'));

    expect(onValider).toHaveBeenCalledTimes(1);
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr'] }),
      expect.stringContaining('[EMAIL]'),
    );
  });

  it('appelle onValider avec le mapping modifié au clic sur Valider', () => {
    const onValider = vi.fn();
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={{}} onValider={onValider} />);

    // Ajouter une valeur pour modifier le mapping
    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    const selectType = screen.getByRole('combobox');
    const inputValeur = screen.getByPlaceholderText('Valeur');
    fireEvent.change(selectType, { target: { value: 'EMAIL' } });
    fireEvent.change(inputValeur, { target: { value: 'test@exemple.fr' } });
    fireEvent.click(screen.getByText('Ajouter'));

    // Le mapping est modifié → clic Valider appelle onValider avec les bonnes données
    fireEvent.click(screen.getByText('Valider et continuer'));

    expect(onValider).toHaveBeenCalledTimes(1);
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr'] }),
      expect.stringContaining('[EMAIL]'),
    );

    // Aucune modale de confirmation ne s'affiche
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('affiche le bouton + Ajouter un pseudo', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('+ Ajouter un pseudo')).toBeInTheDocument();
  });

  describe('Affichage du résultat de la vérification initiale', () => {
    it('affiche tous les tags du mapping dans le tableau', () => {
      const mappingComplet = {
        '[EMAIL]': ['test@exemple.fr'],
        '[TELEPHONE]': ['0612345678'],
      };
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={mappingComplet} onValider={vi.fn()} />);
      expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('[TELEPHONE]').length).toBeGreaterThanOrEqual(1);
    });

    it('affiche le texte pseudonymisé avec les tags', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText(/Texte pseudonymisé/)).toBeInTheDocument();
      expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
    });

    it('affiche le texte lisible avec les valeurs originales', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText(/Texte lisible/)).toBeInTheDocument();
    });

    it('affiche le compte des pseudos dans le titre du tableau', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText('Pseudos (1)')).toBeInTheDocument();
    });

    it('affiche le bouton Valider et continuer', () => {
      renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
      expect(screen.getByText('Valider et continuer')).toBeInTheDocument();
    });
  });
});

describe('EcranRevue — interactions', () => {
  it('bascule les cases à cocher Scroll synchronisé et Recentrer auto', () => {
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);

    const sync = screen.getByLabelText('Scroll synchronisé') as HTMLInputElement;
    const recentrer = screen.getByLabelText('Recentrer auto') as HTMLInputElement;
    expect(sync.checked).toBe(true);
    expect(recentrer.checked).toBe(true);

    fireEvent.click(sync);
    expect(sync.checked).toBe(false);
    fireEvent.click(recentrer);
    expect(recentrer.checked).toBe(false);
  });

  it('INT-1 : bloque la sélection d\'un tag avec crochets dans le volet pseudonymisé', () => {
    const onValider = vi.fn();
    simulerSelection('[PERSONNE]');
    renderAvecI18n(
      <EcranRevue
        texteOriginal="[PERSONNE]"
        mappingInitial={{ '[EMAIL]': ['[PERSONNE]'] }}
        onValider={onValider}
      />,
    );

    // Le premier span [PERSONNE] est dans le volet haut (pseudonymisé) :
    // la sélection contient des crochets → INT-1 bloque l'affichage
    fireEvent.mouseUp(spanParTexte('[PERSONNE]'));

    // Aucune barre d'action ne doit apparaître
    expect(screen.queryByText('Nouveau pseudo')).not.toBeInTheDocument();
    expect(screen.queryByText('Nouvelle valeur')).not.toBeInTheDocument();
    expect(screen.queryByText('Ajout classique')).not.toBeInTheDocument();

    // Le mapping reste inchangé
    fireEvent.click(screen.getByText('Valider et continuer'));
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['[PERSONNE]'] }),
      expect.any(String),
    );
  });

  it('ajoute une nouvelle valeur via le picker après sélection', () => {
    const onValider = vi.fn();
    simulerSelection('0612345678');
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.mouseUp(spanParTexte(/0612345678/));
    fireEvent.click(screen.getByText('Nouvelle valeur'));

    // Le picker s'ouvre avec le titre "Ajouter à quel pseudo ?"
    const dialogue = screen.getByRole('dialog');
    expect(within(dialogue).getByText('Ajouter à quel pseudo ?')).toBeInTheDocument();
    expect(within(dialogue).getByText(/Valeur : 0612345678/)).toBeInTheDocument();

    fireEvent.click(within(dialogue).getByText('[EMAIL]'));

    fireEvent.click(screen.getByText('Valider et continuer'));
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr', '0612345678'] }),
      expect.stringContaining('[EMAIL]'),
    );
  });

  it('annule le picker sans modifier le mapping', () => {
    const onValider = vi.fn();
    simulerSelection('0612345678');
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.mouseUp(spanParTexte(/0612345678/));
    fireEvent.click(screen.getByText('Nouvelle valeur'));

    const dialogue = screen.getByRole('dialog');
    fireEvent.click(within(dialogue).getByText('Annuler'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Valider et continuer'));
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr'] }),
      expect.stringContaining('[EMAIL]'),
    );
    expect(onValider.mock.calls[0][0]).toEqual({ '[EMAIL]': ['test@exemple.fr'] });
  });

  it('déplace une valeur vers un autre tag via le bouton Déplacer', () => {
    const onValider = vi.fn();
    const mapping = {
      '[EMAIL]': ['test@exemple.fr'],
      '[TELEPHONE]': ['0612345678'],
    };
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={mapping} onValider={onValider} />);

    // Cliquer sur la valeur dans le texte lisible active le surlignage de valeur
    fireEvent.click(spanParTexte('test@exemple.fr'));

    // Le bouton "Déplacer" apparaît dès qu'une valeur est active
    fireEvent.click(screen.getByText(/Déplacer.*test@exemple.fr/));

    const dialogue = screen.getByRole('dialog');
    expect(within(dialogue).getByText(/Déplacer.*test@exemple.fr/)).toBeInTheDocument();

    // Seul le tag cible [TELEPHONE] est proposé (source exclue)
    fireEvent.click(within(dialogue).getByText('[TELEPHONE]'));

    fireEvent.click(screen.getByText('Valider et continuer'));
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({
        '[EMAIL]': [],
        '[TELEPHONE]': ['0612345678', 'test@exemple.fr'],
      }),
      expect.stringContaining('[TELEPHONE]'),
    );
  });

  it('supprime un tag via la confirmation de suppression', () => {
    const onValider = vi.fn();
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    const dialogue = screen.getByRole('dialog');
    expect(within(dialogue).getByText('Supprimer le pseudo ?')).toBeInTheDocument();
    fireEvent.click(within(dialogue).getByText('Supprimer'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Pseudos (0)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Valider et continuer'));
    expect(onValider).toHaveBeenCalledWith(
      {},
      expect.stringContaining('test@exemple.fr'),
    );
  });

  it('annule la suppression : le tag est conservé', () => {
    const onValider = vi.fn();
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    const dialogue = screen.getByRole('dialog');
    fireEvent.click(within(dialogue).getByText('Annuler'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Pseudos (1)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Valider et continuer'));
    expect(onValider.mock.calls[0][0]).toEqual({ '[EMAIL]': ['test@exemple.fr'] });
  });

  it('expose les conflits entre valeurs de tags différents', () => {
    const mapping = {
      '[EMAIL]': ['dup@exemple.fr'],
      '[TELEPHONE]': ['dup@exemple.fr'],
    };
    renderAvecI18n(<EcranRevue texteOriginal="Contact : dup@exemple.fr" mappingInitial={mapping} onValider={vi.fn()} />);

    expect(screen.getByText(/dup@exemple.fr.*existe aussi dans \[TELEPHONE\]/)).toBeInTheDocument();
    expect(screen.getByText('voir')).toBeInTheDocument();
  });

  it('sélectionne depuis le volet pseudonymisé (valeur sans crochets) et ouvre le picker', () => {
    const onValider = vi.fn();
    simulerSelection('0612345678');
    renderAvecI18n(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.mouseUp(spanParTexte(/0612345678/));
    fireEvent.click(screen.getByText('Nouvelle valeur'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});