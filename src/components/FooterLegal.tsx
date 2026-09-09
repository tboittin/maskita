import { useState } from 'react';
import legal from '../legal.json';
import { useLangue } from '../i18n/context';
import { Bouton, BouclierIcon, Modal } from '@khaleeno/maskita-design-system';

const styleFooter: React.CSSProperties = {
  borderTop: '1px solid var(--couleur-bordure)',
  padding: 'var(--espacement-md) var(--espacement-lg)',
  textAlign: 'center',
};

export function FooterLegal() {
  const { t } = useLangue();
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <footer style={styleFooter}>
        <button
          onClick={() => setOuvert(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--couleur-texte-secondaire)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          {t('footer.mentions')}
        </button>
      </footer>

      <Modal
        ouvert={ouvert}
        titre={t('footer.titre')}
        onFermer={() => setOuvert(false)}
        pied={
          <Bouton variante="secondaire" onClick={() => setOuvert(false)}>
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
          }}
        >
          <section>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
              {t('footer.editeur')}
            </h4>
            <p>{legal.editorName}</p>
            <p>{legal.adress}</p>
            <p>{legal.email}</p>
          </section>

          <section>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
              {t('footer.hebergement')}
            </h4>
            <p>{legal.provider}</p>
          </section>

          <section>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
              {t('footer.donnees')}
            </h4>
            <p>{legal.privacy}</p>
          </section>

          <section>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
              {t('footer.propriete')}
            </h4>
            <p>{legal.intellectualProperty}</p>
          </section>

          <section>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
              {t('footer.github')}
            </h4>
            <p>
              <a
                href={legal.github}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--couleur-primaire)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <BouclierIcon className="size-4" />
                {t('footer.githubText')}
              </a>
            </p>
          </section>

          <section>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
              {t('footer.responsabilite')}
            </h4>
            <p>{legal.liability}</p>
          </section>
        </div>
      </Modal>
    </>
  );
}