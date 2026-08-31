import { useState, useCallback, useMemo, useEffect } from 'react';
import { type Mapping, appliquerMapping } from '../utils/mapping';

export interface TagEntry {
  tag: string;
  valeurs: string[];
  estNouveau: boolean;
}

export interface Conflit {
  type: 'doublon' | 'sous-chaine';
  tag: string;
  message: string;
}

interface UseRevueReturn {
  tags: TagEntry[];
  textePseudonymise: string;
  tagSurbrillance: string | null;
  valeurSurbrillance: string | null;
  conflits: Conflit[];
  ajouterValeur: (tag: string, valeur: string) => void;
  retirerValeur: (tag: string, valeur: string) => void;
  deplacerValeur: (valeur: string, tagSource: string, tagCible: string) => void;
  reordonnerValeurs: (tag: string, debut: number, fin: number) => void;
  renommerTag: (ancien: string, nouveau: string) => void;
  supprimerTag: (tag: string) => void;
  ajouterTag: (type: string, valeur: string) => void;
  mettreSurbrillance: (tag: string | null) => void;
  mettreSurbrillanceValeur: (tag: string, valeur: string) => void;
  mappingFinal: Mapping;
  mappingModifie: boolean;
  reinitialiserMapping: () => void;
}

export function useRevue(texteOriginal: string, mappingInitial: Mapping): UseRevueReturn {
  const [mapping, setMapping] = useState<Mapping>(() => ({ ...mappingInitial }));
  const [tagSurbrillance, setTagSurbrillance] = useState<string | null>(null);
  const [valeurSurbrillance, setValeurSurbrillance] = useState<string | null>(null);

  // Auto-highlight le premier tag à l'ouverture
  useEffect(() => {
    if (!tagSurbrillance && Object.keys(mapping).length > 0) {
      const premierTag = Object.keys(mapping)[0];
      setTagSurbrillance(premierTag);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tags = useMemo<TagEntry[]>(() => {
    const tagsInitiaux = new Set(Object.keys(mappingInitial));
    return Object.entries(mapping).map(([tag, valeurs]) => ({
      tag,
      valeurs,
      estNouveau: !tagsInitiaux.has(tag),
    }));
  }, [mapping, mappingInitial]);

  const conflits = useMemo<Conflit[]>(() => {
    const resultats: Conflit[] = [];
    const entries = Object.entries(mapping);

    for (let i = 0; i < entries.length; i++) {
      const [tag1, vals1] = entries[i];
      for (let j = i + 1; j < entries.length; j++) {
        const [tag2, vals2] = entries[j];
        for (const v1 of vals1) {
          for (const v2 of vals2) {
            const v1l = v1.toLowerCase().trim();
            const v2l = v2.toLowerCase().trim();
            if (v1l === v2l) {
              resultats.push({
                type: 'doublon',
                tag: tag1,
                message: `"${v1}" existe aussi dans ${tag2}`,
              });
            } else if (v1l.includes(v2l) && v1l.length > v2l.length) {
              resultats.push({
                type: 'sous-chaine',
                tag: tag1,
                message: `"${v2}" (${tag2}) est inclus dans "${v1}"`,
              });
            } else if (v2l.includes(v1l) && v2l.length > v1l.length) {
              resultats.push({
                type: 'sous-chaine',
                tag: tag2,
                message: `"${v1}" (${tag1}) est inclus dans "${v2}"`,
              });
            }
          }
        }
      }
    }
    return resultats;
  }, [mapping]);

  const textePseudonymise = useMemo(
    () => appliquerMapping(texteOriginal, mapping),
    [texteOriginal, mapping],
  );

  const ajouterValeur = useCallback((tag: string, valeur: string) => {
    setMapping(prev => ({
      ...prev,
      [tag]: [...(prev[tag] || []), valeur],
    }));
  }, []);

  const retirerValeur = useCallback((tag: string, valeur: string) => {
    setMapping(prev => ({
      ...prev,
      [tag]: (prev[tag] || []).filter(v => v !== valeur),
    }));
  }, []);

  const deplacerValeur = useCallback((valeur: string, tagSource: string, tagCible: string) => {
    if (tagSource === tagCible) return;
    setMapping(prev => ({
      ...prev,
      [tagSource]: (prev[tagSource] || []).filter(v => v !== valeur),
      [tagCible]: [...(prev[tagCible] || []), valeur],
    }));
  }, []);

  const reordonnerValeurs = useCallback((tag: string, debut: number, fin: number) => {
    setMapping(prev => {
      const vals = [...(prev[tag] || [])];
      if (debut < 0 || debut >= vals.length || fin < 0 || fin >= vals.length) return prev;
      const [deplace] = vals.splice(debut, 1);
      vals.splice(fin, 0, deplace);
      return { ...prev, [tag]: vals };
    });
  }, []);

  const renommerTag = useCallback((ancien: string, nouveau: string) => {
    setMapping(prev => {
      const { [ancien]: valeurs, ...reste } = prev;
      return { ...reste, [nouveau]: valeurs };
    });
  }, []);

  const supprimerTag = useCallback((tag: string) => {
    setMapping(prev => ({
      ...prev,
      [tag]: [],
    }));
  }, []);

  const ajouterTag = useCallback((type: string, valeur: string) => {
    setMapping(prev => {
      const tagsExistants = Object.keys(prev).filter(t => t.startsWith(`[${type}]`) || t.startsWith(`[${type}_`));
      const maxNum = tagsExistants.reduce((max, t) => {
        const match = t.match(/_(\\d+)\\]$/);
        return match ? Math.max(max, parseInt(match[1])) : Math.max(max, 1);
      }, 0);
      const tag = maxNum === 0 ? `[${type}]` : `[${type}_${maxNum + 1}]`;
      return { ...prev, [tag]: [valeur] };
    });
  }, []);

  const mettreSurbrillance = useCallback((tag: string | null) => {
    setTagSurbrillance(prev => prev === tag ? null : tag);
    setValeurSurbrillance(null);
  }, []);

  const mettreSurbrillanceValeur = useCallback((tag: string, valeur: string) => {
    setTagSurbrillance(tag);
    setValeurSurbrillance(valeur === valeurSurbrillance ? null : valeur);
  }, [valeurSurbrillance]);

  const mappingModifie = useMemo(
    () => JSON.stringify(mapping) !== JSON.stringify(mappingInitial),
    [mapping, mappingInitial],
  );

  const reinitialiserMapping = useCallback(() => {
    setMapping({ ...mappingInitial });
  }, [mappingInitial]);

  return {
    tags,
    textePseudonymise,
    tagSurbrillance,
    valeurSurbrillance,
    conflits,
    ajouterValeur,
    retirerValeur,
    deplacerValeur,
    reordonnerValeurs,
    renommerTag,
    supprimerTag,
    ajouterTag,
    mettreSurbrillance,
    mettreSurbrillanceValeur,
    mappingFinal: mapping,
    mappingModifie,
    reinitialiserMapping,
  };
}