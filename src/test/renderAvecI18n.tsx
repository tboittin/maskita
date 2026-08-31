import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { I18nProvider } from '../i18n/context';

/**
 * Rendu avec I18nProvider pour les tests de composants utilisant useLangue.
 * Force le français par défaut en localStorage.
 */
export function renderAvecI18n(ui: ReactElement): RenderResult {
  localStorage.setItem('maskita-langue', 'fr');
  return render(<I18nProvider>{ui}</I18nProvider>);
}