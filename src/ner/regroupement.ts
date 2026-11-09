/**
 * MSK-004 — Détection avancée (CamemBERT-NER), partie sans modèle.
 *
 * Le pipeline `token-classification` de @huggingface/transformers renvoie un
 * résultat par jeton (morceau de mot) : étiquette (`I-PER`, `I-LOC`, `I-ORG`,
 * `I-MISC` ou `O`), score et texte du jeton, mais **pas sa position** dans le
 * texte. Ce module :
 *  1. découpe le texte en morceaux courts (CamemBERT lit au plus 512 jetons) ;
 *  2. retrouve la position de chaque jeton dans le texte d'origine ;
 *  3. regroupe les jetons consécutifs de même étiquette en entités entières ;
 *  4. convertit les entités en `Detection` (même format que les regex).
 *
 * Tout est pur et testable sans charger le modèle.
 */
import type { Detection, TypePII } from '../utils/regex';

/** Un jeton tel que renvoyé par le pipeline (avec `ignore_labels: []`). */
export interface JetonNer {
  entity: string;
  score: number;
  word: string;
}

export type EtiquetteNer = 'PER' | 'LOC' | 'ORG' | 'MISC';

export interface EntiteNer {
  valeur: string;
  etiquette: EtiquetteNer;
  /** Position dans le texte complet (décalage du morceau inclus). */
  debut: number;
  fin: number;
  /** Moyenne des scores des jetons de l'entité. */
  score: number;
}

export interface Morceau {
  texte: string;
  /** Position du morceau dans le texte complet. */
  decalage: number;
}

/**
 * Taille maximale d'un morceau, en caractères. En français, CamemBERT produit
 * environ un jeton pour 3 à 4 caractères : 1 000 caractères restent bien sous
 * la limite de 512 jetons.
 */
export const TAILLE_MAX_MORCEAU = 1000;

const CARACTERE_DE_MOT = /[\p{L}\p{N}]/u;

/** Titre en tête d'entité, retiré de la valeur proposée. */
const TITRE_EN_TETE = /^(?:Dr|Pr|Me|M|Mme|Mlle|Docteur|Professeur|Madame|Monsieur)\.?\s+/u;

/**
 * Découpe le texte par paragraphes (lignes non vides), puis coupe les
 * paragraphes trop longs à la fin d'une phrase, ou à défaut sur un espace.
 * Les positions (`decalage`) renvoient au texte d'origine.
 */
export function decouperTexte(texte: string, tailleMax = TAILLE_MAX_MORCEAU): Morceau[] {
  const morceaux: Morceau[] = [];
  const paragraphe = /[^\n]+/g;
  let m: RegExpExecArray | null;
  while ((m = paragraphe.exec(texte)) !== null) {
    let debut = m.index;
    const fin = m.index + m[0].length;
    while (debut < fin) {
      // Sauter les blancs de tête
      while (debut < fin && /\s/.test(texte[debut])) debut++;
      if (debut >= fin) break;
      let coupe = Math.min(fin, debut + tailleMax);
      if (coupe < fin) {
        const fenetre = texte.slice(debut, coupe);
        const finPhrase = Math.max(
          fenetre.lastIndexOf('. '),
          fenetre.lastIndexOf('! '),
          fenetre.lastIndexOf('? '),
        );
        const espace = fenetre.lastIndexOf(' ');
        if (finPhrase > tailleMax / 2) coupe = debut + finPhrase + 1;
        else if (espace > 0) coupe = debut + espace;
      }
      const brut = texte.slice(debut, coupe);
      const sansFin = brut.replace(/\s+$/, '');
      if (sansFin.length > 0) morceaux.push({ texte: sansFin, decalage: debut });
      debut = coupe;
    }
  }
  return morceaux;
}

