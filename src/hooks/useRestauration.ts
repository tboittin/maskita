import { useState, useCallback, useMemo } from 'react';
import { restaurerTexte, chargerCleJson } from '../utils/mapping';
import type { Mapping } from '../utils/mapping';
import { extraireTexte, extensionDepuisNom } from '../utils/extraction';
import type { ExtensionFichier } from '../utils/extraction';

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

interface UseRestaurationReturn {
  texteAvecTags: string | null;
  texteRestauré: string | null;
  mapping: Mapping | null;
  extension: ExtensionFichier | null;
  chargement: boolean;
  erreur: string | null;
  fichierDocx: File | null;
  nomFichierCle: string | null;
  handleDocxChoisi: (file: File) => Promise<void>;
  handleCleChoisie: (file: File) => Promise<void>;
  reinitialiser: () => void;
}

export function useRestauration(): UseRestaurationReturn {
  const [fichierDocx, setFichierDocx] = useState<File | null>(null);
  const [extension, setExtension] = useState<ExtensionFichier | null>(null);
  const [texteAvecTags, setTexteAvecTags] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [nomFichierCle, setNomFichierCle] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

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

  const reinitialiser = useCallback(() => {
    setFichierDocx(null);
    setTexteAvecTags(null);
    setMapping(null);
    setExtension(null);
    setNomFichierCle(null);
    setChargement(false);
    setErreur(null);
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
    handleDocxChoisi,
    handleCleChoisie,
    reinitialiser,
  };
}