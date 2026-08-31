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

type Onglet = 'anonymiser' | 'restaurer';
type Etape = 'upload' | 'revue';

interface WarningDownload {
  mappingFinal: Mapping;
  textePseudonymise: string;
  nomFichier: string;
  valeursSuspectes: string[];
}

function App() {
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

      setMessageSucces('Fichiers téléchargés avec succès ✓');
      setTimeout(() => setMessageSucces(null), 5000);
    },
    [fichier, extension],
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
        <header style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--couleur-texte)' }}>
            Maskita
          </h1>
          <p style={{ color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
            Pseudonymisation de documents — 100% dans le navigateur.
          </p>
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
              {o === 'anonymiser' ? '🔒 Anonymiser' : '🔓 Restaurer'}
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
                Rapport (.docx, .txt, .md)
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
                Clé .key.json existante <span style={{ fontWeight: 400 }}>(optionnel)</span>
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
                  Lancer l'analyse
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
                ← Recommencer avec un autre fichier
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
          titre="Nom de fichier sensible"
          message={`Le nom du fichier source contient des données potentiellement identifiantes : ${warningNom.valeursSuspectes.join(', ')}.\n\nFichier concerné : ${warningNom.nomFichier}\n\nConseil : renommez le fichier source avant de le traiter pour éviter toute fuite via le nom du fichier téléchargé.\n\nVoulez-vous télécharger quand même ?`}
          boutonConfirmer="Télécharger quand même"
          boutonAnnuler="Annuler"
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

export default App;