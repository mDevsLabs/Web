"use client";

// Boundary racine : rendu uniquement si app/layout.tsx lui-même échoue.
// Styles inline volontaires (le CSS global peut ne pas être chargé ici).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          alignItems: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          height: "100dvh",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
            Une erreur inattendue est survenue
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.6 }}>
            L'application n'a pas pu démarrer correctement. Veuillez recharger
            la page.
          </p>
          {error?.digest ? (
            <p style={{ color: "#71717a", fontSize: 12 }}>
              Référence technique : {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => reset()}
            style={{
              background: "#fafafa",
              border: 0,
              borderRadius: 10,
              color: "#0a0a0a",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              marginTop: 16,
              padding: "10px 18px",
            }}
            type="button"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
