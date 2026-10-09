import { describe, it, expect, beforeEach } from 'vitest';
import {
  reinitialiserCompteurs,
  genererTag,
  genererMapping,
  appliquerMapping,
  restaurerTexte,
  genererCleJson,
  chargerCleJson,
  nomContientValeursMapping,
  estValeurValide,
  estSelectionDansTag,
} from './mapping';

describe('genererTag', () => {
  beforeEach(() => reinitialiserCompteurs());

  it('génère [TYPE] pour la première occurrence', () => {
    expect(genererTag('PERSONNE')).toBe('[PERSONNE]');
  });

  it('génère [TYPE_2] pour la deuxième occurrence', () => {
    genererTag('PERSONNE');
    expect(genererTag('PERSONNE')).toBe('[PERSONNE_2]');
  });

  it('gère plusieurs types indépendamment', () => {
    genererTag('PERSONNE');
    genererTag('ADRESSE');
    expect(genererTag('PERSONNE')).toBe('[PERSONNE_2]');
    expect(genererTag('ADRESSE')).toBe('[ADRESSE_2]');
  });
});

describe('genererMapping', () => {
  beforeEach(() => reinitialiserCompteurs());

  it('crée un mapping à partir de groupes', () => {
    const groupes = [
      { type: 'EMAIL', valeurs: ['test@exemple.fr'] },
      { type: 'TEL', valeurs: ['0612345678'] },
    ];

    const mapping = genererMapping(groupes);

    expect(mapping['[EMAIL]']).toEqual(['test@exemple.fr']);
    expect(mapping['[TEL]']).toEqual(['0612345678']);
  });
});

describe('appliquerMapping', () => {
  it('remplace les valeurs par leurs tags', () => {
    const mapping = {
      '[EMAIL]': ['test@exemple.fr'],
      '[TEL]': ['0612345678'],
    };

    const texte = 'Contact : test@exemple.fr ou 0612345678';
    const resultat = appliquerMapping(texte, mapping);

    expect(resultat).toBe('Contact : [EMAIL] ou [TEL]');
  });

  it('remplace toutes les occurrences de la même valeur', () => {
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };
    const texte = 'a@a.com et test@exemple.fr et test@exemple.fr';

    const resultat = appliquerMapping(texte, mapping);

    expect(resultat).toContain('[EMAIL]');
    expect((resultat.match(/test@exemple\.fr/g) || []).length).toBe(0);
  });

  // B08 — Reproduction du bug de chevauchement
  it('gère les valeurs qui se chevauchent sans résidu (B08)', () => {
    const mapping = {
      '[ADOLESCENT]': ['Tom M', 'Tom', 'Tommy'],
    };

    const texte = 'Tom M a discuté avec Tommy et Tom';
    const resultat = appliquerMapping(texte, mapping);

    // Aucune occurrence ne doit produire de résidu comme '[ADOLESCENT]my'
    expect(resultat).not.toMatch(/\[ADOLESCENT\]\w/);
    expect(resultat).toBe('[ADOLESCENT] a discuté avec [ADOLESCENT] et [ADOLESCENT]');
  });

  // CORR-02 — Tag imbriqué : ne pas pseudonymiser dans un tag déjà posé
  it("ne pseudonymise pas dans un tag déjà posé (CORR-02)", () => {
    const mapping = {
      '[MON PATIENT]': ['MON PATIENT'],
      '[PERSONNE]': ['PATIENT'],
    };

    const texte = 'MON PATIENT est malade. PATIENT va bien.';
    const resultat = appliquerMapping(texte, mapping);

    // "MON PATIENT" doit être remplacé par [MON PATIENT] (plus longue correspondance)
    // "PATIENT" seul (deuxième occurrence) doit être remplacé par [PERSONNE]
    // Mais le PATIENT dans [MON PATIENT] NE doit PAS être remplacé
    expect(resultat).not.toMatch(/\[MON \[PERSONNE\]\]/);
    expect(resultat).toBe('[MON PATIENT] est malade. [PERSONNE] va bien.');
  });

  // CORR-02 — Chevauchement : la plus longue correspondance gagne
  it("en cas de chevauchement, garde la correspondance la plus longue (CORR-02)", () => {
    const mapping = {
      '[LIEU]': ['Saint-Jean-de-Luz'],
      '[VILLE]': ['Jean'],
    };

    const texte = 'Saint-Jean-de-Luz est une belle ville. Jean est mon ami.';
    const resultat = appliquerMapping(texte, mapping);

    // "Saint-Jean-de-Luz" complet → [LIEU] (plus long)
    // "Jean" seul (deuxième occurrence) → [VILLE]
    // Mais "Jean" dans "Saint-Jean-de-Luz" ne doit pas être remplacé
    expect(resultat).toBe('[LIEU] est une belle ville. [VILLE] est mon ami.');
  });

  // CORR-02 — Occurrence isolée bien remplacée (tag non présent)
  it("remplace les occurrences isolées d'une valeur (CORR-02)", () => {
    const mapping = {
      '[PERSONNE]': ['Dupont'],
    };

    const texte = 'Dupont est ici, et Dupont aussi.';
    const resultat = appliquerMapping(texte, mapping);

    expect(resultat).toBe('[PERSONNE] est ici, et [PERSONNE] aussi.');
  });

  // ── REGEX-01 — Accents (Unicode lookarounds \p{L}) ─────────────

  it("pseudonymise Chloé (accent en fin)", () => {
    const mapping = { '[PERSONNE]': ['Chloé'] };
    expect(appliquerMapping('Chloé est venue.', mapping)).toBe('[PERSONNE] est venue.');
  });

  it('pseudonymise Hélène', () => {
    const mapping = { '[PERSONNE]': ['Hélène'] };
    expect(appliquerMapping('Hélène est là.', mapping)).toBe('[PERSONNE] est là.');
  });

  it('pseudonymise Émilie en début de phrase', () => {
    const mapping = { '[PERSONNE]': ['Émilie'] };
    expect(appliquerMapping('Émilie est partie.', mapping)).toBe('[PERSONNE] est partie.');
  });

  it('pseudonymise Tom (non-régression boundary)', () => {
    const mapping = { '[PERSONNE]': ['Tom'] };
    expect(appliquerMapping('Tom est là.', mapping)).toBe('[PERSONNE] est là.');
  });

  it("ne pseudonymise pas Tom dans Tommy (boundary)", () => {
    const mapping = { '[PERSONNE]': ['Tom'] };
    expect(appliquerMapping('Tommy est là.', mapping)).toBe('Tommy est là.');
  });

  it("ne pseudonymise pas Émilie dans Émilienne (boundary avec accent)", () => {
    const mapping = { '[PERSONNE]': ['Émilie'] };
    expect(appliquerMapping('Émilienne est là.', mapping)).toBe('Émilienne est là.');
  });
});

