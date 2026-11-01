import type { Detection } from './regex';
import { PRENOMS, PRENOMS_AMBIGUS } from './prenoms';

// DET-AUTO — détection « sans modèle » des noms, dates, initiales et adresses.
// Contrairement aux REGLES de regex.ts (identifiants à format fixe), ces
// détecteurs s'appuient sur le contexte : civilités, liste de prénoms,
// noms de mois, types de voie. Les résultats sont des propositions que
// l'utilisateur valide ou retire dans l'écran de revue.

const MOIS = 'janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre';
const JOURS = 'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche';

// Mot à majuscule initiale (Dupont) ou tout en majuscules (DUPONT), composé possible
const MOT_MAJ = "\\p{Lu}[\\p{L}'’]+(?:-\\p{Lu}[\\p{L}'’]+)*";
const PARTICULE = "(?:d['’]|de |du |des |le |la |van |von )";
const NOM = `${PARTICULE}?${MOT_MAJ}`;
const SUITE_NOMS = `${NOM}(?: ${NOM}){0,2}`;
const INITIALE = '\\p{Lu}\\.';

const CIVILITES = [
  'M\\.', 'Mr\\.?', 'Monsieur', 'Mme\\.?', 'Madame', 'Mlle\\.?', 'Mademoiselle',
  'Dr\\.?', 'Docteure?', 'Pr\\.?', 'Professeure?', 'Me\\.?', 'Maître',
].join('|');

/** Rend un mot insensible à la casse sans passer tout le motif en flag `i`. */
function insensible(mot: string): string {
  return mot.replace(/\p{L}/gu, c => `[${c.toLowerCase()}${c.toUpperCase()}]`);
}

const TYPES_VOIE = [
  'rue', 'avenue', 'av.', 'boulevard', 'bd', 'place', 'chemin', 'allée', 'allee',
  'impasse', 'route', 'quai', 'cours', 'square', 'résidence', 'residence',
  'lotissement', 'lieu-dit', 'rond-point', 'esplanade', 'promenade', 'passage',
  'sentier', 'hameau', 'cité', 'cite',
].map(v => insensible(v).replace('.', '\\.')).join('|');

const LIAISON_VOIE = "(?:de |du |des |la |le |les |aux |au |sur |l['’]|d['’])";
const NOM_VOIE = `${LIAISON_VOIE}*${MOT_MAJ}(?: ${LIAISON_VOIE}*${MOT_MAJ})*`;
const VILLE = "\\p{Lu}[\\p{L}'’]*(?:-[\\p{L}'’]+)*(?: [Cc][Ee][Dd][Ee][Xx])?";
const CODE_POSTAL_VILLE = `\\d{5} ${VILLE}`;

export const REGLES_CONTEXTUELLES: { type: string; pattern: RegExp; groupe?: number }[] = [
  // 12/03/2024, 12-03-24, 12.03.2024 (le lookahead écarte les adresses IP)
  {
    type: 'DATE',
    pattern: /(?<![\d.])(?:0?[1-9]|[12]\d|3[01])[/.-](?:0?[1-9]|1[0-2])[/.-](?:\d{4}|\d{2})(?![\d]|\.\d)/gu,
  },
  // (lundi) 12 mars (2024), 1er mai
  {
    type: 'DATE',
    pattern: new RegExp(
      `(?<![\\p{L}\\d])(?:(?:${JOURS})\\s+)?(?:1er|[12]?\\d|3[01])\\s+(?:${MOIS})(?:\\s+\\d{4})?(?![\\p{L}\\d])`,
      'giu',
    ),
  },
  // mars 2024
  {
    type: 'DATE',
    pattern: new RegExp(`(?<![\\p{L}])(?:${MOIS})\\s+\\d{4}(?!\\d)`, 'giu'),
  },
  // Mme Dupont, Dr Marie Martin, M. D. → seul le nom est retenu (groupe 1)
  {
    type: 'PERSONNE',
    pattern: new RegExp(
      `(?<![\\p{L}])(?:${CIVILITES}) +((?:${INITIALE} )?${SUITE_NOMS}|${INITIALE})(?![\\p{L}])`,
      'gu',
    ),
    groupe: 1,
  },
  // J.D., J. D. (deux initiales exactement : « C.M.P. » est un sigle)
  {
    type: 'PERSONNE',
    pattern: new RegExp(
      `(?<![\\p{L}]|${INITIALE} ?)${INITIALE} ?${INITIALE}(?![\\p{L}]| ?${INITIALE})`,
      'gu',
    ),
  },
  // 12 bis, rue de la République (75012 Paris)
  {
    type: 'ADRESSE',
    pattern: new RegExp(
      `(?<![\\p{L}\\d])\\d{1,4}(?: ?(?:bis|ter))?,? (?:${TYPES_VOIE}) ${NOM_VOIE}(?:,? ${CODE_POSTAL_VILLE})?(?![\\p{L}])`,
      'gu',
    ),
  },
  // 75012 Paris, 42000 Saint-Étienne
  {
    type: 'ADRESSE',
    pattern: new RegExp(`(?<![\\d])${CODE_POSTAL_VILLE}(?![\\p{L}])`, 'gu'),
  },
];

