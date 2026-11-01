import { type Detection, type TypePII, REGLES } from './regex';
import { genererTag, reinitialiserCompteurs } from './mapping';
import type { Mapping } from './mapping';
import { detecterContexte } from './detectionContextuelle';

export function analyserTexte(texte: string): Detection[] {
  const detections: Detection[] = [];

  for (const regle of REGLES) {
    let match: RegExpExecArray | null;
    regle.pattern.lastIndex = 0;
    while ((match = regle.pattern.exec(texte)) !== null) {
      detections.push({
        valeur: match[0],
        type: regle.type,
        position: match.index,
        longueur: match[0].length,
      });
    }
  }

  return [...detections, ...detecterContexte(texte)];
}

export interface GroupeDetection {
  type: TypePII;
  valeurs: string[];
}

export function deduplicator(detections: Detection[]): GroupeDetection[] {
  const vues = new Map<string, Set<string>>();

  for (const d of detections) {
    const normalisee = d.valeur.trim().toLowerCase().replace(/[\s.-]+/g, '');
    if (!vues.has(d.type)) {
      vues.set(d.type, new Set());
    }
    vues.get(d.type)!.add(normalisee);
  }

  const groupes: GroupeDetection[] = [];
  Array.from(vues.entries()).forEach(([type, valeurs]) => {
    groupes.push({
      type: type as TypePII,
      valeurs: Array.from(valeurs),
    });
  });

  return groupes;
}

interface ConflitSousChaine {
  courte: string;
  longue: string;
  type: TypePII;
}

export function resoudreConflitsSousChaine(
  detections: Detection[],
): { net: Detection[]; conflits: ConflitSousChaine[] } {
  const conflits: ConflitSousChaine[] = [];
  const net = [...detections];
  const supprimees = new Set<number>();

  for (let i = 0; i < net.length; i++) {
    if (supprimees.has(i)) continue;
    for (let j = 0; j < net.length; j++) {
      if (i === j || supprimees.has(j)) continue;
      const a = net[i].valeur.toLowerCase().trim();
      const b = net[j].valeur.toLowerCase().trim();
      if (a !== b && a.includes(b) && a.length > b.length) {
        conflits.push({ courte: net[j].valeur, longue: net[i].valeur, type: net[i].type });
        supprimees.add(j);
      } else if (a !== b && b.includes(a) && b.length > a.length) {
        conflits.push({ courte: net[i].valeur, longue: net[j].valeur, type: net[i].type });
        supprimees.add(i);
        break;
      }
    }
  }

  return {
    net: net.filter((_, idx) => !supprimees.has(idx)),
    conflits,
  };
}

/**
 * Normalise une valeur détectée en forme canonique : trim + minuscule,
 * en conservant l'espacement interne (DET-01 : casse insensible).
 * Partagée par la déduplication pour garantir la cohérence de la casse.
 */
export function normaliserValeurCanonique(valeur: string): string {
  return valeur.trim().toLowerCase();
}

/**
 * DET-AUTO — types où chaque valeur distincte est une entité à part
 * (deux personnes ne doivent pas partager le même tag).
 */
const TYPES_PAR_ENTITE: ReadonlySet<TypePII> = new Set<TypePII>(['PERSONNE', 'DATE', 'ADRESSE']);

/**
 * Rattache un prénom ou un nom seul (« Marie », « Dupont ») au tag PERSONNE
 * dont une valeur contient ce mot, s'il y en a exactement un. En cas
 * d'ambiguïté (deux « Dupont »), aucune liaison : l'utilisateur tranche.
 */
export function trouverPersonneLiee(mapping: Mapping, valeur: string): string | null {
  const mot = valeur.trim().toLowerCase();
  if (/\s/.test(mot)) return null;

  const candidats = Object.entries(mapping).filter(
    ([tag, valeurs]) =>
      (tag.startsWith('[PERSONNE]') || tag.startsWith('[PERSONNE_')) &&
      valeurs.some(v => v.toLowerCase().split(/\s+/).includes(mot)),
  );
  return candidats.length === 1 ? candidats[0][0] : null;
}

/**
 * Fusionne les nouvelles détections avec un mapping existant.
 * - Les valeurs déjà présentes dans le mapping ne sont pas dupliquées.
 * - Les nouvelles valeurs sont ajoutées aux tags existants du même type,
 *   ou créent un nouveau tag si aucun tag du type n'existe.
 * - La valeur canonique stockée est la version minuscule (DET-01).
 * - Réinitialise les compteurs pour éviter les conflits de numérotation.
 */
export function fusionnerAvecMappingExistant(
  mappingExistant: Mapping | null,
  detections: Detection[],
): Mapping {
  const resultat: Mapping = {};

  // 1. Recopier le mapping existant
  if (mappingExistant) {
    for (const [tag, valeurs] of Object.entries(mappingExistant)) {
      resultat[tag] = [...valeurs];
    }
  }

  // 2. Initialiser les compteurs pour générer des tags uniques
  reinitialiserCompteurs();
  for (const tag of Object.keys(resultat)) {
    const base = tag.replace(/^\[/, '').replace(/_\d+\]$/, '').replace(/\]$/, '');
    const match = tag.match(/_(\d+)\]$/);
    const num = match ? parseInt(match[1]) : 1;
    for (let i = 0; i < num; i++) {
      genererTag(base);
    }
  }

  // 3. Ajouter les nouvelles détections. Les entités (personnes, dates,
  // adresses) passent en premier, les plus longues d'abord, pour que
  // « Marie » puisse se rattacher à « Marie Dupont ».
  const entites = detections
    .filter(d => TYPES_PAR_ENTITE.has(d.type))
    .sort((a, b) => b.valeur.length - a.valeur.length);
  const autres = detections.filter(d => !TYPES_PAR_ENTITE.has(d.type));

  for (const d of [...entites, ...autres]) {
    const dejaPresent = Object.values(resultat).some(valeurs =>
      valeurs.some(v =>
        v.toLowerCase().replace(/[\s.-]+/g, '') ===
        d.valeur.toLowerCase().replace(/[\s.-]+/g, ''),
      ),
    );

    if (dejaPresent) continue;

    if (TYPES_PAR_ENTITE.has(d.type)) {
      // DET-AUTO — une entité par tag (valeur canonique minuscule, DET-01)
      const valeur = normaliserValeurCanonique(d.valeur);
      const tagLie = d.type === 'PERSONNE' ? trouverPersonneLiee(resultat, valeur) : null;
      if (tagLie) {
        resultat[tagLie].push(valeur);
      } else {
        resultat[genererTag(d.type)] = [valeur];
      }
    } else {
      const tagExistant = Object.keys(resultat).find(t =>
        t.startsWith(`[${d.type}]`) || t.startsWith(`[${d.type}_`),
      );

      if (tagExistant) {
        resultat[tagExistant].push(normaliserValeurCanonique(d.valeur));
      } else {
        const nouveauTag = genererTag(d.type);
        resultat[nouveauTag] = [normaliserValeurCanonique(d.valeur)];
      }
    }
  }

  return resultat;
}