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
  'footer.siren': 'SIREN',
  'footer.email': 'E-mail',
  'footer.adresse': 'Adresse',
  'footer.fermer': 'Fermer',

  /* contenu des mentions légales */
  'footer.eiMention': 'Entrepreneur individuel',
  'footer.privacy': 'Cette application traite vos documents exclusivement dans votre navigateur. Aucune donnée personnelle, aucun document, aucune information identifiante n\'est transmise, stockée ou traitée sur un serveur externe. L\'ensemble du traitement (extraction, analyse, pseudonymisation, reconstruction) est effectué localement, en mémoire, sans persistance. Aucun cookie, traceur ou outil d\'analyse n\'est utilisé. Vous conservez le contrôle total de vos données à chaque étape.',
  'footer.intellectualProperty': 'Maskita est un logiciel libre distribué sous licence MIT. Le code source est disponible sur GitHub. Les icônes et emojis utilisés dans l\'interface sont fournis à titre indicatif et ne font pas l\'objet de droits d\'auteur spécifiques.',
  'footer.liability': 'Ce logiciel est fourni « en l\'état », sans garantie d\'aucune sorte, expresse ou implicite. L\'utilisateur est seul responsable de l\'utilisation qu\'il fait des documents pseudonymisés et restaurés. Il lui incombe de vérifier l\'exhaustivité de la pseudonymisation avant de transmettre les documents à un tiers. L\'auteur ne saurait être tenu responsable d\'une fuite de données résultant d\'une mauvaise utilisation du logiciel.',

  /* Ouverture vers l'IA (écran Télécharger, pied de page) */
  'ia.panneau.titre': 'Et ensuite ? Utiliser une IA',
  'ia.panneau.texte': "Ce document n'est pas anonyme : il peut rester une donnée de santé couverte par le secret professionnel. Maskita réduit au strict nécessaire ce que vous confiez à une IA, y compris une IA certifiée HDS, mais le choix de l'outil vous appartient.",
  'ia.bouton.copier': 'Copier le prompt',
  'ia.bouton.copie': 'Prompt copié ✓',
  'ia.bouton.precautions': 'Précautions avant d\'utiliser une IA',
  'ia.copie.echec': 'Copie automatique impossible. Sélectionnez le texte ci-dessous et copiez-le.',
  'ia.prompt.libelle': 'Prompt à copier',
  'ia.prompt.aide': "Collez ce prompt dans l'IA, complétez votre demande, puis collez le contenu du document pseudonymisé à la suite.",
  'ia.footer.lien': 'Utiliser une IA',
  'ia.modal.titre': 'Précautions avant d\'utiliser une IA',
  'ia.modal.fait.titre': 'Ce que fait Maskita',
  'ia.modal.fait.texte': 'Maskita remplace les informations identifiantes par des pseudos, directement dans votre navigateur. Rien n\'est envoyé sur internet.',
  'ia.modal.faitPas.titre': 'Ce qu\'il ne fait pas',
  'ia.modal.faitPas.texte': 'Le document obtenu n\'est pas anonyme. Pour vous, qui détenez la clé, il reste une donnée de santé à caractère personnel, couverte par le secret professionnel le cas échéant.',
  'ia.modal.relire.titre': 'Avant de l\'envoyer, relisez-le',
  'ia.modal.relire.texte': 'Âges, dates, lieux, établissement scolaire, profession, composition familiale, événements marquants : ces détails peuvent suffire à reconnaître quelqu\'un. Ajoutez-les comme pseudos si besoin.',
  'ia.modal.choisir.titre': 'Choisissez un service adapté',
  'ia.modal.choisir.texte': 'De préférence, une IA proposée par un hébergeur certifié HDS (hébergeur de données de santé) en Europe. À défaut, un service qui ne conserve pas vos échanges et ne les utilise pas pour s\'entraîner. Les assistants grand public qui gardent l\'historique des conversations ne sont pas certifiés HDS.',
  'ia.modal.cle.titre': 'Gardez la clé pour vous',
  'ia.modal.cle.texte': 'N\'envoyez jamais le fichier .key.json à l\'IA : il contient les vraies valeurs.',
  'ia.modal.prompt.titre': 'Préserver les pseudos',
  'ia.modal.prompt.texte': 'Le prompt proposé demande à l\'IA de recopier les pseudos à l\'identique, pour que Maskita puisse restaurer le document. À la restauration, Maskita signale les pseudos qu\'il ne reconnaît pas.',
  'ia.modal.responsabilite': 'Maskita réduit au strict nécessaire ce que vous confiez à une IA, y compris une IA certifiée HDS. Il ne garantit pas la conformité de votre usage, qui reste sous votre responsabilité.',
  'ia.prompt': `Le document ci-dessous a été pseudonymisé : les informations personnelles ont été remplacées par des balises entre crochets, par exemple [PERSONNE], [PERSONNE_2] ou [EMAIL].

Règles à respecter impérativement :
1. Recopie chaque balise exactement telle qu'elle est écrite : mêmes crochets, mêmes MAJUSCULES, même numéro, sans espace ajouté. Par exemple, [PERSONNE_2] ne doit jamais devenir [Personne_2], [PERSONNE 2], PERSONNE_2 ou [PERSONNE2].
2. Ne remplace jamais une balise par un nom, un prénom ou une valeur inventée, et n'essaie pas de deviner ce qu'elle cache.
3. Ne crée pas de nouvelle balise et ne fusionne pas deux balises différentes.
4. Une balise représente toujours la même personne ou la même information dans tout le document.
5. Si tu reformules ou résumes, conserve les balises dans les phrases où elles ont du sens.

Ma demande : (décrivez ici ce que vous voulez que l'IA fasse)

Document :
`,

  /* errors courants */
  'erreur.generique': 'Une erreur est survenue.',
};

export type Dictionnaire = typeof fr;