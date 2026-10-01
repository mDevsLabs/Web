/**
 * Résolution centralisée de la chaîne de connexion Postgres.
 *
 * Contexte : une valeur `DATABASE_URL` collée dans un dashboard (Vercel ou
 * autre) avec des guillemets englobants produit une variable d'environnement
 * qui CONTIENT littéralement `"postgresql://…"` — guillemets compris. Le
 * driver postgres.js appelle alors `new URL()` sur une entrée invalide et
 * toutes les requêtes échouent en `TypeError: Invalid URL` (ERR_INVALID_URL),
 * sans aucun log d'appel API visible côté modèle.
 *
 * Ce module est l'unique point de lecture des variables de connexion : il
 * tolère les deux formes (avec ou sans guillemets), plus les espaces et
 * apostrophes parasites, avant de construire le client.
 *
 * Note : volontairement SANS import "server-only" — il est aussi utilisé par
 * lib/db/migrate.ts et les scripts Node, exécutés hors React Server
 * Components. Il ne contient aucune donnée sensible.
 */

/** Retire guillemets englobants, apostrophes et espaces autour de l'URL. */
export function sanitizeConnectionString(raw: string): string {
  let value = raw.trim();
  // Guillemets doubles ou simples appariés en début/fin (répétés : ""x"" → x).
  value = value.replace(/^(["'])+/, "").replace(/(["'])+$/, "");
  return value.trim();
}

type DatabaseUrlEnv = {
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
  POSTGRES_PRISMA_URL?: string;
};

/** URL de connexion nettoyée à partir des variables d'environnement, ou null. */
export function resolveDatabaseUrl(
  env: DatabaseUrlEnv = process.env as DatabaseUrlEnv
): string | null {
  const raw =
    env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL || "";
  const value = sanitizeConnectionString(raw);
  return value || null;
}
