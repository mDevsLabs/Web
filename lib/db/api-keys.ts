import "server-only";

import postgres from "postgres";

export async function getUserApiKey(userId: string): Promise<string | null> {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!userId || !dbUrl) {
    return null;
  }

  try {
    const sql = postgres(dbUrl, { prepare: false });
    const rows = await sql`
      SELECT api_key FROM mprojects_api_keys 
      WHERE user_id = ${userId}::text 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    await sql.end();
    if (rows.length > 0 && rows[0].api_key) {
      return rows[0].api_key;
    }
    return null;
  } catch (err: any) {
    // La table peut ne pas exister dans un environnement neuf — on ne bloque pas la navigation
    if (err?.code === "42P01") {
      // relation does not exist → ignorer silencieusement
      return null;
    }
    console.error("Erreur lecture clé API Neon:", err);
    return null;
  }
}
