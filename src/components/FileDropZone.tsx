import { useCallback } from 'react';
import { useLangue } from '../i18n/context';
import {
  FileDropZone as FileDropZoneDS,
  type FileDropZoneProps as FileDropZoneDSProps,
} from '@khaleeno/maskita-design-system';

interface FileDropZoneProps {
  onFichierChoisi: (fichier: File) => void;
  chargement?: boolean;
  erreur?: string | null;
  fichierCourant?: string | null;
  accept?: string;
  libelle?: string;
}

/**
 * FileDropZone — wrapper local par-dessus le design system.
 * Transmet le File brut via onFichierFile (pipeline mammoth) et localise
 * les libellés avec le contexte i18n.
 */
export function FileDropZone({
  onFichierChoisi,
  chargement = false,
  erreur = null,
  fichierCourant = null,
  accept = '.docx',
  libelle = accept ?? '.docx',
}: FileDropZoneProps) {
  const { t } = useLangue();

  const handleFile = useCallback(
    (fichier: File) => {
      onFichierChoisi(fichier);
    },
    [onFichierChoisi],
  );

  const dsProps: FileDropZoneDSProps = {
    accept,
    libelle,
    chargement,
    erreur,
    fichierCourant,
    onFichierFile: handleFile,
    libelleDeposer: t('dropzone.deposer', libelle),
    sousTitre: t('dropzone.ouCliquer'),
    libelleChangement: t('dropzone.changer'),
  };

  return <FileDropZoneDS {...dsProps} />;
}