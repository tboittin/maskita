# Retour utilisateur Maskita — User Stories

## ✅ Comportements validés (à ne pas casser)

- **US-V1** — En tant qu'utilisateur, je veux que la détection d'une valeur à pseudonymiser fonctionne indépendamment de la casse, afin de ne pas avoir à saisir la valeur exactement comme elle apparaît dans le texte.
- **US-V2** — En tant qu'utilisateur, je veux qu'un pseudo en doublon soit automatiquement suffixé (ex. `ADOLESCENT` → `ADOLESCENT_2`), afin d'éviter les collisions de noms sans y penser moi-même.
- **US-V3** — En tant qu'utilisateur, je veux pouvoir sélectionner du texte par surlignage pour créer directement une valeur/un tag, afin d'accélérer l'annotation.
- **US-V4** — En tant qu'utilisateur, je veux voir en surligné vert dans le texte lisible ce qui a été tagué dans le texte pseudonymisé, afin de suivre visuellement ce qui a été traité.
- **US-V5** — En tant qu'utilisateur, je veux que la restauration fonctionne même si le document a été modifié entre-temps (tant que les pseudos sont identiques), afin de pouvoir dé-pseudonymiser un texte édité ou déplacé vers un autre document.
- **US-V6** — En tant qu'utilisateur, je veux pouvoir réordonner les valeurs associées à un pseudo, afin de contrôler quelle valeur est prioritaire lors de la détection (cf. bug Tom/Tommy ci-dessous).

## 🐞 Bugs à corriger

- **US-B01** — En tant qu'utilisateur, je veux que les crochets qui entourent le pseudo restent, ils ne doivent pas être éditables et ne doivent pas disparaître à la modification du pseudo.
- **US-B02** — En tant qu'utilisateur, je veux pouvoir supprimer un pseudo dans son intégralité (pas seulement une valeur qui lui est associée), afin de nettoyer complètement le mapping.
- **US-B03** — En tant qu'utilisateur, je veux que le pseudo soit toujours forcé à la majuscule pour éviter tout problème lié à la casse d'un pseudo.
- **US-B04** — En tant qu'utilisateur, je veux être alerté clairement quand une valeur que je rattache à un nouveau type existe déjà sous un autre type (ex. « Ilana » à la fois dans FRERE et SOEUR), une valeur ne peut être que dans un seul pseudo.
- **US-B05** — En tant qu'utilisateur, je veux que l'alerte qui identifie une information sensible dans le titre du fichier soit claire notamment pour la pseudonymisation.
- **US-B06** — À l'inverse de l'US-B5, lorsqu'il y a un pseudo dans le titre je dois également être notifié lors de la restauration.
- **US-B07** — En tant qu'utilisateur, je veux que le fait de réordonner les valeurs d'une clé ne déclenche pas un re-téléchargement automatique de la clé, afin de ne pas générer des exports redondants/non désirés.
- **US-B08 (critique)** — En tant qu'utilisateur, je veux que la détection gère correctement les valeurs qui se chevauchent (ex. « Tom M », « Tom », « Tommy » pour un même pseudo), afin d'éviter des anonymisations partielles comme `[ADOLESCENT]my` au lieu de `[ADOLESCENT]`. Il faut ajouter une regex qui entoure la valeur à pseudonymiser par des espaces ou des ponctuations pour éviter les incohérences (ex: anonymiser le prénom "max" ne doit pas avoir d'influence sur le mot "maximum")
- **US-B09** — En tant qu'utilisateur, je veux que le bouton « relancer l'analyse depuis le rapport d'origine » ne supprime pas tout mon travail de mapping déjà réalisé, ou à défaut je veux un message d'avertissement explicite sur ce que cette action va effacer avant de valider.

## 💡 Améliorations / nouvelles fonctionnalités

- **US-F1** — En tant qu'utilisateur, je veux que l'outil me propose une liste de pseudos suggérés (ex. "PERSONNE", "DATE", "LIEU"), afin de gagner du temps et d'éviter des pseudos qui pourraient laisser deviner l'identité réelle par manque d'originalité. Évidemment cette liste est suffixée par un numéro si la valeur existe déjà (ex: "PERSONNE_2")
- **US-F2** — En tant qu'utilisateur, je veux une terminologie cohérente entre les actions « ajouter un tag » (via surlignage) et « ajouter un pseudo » (via le formulaire dédié), afin de ne pas être perdu entre deux mots différents pour un concept proche.
- **US-F3** — En tant qu'utilisateur, je veux que le bouton « voir » (affiché quand une valeur est utilisée dans un autre pseudo) m'amène directement et visuellement à cette valeur dans le texte dès le premier clic, afin de ne pas avoir à cliquer plusieurs fois sans effet visible.
- **US-F4** — En tant qu'utilisateur, je veux pouvoir naviguer via une flèche entre chaque « itération »/modification du mapping, afin de suivre l'historique de mes changements.
- **US-F5** — En tant qu'utilisateur, je veux un repère visuel (à l'écran, pas nécessairement à l'export) dans le texte pseudonymisé qui suit en direct les tags ajoutés, afin de compenser le décalage de texte que peut provoquer la longueur variable des pseudos.
- **US-F6** — En tant qu'utilisateur, je veux pouvoir éditer manuellement les textes, une modification dans un aperçu sera répercutée dans le second et sera anonymisée à la volée si une valeur est identifiée.
- **US-F7** — En tant qu'utilisateur, je veux que le téléchargement (anonymiser ou restaurer) ait lieu sur un nouvel écran à l'étape "Récupérer" au lieu d'être activé à l'étape "Vérifier".
- **US-F8** — En tant qu'utilisateur, je veux que l'étape de restauration ait également une étape de vérification qui affiche le texte pseudonymisé et le texte restaurer.