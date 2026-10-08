export const fr = {
  /* App */
  'app.titre': 'Maskita',
  'app.sousTitre': 'Pseudonymisation de documents — 100% dans le navigateur.',
  'app.onglet.pseudonymiser': 'Pseudonymiser',
  'app.onglet.restaurer': 'Restaurer',
  'app.section.rapport': 'Rapport (.docx, .txt, .md)',
  'app.section.cle': 'Clé .key.json existante',
  'app.optionnel': '(optionnel)',
  'app.bouton.analyser': "Lancer l'analyse",
  'app.jalon.deposer': 'Déposer',
  'app.jalon.verifier': 'Vérifier',
  'app.jalon.recuperer': 'Télécharger',
  'app.bouton.recommencer': '← Recommencer avec un autre fichier',
  'app.succes': 'Fichiers téléchargés avec succès ✓',
  'app.warning.titre': 'Nom de fichier sensible',
  'app.warning.message': (vals: string, nom: string) =>
    `Le nom du fichier contient des données sensibles (valeurs ou tags) : ${vals}.\n\nFichier concerné : ${nom}\n\nRisque : le nom du fichier téléchargé pourrait fuiter des informations personnelles.\n\nConseil : renommez le fichier source avant de le traiter.\n\nVoulez-vous télécharger quand même ?`,
  'app.warning.confirmer': 'Télécharger quand même',
  'app.warning.annuler': 'Annuler',

  /* EcranRevue */
  'revue.titre.pseudo': 'Texte pseudonymisé',
  'revue.titre.lisible': 'Texte lisible',
  'revue.bouton.nouveauTag': 'Nouveau pseudo',
  'revue.bouton.nouvelleValeur': 'Nouvelle valeur',
  'revue.ajoutClassique.titre': 'Ajouter un pseudo',
  'revue.ajoutClassique.labelType': 'Pseudo',
  'revue.ajoutClassique.labelValeur': 'Valeur',
  'revue.ajoutClassique.alerteCrochet': 'La valeur ne peut pas contenir de crochets « [ » ou « ] »',
  'revue.picker.titre.deplacer': (v: string) => `Déplacer « ${v} » vers quel pseudo ?`,
  'revue.picker.titre.ajouter': 'Ajouter à quel pseudo ?',
  'revue.picker.valeur': (v: string) => `Valeur : ${v}`,
  'revue.picker.aucun': 'Aucun autre pseudo disponible.',
  'revue.picker.annuler': 'Annuler',
  'revue.bouton.deplacer': (v: string) => `📦 Déplacer « ${v} »`,
  'revue.checkbox.sync': 'Scroll synchronisé',
  'revue.checkbox.recentrer': 'Recentrer auto',
  'revue.bouton.valider': 'Valider et continuer',

  /* Popup suppression dans EcranRevue */
  'revue.supprimer.titre': 'Supprimer le pseudo ?',
  'revue.supprimer.message': (tag: string) =>
    `Êtes-vous sûr de vouloir supprimer le tag ${tag} ?`,
  'revue.supprimer.valeurs': 'Valeurs qui seront supprimées :',
  'revue.supprimer.note': 'Le pseudo et ses valeurs seront définitivement supprimés.',
  'revue.supprimer.annuler': 'Annuler',
  'revue.supprimer.confirmer': 'Supprimer',

  /* PseudoTableau */
  'tableau.titre': (n: number) => `Pseudos (${n})`,
  'tableau.enTete.tag': 'Pseudo',
  'tableau.enTete.valeurs': 'Valeurs',
  'tableau.vide': 'vide',
  'tableau.aucun': 'Aucun pseudonyme détecté.',
  'tableau.voir': 'voir',
  'tableau.ajoutManuel.titre': 'Ajouter un pseudo',
  'tableau.ajoutManuel.type.label': 'Type de pseudo…',
  'tableau.ajoutManuel.type.custom': 'Autre…',
  'tableau.tooltip.ajouterValeur': 'Ajouter une valeur',
  'tableau.tooltip.retirer': 'Retirer',
  'tableau.retirerValeur': (v: string) => `Retirer ${v}`,
  'tableau.tooltip.supprimer': 'Supprimer',
  'tableau.placeholder.nouvelleValeur': 'Nouvelle valeur…',
  'tableau.placeholder.type': 'Type (ex: PERSONNE)',
  'tableau.placeholder.valeur': 'Valeur',
  'tableau.bouton.ajouter': 'Ajouter',
  'tableau.bouton.annuler': 'Annuler',
  'tableau.bouton.ajouterPseudoClassique': '+ Ajouter un pseudo',

  /* FileDropZone */
  'dropzone.chargement': 'Extraction en cours…',
  'dropzone.patienter': 'Veuillez patienter',
  'dropzone.changer': 'Cliquer ou glisser-déposer pour changer de fichier',
  'dropzone.deposer': (lib: string) => `Glisser-déposer un fichier ${lib} ici`,
  'dropzone.ouCliquer': 'ou cliquer pour parcourir',
  'dropzone.ariaLabel': (lib: string) => `Zone de dépôt de fichier ${lib}`,

  /* EcranTelechargement */
  'telechargement.titre': 'Télécharger les fichiers',
  'telechargement.sousTitre': 'Téléchargez chaque fichier indépendamment.',
  'telechargement.document': 'Document pseudonymisé',
  'telechargement.bouton.document': 'Télécharger le document',
  'telechargement.cle': 'Clé .key.json',
  'telechargement.bouton.cle': 'Télécharger la clé',
  'telechargement.succes.document': 'Document téléchargé ✓',
  'telechargement.succes.cle': 'Clé téléchargée ✓',
  'telechargement.bouton.retour': '← Modifier les pseudos',

  /* EcranTelechargement — Restauration */
  'restaurationTelechargement.titre': 'Télécharger les fichiers restaurés',
  'restaurationTelechargement.sousTitre': 'Téléchargez chaque fichier indépendamment.',
  'restaurationTelechargement.document': 'Document restauré',
  'restaurationTelechargement.bouton.document': 'Télécharger le document restauré',
  'restaurationTelechargement.cle': 'Clé .key.json',
  'restaurationTelechargement.bouton.cle': 'Télécharger la clé',
  'restaurationTelechargement.succes.document': 'Document restauré téléchargé ✓',
  'restaurationTelechargement.succes.cle': 'Clé téléchargée ✓',
  'restaurationTelechargement.bouton.retour': '← Modifier les pseudos',

  /* EcranRestauration */
  'restauration.titre.rapport': 'Rapport modifié (avec des pseudos)',
  'restauration.titre.cle': 'Clé .key.json correspondante',
  'restauration.obligatoire': '(obligatoire)',
  'restauration.apercu': 'Aperçu du texte restauré',
  'restauration.bouton.recommencer': 'Recommencer',
  'restauration.bouton.telecharger': 'Télécharger le rapport restauré',
  'restauration.bouton.lancer': 'Lancer la restauration',

  /* EcranRestaurationRevue */
  'restaurationRevue.titre.restaure': 'Aperçu restauré',

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
  'footer.afficherCoordonnees': 'Afficher les coordonnées',
  'footer.ei': 'Entrepreneur individuel',
  'footer.siren': 'SIREN',
  'footer.telephone': 'Téléphone',
  'footer.email': 'E-mail',
  'footer.adresse': 'Adresse de domiciliation',
  'footer.fermer': 'Fermer',

  /* contenu des mentions légales */
  'footer.eiMention': 'Entrepreneur individuel',
  'footer.privacy': 'Cette application traite vos documents exclusivement dans votre navigateur. Aucune donnée personnelle, aucun document, aucune information identifiante n\'est transmise, stockée ou traitée sur un serveur externe. L\'ensemble du traitement (extraction, analyse, pseudonymisation, reconstruction) est effectué localement, en mémoire, sans persistance. Aucun cookie, traceur ou outil d\'analyse n\'est utilisé. Vous conservez le contrôle total de vos données à chaque étape.',
  'footer.intellectualProperty': 'Maskita est un logiciel libre distribué sous licence MIT. Le code source est disponible sur GitHub. Les icônes et emojis utilisés dans l\'interface sont fournis à titre indicatif et ne font pas l\'objet de droits d\'auteur spécifiques.',
  'footer.liability': 'Ce logiciel est fourni « en l\'état », sans garantie d\'aucune sorte, expresse ou implicite. L\'utilisateur est seul responsable de l\'utilisation qu\'il fait des documents pseudonymisés et restaurés. Il lui incombe de vérifier l\'exhaustivité de la pseudonymisation avant de transmettre les documents à un tiers. L\'auteur ne saurait être tenu responsable d\'une fuite de données résultant d\'une mauvaise utilisation du logiciel.',

  /* errors courants */
  'erreur.generique': 'Une erreur est survenue.',
};

export type Dictionnaire = typeof fr;