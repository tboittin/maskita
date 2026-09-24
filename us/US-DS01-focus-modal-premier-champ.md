# US-DS01 — Focus automatique sur le premier champ de la Modal

**Tags** : `design-system` `modal` `accessibilite` `focus`

## Contexte

Quand l'application ouvre une `Modal` (ex: ajout manuel d'un pseudo), le focus est placé sur le conteneur du dialog (`tabIndex={-1}`). L'utilisateur doit cliquer manuellement dans le premier champ pour commencer à taper.

Comportement attendu : le premier champ focusable dans le contenu de la Modal reçoit le focus automatiquement à l'ouverture.

## Comportement actuel

```ts
// Modal.tsx (v1.2.2) — lignes 216-228
useEffect(() => {
  if (ouvert) {
    declencheurRef.current = document.activeElement;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = precedent;
      declencheurRef.current?.focus?.();
    };
  }
}, [ouvert]);
```

Le `dialogRef.current?.focus()` place le focus sur le div `role="dialog"` (tabIndex=-1).

## Comportement attendu

1. À l'ouverture (`ouvert=true`), la Modal doit focus le **premier élément focusable** dans son `children` ou son `pied`
2. Si aucun élément focusable n'est trouvé, focus le dialog (fallback actuel)
3. Le focus trap (`gererTab`) continue de fonctionner normalement
4. La sauvegarde/restauration du `declencheurRef` reste inchangée

## Proposition d'implémentation

```ts
useEffect(() => {
  if (ouvert) {
    declencheurRef.current = document.activeElement;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      // Chercher le premier élément focusable dans le contenu
      const focusables = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables && focusables.length > 0) {
        (focusables[0] as HTMLElement).focus();
      } else {
        dialogRef.current?.focus();
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = precedent;
      declencheurRef.current?.focus?.();
    };
  }
}, [ouvert]);
```

## Fichiers concernés

- `src/components/ui/Modal.tsx` (source)
- `dist/index.js` (build)
- `dist/index.d.ts` (types — inchangé, les props restent identiques)

## Dépendances

Aucune — le comportement est purement interne au composant Modal.

## Tests

- Modal avec un `<input>` en premier enfant → le input reçoit le focus
- Modal avec seulement du texte → le dialog reçoit le focus (fallback)
- Modal avec `pied` contenant des boutons mais `children` sans focusable → le premier bouton du pied reçoit le focus (le querySelector parcourt tout le dialog)
- Focus trap intact : Tab fait le cycle premier → dernier → premier

## Notes

- Une PR de contournement (#31) a été créée côté application (`EcranRevue.tsx` avec double rAF) en attendant le fix dans le DS
- Une fois le DS publié (v1.3.0+), le contournement pourra être supprimé d'`EcranRevue.tsx`
- Considérer l'ajout d'une prop optionnelle `focusPremierChamp` (default `true`) si un cas d'usage nécessite de désactiver ce comportement
