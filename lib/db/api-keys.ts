import "server-only";

import postgres from "postgres";

export async function getUserApiKey(userId: string): Promise<string | null> {
  if (!userId || !process.env.POSTGRES_URL) return null;

  try {
    const sql = postgres(process.env.POSTGRES_URL);
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
  } catch (err) {
    console.error("Erreur lecture clé API Neon:", err);
    return null;
  }
}
