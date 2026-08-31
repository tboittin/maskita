import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useLangue } from './context';
import App from '../App';

function Temoin() {
  const { langue, basculer, t } = useLangue();
  return (
    <div>
      <span data-testid="langue">{langue}</span>
      <span data-testid="texte">{t('app.sousTitre')}</span>
      <button onClick={basculer}>basculer</button>
    </div>
  );
}

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('défaut : français si rien en stockage et navigateur français', () => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'fr-FR',
    });
    render(
      <I18nProvider>
        <Temoin />
      </I18nProvider>,
    );
    expect(screen.getByTestId('langue')).toHaveTextContent('fr');
    expect(screen.getByTestId('texte')).toHaveTextContent(
      'Pseudonymisation de documents — 100% dans le navigateur.',
    );
  });

  it('utilise le navigateur anglais si rien en stockage', () => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'en-US',
    });
    render(
      <I18nProvider>
        <Temoin />
      </I18nProvider>,
    );
    expect(screen.getByTestId('langue')).toHaveTextContent('en');
    expect(screen.getByTestId('texte')).toHaveTextContent(
      'Document pseudonymisation — 100% in the browser.',
    );
  });

  it('basculer change la langue et persiste en localStorage', () => {
    localStorage.setItem('maskita-langue', 'fr');
    render(
      <I18nProvider>
        <Temoin />
      </I18nProvider>,
    );
    expect(screen.getByTestId('langue')).toHaveTextContent('fr');

    fireEvent.click(screen.getByText('basculer'));
    expect(screen.getByTestId('langue')).toHaveTextContent('en');
    expect(screen.getByTestId('texte')).toHaveTextContent(
      'Document pseudonymisation — 100% in the browser.',
    );
    expect(localStorage.getItem('maskita-langue')).toBe('en');

    fireEvent.click(screen.getByText('basculer'));
    expect(screen.getByTestId('langue')).toHaveTextContent('fr');
    expect(localStorage.getItem('maskita-langue')).toBe('fr');
  });

  it('restaure la langue depuis le localStorage', () => {
    localStorage.setItem('maskita-langue', 'en');
    render(
      <I18nProvider>
        <Temoin />
      </I18nProvider>,
    );
    expect(screen.getByTestId('langue')).toHaveTextContent('en');
  });

  it('gère les fonctions de traduction avec arguments', () => {
    localStorage.setItem('maskita-langue', 'fr');
    function TemoinArgs() {
      const { t } = useLangue();
      return (
        <div>
          <span>{t('tableau.titre', 3)}</span>
          <span>{t('revue.bouton.deplacer', 'Sophie')}</span>
        </div>
      );
    }
    render(
      <I18nProvider>
        <TemoinArgs />
      </I18nProvider>,
    );
    expect(screen.getByText('Pseudos (3)')).toBeInTheDocument();
    // Le guillemet « est un caractère unicode — getByText match le texte complet
    expect(screen.getByText(/📦 Déplacer.*Sophie/)).toBeInTheDocument();
  });

  it('retourne la clé si elle est manquante', () => {
    const origine = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function TemoinManquant() {
      const { t } = useLangue();
      return <span>{t('cle.inexistante')}</span>;
    }
    render(
      <I18nProvider>
        <TemoinManquant />
      </I18nProvider>,
    );
    expect(screen.getByText('cle.inexistante')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('cle.inexistante'),
    );
    process.env.NODE_ENV = origine;
  });
});

describe('App i18n', () => {
  beforeEach(() => {
    localStorage.setItem('maskita-langue', 'fr');
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    URL.revokeObjectURL = vi.fn();
  });

  it('affiche les textes en français', () => {
    render(<App />);
    expect(screen.getByText('🔒 Anonymiser')).toBeInTheDocument();
    expect(screen.getByText('🔓 Restaurer')).toBeInTheDocument();
    expect(
      screen.getByText(/Pseudonymisation.*100% dans le navigateur/i),
    ).toBeInTheDocument();
  });

  it('bascule en anglais au clic sur le toggle', () => {
    render(<App />);

    const bouton = screen.getByTitle('Switch to English');
    expect(bouton).toHaveTextContent('🇬🇧 EN');

    fireEvent.click(bouton);

    expect(screen.getByText('🔒 Anonymise')).toBeInTheDocument();
    expect(screen.getByText('🔓 Restore')).toBeInTheDocument();
    expect(
      screen.getByText(/pseudonymisation.*100% in the browser/i),
    ).toBeInTheDocument();
    expect(localStorage.getItem('maskita-langue')).toBe('en');
  });

  it('met à jour lang="en" sur le document', () => {
    render(<App />);
    expect(document.documentElement.lang).toBe('fr');

    fireEvent.click(screen.getByTitle('Switch to English'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('reste en anglais après un retour à l\'onglet Anonymiser', () => {
    render(<App />);
    fireEvent.click(screen.getByTitle('Switch to English'));
    fireEvent.click(screen.getByText('🔓 Restore'));

    expect(screen.getByText('Modified report (with tags)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('🔒 Anonymise'));
    expect(screen.getByText('Report (.docx, .txt, .md)')).toBeInTheDocument();
  });
});