/** Majuscules sans accents, pour comparer avec la liste de prénoms. */
export function normaliserPrenom(mot: string): string {
  return mot.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
}

/**
 * Vrai si la position est en début de phrase : début du texte, ou précédée
 * (hors espaces, guillemets, puces) d'une fin de phrase ou d'un saut de ligne.
 */
export function estDebutDePhrase(texte: string, position: number): boolean {
  let i = position - 1;
  while (i >= 0 && /[ \t «"“(\-–—•*]/.test(texte[i])) i--;
  return i < 0 || /[.!?:\n\r]/.test(texte[i]);
}

const MOT_TITRE = /(?<![\p{L}'’-])\p{Lu}\p{Ll}+(?:-\p{Lu}\p{Ll}+)?(?![\p{L}])/gu;
const NOM_SUIVANT = new RegExp(`^[ \\u00a0](${MOT_MAJ})(?![\\p{L}])`, 'u');

/**
 * Prénoms connus (liste INSEE / data.gouv), suivis éventuellement d'un nom.
 * Un prénom qui est aussi un mot courant (Rose, Pierre) n'est retenu en début
 * de phrase que s'il est suivi d'un nom, ou si le texte contient ailleurs ce
 * prénom suivi d'un nom (« Rose dit… » puis « Rose Bernard »).
 */
export function detecterPrenoms(texte: string): Detection[] {
  const detections: Detection[] = [];
  const ecartes: Detection[] = [];
  MOT_TITRE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MOT_TITRE.exec(texte)) !== null) {
    const mot = match[0];
    const premierePartie = normaliserPrenom(mot.split('-')[0]);
    if (!PRENOMS.has(premierePartie)) continue;

    const suite = texte.slice(match.index + mot.length).match(NOM_SUIVANT);
    const nom = suite ? suite[1] : null;

    const valeur = nom ? `${mot} ${nom}` : mot;
    const detection: Detection = { valeur, type: 'PERSONNE', position: match.index, longueur: valeur.length };

    if (!nom && PRENOMS_AMBIGUS.has(premierePartie) && estDebutDePhrase(texte, match.index)) {
      ecartes.push(detection);
      continue;
    }

    detections.push(detection);
    if (nom) MOT_TITRE.lastIndex = match.index + valeur.length;
  }

  const prenomsAvecNom = new Set(
    detections.filter(d => d.valeur.includes(' ')).map(d => d.valeur.split(' ')[0]),
  );
  return [...detections, ...ecartes.filter(d => prenomsAvecNom.has(d.valeur))];
}

/**
 * Supprime les détections entièrement contenues dans une détection plus
 * longue (« mars 2024 » dans « 12 mars 2024 »).
 */
export function retirerChevauchements(detections: Detection[]): Detection[] {
  const triees = [...detections].sort((a, b) => a.position - b.position || b.longueur - a.longueur);
  const gardees: Detection[] = [];
  for (const d of triees) {
    const englobante = gardees.find(
      g => g.position <= d.position && d.position + d.longueur <= g.position + g.longueur,
    );
    if (!englobante) gardees.push(d);
  }
  return gardees;
}

export function detecterContexte(texte: string): Detection[] {
  const detections: Detection[] = [];

  for (const regle of REGLES_CONTEXTUELLES) {
    regle.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regle.pattern.exec(texte)) !== null) {
      const valeur = regle.groupe ? match[regle.groupe] : match[0];
      // Le groupe capturé termine toujours la correspondance
      const position = match.index + match[0].length - valeur.length;
      detections.push({ valeur, type: regle.type as Detection['type'], position, longueur: valeur.length });
    }
  }

  return retirerChevauchements([...detections, ...detecterPrenoms(texte)]);
}
