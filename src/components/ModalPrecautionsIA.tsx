import { useLangue } from '../i18n/context';
import { Bouton, Modal } from '@khaleeno/maskita-design-system';

interface ModalPrecautionsIAProps {
  ouvert: boolean;
  onFermer: () => void;
}

const SECTIONS = ['fait', 'faitPas', 'relire', 'choisir', 'cle', 'prompt'] as const;

const styleTitre: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 'var(--espacement-xs)',
  color: 'var(--couleur-texte)',
};

/** Notice complète sur l'usage d'une IA avec un document pseudonymisé. */
export function ModalPrecautionsIA({ ouvert, onFermer }: ModalPrecautionsIAProps) {
  const { t } = useLangue();

  return (
    <Modal
      ouvert={ouvert}
      titre={t('ia.modal.titre')}
      onFermer={onFermer}
      pied={
        <Bouton variante="secondaire" onClick={onFermer}>
          {t('footer.fermer')}
        </Bouton>
      }
    >
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--couleur-texte-secondaire)',
          lineHeight: 1.7,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--espacement-md)',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        {SECTIONS.map((section) => (
          <section key={section}>
            <h4 style={styleTitre}>{t(`ia.modal.${section}.titre`)}</h4>
            <p>{t(`ia.modal.${section}.texte`)}</p>
          </section>
        ))}
        <p style={{ fontStyle: 'italic' }}>{t('ia.modal.responsabilite')}</p>
      </div>
    </Modal>
  );
}
