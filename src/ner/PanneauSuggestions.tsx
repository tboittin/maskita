/**
 * MSK-004 — Suggestions de la détection avancée dans l'écran de revue.
 *
 * Rien n'est ajouté au mapping sans un clic du praticien : chaque suggestion
 * s'accepte (un nouveau pseudo est créé, comme un ajout manuel) ou s'ignore.
 * Une suggestion dont la valeur figure déjà dans le mapping est masquée.
 */
import { useMemo, useState } from 'react';
import { Bouton, Panneau } from '@khaleeno/maskita-design-system';
import { useLangue } from '../i18n/context';
import type { Mapping } from '../utils/mapping';
import type { Detection } from '../utils/regex';

export interface Suggestion {
  type: string;
  valeur: string;
  occurrences: number;
}

function cle(valeur: string): string {
  return valeur.trim().toLowerCase();
}

/** Une suggestion par couple (type, valeur), dans l'ordre d'apparition. */
export function regrouperSuggestions(detections: Detection[]): Suggestion[] {
  const parCle = new Map<string, Suggestion>();
  for (const d of detections) {
    const k = `${d.type}|${cle(d.valeur)}`;
    const existante = parCle.get(k);
    if (existante) existante.occurrences++;
    else parCle.set(k, { type: d.type, valeur: d.valeur.trim(), occurrences: 1 });
  }
  return [...parCle.values()];
}

interface PanneauSuggestionsProps {
  suggestions: Detection[];
  mapping: Mapping;
  onAccepter: (type: string, valeur: string) => void;
}

export function PanneauSuggestions({ suggestions, mapping, onAccepter }: PanneauSuggestionsProps) {
  const { t } = useLangue();
  const [ignorees, setIgnorees] = useState<Set<string>>(() => new Set());

  const visibles = useMemo(() => {
    const dejaPresentes = new Set(Object.values(mapping).flat().map(cle));
    return regrouperSuggestions(suggestions).filter(
      s => !dejaPresentes.has(cle(s.valeur)) && !ignorees.has(cle(s.valeur)),
    );
  }, [suggestions, mapping, ignorees]);

  const ignorer = (valeur: string) =>
    setIgnorees(prev => new Set(prev).add(cle(valeur)));

  return (
    <Panneau title={t('ner.suggestions.titre', visibles.length)}>
      <div style={{ padding: 'var(--espacement-md)', display: 'flex', flexDirection: 'column', gap: 'var(--espacement-sm)' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', margin: 0 }}>
          {t('ner.suggestions.aide')}
        </p>
        {visibles.length === 0 ? (
          <p style={{ fontSize: '0.875rem', margin: 0 }}>{t('ner.suggestions.aucune')}</p>
        ) : (
          <>
            <ul aria-label={t('ner.suggestions.titre', visibles.length)} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--espacement-sm)' }}>
              {visibles.map(s => (
                <li
                  key={`${s.type}|${s.valeur}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--espacement-xs)',
                    border: '1px solid var(--couleur-bordure)', borderRadius: 'var(--rayon, 0.5rem)',
                    padding: '2px 4px 2px 8px', fontSize: '0.875rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{s.valeur}</span>
                  <span style={{ color: 'var(--couleur-texte-secondaire)', fontSize: '0.75rem' }}>
                    {s.type}{s.occurrences > 1 ? ` ×${s.occurrences}` : ''}
                  </span>
                  <Bouton variante="ghost" taille="sm" onClick={() => onAccepter(s.type, s.valeur)} aria-label={`${t('ner.suggestions.accepter')} ${s.valeur}`}>
                    ✓
                  </Bouton>
                  <Bouton variante="ghost" taille="sm" onClick={() => ignorer(s.valeur)} aria-label={`${t('ner.suggestions.ignorer')} ${s.valeur}`}>
                    ✕
                  </Bouton>
                </li>
              ))}
            </ul>
            <div>
              <Bouton
                variante="secondaire"
                taille="sm"
                onClick={() => visibles.forEach(s => onAccepter(s.type, s.valeur))}
              >
                {t('ner.suggestions.toutAccepter')}
              </Bouton>
            </div>
          </>
        )}
      </div>
    </Panneau>
  );
}
