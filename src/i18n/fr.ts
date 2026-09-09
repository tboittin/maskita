export const fr = {
  /* App */
  'app.titre': 'Maskita',
  'app.sousTitre': 'Pseudonymisation de documents — 100% dans le navigateur.',
  'app.onglet.anonymiser': 'Anonymiser',
  'app.onglet.restaurer': 'Restaurer',
  'app.section.rapport': 'Rapport (.docx, .txt, .md)',
  'app.section.cle': 'Clé .key.json existante',
  'app.optionnel': '(optionnel)',
  'app.bouton.analyser': "Lancer l'analyse",
  'app.jalon.deposer': 'Déposer',
  'app.jalon.verifier': 'Vérifier',
  'app.jalon.recuperer': 'Récupérer',
  'app.bouton.recommencer': '← Recommencer avec un autre fichier',
  'app.succes': 'Fichiers téléchargés avec succès ✓',
  'app.warning.titre': 'Nom de fichier sensible',
  'app.warning.message': (vals: string, nom: string) =>
    `Le nom du fichier source contient des données potentiellement identifiantes : ${vals}.\n\nFichier concerné : ${nom}\n\nConseil : renommez le fichier source avant de le traiter pour éviter toute fuite via le nom du fichier téléchargé.\n\nVoulez-vous télécharger quand même ?`,
  'app.warning.confirmer': 'Télécharger quand même',
  'app.warning.annuler': 'Annuler',

  /* EcranRevue */
  'revue.titre.pseudo': 'Texte pseudonymisé',
  'revue.titre.lisible': 'Texte lisible',
  'revue.bouton.nouveauTag': 'Nouveau tag',
  'revue.bouton.nouvelleValeur': 'Nouvelle valeur',
  'revue.picker.titre.deplacer': (v: string) => `Déplacer « ${v} » vers quel tag ?`,
  'revue.picker.titre.ajouter': 'Ajouter à quel tag ?',
  'revue.picker.valeur': (v: string) => `Valeur : ${v}`,
  'revue.picker.aucun': 'Aucun autre tag disponible.',
  'revue.picker.annuler': 'Annuler',
  'revue.bouton.deplacer': (v: string) => `📦 Déplacer « ${v} »`,
  'revue.checkbox.sync': 'Scroll synchronisé',
  'revue.checkbox.recentrer': 'Recentrer auto',
  'revue.bouton.valider': 'Valider et télécharger',

  /* Popup suppression dans EcranRevue */
  'revue.supprimer.titre': 'Vider le tag ?',
  'revue.supprimer.message': (tag: string) =>
    `Êtes-vous sûr de vouloir vider les valeurs de ${tag} ?`,
  'revue.supprimer.valeurs': 'Valeurs qui seront supprimées :',
  'revue.supprimer.note': 'Le tag restera visible mais vide. Vous pourrez y ajouter des valeurs plus tard.',
  'revue.supprimer.annuler': 'Annuler',
  'revue.supprimer.confirmer': 'Vider',

  /* Popup modifications dans EcranRevue */
  'revue.modifs.titre': 'Modifications détectées',
  'revue.modifs.message': "Vous avez modifié le mapping. Voulez-vous relancer l'analyse depuis le rapport d'origine, ou continuer avec les données actuelles ?",
  'revue.modifs.confirmer': 'Continuer',
  'revue.modifs.relancer': "Relancer l'analyse",

  /* PseudoTableau */
  'tableau.titre': (n: number) => `Pseudos (${n})`,
  'tableau.enTete.tag': 'Tag',
  'tableau.enTete.valeurs': 'Valeurs',
  'tableau.vide': 'vide',
  'tableau.aucun': 'Aucun pseudonyme détecté.',
  'tableau.voir': 'voir',
  'tableau.ajoutManuel.titre': 'Ajouter un pseudo',
  'tableau.tooltip.ajouterValeur': 'Ajouter une valeur',
  'tableau.tooltip.retirer': 'Retirer',
  'tableau.retirerValeur': (v: string) => `Retirer ${v}`,
  'tableau.tooltip.supprimer': 'Supprimer',
  'tableau.placeholder.nouvelleValeur': 'Nouvelle valeur…',
  'tableau.placeholder.type': 'Type (ex: PERSONNE)',
  'tableau.placeholder.valeur': 'Valeur',
  'tableau.bouton.ajouter': 'Ajouter',
  'tableau.bouton.annuler': 'Annuler',
  'tableau.bouton.ajouterPseudo': '+ Ajouter un pseudo',

  /* FileDropZone */
  'dropzone.chargement': 'Extraction en cours…',
  'dropzone.patienter': 'Veuillez patienter',
  'dropzone.changer': 'Cliquer ou glisser-déposer pour changer de fichier',
  'dropzone.deposer': (lib: string) => `Glisser-déposer un fichier ${lib} ici`,
  'dropzone.ouCliquer': 'ou cliquer pour parcourir',
  'dropzone.ariaLabel': (lib: string) => `Zone de dépôt de fichier ${lib}`,

  /* EcranRestauration */
  'restauration.titre.rapport': 'Rapport modifié (avec des tags)',
  'restauration.titre.cle': 'Clé .key.json correspondante',
  'restauration.obligatoire': '(obligatoire)',
  'restauration.apercu': 'Aperçu du texte restauré',
  'restauration.bouton.recommencer': 'Recommencer',
  'restauration.bouton.telecharger': 'Télécharger le rapport restauré',

  /* FooterLegal */
  'footer.mentions': 'Mentions légales',
  'footer.titre': 'Mentions légales',
  'footer.github': 'Code source',
  'footer.githubText': 'Projet open source — accéder au code sur GitHub',
  'footer.editeur': 'Éditeur',
  'footer.hebergement': 'Hébergement',
  'footer.donnees': 'Protection des données',
  'footer.propriete': 'Propriété intellectuelle',
  'footer.responsabilite': 'Responsabilité',
  'footer.fermer': 'Fermer',

  /* errors courants */
  'erreur.generique': 'Une erreur est survenue.',
};

export type Dictionnaire = typeof fr;