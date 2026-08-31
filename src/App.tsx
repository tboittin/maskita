import { useState, useCallback, useEffect } from 'react';
import { FileDropZone } from './components/FileDropZone';
import { EcranRevue } from './components/EcranRevue';
import { EcranRestauration } from './components/EcranRestauration';
import { useFileUpload } from './hooks/useFileUpload';
import { analyserTexte, fusionnerAvecMappingExistant } from './utils/analyse';
import { genererCleJson } from './utils/mapping';
import { type Mapping } from './utils/mapping';
import { buildDocument } from './utils/buildDocument';
import { declencherTelechargement } from './utils/telechargement';
import { FooterLegal } from './components/FooterLegal';
import { PopupConfirmation } from './components/PopupConfirmation';
import { nomContientValeursMapping } from './utils/mapping';
import { I18nProvider, useLangue } from './i18n/context';

type Onglet = 'anonymiser' | 'restaurer';
type Etape = 'upload' | 'revue';

interface WarningDownload {
  mappingFinal: Mapping;
  textePseudonymise: string;
  nomFichier: string;
  valeursSuspectes: string[];
}

function AppInterieur() {
  const { t, langue, basculer } = useLangue();
  const [onglet, setOnglet] = useState<Onglet>('anonymiser');
  const [messageSucces, setMessageSucces] = useState<string | null>(null);
  const {
    fichier, extension, texte, chargement, erreur,
    cle, erreurCle, nomFichierCle,
    uploader, uploaderCle, reinitialiser,
  } = useFileUpload();

  const [etape, setEtape] = useState<Etape>('upload');
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [warningNom, setWarningNom] = useState<WarningDownload | null>(null);
  const [analysePrete, setAnalysePrete] = useState(false);

  // Synchroniser l'attribut lang du document et le titre
  useEffect(() => {
    document.documentElement.lang = langue;
    document.title = 'Maskita';
  }, [langue]);

  const handleFichierChoisi = useCallback(
    async (file: File) => { await uploader(file); },
    [uploader],
  );

  const handleCleChoisie = useCallback(
    async (file: File) => { await uploaderCle(file); },
    [uploaderCle],
  );

  // Quand le texte est extrait, signaler que l'analyse est prête
  useEffect(() => {
    if (texte !== null) {
      setAnalysePrete(true);
    }
  }, [texte]);

  const handleLancerAnalyse = useCallback(() => {
    if (texte === null) return;
    const detections = analyserTexte(texte);
    const mappingGenere = fusionnerAvecMappingExistant(cle, detections);
    setMapping(mappingGenere);
    setEtape('revue');
  }, [texte, cle]);

  const executerTelechargement = useCallback(
    async (mappingFinal: Mapping, textePseudonymise: string) => {
      const ext = extension ?? 'docx';
      const nomBase = fichier?.name.replace(/\.(docx|txt|md)$/i, '') ?? 'rapport';

      const blobDoc = await buildDocument(textePseudonymise, ext);
      declencherTelechargement(blobDoc, `${nomBase}-pseudonymise.${ext}`);

      const contenuCle = genererCleJson(mappingFinal);
      const blobCle = new Blob([contenuCle], { type: 'application/json' });
      declencherTelechargement(blobCle, `${nomBase}.key.json`);

      setMessageSucces(t('app.succes'));
      setTimeout(() => setMessageSucces(null), 5000);
    },
    [fichier, extension, t],
  );

  const handleValider = useCallback(
    async (mappingFinal: Mapping, textePseudonymise: string) => {
      const nomBase = fichier?.name.replace(/\.(docx|txt|md)$/i, '') ?? 'rapport';
      const ext = extension ?? 'docx';

      const suspectes = nomContientValeursMapping(nomBase, mappingFinal);
      if (suspectes.length > 0) {
        setWarningNom({
          mappingFinal,
          textePseudonymise,
          nomFichier: `${nomBase}-pseudonymise.${ext}`,
          valeursSuspectes: suspectes,
        });
        return;
      }

      await executerTelechargement(mappingFinal, textePseudonymise);
    },
    [fichier, extension, executerTelechargement],
  );

  const annulerWarningNom = useCallback(() => {
    setWarningNom(null);
  }, []);

  const handleRetour = useCallback(() => {
    reinitialiser();
    setMapping(null);
    setEtape('upload');
    setAnalysePrete(false);
  }, [reinitialiser]);

  return (
    <>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--espacement-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--espacement-lg)',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <header style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: 0 }}>
            <button
              onClick={basculer}
              title={langue === 'fr' ? 'Switch to English' : 'Passer en français'}
              style={{
                background: 'none',
                border: '1px solid var(--couleur-bordure)',
                borderRadius: 'var(--rayon-bordure)',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--couleur-texte-secondaire)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {langue === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--couleur-texte)' }}>
            {t('app.titre')}
          </h1>
          <p style={{ color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
            {t('app.sousTitre')}
          </p>
          <div style={{ marginTop: 'var(--espacement-sm)' }}>
            <a
              href="https://github.com/tboittin/maskita"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: '1px solid var(--couleur-bordure)',
                borderRadius: 'var(--rayon-bordure)',
                color: 'var(--couleur-texte-secondaire)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--couleur-primaire)'; e.currentTarget.style.color = 'var(--couleur-primaire)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--couleur-bordure)'; e.currentTarget.style.color = 'var(--couleur-texte-secondaire)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Open source — GitHub
            </a>
          </div>
        </header>

        {/* Navigation par onglets */}
        <nav
          style={{
            display: 'flex',
            gap: 'var(--espacement-xs)',
            borderBottom: '1px solid var(--couleur-bordure)',
            paddingBottom: 'var(--espacement-xs)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            whiteSpace: 'nowrap',
          }}
        >
          {(['anonymiser', 'restaurer'] as const).map((o) => (
            <button
              key={o}
              onClick={() => {
                setOnglet(o);
                setMessageSucces(null);
                if (o !== 'anonymiser') {
                  reinitialiser();
                  setMapping(null);
                  setEtape('upload');
                  setAnalysePrete(false);
                }
              }}
              style={{
                padding: 'var(--espacement-sm) var(--espacement-md)',
                background: 'none',
                border: 'none',
                borderBottom: o === onglet ? '2px solid var(--couleur-primaire)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: o === onglet ? 600 : 400,
                color: o === onglet ? 'var(--couleur-primaire)' : 'var(--couleur-texte-secondaire)',
                fontSize: '0.9375rem',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {t(`app.onglet.${o}`)}
            </button>
          ))}
        </nav>

        {messageSucces && (
          <div
            role="status"
            style={{
              padding: 'var(--espacement-sm) var(--espacement-md)',
              background: '#f0fdf4',
              border: '1px solid var(--couleur-succes)',
              borderRadius: 'var(--rayon-bordure)',
              color: '#166534',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {messageSucces}
          </div>
        )}

        {onglet === 'anonymiser' && etape === 'upload' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)' }}>
                {t('app.section.rapport')}
              </h3>
              <FileDropZone
                onFichierChoisi={handleFichierChoisi}
                chargement={chargement}
                erreur={erreur}
                fichierCourant={fichier?.name ?? null}
                accept=".docx,.txt,.md"
              />
            </div>

            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)', color: 'var(--couleur-texte-secondaire)' }}>
                {t('app.section.cle')} <span style={{ fontWeight: 400 }}>({t('app.optionnel')})</span>
              </h3>
              <FileDropZone
                onFichierChoisi={handleCleChoisie}
                erreur={erreurCle}
                fichierCourant={nomFichierCle}
                accept=".json"
                libelle=".key.json"
              />
            </div>
            {analysePrete && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleLancerAnalyse}
                  style={{
                    padding: 'var(--espacement-sm) var(--espacement-lg)',
                    background: 'var(--couleur-primaire)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--rayon-bordure)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginTop: 'var(--espacement-sm)',
                  }}
                >
                  {t('app.bouton.analyser')}
                </button>
              </div>
            )}
          </section>
        )}

        {onglet === 'anonymiser' && etape === 'revue' && mapping && texte && (
          <section>
            <EcranRevue
              texteOriginal={texte}
              mappingInitial={mapping}
              onValider={handleValider}
            />
            <div style={{ marginTop: 'var(--espacement-md)', textAlign: 'center' }}>
              <button
                onClick={handleRetour}
                style={{
                  padding: 'var(--espacement-sm) var(--espacement-md)',
                  background: 'none',
                  border: '1px solid var(--couleur-bordure)',
                  borderRadius: 'var(--rayon-bordure)',
                  cursor: 'pointer',
                  color: 'var(--couleur-texte-secondaire)',
                  fontSize: '0.875rem',
                }}
              >
                {t('app.bouton.recommencer')}
              </button>
            </div>
          </section>
        )}

        {onglet === 'restaurer' && (
          <section>
            <EcranRestauration />
          </section>
        )}
      </div>

      <FooterLegal />

      {warningNom && (
        <PopupConfirmation
          titre={t('app.warning.titre')}
          message={t('app.warning.message', warningNom.valeursSuspectes.join(', '), warningNom.nomFichier)}
          boutonConfirmer={t('app.warning.confirmer')}
          boutonAnnuler={t('app.warning.annuler')}
          onConfirmer={() => {
            const w = warningNom;
            setWarningNom(null);
            executerTelechargement(w.mappingFinal, w.textePseudonymise);
          }}
          onAnnuler={annulerWarningNom}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppInterieur />
    </I18nProvider>
  );
}