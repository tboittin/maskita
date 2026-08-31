import { useState } from 'react';
import legal from '../legal.json';

const styleOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const stylePopup: React.CSSProperties = {
  background: 'white',
  borderRadius: 'var(--rayon-bordure)',
  padding: 'var(--espacement-lg)',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '70vh',
  overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
};

const styleFooter: React.CSSProperties = {
  borderTop: '1px solid var(--couleur-bordure)',
  padding: 'var(--espacement-md) var(--espacement-lg)',
  textAlign: 'center',
};

export function FooterLegal() {
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
          Mentions légales
        </button>
      </footer>

      {ouvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mentions légales"
          style={styleOverlay}
          onClick={() => setOuvert(false)}
        >
          <div style={stylePopup} onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: 'var(--espacement-md)',
                color: 'var(--couleur-texte)',
              }}
            >
              Mentions légales
            </h3>

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
                  Éditeur
                </h4>
                <p>{legal.editorName}</p>
                <p>{legal.adress}</p>
                <p>{legal.email}</p>
              </section>

              <section>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
                  Hébergement
                </h4>
                <p>{legal.provider}</p>
              </section>

              <section>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
                  Protection des données
                </h4>
                <p>{legal.privacy}</p>
              </section>

              <section>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
                  Propriété intellectuelle
                </h4>
                <p>{legal.intellectualProperty}</p>
              </section>

              <section>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--espacement-xs)', color: 'var(--couleur-texte)' }}>
                  Responsabilité
                </h4>
                <p>{legal.liability}</p>
              </section>
            </div>

            <button
              onClick={() => setOuvert(false)}
              style={{
                marginTop: 'var(--espacement-lg)',
                padding: 'var(--espacement-sm) var(--espacement-md)',
                background: 'var(--couleur-primaire)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--rayon-bordure)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}