describe('restaurerTexte', () => {
  it('remplace les tags par leurs valeurs', () => {
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };
    const texte = 'Contact : [EMAIL]';

    const resultat = restaurerTexte(texte, mapping);

    expect(resultat).toBe('Contact : test@exemple.fr');
  });
});

describe('genererCleJson / chargerCleJson', () => {
  it('fait un round-trip JSON (valeurs valides seulement)', () => {
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };

    const json = genererCleJson(mapping);
    const { mapping: reloaded, valeursRetirees } = chargerCleJson(json);

    expect(reloaded).toEqual(mapping);
    expect(valeursRetirees).toEqual([]);
  });

  it('filtre les valeurs contenant des crochets', () => {
    const json = JSON.stringify({
      '[PERSONNE]': ['Tom', '[ADRESSE]', 'Jean [Dupont]'],
    });

    const { mapping, valeursRetirees } = chargerCleJson(json);

    expect(mapping['[PERSONNE]']).toEqual(['Tom']);
    expect(valeursRetirees).toEqual([
      { tag: '[PERSONNE]', valeur: '[ADRESSE]' },
      { tag: '[PERSONNE]', valeur: 'Jean [Dupont]' },
    ]);
  });

  it('conserve un tag vidé de toutes ses valeurs', () => {
    const json = JSON.stringify({
      '[PERSONNE]': ['[ADRESSE]', '[PERS'],
    });

    const { mapping, valeursRetirees } = chargerCleJson(json);

    expect(mapping['[PERSONNE]']).toEqual([]);
    expect(valeursRetirees).toHaveLength(2);
  });

  it('ne modifie pas un entièrement valide', () => {
    const original = {
      '[EMAIL]': ['test@exemple.fr'],
      '[TEL]': ['0612345678'],
    };

    const json = genererCleJson(original);
    const { mapping, valeursRetirees } = chargerCleJson(json);

    expect(mapping).toEqual(original);
    expect(valeursRetirees).toEqual([]);
  });

  it('laisse les autres tags intacts quand un tag a des invalides', () => {
    const json = JSON.stringify({
      '[PERSONNE]': ['Tom', '[ADRESSE]'],
      '[EMAIL]': ['test@exemple.fr'],
    });

    const { mapping, valeursRetirees } = chargerCleJson(json);

    expect(mapping['[PERSONNE]']).toEqual(['Tom']);
    expect(mapping['[EMAIL]']).toEqual(['test@exemple.fr']);
    expect(valeursRetirees).toEqual([
      { tag: '[PERSONNE]', valeur: '[ADRESSE]' },
    ]);
  });
});

