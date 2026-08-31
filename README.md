# Maskita

Pseudonymisation de documents (.docx) — **100% dans le navigateur.**

Aucun serveur, aucune installation Python ou LLM, aucune donnée qui quitte la machine.

## Pourquoi Maskita ?

Vous avez un rapport de psychologie contenant des données sensibles. Vous voulez utiliser un LLM (ChatGPT, Claude…) pour l'analyser, mais vous ne pouvez pas lui envoyer les données brutes.

Maskita **pseudonymise** le rapport dans votre navigateur : il vous permet de remplacer les noms, adresses, numéros et autres PII par des tags lisibles (`[PERSONNE]`, `[ADRESSE]`, `[TELEPHONE]`…). Vous pouvez alors envoyer le rapport pseudonymisé
à un LLM sans exposer les données réelles.

Une fois le traitement terminé, Maskita **restaure** le rapport modifié en remplaçant les tags par leurs valeurs d'origine.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:5173`.

## Utilisation

### 1. Anonymiser

1. Cliquer sur l'onglet **Anonymiser**
2. Sélectionner ou glisser un fichier `.docx`
3. (Optionnel) fournir une clé `.key.json` si vous avez déjà un mapping existant
4. Cliquer **Lancer l'analyse**
5. Les PII à structure fixe sont détectés automatiquement (email, téléphone, NIR, ADELI…)
6. Vérifier les détections dans l'écran de revue
7. Ajouter/Modifier les valeurs manquantes :
   - Clic dans le texte lisible → sélection d'une valeur → création d'un tag
   - Bouton "+ Ajouter un pseudo" dans le tableau
8. Cliquer **Valider et télécharger**
9. Deux fichiers sont disponibles au téléchargement :
   - Le rapport pseudonymisé (`.docx`)
   - La clé de réversibilité (`.key.json`) — **à conserver précieusement**

### 2. Restaurer

1. Cliquer sur l'onglet **Restaurer**
2. Uploader le rapport modifié (avec les tags)
3. Uploader la clé `.key.json` correspondante
4. Télécharger la version restaurée

## Sécurité

- **Tout se passe dans le navigateur.** Aucune donnée n'est envoyée à un serveur.
- Les fichiers .docx uploadés ne sont jamais persistés.
- La clé de mapping est un fichier `.key.json` non chiffré — l'utilisateur est seul responsable de sa conservation.

## Limitations

- Seuls les PII à structure fixe sont détectés (email, téléphone, ADELI, NIR…).
- Les noms, adresses, professions doivent être ajoutés manuellement via l'écran de revue.
- Pas de LLM embarqué : pas de validation automatique des détections.

## Stack

React 18 / TypeScript / Vite / mammoth / docx (npm) / vitest

## Licence

MIT