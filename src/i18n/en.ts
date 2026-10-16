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
  'app.jalon.recuperer': 'Download',
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
  'revue.ajoutClassique.titre': 'Add a pseudo',
  'revue.ajoutClassique.labelType': 'Pseudonym',
  'revue.ajoutClassique.labelValeur': 'Value',
  'revue.ajoutClassique.alerteCrochet': "The value cannot contain brackets '[' or ']'",
  'revue.picker.titre.deplacer': (v: string) => `Move « ${v} » to which pseudo?`,
  'revue.picker.titre.ajouter': 'Add to which pseudo?',
  'revue.picker.valeur': (v: string) => `Value: ${v}`,
  'revue.picker.aucun': 'No other pseudo available.',
  'revue.picker.annuler': 'Cancel',
  'revue.bouton.deplacer': (v: string) => `📦 Move « ${v} »`,
  'revue.checkbox.sync': 'Sync scroll',
  'revue.checkbox.recentrer': 'Auto centre',
  'revue.bouton.valider': 'Validate and continue',

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
  'tableau.bouton.ajouterPseudoClassique': '+ Add a pseudo',

  /* FileDropZone */
  'dropzone.chargement': 'Extracting…',
  'dropzone.patienter': 'Please wait',
  'dropzone.changer': 'Click or drag & drop to change file',
  'dropzone.deposer': (lib: string) => `Drag & drop a ${lib} file here`,
  'dropzone.ouCliquer': 'or click to browse',
  'dropzone.ariaLabel': (lib: string) => `File drop zone for ${lib}`,

  /* EcranTelechargement */
  'telechargement.titre': 'Download files',
  'telechargement.sousTitre': 'Download each file independently.',
  'telechargement.document': 'Pseudonymised document',
  'telechargement.bouton.document': 'Download document',
  'telechargement.cle': '.key.json key',
  'telechargement.bouton.cle': 'Download key',
  'telechargement.succes.document': 'Document downloaded ✓',
  'telechargement.succes.cle': 'Key downloaded ✓',
  'telechargement.bouton.retour': '← Modify pseudos',

  /* EcranTelechargement — Restoration */
  'restaurationTelechargement.titre': 'Download restored files',
  'restaurationTelechargement.sousTitre': 'Download each file independently.',
  'restaurationTelechargement.document': 'Restored document',
  'restaurationTelechargement.bouton.document': 'Download restored document',
  'restaurationTelechargement.cle': '.key.json key',
  'restaurationTelechargement.bouton.cle': 'Download key',
  'restaurationTelechargement.succes.document': 'Restored document downloaded ✓',
  'restaurationTelechargement.succes.cle': 'Key downloaded ✓',
  'restaurationTelechargement.bouton.retour': '← Modify pseudos',

  /* EcranRestauration */
  'restauration.titre.rapport': 'Modified report (with pseudos)',
  'restauration.titre.cle': 'Corresponding .key.json key',
  'restauration.obligatoire': '(required)',
  'restauration.apercu': 'Restored text preview',
  'restauration.bouton.recommencer': 'Start over',
  'restauration.bouton.telecharger': 'Download restored report',
  'restauration.bouton.lancer': 'Run restoration',

  /* EcranRestaurationRevue */
  'restaurationRevue.titre.restaure': 'Restored preview',

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
  'footer.afficherCoordonnees': 'Show contact details',
  'footer.siren': 'SIREN',
  'footer.email': 'Email',
  'footer.adresse': 'Address',
  'footer.fermer': 'Close',

  /* legal notice content */
  'footer.eiMention': 'Sole proprietor (EI)',
  'footer.privacy': 'This application processes your documents exclusively in your browser. No personal data, documents, or identifying information is transmitted, stored, or processed on an external server. All processing (extraction, analysis, pseudonymisation, reconstruction) is performed locally, in memory, without persistence. No cookies, trackers, or analytics tools are used. You retain full control of your data at every step.',
  'footer.intellectualProperty': 'Maskita is free software distributed under the MIT license. The source code is available on GitHub. The icons and emojis used in the interface are provided for informational purposes and are not subject to specific copyright.',
  'footer.liability': 'This software is provided "as is", without warranty of any kind, express or implied. The user is solely responsible for their use of pseudonymised and restored documents. It is their responsibility to verify the completeness of pseudonymisation before transmitting documents to a third party. The author shall not be held liable for any data breach resulting from misuse of the software.',

  /* Ouverture vers l'IA (écran Télécharger, pied de page) */
  'ia.panneau.titre': 'What next? Using an AI',
  'ia.panneau.texte': "This document is not anonymous: it may still be health data covered by professional secrecy. Maskita reduces what you entrust to an AI to the strict minimum, including an HDS-certified AI, but the choice of tool is yours.",
  'ia.bouton.copier': 'Copy the prompt',
  'ia.bouton.copie': 'Prompt copied ✓',
  'ia.bouton.precautions': 'Precautions before using an AI',
  'ia.copie.echec': 'Automatic copy failed. Select the text below and copy it.',
  'ia.prompt.libelle': 'Prompt to copy',
  'ia.prompt.aide': 'Paste this prompt into the AI, complete your request, then paste the content of the pseudonymised document after it.',
  'ia.footer.lien': 'Using an AI',
  'ia.modal.titre': 'Precautions before using an AI',
  'ia.modal.fait.titre': 'What Maskita does',
  'ia.modal.fait.texte': 'Maskita replaces identifying information with pseudos, directly in your browser. Nothing is sent over the internet.',
  'ia.modal.faitPas.titre': 'What it does not do',
  'ia.modal.faitPas.texte': 'The resulting document is not anonymous. For you, as the key holder, it remains personal health data, covered by professional secrecy where applicable.',
  'ia.modal.relire.titre': 'Proofread it before sending',
  'ia.modal.relire.texte': 'Ages, dates, places, school, occupation, family composition, significant events: these details can be enough to recognise someone. Add them as pseudos if needed.',
  'ia.modal.choisir.titre': 'Choose a suitable service',
  'ia.modal.choisir.texte': 'Preferably, an AI offered by an HDS-certified host (French certification for health data hosting) in Europe. Failing that, a service that does not retain your exchanges or use them for training. Consumer assistants that keep conversation history are not HDS-certified.',
  'ia.modal.cle.titre': 'Keep the key to yourself',
  'ia.modal.cle.texte': 'Never send the .key.json file to the AI: it contains the real values.',
  'ia.modal.prompt.titre': 'Preserving pseudos',
  'ia.modal.prompt.texte': 'The suggested prompt asks the AI to copy pseudos exactly, so that Maskita can restore the document. During restoration, Maskita flags any pseudo it does not recognise.',
  'ia.modal.responsabilite': 'Maskita reduces what you entrust to an AI to the strict minimum, including an HDS-certified AI. It does not guarantee the compliance of your use, which remains your responsibility.',
  'ia.prompt': `The document below has been pseudonymised: personal information has been replaced by tags in square brackets, for example [PERSONNE], [PERSONNE_2] or [EMAIL].

Rules you must follow:
1. Copy each tag exactly as written: same brackets, same UPPERCASE, same number, no added spaces. For example, [PERSONNE_2] must never become [Personne_2], [PERSONNE 2], PERSONNE_2 or [PERSONNE2].
2. Never replace a tag with a name, first name or invented value, and do not try to guess what it hides.
3. Do not create new tags and do not merge two different tags.
4. A tag always refers to the same person or the same information throughout the document.
5. If you rephrase or summarise, keep the tags in the sentences where they are meaningful.

My request: (describe here what you want the AI to do)

Document:
`,

  /* errors courants */
  'erreur.generique': 'An error occurred.',
};