/** Retire les marqueurs de début de mot SentencePiece éventuels. */
function nettoyerJeton(mot: string): string {
  return mot.replace(/^[▁Ġ]+/, '').replace(/^##/, '');
}

/**
 * Retrouve la position de chaque jeton dans `texte`, dans l'ordre.
 * Un jeton introuvable (normalisation Unicode du tokeniseur, par exemple)
 * reçoit `null` sans faire avancer le curseur.
 */
export function alignerJetons(
  texte: string,
  jetons: JetonNer[],
): ({ debut: number; fin: number } | null)[] {
  const positions: ({ debut: number; fin: number } | null)[] = [];
  let curseur = 0;
  for (const jeton of jetons) {
    const mot = nettoyerJeton(jeton.word);
    if (mot.length === 0) {
      positions.push(null);
      continue;
    }
    let idx = texte.indexOf(mot, curseur);
    if (idx === -1) {
      // Repli insensible à la casse (certains tokeniseurs normalisent)
      idx = texte.toLowerCase().indexOf(mot.toLowerCase(), curseur);
    }
    // On n'accepte pas un saut de plus de quelques caractères : au-delà,
    // ce serait une autre occurrence plus loin dans le texte.
    if (idx === -1 || texte.slice(curseur, idx).trim().length > 2) {
      positions.push(null);
      continue;
    }
    positions.push({ debut: idx, fin: idx + mot.length });
    curseur = idx + mot.length;
  }
  return positions;
}

function etiquetteDe(entity: string): EtiquetteNer | null {
  const e = entity.replace(/^[BI]-/, '');
  return e === 'PER' || e === 'LOC' || e === 'ORG' || e === 'MISC' ? e : null;
}

/** Élargit [debut, fin) aux limites du mot (un jeton peut couper un mot). */
function elargirAuMot(texte: string, debut: number, fin: number): [number, number] {
  while (debut > 0 && CARACTERE_DE_MOT.test(texte[debut - 1])) debut--;
  while (fin < texte.length && CARACTERE_DE_MOT.test(texte[fin])) fin++;
  return [debut, fin];
}

/**
 * Regroupe les jetons consécutifs de même étiquette en entités.
 * Un `B-` (si le modèle en produit) ouvre toujours une nouvelle entité.
 * Un saut de ligne entre deux jetons coupe aussi l'entité.
 */
export function regrouperEntites(
  morceau: Morceau,
  jetons: JetonNer[],
): EntiteNer[] {
  const { texte, decalage } = morceau;
  const positions = alignerJetons(texte, jetons);
  const entites: EntiteNer[] = [];
  let courante: { etiquette: EtiquetteNer; debut: number; fin: number; scores: number[] } | null = null;

  const clore = () => {
    if (!courante) return;
    let [d, f] = elargirAuMot(texte, courante.debut, courante.fin);
    // « Dr. Laurence Petit » → « Laurence Petit » : le titre reste en clair.
    const titre = texte.slice(d, f).match(TITRE_EN_TETE);
    if (titre && d + titre[0].length < f) d += titre[0].length;
    const valeur = texte.slice(d, f).trim();
    if (valeur.length > 0 && CARACTERE_DE_MOT.test(valeur)) {
      entites.push({
        valeur,
        etiquette: courante.etiquette,
        debut: decalage + d,
        fin: decalage + f,
        score: courante.scores.reduce((a, b) => a + b, 0) / courante.scores.length,
      });
    }
    courante = null;
  };

  jetons.forEach((jeton, i) => {
    const pos = positions[i];
    const etiquette = etiquetteDe(jeton.entity);
    if (!pos) return; // jeton non aligné : ignoré, sans couper l'entité
    if (!etiquette) {
      clore();
      return;
    }
    const nouvelle =
      !courante ||
      courante.etiquette !== etiquette ||
      jeton.entity.startsWith('B-') ||
      texte.slice(courante.fin, pos.debut).includes('\n');
    if (nouvelle) {
      clore();
      courante = { etiquette, debut: pos.debut, fin: pos.fin, scores: [jeton.score] };
    } else if (courante) {
      courante.fin = pos.fin;
      courante.scores.push(jeton.score);
    }
  });
  clore();
  return entites;
}

/** Correspondance étiquette du modèle → type de pseudo Maskita. */
export const TYPE_PAR_ETIQUETTE: Record<EtiquetteNer, TypePII | null> = {
  PER: 'PERSONNE',
  LOC: 'LIEU',
  ORG: 'ETABLISSEMENT',
  MISC: null, // divers (événements, œuvres…) : non proposé
};

/** Score moyen minimal pour qu'une entité soit proposée. À régler en MSK-005. */
export const SEUIL_SCORE = 0.5;

/** Convertit les entités en détections Maskita (même format que les regex). */
export function versDetections(entites: EntiteNer[], seuil = SEUIL_SCORE): Detection[] {
  const detections: Detection[] = [];
  for (const e of entites) {
    const type = TYPE_PAR_ETIQUETTE[e.etiquette];
    if (!type || e.score < seuil) continue;
    // Un mot d'une seule lettre (« M », « D ») est presque toujours du bruit.
    if (e.valeur.replace(/[^\p{L}\p{N}]/gu, '').length < 2) continue;
    detections.push({ valeur: e.valeur, type, position: e.debut, longueur: e.fin - e.debut });
  }
  return detections;
}
