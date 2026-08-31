import { useState, useRef } from 'react';
import type { TagEntry, Conflit } from '../hooks/useRevue';

interface PseudoTableauProps {
  tags: TagEntry[];
  conflits: Conflit[];
  tagSurbrillance: string | null;
  valeurSurbrillance: string | null;
  onTagClick: (tag: string) => void;
  onValeurClick: (tag: string, valeur: string) => void;
  onDeplacerValeur: (valeur: string, tagSource: string, tagCible: string) => void;
  onReordonnerValeurs: (tag: string, debut: number, fin: number) => void;
  onRenommer: (ancien: string, nouveau: string) => void;
  onSupprimer: (tag: string) => void;
  onAjouterValeur: (tag: string, valeur: string) => void;
  onRetirerValeur: (tag: string, valeur: string) => void;
  onAjouterTag: (type: string, valeur: string) => void;
}

function couleurTag(entry: TagEntry): string {
  if (entry.valeurs.length === 0) return 'var(--couleur-texte-secondaire)';
  if (entry.estNouveau) return 'var(--couleur-succes)';
  return 'var(--couleur-texte)';
}

export function PseudoTableau({
  tags,
  conflits,
  tagSurbrillance,
  valeurSurbrillance,
  onTagClick,
  onValeurClick,
  onDeplacerValeur,
  onReordonnerValeurs,
  onRenommer,
  onSupprimer,
  onAjouterValeur,
  onRetirerValeur,
  onAjouterTag,
}: PseudoTableauProps) {
  const [editionTag, setEditionTag] = useState<string | null>(null);
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouvelleValeur, setNouvelleValeur] = useState('');
  const [ajoutValeurTag, setAjoutValeurTag] = useState<string | null>(null);
  const [showAjoutManuel, setShowAjoutManuel] = useState(false);
  const [typeAjout, setTypeAjout] = useState('');
  const [valeurAjout, setValeurAjout] = useState('');
  const [dragOverTag, setDragOverTag] = useState<string | null>(null);
  const dragValue = useRef<{ valeur: string; tagSource: string; index: number } | null>(null);

  const conflitsParTag = conflits.reduce<Record<string, string[]>>((acc, c) => {
    if (!acc[c.tag]) acc[c.tag] = [];
    acc[c.tag].push(c.message);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
        Pseudos ({tags.length})
      </h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--couleur-bordure)' }}>
            <th style={{ textAlign: 'left', padding: 'var(--espacement-sm)', fontWeight: 600 }}>Tag</th>
            <th style={{ textAlign: 'left', padding: 'var(--espacement-sm)', fontWeight: 600 }}>Valeurs</th>
            <th style={{ textAlign: 'right', padding: 'var(--espacement-sm)', fontWeight: 600 }}></th>
          </tr>
        </thead>
        <tbody>
          {tags.map(entry => (
            <tr
              key={entry.tag}
              data-tag={entry.tag}
              onClick={() => onTagClick(entry.tag)}
              style={{
                borderBottom: '1px solid var(--couleur-bordure)',
                backgroundColor: tagSurbrillance === entry.tag
                  ? 'rgba(79, 70, 229, 0.08)'
                  : dragOverTag === entry.tag
                    ? 'rgba(34, 197, 94, 0.08)'
                    : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onDragOver={(e) => {
                if (dragValue.current && dragValue.current.tagSource !== entry.tag) {
                  e.preventDefault();
                  setDragOverTag(entry.tag);
                }
              }}
              onDragLeave={() => setDragOverTag(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverTag(null);
                const dv = dragValue.current;
                if (dv && dv.tagSource !== entry.tag) {
                  onDeplacerValeur(dv.valeur, dv.tagSource, entry.tag);
                }
                dragValue.current = null;
              }}
            >
              <td style={{ padding: 'var(--espacement-sm)', color: couleurTag(entry) }}>
                {editionTag === entry.tag ? (
                  <input
                    value={nouveauNom}
                    onChange={e => setNouveauNom(e.target.value)}
                    onBlur={() => {
                      if (nouveauNom.trim()) onRenommer(entry.tag, nouveauNom.trim());
                      setEditionTag(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (nouveauNom.trim()) onRenommer(entry.tag, nouveauNom.trim());
                        setEditionTag(null);
                      }
                      if (e.key === 'Escape') setEditionTag(null);
                    }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', fontFamily: 'var(--police-mono)' }}
                  />
                ) : (
                  <span
                    onDoubleClick={e => {
                      e.stopPropagation();
                      setEditionTag(entry.tag);
                      setNouveauNom(entry.tag);
                    }}
                    style={{ fontFamily: 'var(--police-mono)' }}
                  >
                    {entry.tag}
                  </span>
                )}
                {conflitsParTag[entry.tag]?.map((msg, i) => (
                  <div key={i} style={{ color: 'var(--couleur-erreur)', fontSize: '0.75rem', marginTop: '2px' }}>
                    ⚠ {msg}
                  </div>
                ))}
              </td>
              <td style={{ padding: 'var(--espacement-sm)' }}>
                {entry.valeurs.length === 0 ? (
                  <span style={{ color: 'var(--couleur-texte-secondaire)', fontStyle: 'italic' }}>vide</span>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 'var(--espacement-md)', listStyle: 'disc' }}>
                    {entry.valeurs.map((v, idx) => (
                      <li
                        key={v}
                        draggable
                        onDragStart={(e) => {
                          dragValue.current = { valeur: v, tagSource: entry.tag, index: idx };
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault(); // toujours autoriser le drop
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const dv = dragValue.current;
                          if (!dv) return;
                          if (dv.tagSource === entry.tag && dv.index !== idx) {
                            onReordonnerValeurs(entry.tag, dv.index, idx);
                          } else if (dv.tagSource !== entry.tag) {
                            onDeplacerValeur(dv.valeur, dv.tagSource, entry.tag);
                          }
                          dragValue.current = null;
                        }}
                        style={{
                          display: 'flex',
                          gap: 'var(--espacement-xs)',
                          alignItems: 'center',
                          cursor: 'grab',
                          padding: '2px 0',
                        }}
                      >
                        <span
                          onClick={e => { e.stopPropagation(); onValeurClick(entry.tag, v); }}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: tagSurbrillance === entry.tag && valeurSurbrillance === v
                              ? 'rgba(79, 70, 229, 0.15)'
                              : 'transparent',
                            borderRadius: '2px',
                            transition: 'background-color 0.15s',
                          }}
                        >{v}</span>
                        <button
                          onClick={e => { e.stopPropagation(); onRetirerValeur(entry.tag, v); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--couleur-erreur)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            padding: 0,
                          }}
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setAjoutValeurTag(ajoutValeurTag === entry.tag ? null : entry.tag); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'var(--couleur-texte-secondaire)',
                    marginTop: entry.valeurs.length > 0 ? 'var(--espacement-xs)' : 0,
                    padding: 0,
                  }}
                  title="Ajouter une valeur"
                >
                  ➕
                </button>
                {ajoutValeurTag === entry.tag && (
                  <div style={{ display: 'flex', gap: 'var(--espacement-xs)', marginTop: 'var(--espacement-xs)' }}>
                    <input
                      value={nouvelleValeur}
                      onChange={e => setNouvelleValeur(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && nouvelleValeur.trim()) {
                          onAjouterValeur(entry.tag, nouvelleValeur.trim());
                          setNouvelleValeur('');
                        }
                        if (e.key === 'Escape') {
                          setAjoutValeurTag(null);
                          setNouvelleValeur('');
                        }
                      }}
                      placeholder="Nouvelle valeur…"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, fontSize: '0.8rem' }}
                    />
                  </div>
                )}
              </td>
              <td style={{ padding: 'var(--espacement-sm)', textAlign: 'right' }}>
                <button
                  onClick={e => { e.stopPropagation(); onSupprimer(entry.tag); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--couleur-erreur)', fontSize: '0.8rem' }}
                  title="Supprimer"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAjoutManuel ? (
        <div style={{ display: 'flex', gap: 'var(--espacement-sm)', alignItems: 'center' }}>
          <input
            value={typeAjout}
            onChange={e => setTypeAjout(e.target.value.toUpperCase())}
            placeholder="Type (ex: PERSONNE)"
            style={{ flex: 1, fontSize: '0.8rem' }}
          />
          <input
            value={valeurAjout}
            onChange={e => setValeurAjout(e.target.value)}
            placeholder="Valeur"
            style={{ flex: 1, fontSize: '0.8rem' }}
          />
          <button
            onClick={() => {
              if (typeAjout.trim() && valeurAjout.trim()) {
                onAjouterTag(typeAjout.trim(), valeurAjout.trim());
                setTypeAjout('');
                setValeurAjout('');
                setShowAjoutManuel(false);
              }
            }}
            style={{
              padding: '4px 12px',
              background: 'var(--couleur-primaire)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Ajouter
          </button>
          <button
            onClick={() => setShowAjoutManuel(false)}
            style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--couleur-bordure)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAjoutManuel(true)}
          style={{
            padding: 'var(--espacement-sm) var(--espacement-md)',
            background: 'none',
            border: '1px dashed var(--couleur-bordure)',
            borderRadius: 'var(--rayon-bordure)',
            cursor: 'pointer',
            color: 'var(--couleur-primaire)',
            fontSize: '0.875rem',
          }}
        >
          + Ajouter un pseudo
        </button>
      )}
    </div>
  );
}