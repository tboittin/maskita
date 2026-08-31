import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface FileDropZoneProps {
  onFichierChoisi: (fichier: File) => void;
  chargement?: boolean;
  erreur?: string | null;
  fichierCourant?: string | null;
  accept?: string;
  libelle?: string;
}

export function FileDropZone({
  onFichierChoisi,
  chargement = false,
  erreur = null,
  fichierCourant = null,
  accept = '.docx',
  libelle = accept ?? '.docx',
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFichier = useCallback(
    (fichier: File) => {
      onFichierChoisi(fichier);
    },
    [onFichierChoisi],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const fichiers = e.dataTransfer.files;
      if (fichiers.length > 0) {
        handleFichier(fichiers[0]);
      }
    },
    [handleFichier],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const fichiers = e.target.files;
      if (fichiers && fichiers.length > 0) {
        handleFichier(fichiers[0]);
      }
      // Réinitialiser pour permettre de re-sélectionner le même fichier
      e.target.value = '';
    },
    [handleFichier],
  );

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`Zone de dépôt de fichier ${libelle}`}
      style={{
        display: 'block',
        border: `2px dashed ${dragOver ? 'var(--couleur-primaire)' : erreur ? 'var(--couleur-erreur)' : 'var(--couleur-bordure)'}`,
        borderRadius: 'var(--rayon-bordure)',
        padding: 'var(--espacement-xl)',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: dragOver ? 'rgb(79, 70, 229, 0.05)' : 'var(--couleur-surface)',
        transition: 'all 0.2s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        data-testid="input-fichier"
      />

      {chargement ? (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--couleur-primaire)' }}>
            Extraction en cours…
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
            Veuillez patienter
          </p>
        </div>
      ) : fichierCourant ? (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--couleur-texte)' }}>
            {fichierCourant}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
            Cliquer ou glisser-déposer pour changer de fichier
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--couleur-texte)' }}>
            Glisser-déposer un fichier {libelle} ici
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
            ou cliquer pour parcourir
          </p>
        </div>
      )}

      {erreur && (
        <p
          style={{
            marginTop: 'var(--espacement-md)',
            color: 'var(--couleur-erreur)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
          role="alert"
        >
          {erreur}
        </p>
      )}
    </label>
  );
}