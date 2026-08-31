import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { fr } from './fr';
import { en } from './en';

export type Langue = 'fr' | 'en';

interface I18nContextValue {
  langue: Langue;
  basculer: () => void;
  definirlangue: (l: Langue) => void;
  t: (cle: string, ...args: unknown[]) => string;
}

const STOCKAGE_CLE = 'maskita-langue';

function chargerLangue(): Langue {
  try {
    const stockee = localStorage.getItem(STOCKAGE_CLE);
    if (stockee === 'fr' || stockee === 'en') return stockee;
  } catch {
    // localStorage inaccessible
  }
  // Détection automatique navigateur
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language?.slice(0, 2);
    if (lang === 'en') return 'en';
  }
  return 'fr';
}

function sauverLangue(l: Langue) {
  try {
    localStorage.setItem(STOCKAGE_CLE, l);
  } catch {
    // ignore
  }
}

const dictionnaires: Record<Langue, Record<string, unknown>> = { fr, en };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(chargerLangue);

  const basculer = useCallback(() => {
    setLangue((prev) => {
      const nouvelle: Langue = prev === 'fr' ? 'en' : 'fr';
      sauverLangue(nouvelle);
      return nouvelle;
    });
  }, []);

  const definirlangue = useCallback((l: Langue) => {
    sauverLangue(l);
    setLangue(l);
  }, []);

  const t = useCallback(
    (cle: string, ...args: unknown[]): string => {
      const dico = dictionnaires[langue];
      const valeur = dico[cle];
      if (valeur === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Clé manquante: "${cle}" (${langue})`);
        }
        return cle;
      }
      if (typeof valeur === 'function') {
        return (valeur as (...a: unknown[]) => string)(...args);
      }
      return String(valeur);
    },
    [langue],
  );

  return (
    <I18nContext.Provider value={{ langue, basculer, definirlangue, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLangue(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLangue doit être utilisé sous un I18nProvider');
  return ctx;
}