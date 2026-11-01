#!/usr/bin/env python3
"""Génère src/utils/prenoms.ts à partir de deux paquets npm décompressés.

Usage :
  python3 scripts/generer-prenoms.py <match-entities/package> <dictionary-fr/package> > src/utils/prenoms.ts

- @socialgouv/match-entities (Apache-2.0) fournit la liste des prénoms, issue
  du jeu de données data.gouv.fr « Liste de prénoms et patronymes ».
- dictionary-fr (Hunspell, MPL) sert uniquement à repérer les prénoms qui
  sont aussi des mots courants (« Rose », « Pierre »…) : ils ne sont détectés
  qu'au milieu d'une phrase.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

# Entrées de la liste source qui ne sont pas des prénoms, ou trop risquées
EXCLUS = set("""
AMER ANTE BAT BER BUN CAB CHAR CHI COLPORTAGE DES DIT DIV DOS ENGIN FEMME FILS
HOMME INDIVISION LAI LIE LIEN LONG MADE MAIRE MAN MATELASSIER MEDECINE MEDICAL
MICHE MILE MIN MOCHE NONCE PERE PHI PIE POISSONNERIE ROBE SANG SANTE SERIF SON
TEINTURERIE THE TONNELLERIE TRI WAI CROIX DIEU SAINT PETIT BLANC DAME LAID AVOUE
AMOUR HUE TIN TAN ESPRIT OURS PAPA MAMA MAMY NANA BABA BIBI DOUDOU BOUBOU JUNIOR
KING PRINCE SULTAN GENTIL PARFAIT SAGE SEVERE PRUDENT CONSTANT JUSTE MODESTE
ROCHE MOULIN MEUNIER CLERC DUC REINE FRANC ETOILE NEIGE ROUX ISLAM JIHAD RAMADAN
ASCENSION ASSOMPTION CONCEPTION INCARNATION TRINITE CHRIST JESUS JUDAS DON BEN
MME MLLE PARIS FRANCE LOURDES
""".split())


def normaliser(mot: str) -> str:
    sans_accents = unicodedata.normalize('NFD', mot)
    sans_accents = ''.join(c for c in sans_accents if unicodedata.category(c) != 'Mn')
    return sans_accents.upper()


def extraire_prenoms(chemin_paquet: Path) -> list[str]:
    source = (chemin_paquet / 'dist' / 'index.mjs').read_text(encoding='utf-8')
    bloc = re.search(r'var prenoms_default = (\[.*?\n\]);', source, re.S)
    if not bloc:
        sys.exit('Liste de prénoms introuvable dans le paquet')
    donnees = json.loads(re.sub(r'(\w+):', r'"\1":', bloc.group(1)))
    return sorted({d['value'] for d in donnees})


def extraire_mots_courants(chemin_dico: Path) -> set[str]:
    lignes = (chemin_dico / 'index.dic').read_text(encoding='utf-8').splitlines()[1:]
    mots = set()
    for ligne in lignes:
        mot = ligne.split('/')[0].split('\t')[0]
        if mot and mot[0].islower():
            mots.add(normaliser(mot))
    return mots


def main() -> None:
    prenoms = [p for p in extraire_prenoms(Path(sys.argv[1]))
               if len(p) >= 3 and p not in EXCLUS and re.fullmatch(r'[A-Z]+(-[A-Z]+)?', p)]
    mots_courants = extraire_mots_courants(Path(sys.argv[2]))
    ambigus = [p for p in prenoms if p in mots_courants]
    print('// Fichier généré par scripts/generer-prenoms.py — ne pas modifier à la main.')
    print('// Source des prénoms : data.gouv.fr « Liste de prénoms et patronymes »,')
    print('// via le paquet npm @socialgouv/match-entities (Apache-2.0).')
    print('// Prénoms en majuscules, sans accents.')
    print()
    print(f"const LISTE = '{'|'.join(prenoms)}';")
    print()
    print('// Prénoms qui sont aussi des mots courants (dictionnaire Hunspell fr) :')
    print('// détectés seulement au milieu d\'une phrase, ou suivis d\'un nom.')
    print(f"const LISTE_AMBIGUS = '{'|'.join(ambigus)}';")
    print()
    print("export const PRENOMS: ReadonlySet<string> = new Set(LISTE.split('|'));")
    print("export const PRENOMS_AMBIGUS: ReadonlySet<string> = new Set(LISTE_AMBIGUS.split('|'));")


main()
