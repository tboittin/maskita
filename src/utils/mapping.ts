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
    for (const valeur of valeurs) {
      // Échapper les caractères regex dans la valeur
      const echapee = valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(echapee, 'gi');
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
 * issues du mapping (données sensibles). Retourne la liste des valeurs
 * détectées, ou une liste vide si le nom est sûr.
 */
export function nomContientValeursMapping(
  nomFichier: string,
  mapping: Mapping,
): string[] {
  const nomMinuscule = nomFichier.toLowerCase();
  const detectees: string[] = [];

  for (const valeurs of Object.values(mapping)) {
    for (const valeur of valeurs) {
      if (valeur.length > 0 && nomMinuscule.includes(valeur.toLowerCase())) {
        detectees.push(valeur);
      }
    }
  }

  return detectees;
}