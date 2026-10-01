# US-SUG-B — Ajout classique : formulaire prérempli depuis la sélection

**Tags** : `suggestion` `modal` `formulaire` `ajout-classique` `selection`

## Contexte

L'US-SUG-A (#57) a ajouté un bouton "Ajouter un pseudo…" dans la `BarreAjoutSelection` (barre qui apparaît quand on surligne du texte). Ce bouton est pour l'instant un stub (`void montrerAjoutClassique`). Il faut maintenant implémenter la modale qui s'ouvre, avec le champ Valeur prérempli depuis la sélection texte.

## Comportement attendu

1. **Clic "Ajout classique" depuis une sélection texte**
   - La modale s'ouvre avec le champ **Valeur** prérempli (texte sélectionné)
   - Le champ **Type** n'est pas présélectionné (option vide par défaut)
   - Le focus est placé sur le champ **Type** (premier champ focusable)

2. **Validation**
   - Les deux champs (Type + Valeur) doivent être remplis
   - Valider → crée le tag du type choisi avec la valeur, ferme la modale, efface la sélection
   - Si Type ou Valeur est vide, le bouton Valider est désactivé

3. **Annulation**
   - Clic sur Annuler / fermeture → la modale se ferme, la sélection est conservée

4. **Sans sélection**
   - Le `+ Ajouter un pseudo` du tableau (existant dans `PanneauTableauPseudos`) continue de fonctionner avec le formulaire existant
   - La modale SUG-B n'est accessible que via la `BarreAjoutSelection` (donc uniquement quand du texte est surligné)

5. **Ne pas écraser une saisie déjà commencée**
   - Si l'utilisateur sélectionne du texte pendant que la modale est ouverte, la valeur déjà affichée ne change pas
   - La valeur est figée au moment du clic sur "Ajout classique"

## Fichiers concernés

- `src/components/ModalAjoutClassique.tsx` — nouveau composant modale
- `src/hooks/useAjoutRapide.ts` — ajouter `ouvrirAjoutClassique`
- `src/components/EcranRevue.tsx` — intégrer la modale
- `src/components/EcranRestaurationRevue.tsx` — intégrer la modale
- `src/i18n/fr.ts` — libellés français
- `src/i18n/en.ts` — libellés anglais
- Tests unitaires et e2e

## Validation

- `pnpm test -- --run`
- `pnpm exec playwright test`
- `bash scripts/check-coverage.sh`
