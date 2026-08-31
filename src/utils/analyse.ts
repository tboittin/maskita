import { type Detection, type TypePII, REGLES } from './regex';
import { genererTag, reinitialiserCompteurs } from './mapping';
import type { Mapping } from './mapping';

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

  return detections;
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
 * Fusionne les nouvelles détections avec un mapping existant.
 * - Les valeurs déjà présentes dans le mapping ne sont pas dupliquées.
 * - Les nouvelles valeurs sont ajoutées aux tags existants du même type,
 *   ou créent un nouveau tag si aucun tag du type n'existe.
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

  // 3. Ajouter les nouvelles détections
  for (const d of detections) {
    const dejaPresent = Object.values(resultat).some(valeurs =>
      valeurs.some(v =>
        v.toLowerCase().replace(/[\s.-]+/g, '') ===
        d.valeur.toLowerCase().replace(/[\s.-]+/g, ''),
      ),
    );

    if (!dejaPresent) {
      const tagExistant = Object.keys(resultat).find(t =>
        t.startsWith(`[${d.type}]`) || t.startsWith(`[${d.type}_`),
      );

      if (tagExistant) {
        resultat[tagExistant].push(d.valeur);
      } else {
        const nouveauTag = genererTag(d.type);
        resultat[nouveauTag] = [d.valeur];
      }
    }
  }

  return resultat;
}