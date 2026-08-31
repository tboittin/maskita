interface PopupConfirmationProps {
  titre: string;
  message: string;
  boutonConfirmer?: string;
  boutonAnnuler?: string;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

export function PopupConfirmation({
  titre,
  message,
  boutonConfirmer = 'Continuer',
  boutonAnnuler = 'Annuler',
  onConfirmer,
  onAnnuler,
}: PopupConfirmationProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onAnnuler}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--rayon-bordure)',
          padding: 'var(--espacement-lg)',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: 'var(--espacement-sm)',
            color: 'var(--couleur-texte)',
          }}
        >
          {titre}
        </h3>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--couleur-texte-secondaire)',
            lineHeight: 1.6,
            marginBottom: 'var(--espacement-lg)',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--espacement-sm)' }}>
          <button
            onClick={onAnnuler}
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
            {boutonAnnuler}
          </button>
          <button
            onClick={onConfirmer}
            style={{
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
            {boutonConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}