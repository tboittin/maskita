import type { Dictionnaire } from './fr';

export const en: Dictionnaire = {
  /* App */
  'app.titre': 'Maskita',
  'app.sousTitre': 'Document pseudonymisation — 100% in the browser.',
  'app.onglet.anonymiser': '🔒 Anonymise',
  'app.onglet.restaurer': '🔓 Restore',
  'app.section.rapport': 'Report (.docx, .txt, .md)',
  'app.section.cle': 'Existing .key.json key',
  'app.optionnel': '(optional)',
  'app.bouton.analyser': 'Run analysis',
  'app.bouton.recommencer': '← Start over with another file',
  'app.succes': 'Files downloaded successfully ✓',
  'app.warning.titre': 'Sensitive file name',
  'app.warning.message': (vals: string, nom: string) =>
    `The source file name contains potentially identifying data: ${vals}.\n\nFile concerned: ${nom}\n\nTip: rename the source file before processing to avoid leakage through the downloaded file name.\n\nDownload anyway?`,
  'app.warning.confirmer': 'Download anyway',
  'app.warning.annuler': 'Cancel',

  /* EcranRevue */
  'revue.titre.pseudo': 'Pseudonymised text',
  'revue.titre.lisible': 'Readable text',
  'revue.bouton.nouveauTag': 'New tag',
  'revue.bouton.nouvelleValeur': 'New value',
  'revue.picker.titre.deplacer': (v: string) => `Move « ${v} » to which tag?`,
  'revue.picker.titre.ajouter': 'Add to which tag?',
  'revue.picker.valeur': (v: string) => `Value: ${v}`,
  'revue.picker.aucun': 'No other tag available.',
  'revue.picker.annuler': 'Cancel',
  'revue.bouton.deplacer': (v: string) => `📦 Move « ${v} »`,
  'revue.checkbox.sync': 'Sync scroll',
  'revue.checkbox.recentrer': 'Auto centre',
  'revue.bouton.valider': 'Validate and download',

  /* Popup suppression dans EcranRevue */
  'revue.supprimer.titre': 'Clear this tag?',
  'revue.supprimer.message': (tag: string) =>
    `Are you sure you want to clear the values of ${tag}?`,
  'revue.supprimer.valeurs': 'Values that will be removed:',
  'revue.supprimer.note': 'The tag will remain visible but empty. You can add values later.',
  'revue.supprimer.annuler': 'Cancel',
  'revue.supprimer.confirmer': 'Clear',

  /* Popup modifications dans EcranRevue */
  'revue.modifs.titre': 'Changes detected',
  'revue.modifs.message': 'You have modified the mapping. Do you want to re-run analysis from the original report, or continue with current data?',
  'revue.modifs.confirmer': 'Continue',
  'revue.modifs.relancer': 'Re-run analysis',

  /* PseudoTableau */
  'tableau.titre': (n: number) => `Pseudos (${n})`,
  'tableau.enTete.tag': 'Tag',
  'tableau.enTete.valeurs': 'Values',
  'tableau.vide': 'empty',
  'tableau.tooltip.ajouterValeur': 'Add a value',
  'tableau.tooltip.retirer': 'Remove',
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
  'restauration.titre.rapport': 'Modified report (with tags)',
  'restauration.titre.cle': 'Corresponding .key.json key',
  'restauration.obligatoire': '(required)',
  'restauration.apercu': 'Restored text preview',
  'restauration.bouton.recommencer': 'Start over',
  'restauration.bouton.telecharger': 'Download restored report',

  /* FooterLegal */
  'footer.mentions': 'Legal notice',
  'footer.titre': 'Legal notice',
  'footer.editeur': 'Publisher',
  'footer.hebergement': 'Hosting',
  'footer.donnees': 'Data protection',
  'footer.propriete': 'Intellectual property',
  'footer.responsabilite': 'Liability',
  'footer.fermer': 'Close',

  /* errors courants */
  'erreur.generique': 'An error occurred.',
};