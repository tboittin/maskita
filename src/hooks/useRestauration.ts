import { useState, useCallback, useMemo } from 'react';
import { restaurerTexte, chargerCleJson } from '../utils/mapping';
import type { Mapping } from '../utils/mapping';
import { extraireTexte, extensionDepuisNom } from '../utils/extraction';
import type { ExtensionFichier } from '../utils/extraction';

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

export type EtapeRestauration = 'upload' | 'revue' | 'telechargement';

interface UseRestaurationReturn {
  texteAvecTags: string | null;
  texteRestauré: string | null;
  mapping: Mapping | null;
  extension: ExtensionFichier | null;
  chargement: boolean;
  erreur: string | null;
  fichierDocx: File | null;
  nomFichierCle: string | null;
  etape: EtapeRestauration;
  handleDocxChoisi: (file: File) => Promise<void>;
  handleCleChoisie: (file: File) => Promise<void>;
  handleLancerRestauration: () => void;
  handleValiderRevue: () => void;
  reinitialiser: () => void;
  // US-V03 — Modification du mapping à l'étape Restauration
  ajouterValeur: (tag: string, valeur: string) => void;
  retirerValeur: (tag: string, valeur: string) => void;
  deplacerValeur: (valeur: string, tagSource: string, tagCible: string) => void;
  reordonnerValeurs: (tag: string, debut: number, fin: number) => void;
  renommerTag: (ancien: string, nouveau: string) => void;
  supprimerTag: (tag: string) => void;
  ajouterTag: (type: string, valeur: string) => void;
}

export function useRestauration(): UseRestaurationReturn {
  const [fichierDocx, setFichierDocx] = useState<File | null>(null);
  const [extension, setExtension] = useState<ExtensionFichier | null>(null);
  const [texteAvecTags, setTexteAvecTags] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [nomFichierCle, setNomFichierCle] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [etape, setEtape] = useState<EtapeRestauration>('upload');

  const texteRestauré = useMemo<string | null>(() => {
    if (texteAvecTags === null || mapping === null) return null;
    return restaurerTexte(texteAvecTags, mapping);
  }, [texteAvecTags, mapping]);

  const handleDocxChoisi = useCallback(async (file: File) => {
    setErreur(null);
    setTexteAvecTags(null);
    setExtension(null);

    const ext = extensionDepuisNom(file.name);
    if (!ext) {
      setErreur('Format accepté : .docx, .txt, .md');
      return;
    }

    if (file.size === 0) {
      setErreur('Le fichier est vide');
      return;
    }

    if (file.size > TAILLE_MAX_OCTETS) {
      setErreur(`Le fichier dépasse la limite de 10 Mo (${(file.size / 1024 / 1024).toFixed(1)} Mo)`);
      return;
    }

    setFichierDocx(file);
    setExtension(ext.slice(1) as ExtensionFichier);
    setChargement(true);

    try {
      const resultat = await extraireTexte(file);
      setTexteAvecTags(resultat);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setErreur(`Impossible de lire le fichier : ${message}`);
      setFichierDocx(null);
      setExtension(null);
    } finally {
      setChargement(false);
    }
  }, []);

  const handleCleChoisie = useCallback(async (file: File) => {
    setErreur(null);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setErreur('La clé doit être au format .json');
      return;
    }

    try {
      const contenu = await file.text();
      const mappingCharge = chargerCleJson(contenu);
      setMapping(mappingCharge);
      setNomFichierCle(file.name);
    } catch {
      setErreur('Fichier .key.json invalide ou corrompu');
    }
  }, []);

  const handleLancerRestauration = useCallback(() => {
    setEtape('revue');
  }, []);

  const handleValiderRevue = useCallback(() => {
    setEtape('telechargement');
  }, []);

  /* US-V03 — Modification du mapping à l'étape Restauration.
     Les handlers ne font rien si le mapping n'est pas encore chargé. */
  const ajouterValeur = useCallback((tag: string, valeur: string) => {
    setMapping(prev => {
      if (!prev) return prev;
      return { ...prev, [tag]: [...(prev[tag] || []), valeur] };
    });
  }, []);

  const retirerValeur = useCallback((tag: string, valeur: string) => {
    setMapping(prev => {
      if (!prev) return prev;
      return { ...prev, [tag]: (prev[tag] || []).filter(v => v !== valeur) };
    });
  }, []);

  const deplacerValeur = useCallback((valeur: string, tagSource: string, tagCible: string) => {
    if (tagSource === tagCible) return;
    setMapping(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [tagSource]: (prev[tagSource] || []).filter(v => v !== valeur),
        [tagCible]: [...(prev[tagCible] || []), valeur],
      };
    });
  }, []);

  const reordonnerValeurs = useCallback((tag: string, debut: number, fin: number) => {
    setMapping(prev => {
      if (!prev) return prev;
      const vals = [...(prev[tag] || [])];
      if (debut < 0 || debut >= vals.length || fin < 0 || fin >= vals.length) return prev;
      const [deplace] = vals.splice(debut, 1);
      vals.splice(fin, 0, deplace);
      return { ...prev, [tag]: vals };
    });
  }, []);

  const renommerTag = useCallback((ancien: string, nouveau: string) => {
    // B01 — Ajouter les crochets [] si l'utilisateur les a omis
    let tagNettoye = nouveau.trim();
    if (!tagNettoye.startsWith('[')) tagNettoye = '[' + tagNettoye;
    if (!tagNettoye.endsWith(']')) tagNettoye = tagNettoye + ']';
    // B03 — Forcer la majuscule sur le contenu entre crochets
    tagNettoye = tagNettoye.replace(/^\[(.+)\]$/, (_, contenu) => {
      return '[' + contenu.toUpperCase() + ']';
    });

    setMapping(prev => {
      if (!prev) return prev;
      const { [ancien]: valeurs, ...reste } = prev;
      if (valeurs === undefined) return prev;
      return { ...reste, [tagNettoye]: valeurs };
    });
  }, []);

  const supprimerTag = useCallback((tag: string) => {
    setMapping(prev => {
      if (!prev) return prev;
      const { [tag]: _, ...reste } = prev;
      return reste;
    });
  }, []);

  const ajouterTag = useCallback((type: string, valeur: string) => {
    setMapping(prev => {
      if (!prev) return prev;
      const tagsExistants = Object.keys(prev).filter(
        t => t.startsWith(`[${type}]`) || t.startsWith(`[${type}_`),
      );
      const maxNum = tagsExistants.reduce((max, t) => {
        const match = t.match(/[_[](\d+)\]$/);
        return match ? Math.max(max, parseInt(match[1])) : Math.max(max, 1);
      }, 0);
      const tag = maxNum === 0 ? `[${type}]` : `[${type}_${maxNum + 1}]`;
      return { ...prev, [tag]: [valeur] };
    });
  }, []);

  const reinitialiser = useCallback(() => {
    setFichierDocx(null);
    setTexteAvecTags(null);
    setMapping(null);
    setExtension(null);
    setNomFichierCle(null);
    setChargement(false);
    setErreur(null);
    setEtape('upload');
  }, []);

  return {
    texteAvecTags,
    texteRestauré,
    mapping,
    extension,
    chargement,
    erreur,
    fichierDocx,
    nomFichierCle,
    etape,
    handleDocxChoisi,
    handleCleChoisie,
    handleLancerRestauration,
    handleValiderRevue,
    reinitialiser,
    ajouterValeur,
    retirerValeur,
    deplacerValeur,
    reordonnerValeurs,
    renommerTag,
    supprimerTag,
    ajouterTag,
  };
}