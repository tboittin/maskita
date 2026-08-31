/**
 * Déclenche le téléchargement d'un Blob côté navigateur
 * en créant un lien <a> en mémoire puis en cliquant dessus.
 */
export function declencherTelechargement(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}