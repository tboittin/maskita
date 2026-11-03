import type { Detection } from './regex';

// DET-AUTO — détection « sans modèle » des dates et des adresses.
// Contrairement aux REGLES de regex.ts (identifiants à format fixe), ces
// détecteurs s'appuient sur le contexte : noms de mois, types de voie,
// code postal. Les noms de personnes ne sont pas détectés ici : une liste de
// prénoms produit trop de faux positifs, ils viendront d'un modèle NER.

const MOIS = 'janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre';
const JOURS = 'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche';

// Mot à majuscule initiale (Dupont) ou tout en majuscules (DUPONT), composé possible
const MOT_MAJ = "\\p{Lu}[\\p{L}'’]+(?:-\\p{Lu}[\\p{L}'’]+)*";
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

export const REGLES_CONTEXTUELLES: { type: string; pattern: RegExp }[] = [
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
      detections.push({
        valeur: match[0],
        type: regle.type as Detection['type'],
        position: match.index,
        longueur: match[0].length,
      });
    }
  }

  return retirerChevauchements(detections);
}
