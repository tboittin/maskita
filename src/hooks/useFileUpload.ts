import { useState, useCallback } from 'react';
import type { Mapping } from '../utils/mapping';
import { chargerCleJson } from '../utils/mapping';
import { extraireTexte, extensionDepuisNom } from '../utils/extraction';
import type { ExtensionFichier } from '../utils/extraction';

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

interface UseFileUploadReturn {
  fichier: File | null;
  extension: ExtensionFichier | null;
  texte: string | null;
  chargement: boolean;
  erreur: string | null;
  erreurCle: string | null;
  cle: Mapping | null;
  nomFichierCle: string | null;
  uploader: (file: File) => Promise<void>;
  uploaderCle: (file: File) => Promise<void>;
  reinitialiser: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [fichier, setFichier] = useState<File | null>(null);
  const [extension, setExtension] = useState<ExtensionFichier | null>(null);
  const [texte, setTexte] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cle, setCle] = useState<Mapping | null>(null);
  const [nomFichierCle, setNomFichierCle] = useState<string | null>(null);
  const [erreurCle, setErreurCle] = useState<string | null>(null);

  const reinitialiser = useCallback(() => {
    setFichier(null);
    setExtension(null);
    setTexte(null);
    setChargement(false);
    setErreur(null);
    setCle(null);
    setNomFichierCle(null);
    setErreurCle(null);
  }, []);

  const uploader = useCallback(async (file: File) => {
    setErreur(null);
    setTexte(null);
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

    setFichier(file);
    setExtension(ext.slice(1) as ExtensionFichier);
    setChargement(true);

    try {
      const resultat = await extraireTexte(file);
      setTexte(resultat);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'extraction';
      setErreur(`Impossible de lire le fichier : ${message}`);
      setFichier(null);
      setExtension(null);
    } finally {
      setChargement(false);
    }
  }, []);

  const uploaderCle = useCallback(async (file: File) => {
    setErreurCle(null);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setErreurCle('La clé doit être au format .json');
      return;
    }

    try {
      const contenu = await file.text();
      const mapping = chargerCleJson(contenu);
      setCle(mapping);
      setNomFichierCle(file.name);
    } catch {
      setErreurCle('Fichier .key.json invalide ou corrompu');
    }
  }, []);

  return {
    fichier, extension, texte, chargement, erreur,
    cle, nomFichierCle, erreurCle,
    uploader, uploaderCle, reinitialiser,
  };
}