describe('nomContientValeursMapping', () => {
  it('détecte une valeur du mapping dans le nom du fichier', () => {
    const mapping = { '[PERSONNE]': ['Sophie Lambert'] };
    expect(nomContientValeursMapping('compte-rendu Sophie Lambert', mapping)).toEqual([
      'Sophie Lambert',
    ]);
  });

  it('retourne une liste vide si le nom est sûr', () => {
    const mapping = { '[PERSONNE]': ['Sophie Lambert'] };
    expect(nomContientValeursMapping('compte-rendu patient', mapping)).toEqual([]);
  });

  it('détecte plusieurs valeurs', () => {
    const mapping = {
      '[PERSONNE]': ['Sophie Lambert', 'Jean Dupont'],
    };
    const resultat = nomContientValeursMapping(
      'Sophie Lambert et Jean Dupont rapport',
      mapping,
    );
    expect(resultat).toContain('Sophie Lambert');
    expect(resultat).toContain('Jean Dupont');
  });

  it('ignore les valeurs vides', () => {
    const mapping = { '[PERSONNE]': [''] };
    expect(nomContientValeursMapping('test', mapping)).toEqual([]);
  });

  it('est insensible à la casse', () => {
    const mapping = { '[EMAIL]': ['sophie@test.fr'] };
    expect(nomContientValeursMapping('Rapport SOPHIE@test.fr', mapping)).toEqual([
      'sophie@test.fr',
    ]);
  });

  it("détecte un tag (clé du mapping) dans le nom du fichier", () => {
    const mapping = { '[PERSONNE]': ['Sophie Lambert'] };
    expect(nomContientValeursMapping('Rapport [PERSONNE]', mapping)).toEqual([
      '[PERSONNE]',
    ]);
  });

  it('détecte à la fois valeurs et tags dans le nom', () => {
    const mapping = { '[PERSONNE]': ['Sophie Lambert', 'Jean Dupont'] };
    const resultat = nomContientValeursMapping(
      'Sophie Lambert et [PERSONNE] rapport',
      mapping,
    );
    expect(resultat).toContain('Sophie Lambert');
    expect(resultat).toContain('[PERSONNE]');
  });

  it('est insensible à la casse pour les tags', () => {
    const mapping = { '[PERSONNE]': ['Sophie Lambert'] };
    expect(nomContientValeursMapping('rapport [personne]', mapping)).toEqual([
      '[PERSONNE]',
    ]);
  });

  // ── DET-02 — Détection par tokens (espaces / tirets) ─────────────────
  it('détecte une valeur quand un seul de ses tokens est présent dans le titre (DET-02)', () => {
    const mapping = { '[PERSONNE]': ['M. Lefevre'] };
    // Le titre ne contient PAS la chaîne complète "M. Lefevre", mais le token "Lefevre"
    expect(nomContientValeursMapping('Henri Lefevre', mapping)).toEqual([
      'M. Lefevre',
    ]);
  });

  it('détecte grâce au token "M." (initiale conservée, 2 caractères) (DET-02)', () => {
    const mapping = { '[PERSONNE]': ['M. Lefevre'] };
    expect(nomContientValeursMapping('Docteur M. Smith', mapping)).toEqual([
      'M. Lefevre',
    ]);
  });

  it('découpe les valeurs sur les tirets (DET-02)', () => {
    const mapping = { '[PERSONNE]': ['Jean-Paul'] };
    expect(nomContientValeursMapping('Contact Paul', mapping)).toEqual([
      'Jean-Paul',
    ]);
    expect(nomContientValeursMapping('Contact Jean', mapping)).toEqual([
      'Jean-Paul',
    ]);
  });

  it('reste insensible à la casse après tokenisation (DET-02)', () => {
    const mapping = { '[PERSONNE]': ['M. Lefevre'] };
    expect(nomContientValeursMapping('HENRI LEFEVRE', mapping)).toEqual([
      'M. Lefevre',
    ]);
  });

  it('ignore les tokens trop courts (< 2 caractères) pour éviter les faux positifs (DET-02)', () => {
    const mapping = { '[PERSONNE]': ['J Martin'] };
    // L'initiale "J" (1 caractère) seule ne doit pas déclencher la détection
    expect(nomContientValeursMapping('rapport J', mapping)).toEqual([]);
    // mais "Martin" doit déclencher la détection de la valeur complète
    expect(nomContientValeursMapping('rapport Martin', mapping)).toEqual([
      'J Martin',
    ]);
  });

  it('ne détecte pas un nom sûr quand aucun token ne correspond (DET-02)', () => {
    const mapping = { '[PERSONNE]': ['M. Lefevre'] };
    expect(nomContientValeursMapping('compte-rendu patient', mapping)).toEqual(
      [],
    );
  });

  // ── Scénario utilisateur : token partiel d'une valeur multi-mot ──────────
  it("détecte une valeur multi-mot quand un seul token est dans le nom (ex: 'Lefevre' de 'Henri Lefevre')", () => {
    const mapping = { '[PERSONNE]': ['Henri Lefevre'] };
    // Le nom ne contient QUE "Lefevre", pas "Henri"
    expect(
      nomContientValeursMapping('rapport Lefevre-pseudonymise.docx', mapping),
    ).toEqual(['Henri Lefevre']);
  });

  it('détecte une valeur multi-mot quand le nom complet est présent', () => {
    const mapping = { '[PERSONNE]': ['Henri Lefevre'] };
    expect(
      nomContientValeursMapping(
        'rapport Henri Lefevre-pseudonymise.docx',
        mapping,
      ),
    ).toEqual(['Henri Lefevre']);
  });

  it('détecte parmi plusieurs tags quand un seul token correspond', () => {
    const mapping = {
      '[PERSONNE]': ['Henri Lefevre', 'Sophie Lambert'],
      '[EMAIL]': ['test@exemple.fr'],
    };
    const resultat = nomContientValeursMapping(
      'rapport Lefevre-pseudonymise.docx',
      mapping,
    );
    expect(resultat).toContain('Henri Lefevre');
    expect(resultat).not.toContain('Sophie Lambert');
    expect(resultat).not.toContain('test@exemple.fr');
  });

  it("détecte une valeur canonique (minuscule) quand le token est présent", () => {
    const mapping = { '[PERSONNE]': ['henri lefevre'] };
    expect(
      nomContientValeursMapping('rapport Lefevre-pseudonymise.docx', mapping),
    ).toEqual(['henri lefevre']);
  });
});

