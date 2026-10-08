import { useState, useRef, useEffect } from 'react';
import legal from '../legal.json';
import { useLangue } from '../i18n/context';
import { Bouton, BouclierIcon, Modal } from '@khaleeno/maskita-design-system';

const styleFooter: React.CSSProperties = {
  borderTop: '1px solid var(--couleur-bordure)',
  padding: 'var(--espacement-md) var(--espacement-lg)',
  textAlign: 'center',
};

const styleCoordonnees: React.CSSProperties = {
  marginTop: 'var(--espacement-sm)',
  padding: 'var(--espacement-sm)',
  background: 'var(--couleur-surface-secondaire, #f5f5f5)',
  borderRadius: 'var(--rayon, 6px)',
  fontSize: '0.875rem',
  lineHeight: 1.7,
};

export function FooterLegal() {
  const { t } = useLangue();
  const [ouvert, setOuvert] = useState(false);
  const [coordonneesVisibles, setCoordonneesVisibles] = useState(false);
  const blocCoordonneesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (coordonneesVisibles && blocCoordonneesRef.current) {
      blocCoordonneesRef.current.focus();
    }
  }, [coordonneesVisibles]);

  const handleAfficherCoordonnees = () => {
    setCoordonneesVisibles(true);
  };

  const decodedPhone = coordonneesVisibles ? atob(legal.phone) : '';
  const decodedEmail = coordonneesVisibles ? atob(legal.email) : '';
  const decodedAdresse = coordonneesVisibles ? atob(legal.adresseDeDomiciliation) : '';

  return (
    <>
      <footer style={styleFooter}>
        <Bouton variante="ghost" taille="sm" onClick={() => setOuvert(true)}>
          {t('footer.mentions')}
        </Bouton>
      </footer>

      <Modal
        ouvert={ouvert}
        titre={t('footer.titre')}
        onFermer={() => {
          setOuvert(false);
          setCoordonneesVisibles(false);
        }}
        pied={
          <Bouton variante="secondaire" onClick={() => {
            setOuvert(false);
            setCoordonneesVisibles(false);
          }}>
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
            <p>{t('footer.siren')} : {legal.siren}</p>
            <p>{legal.eiMention}</p>
            <p>{legal.adress}</p>
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

          <section>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
              {t('footer.ei')}
            </h4>
            <p>{legal.editorName}</p>
            <p>{t('footer.siren')} : {legal.siren}</p>
            {!coordonneesVisibles && (
              <Bouton variante="secondaire" taille="sm" onClick={handleAfficherCoordonnees}>
                {t('footer.afficherCoordonnees')}
              </Bouton>
            )}
            {coordonneesVisibles && (
              <div
                ref={blocCoordonneesRef}
                tabIndex={-1}
                style={styleCoordonnees}
                role="region"
                aria-label={t('footer.afficherCoordonnees')}
              >
                <p>{t('footer.telephone')} : {decodedPhone}</p>
                <p>{decodedEmail}</p>
                <p>{decodedAdresse}</p>
              </div>
            )}
          </section>
        </div>
      </Modal>
    </>
  );
}
