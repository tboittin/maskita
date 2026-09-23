import type { Dictionnaire } from './fr';

export const en: Dictionnaire = {
  /* App */
  'app.titre': 'Maskita',
  'app.sousTitre': 'Document pseudonymisation — 100% in the browser.',
  'app.onglet.pseudonymiser': 'Pseudonymise',
  'app.onglet.restaurer': 'Restore',
  'app.section.rapport': 'Report (.docx, .txt, .md)',
  'app.section.cle': 'Existing .key.json key',
  'app.optionnel': '(optional)',
  'app.bouton.analyser': 'Run analysis',
  'app.jalon.deposer': 'Drop',
  'app.jalon.verifier': 'Review',
  'app.jalon.recuperer': 'Retrieve',
  'app.bouton.recommencer': '← Start over with another file',
  'app.succes': 'Files downloaded successfully ✓',
  'app.warning.titre': 'Sensitive file name',
  'app.warning.message': (vals: string, nom: string) =>
    `The file name contains sensitive data (values or tags): ${vals}.\n\nFile concerned: ${nom}\n\nRisk: the downloaded file name could leak personal information.\n\nTip: rename the source file before processing.\n\nDownload anyway?`,
  'app.warning.confirmer': 'Download anyway',
  'app.warning.annuler': 'Cancel',

  /* EcranRevue */
  'revue.titre.pseudo': 'Pseudonymised text',
  'revue.titre.lisible': 'Readable text',
  'revue.bouton.nouveauTag': 'New pseudo',
  'revue.bouton.nouvelleValeur': 'New value',
  'revue.picker.titre.deplacer': (v: string) => `Move « ${v} » to which pseudo?`,
  'revue.picker.titre.ajouter': 'Add to which pseudo?',
  'revue.picker.valeur': (v: string) => `Value: ${v}`,
  'revue.picker.aucun': 'No other pseudo available.',
  'revue.picker.annuler': 'Cancel',
  'revue.bouton.deplacer': (v: string) => `📦 Move « ${v} »`,
  'revue.checkbox.sync': 'Sync scroll',
  'revue.checkbox.recentrer': 'Auto centre',
  'revue.bouton.valider': 'Validate and download',

  /* Popup suppression dans EcranRevue */
  'revue.supprimer.titre': 'Delete this pseudo?',
  'revue.supprimer.message': (tag: string) =>
    `Are you sure you want to delete the tag ${tag}?`,
  'revue.supprimer.valeurs': 'Values that will be removed:',
  'revue.supprimer.note': 'The pseudo and its values will be permanently deleted.',
  'revue.supprimer.annuler': 'Cancel',
  'revue.supprimer.confirmer': 'Delete',

  /* PseudoTableau */
  'tableau.titre': (n: number) => `Pseudos (${n})`,
  'tableau.enTete.tag': 'Pseudo',
  'tableau.enTete.valeurs': 'Values',
  'tableau.vide': 'empty',
  'tableau.aucun': 'No pseudo detected.',
  'tableau.voir': 'view',
  'tableau.ajoutManuel.titre': 'Add a pseudo',
  'tableau.ajoutManuel.type.label': 'Pseudo type…',
  'tableau.ajoutManuel.type.custom': 'Other…',
  'tableau.tooltip.ajouterValeur': 'Add a value',
  'tableau.tooltip.retirer': 'Remove',
  'tableau.retirerValeur': (v: string) => `Remove ${v}`,
  'tableau.tooltip.supprimer': 'Delete',
  'tableau.placeholder.nouvelleValeur': 'New value…',
  'tableau.placeholder.type': 'Type (e.g. PERSON)',
  'tableau.placeholder.valeur': 'Value',
  'tableau.bouton.ajouter': 'Add',
  'tableau.bouton.annuler': 'Cancel',
  'tableau.bouton.ajouterPseudo': '+ Add a pseudo',

  /* FileDropZone */
  'dropzone.chargement': 'Extracting…',
  'dropzone.patienter': 'Please wait',
  'dropzone.changer': 'Click or drag & drop to change file',
  'dropzone.deposer': (lib: string) => `Drag & drop a ${lib} file here`,
  'dropzone.ouCliquer': 'or click to browse',
  'dropzone.ariaLabel': (lib: string) => `File drop zone for ${lib}`,

  /* EcranRestauration */
  'restauration.titre.rapport': 'Modified report (with pseudos)',
  'restauration.titre.cle': 'Corresponding .key.json key',
  'restauration.obligatoire': '(required)',
  'restauration.apercu': 'Restored text preview',
  'restauration.bouton.recommencer': 'Start over',
  'restauration.bouton.telecharger': 'Download restored report',

  /* FooterLegal */
  'footer.mentions': 'Legal notice',
  'footer.titre': 'Legal notice',
  'footer.github': 'Source code',
  'footer.githubText': 'Open source — view the code on GitHub',
  'footer.editeur': 'Publisher',
  'footer.hebergement': 'Hosting',
  'footer.donnees': 'Data protection',
  'footer.propriete': 'Intellectual property',
  'footer.responsabilite': 'Liability',
  'footer.fermer': 'Close',

  /* errors courants */
  'erreur.generique': 'An error occurred.',
};