export interface Mapping {
  [tag: string]: string[];
}

const COMPTEURS: Record<string, number> = {};

export function reinitialiserCompteurs(): void {
  for (const key of Object.keys(COMPTEURS)) {
    delete COMPTEURS[key];
  }
}

export function genererTag(type: string): string {
  if (!COMPTEURS[type]) {
    COMPTEURS[type] = 1;
    return `[${type}]`;
  }
  COMPTEURS[type]++;
  return `[${type}_${COMPTEURS[type]}]`;
}

export function genererMapping(
  groupes: { type: string; valeurs: string[] }[],
): Mapping {
  reinitialiserCompteurs();
  const mapping: Mapping = {};

  for (const groupe of groupes) {
    const tag = genererTag(groupe.type);
    mapping[tag] = groupe.valeurs;
  }

  return mapping;
}

export function appliquerMapping(texte: string, mapping: Mapping): string {
  let resultat = texte;

  for (const [tag, valeurs] of Object.entries(mapping)) {
    // Trier par longueur décroissante : les plus longues d'abord
    // pour éviter les remplacements partiels (B08)
    const valeursTriees = [...valeurs].sort((a, b) => b.length - a.length);

    for (const valeur of valeursTriees) {
      // Échapper les caractères regex dans la valeur
      const echapee = valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Word boundaries (\b) pour que 'Tom' ne soit pas remplacé dans 'Tommy'
      const regex = new RegExp(`\\b${echapee}\\b`, 'gi');
      resultat = resultat.replace(regex, tag);
    }
  }

  return resultat;
}

export function restaurerTexte(texte: string, mapping: Mapping): string {
  let resultat = texte;

  for (const [tag, valeurs] of Object.entries(mapping)) {
    if (valeurs.length > 0) {
      const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      resultat = resultat.replace(regex, valeurs[0]);
    }
  }

  return resultat;
}

export function genererCleJson(mapping: Mapping): string {
  return JSON.stringify(mapping, null, 2);
}

export function chargerCleJson(contenu: string): Mapping {
  return JSON.parse(contenu);
}

/**
 * Vérifie si un nom de fichier (sans extension) contient des valeurs
 * ou des tags issus du mapping (données sensibles). Retourne la liste
 * des éléments détectés, ou une liste vide si le nom est sûr.
 */
export function nomContientValeursMapping(
  nomFichier: string,
  mapping: Mapping,
): string[] {
  const nomMinuscule = nomFichier.toLowerCase();
  const detectees: string[] = [];

  // Vérifier les valeurs du mapping (ex: "Sophie Lambert")
  for (const valeurs of Object.values(mapping)) {
    for (const valeur of valeurs) {
      if (valeur.length > 0 && nomMinuscule.includes(valeur.toLowerCase())) {
        if (!detectees.includes(valeur)) {
          detectees.push(valeur);
        }
      }
    }
  }

  // Vérifier les tags du mapping (ex: "[PERSONNE]")
  for (const tag of Object.keys(mapping)) {
    if (nomMinuscule.includes(tag.toLowerCase())) {
      if (!detectees.includes(tag)) {
        detectees.push(tag);
      }
    }
  }

  return detectees;
}