'use client';

/** Error de último nivel (falla el layout raíz). Debe incluir <html> y <body>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-CO">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f7fa', color: '#0e1a2e' }}>
        <main style={{ maxWidth: 480, margin: '15vh auto', padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 64, fontWeight: 900, color: '#0B1E3F', margin: 0 }}>500</p>
          <h1 style={{ fontSize: 24 }}>TecnoBray no está disponible en este momento</h1>
          <p style={{ color: '#475569' }}>Estamos trabajando para solucionarlo. Intenta de nuevo en unos minutos.</p>
          {error.digest ? <p style={{ fontSize: 12, color: '#94a3b8' }}>Código: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 0, background: '#84C43A', color: '#0B1E3F', fontWeight: 600, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
