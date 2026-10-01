import { useState, useCallback, useEffect } from 'react';
import { FileDropZone } from './components/FileDropZone';
import { EcranRevue } from './components/EcranRevue';
import { EcranRestauration } from './components/EcranRestauration';
import { EcranTelechargement } from './components/EcranTelechargement';
import { useFileUpload } from './hooks/useFileUpload';
import { analyserTexte, fusionnerAvecMappingExistant } from './utils/analyse';
import { type Mapping } from './utils/mapping';
import { FooterLegal } from './components/FooterLegal';
import { I18nProvider, useLangue } from './i18n/context';
import { type EtapeRestauration } from './hooks/useRestauration';
import {
  Bouton,
  BrochetteIcon,
  Jalons,
  MessageSucces,
  Panneau,
} from '@khaleeno/maskita-design-system';

type Onglet = 'pseudonymiser' | 'restaurer';
type Etape = 'upload' | 'revue' | 'telechargement';

function AppInterieur() {
  const { t, langue, basculer } = useLangue();
  const [onglet, setOnglet] = useState<Onglet>('pseudonymiser');
  const [messageSucces, setMessageSucces] = useState<string | null>(null);
  const {
    fichier, extension, texte, chargement, erreur,
    cle, erreurCle, messageCle, nomFichierCle,
    uploader, uploaderCle, reinitialiser,
  } = useFileUpload();

  const [etape, setEtape] = useState<Etape>('upload');
  const [etapeRestauration, setEtapeRestauration] = useState<EtapeRestauration>('upload');
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [analysePrete, setAnalysePrete] = useState(false);

  // États pour l'écran de téléchargement
  const [textePseudonymise, setTextePseudonymise] = useState<string | null>(null);
  const [mappingFinal, setMappingFinal] = useState<Mapping | null>(null);

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

  const handleValider = useCallback(
    (mFinal: Mapping, textePseudo: string) => {
      setMappingFinal(mFinal);
      setTextePseudonymise(textePseudo);
      setEtape('telechargement');
    },
    [],
  );

  const handleRetour = useCallback(() => {
    reinitialiser();
    setMapping(null);
    setEtape('upload');
    setAnalysePrete(false);
    setTextePseudonymise(null);
    setMappingFinal(null);
  }, [reinitialiser]);

  const handleRetourTelechargement = useCallback(() => {
    setEtape('revue');
  }, []);

  const nomFichierBase = fichier?.name.replace(/\.(docx|txt|md)$/i, '') ?? 'rapport';
  const ext = extension ?? 'docx';

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
            <Bouton variante="ghost" taille="sm" onClick={basculer} title={langue === 'fr' ? 'Switch to English' : 'Passer en français'}>
              {langue === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </Bouton>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--espacement-sm)' }}>
            <BrochetteIcon
              className="size-8"
              style={{ color: 'var(--couleur-primaire)' }}
            />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--couleur-texte)' }}>
              {t('app.titre')}
            </h1>
          </div>
          <p style={{ color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
            {t('app.sousTitre')}
          </p>
          <div style={{ marginTop: 'var(--espacement-sm)' }}>
            <a
              href="https://github.com/tboittin/maskita"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-brume-200 rounded-lg text-sm text-brume-500 no-underline hover:text-action-500 hover:border-action-400 transition-all"
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
          {(['pseudonymiser', 'restaurer'] as const).map((o) => (
            <button
              key={o}
              onClick={() => {
                setOnglet(o);
                setMessageSucces(null);
                if (o !== 'pseudonymiser') {
                  reinitialiser();
                  setMapping(null);
                  setEtape('upload');
                  setAnalysePrete(false);
                } else {
                  setTextePseudonymise(null);
                  setMappingFinal(null);
                  setEtapeRestauration('upload');
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

        {/* Fil d'étapes */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Jalons
            etapes={[
              { id: 'deposer', libelle: t('app.jalon.deposer') },
              { id: 'verifier', libelle: t('app.jalon.verifier') },
              { id: 'recuperer', libelle: t('app.jalon.recuperer') },
            ]}
            active={onglet === 'pseudonymiser' ? (etape === 'upload' ? 'deposer' : etape === 'revue' ? 'verifier' : 'recuperer') : (etapeRestauration === 'upload' ? 'deposer' : etapeRestauration === 'revue' ? 'verifier' : 'recuperer')}
            onSelect={(id) => {
              if (id === 'deposer') {
                setOnglet('pseudonymiser');
                handleRetour();
              } else if (id === 'verifier' && etape === 'telechargement') {
                handleRetourTelechargement();
              }
            }}
          />
        </div>

        {messageSucces && (
          <div role="status" style={{ display: 'flex', justifyContent: 'center' }}>
            <MessageSucces onFermer={() => setMessageSucces(null)}>{messageSucces}</MessageSucces>
          </div>
        )}

        {onglet === 'pseudonymiser' && etape === 'upload' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
            <Panneau title={t('app.section.rapport')}>
              <div style={{ padding: 'var(--espacement-md)' }}>
                <FileDropZone
                  onFichierChoisi={handleFichierChoisi}
                  chargement={chargement}
                  erreur={erreur}
                  fichierCourant={fichier?.name ?? null}
                  accept=".docx,.txt,.md"
                />
              </div>
            </Panneau>

            <Panneau title={`${t('app.section.cle')} (${t('app.optionnel')})`}>
              <div style={{ padding: 'var(--espacement-md)' }}>
                <FileDropZone
                  onFichierChoisi={handleCleChoisie}
                  erreur={erreurCle}
                  fichierCourant={nomFichierCle}
                  accept=".json"
                  libelle=".key.json"
                />
                {messageCle && (
                  <div
                    role="alert"
                    style={{
                      marginTop: 'var(--espacement-sm)',
                      padding: 'var(--espacement-sm) var(--espacement-md)',
                      background: 'var(--couleur-surface-avertissement, #fef3cd)',
                      border: '1px solid var(--couleur-bordure-avertissement, #f59e0b)',
                      borderRadius: 'var(--rayon, 0.5rem)',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {messageCle}
                  </div>
                )}
              </div>
            </Panneau>
            {analysePrete && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Bouton variante="primaire" taille="lg" onClick={handleLancerAnalyse}>
                  {t('app.bouton.analyser')}
                </Bouton>
              </div>
            )}
          </section>
        )}

        {onglet === 'pseudonymiser' && etape === 'revue' && mapping && texte && (
          <section>
            <EcranRevue
              texteOriginal={texte}
              mappingInitial={mapping}
              onValider={handleValider}
            />
            <div style={{ marginTop: 'var(--espacement-md)', textAlign: 'center' }}>
              <Bouton variante="secondaire" onClick={handleRetour}>
                {t('app.bouton.recommencer')}
              </Bouton>
            </div>
          </section>
        )}

        {onglet === 'pseudonymiser' && etape === 'telechargement' && mappingFinal && textePseudonymise && (
          <section>
            <EcranTelechargement
              contenuDocument={textePseudonymise}
              mappingFinal={mappingFinal}
              nomFichierBase={nomFichierBase}
              extension={ext}
              onRetour={handleRetourTelechargement}
              suffixeDocument="-pseudonymise"
              titre={t('telechargement.titre')}
              sousTitre={t('telechargement.sousTitre')}
              libelleDocument={t('telechargement.document')}
              libelleCle={t('telechargement.cle')}
              boutonDocument={t('telechargement.bouton.document')}
              boutonCle={t('telechargement.bouton.cle')}
              succesDocument={t('telechargement.succes.document')}
              succesCle={t('telechargement.succes.cle')}
              boutonRetour={t('telechargement.bouton.retour')}
              verifierNomSensible
            />
          </section>
        )}

        {onglet === 'restaurer' && (
          <section>
            <EcranRestauration onEtapeChange={setEtapeRestauration} />
          </section>
        )}
      </div>

      <FooterLegal />
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
