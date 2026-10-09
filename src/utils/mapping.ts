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
      // INT-1 — Garde-fou : une valeur contenant des crochets est un tag,
      // pas une valeur à pseudonymiser. Les lookarounds (?<!\p{L})/(?!\p{L})
      // matcheraient '[' / ']' (non-lettres) là où \b ne le faisait pas,
      // donc on filtre explicitement pour préserver le comportement.
      if (!estValeurValide(valeur)) continue;
      // Échapper les caractères regex dans la valeur
      const echapee = valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Word boundaries Unicode-aware (REGEX-01) : `\b` ne reconnaît que
      // [a-zA-Z0-9_] sans le flag `u`, donc 'Chloé' n'était pas remplacé.
      // (?<!\p{L}) / (?!\p{L}) exigent que la valeur ne soit pas entourée
      // de lettres (é, è, ê... incluses via \p{L}).
      const regex = new RegExp(`(?<!\\p{L})${echapee}(?!\\p{L})`, 'giu');
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

export interface ValeurRetiree {
  tag: string;
  valeur: string;
}

export interface ChargementCleResult {
  mapping: Mapping;
  valeursRetirees: ValeurRetiree[];
}

/**
 * Charge un mapping depuis une chaîne JSON et assainit les valeurs.
 * Les valeurs invalides (contenant des crochets) sont filtrées via
 * estValeurValide. Les tags vidés de toutes leurs valeurs sont conservés
 * avec un tableau vide. Retourne le mapping nettoyé et la liste des
 * valeurs retirées.
 */
export function chargerCleJson(contenu: string): ChargementCleResult {
  const brut = JSON.parse(contenu) as Mapping;
  const valeursRetirees: ValeurRetiree[] = [];
  const mapping: Mapping = {};

  for (const [tag, valeurs] of Object.entries(brut)) {
    const valides = valeurs.filter(v => {
      if (!estValeurValide(v)) {
        valeursRetirees.push({ tag, valeur: v });
        return false;
      }
      return true;
    });
    mapping[tag] = valides;
  }

  return { mapping, valeursRetirees };
}

/**
 * Vérifie qu'une valeur sélectionnée ne contient pas de crochets (tags).
 * INT-1 — Garde-fou à la sélection : si la sélection contient '[' ou ']',
 * on est en train de sélectionner un tag existant, pas une valeur à pseudonymiser.
 */
export function estValeurValide(valeur: string): boolean {
  return !valeur.includes('[') && !valeur.includes(']');
}

/**
 * CORR-1 — Vérifie si le début d'une sélection tombe à l'intérieur d'un tag.
 * En remontant depuis le début de la sélection dans le texte, on vérifie le
 * premier crochet rencontré : si c'est '[' (et qu'il n'a pas été refermé par
 * un ']' avant), la sélection est dans un tag.
 *
 * @param texteAvantSelection — le contenu textuel complet avant le début de la sélection
 * @returns true si le début de la sélection est à l'intérieur d'un tag
 */
export function estSelectionDansTag(texteAvantSelection: string): boolean {
  for (let i = texteAvantSelection.length - 1; i >= 0; i--) {
    if (texteAvantSelection[i] === '[') return true;
    if (texteAvantSelection[i] === ']') return false;
  }
  return false;
}

/**
 * Vérifie si un nom de fichier (sans extension) contient des valeurs
 * ou des tags issus du mapping (données sensibles). Retourne la liste
 * des éléments détectés (valeur ou tag complet), ou une liste vide si
 * le nom est sûr.
 *
 * DET-02 — Détection par tokens : chaque valeur est découpée en tokens
 * sur les espaces ET les tirets (ex: "M. Lefevre" → ["M.", "Lefevre"],
 * "Jean-Paul" → ["Jean", "Paul"]). Une valeur est DÉTECTÉE dès qu'AU
 * MOINS UN de ses tokens est présent dans le nom du fichier. On retourne
 * toujours la VALEUR COMPLÈTE détectée (et non le token seul), afin de
 * préserver le format de retour existant et d'afficher la donnée sensible
 * correspondante dans le warning.
 *
 * Les tokens trop courts (< 2 caractères, ex: l'initiale "M" seule) sont
 * ignorés pour limiter les faux positifs. On conserve en revanche les
 * tokens de 2 caractères comme "M." — souhaité pour détecter l'invocation
 * et l'initiale dans le titre (ex: "Docteur M. Smith").
 */

export function nomContientValeursMapping(
  nomFichier: string,
  mapping: Mapping,
): string[] {
  const nomMinuscule = nomFichier.toLowerCase();
  const detectees: string[] = [];

  // Vérifier les valeurs du mapping (ex: "Sophie Lambert")
  const valeurPresente = (valeur: string): boolean => {
    const tokens = valeur
      .split(/[\s-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2);
    return tokens.some((token) => nomMinuscule.includes(token.toLowerCase()));
  };

  for (const valeurs of Object.values(mapping)) {
    for (const valeur of valeurs) {
      if (valeur.length > 0 && valeurPresente(valeur)) {
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