describe('estSelectionDansTag', () => {
  it.each([
    // [texteAvant, attendu]
    ['Contact : [PATIE', true],        // après '[' → dans le tag
    ['Le patient [PATIENT] ', false],  // après ']' → hors du tag
    ['Début du texte sans crochet', false], // pas de crochet → hors
    ['[', true],                       // juste '[' → dans le tag
    [']', false],                      // juste ']' → hors (le ']' ferme avant)
    ['[TEL][PATIE', true],             // deuxième tag ouvert
    ['[TEL] ', false],                 // après ']' → hors
    ['Début [TEL] texte [PATIE', true], // après '[' du deuxième tag
    ['Début [TEL] texte ', false],      // après ']' du deuxième tag
  ])('retourne %s pour "%s"', (texteAvant, attendu) => {
    expect(estSelectionDansTag(texteAvant!)).toBe(attendu);
  });
});

describe('estValeurValide', () => {
  it.each([
    ['[ADRESSE]', false],
    ['[PERS', false],
    ['PERS]', false],
    ['6, [ADRESSE], Paris', false],
    ['Jean [Dupont]', false],
    ['Tom', true],
    ['Jean-Paul', true],
    ['6, rue de Paris', true],
    ['Émilie', true],
  ])('retourne %s pour %s', (valeur, attendu) => {
    expect(estValeurValide(valeur)).toBe(attendu);
  });
});