/**
 * Tokenisation de texte pour l'autocomplétion SUG-C.
 * Extrait les mots uniques du texte original (texte lisible) pour générer
 * des suggestions d'autocomplétion dans la modale d'ajout classique.
 *
 * @module tokenisation
 */

/**
 * Extrait les mots uniques d'un texte en découpant sur les espaces
 * et les signes de ponctuation. Les mots sont dédupliqués et conservés
 * dans l'ordre de première apparition.
 */
export function extraireMots(texte: string): string[] {
  if (!texte) return [];

  const tokens = texte.split(/[\s,;:!?.'"()\[\]{}@#$%^&*+<=>|~`\/\\–—]+/);
  const vus = new Set<string>();
  const mots: string[] = [];

  for (const token of tokens) {
    const t = token.trim();
    if (t !== '' && !vus.has(t)) {
      vus.add(t);
      mots.push(t);
    }
  }

  return mots;
}

/**
 * Filtre les mots par préfixe (insensible à la casse).
 * Retourne les mots qui commencent par le préfixe donné.
 * N'inclut PAS le mot qui correspond exactement au préfixe.
 * Limite optionnelle (max) pour éviter de submerger l'UI.
 */
export function filtrerParPrefixe(
  mots: string[],
  prefixe: string,
  limite?: number,
): string[] {
  const p = prefixe.trim();
  if (p === '') return [];

  const pLower = p.toLowerCase();
  const resultats: string[] = [];

  for (const mot of mots) {
    const mLower = mot.toLowerCase();
    if (mLower.startsWith(pLower) && mot !== p) {
      resultats.push(mot);
      if (limite && resultats.length >= limite) break;
    }
  }

  return resultats;
}

/**
 * Vérifie si une valeur correspond exactement à un mot dans la liste
 * (insensible à la casse). Quand c'est le cas, les suggestions
 * d'autocomplétion ne sont pas utiles.
 */
export function existeCorrespondanceExacte(
  mots: string[],
  valeur: string,
): boolean {
  const v = valeur.trim();
  if (v === '') return false;
  const vLower = v.toLowerCase();
  for (const mot of mots) {
    if (mot.toLowerCase() === vLower) return true;
  }
  return false;
}