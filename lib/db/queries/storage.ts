import "server-only";

import { getTierStorageBytes } from "@/lib/plans/tier-limits";
import { getRawClient } from "./connection";

export interface CloudFileInfo {
  filename: string;
  id: string;
  mime_type: string;
  original_name: string;
  size_bytes: number;
  uploaded_at: string;
  url: string;
}

export interface CloudStorageStats {
  bytes_limit: number;
  bytes_used: number;
  files_count: number;
  over_limit: boolean;
  percent_used: number;
  tier: string;
}

/**
 * Récupère les métriques de stockage Cloud pour un utilisateur depuis Neon.
 */
export async function getUserCloudStorage(
  userId: string,
  userTier = "Free"
): Promise<CloudStorageStats> {
  const sql = getRawClient();
  if (!sql) {
    const bytesLimit = getTierStorageBytes(userTier);
    return {
      bytes_limit: bytesLimit,
      bytes_used: 0,
      files_count: 0,
      over_limit: false,
      percent_used: 0,
      tier: userTier,
    };
  }

  try {
    const [uRows, usageRows] = await Promise.all([
      sql<{ tier: string | null }[]>`
        SELECT tier FROM users
        WHERE id::text = ${userId}::text
           OR username = ${userId}::text
           OR email = ${userId}::text
        LIMIT 1
      `.catch(() => []),
      sql<{ bytes_used: number | string; files_count: number | string }[]>`
        SELECT COALESCE(SUM(bytes_used::numeric), 0) AS bytes_used,
               COALESCE(SUM(files_count::numeric), 0) AS files_count
        FROM cloud_storage_usage
        WHERE (
          user_id = ${userId}::text
          OR user_id IN (SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          OR user_id IN (SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          OR user_id IN (SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
        )
        LIMIT 1
      `.catch(() => []),
    ]);

    const effectiveTier = (uRows[0]?.tier || userTier || "Free").trim();
    const bytesUsed = Number(usageRows[0]?.bytes_used || 0);
    const filesCount = Number(usageRows[0]?.files_count || 0);
    const bytesLimit = getTierStorageBytes(effectiveTier);
    const percentUsed =
      bytesLimit > 0 ? Math.min(100, (bytesUsed / bytesLimit) * 100) : 0;

    return {
      bytes_limit: bytesLimit,
      bytes_used: bytesUsed,
      files_count: filesCount,
      // Limite à 0 = aucune limite connue : ne pas signaler de dépassement.
      over_limit: bytesLimit > 0 && bytesUsed >= bytesLimit,
      percent_used: Math.round(percentUsed * 100) / 100,
      tier: effectiveTier,
    };
  } catch (error) {
    console.error("[Storage] Erreur récupération cloud_storage_usage:", error);
    const bytesLimit = getTierStorageBytes(userTier);
    return {
      bytes_limit: bytesLimit,
      bytes_used: 0,
      files_count: 0,
      over_limit: false,
      percent_used: 0,
      tier: userTier,
    };
  }
}

/**
 * Récupère la liste des fichiers Cloud de l'utilisateur depuis Neon.
 */
export async function getUserCloudFiles(
  userId: string,
  limit = 200
): Promise<CloudFileInfo[]> {
  const sql = getRawClient();
  if (!sql) return [];

  try {
    const rows = await sql<CloudFileInfo[]>`
      SELECT id::text, filename, original_name, url, size_bytes::int, mime_type, uploaded_at::text
      FROM cloud_files
      WHERE (
        user_id = ${userId}::text
        OR user_id IN (SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
        OR user_id IN (SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
        OR user_id IN (SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
      )
      ORDER BY uploaded_at DESC
      LIMIT ${limit}
    `.catch(() => []);

    return rows;
  } catch (error) {
    console.error("[Storage] Erreur récupération cloud_files:", error);
    return [];
  }
}

/**
 * Renomme un fichier Cloud dans Neon.
 */
export async function renameUserCloudFile(
  fileId: string,
  userId: string,
  newName: string
): Promise<boolean> {
  const sql = getRawClient();
  if (!sql) return false;

  try {
    const result = await sql`
      UPDATE cloud_files
      SET original_name = ${newName}
      WHERE (id::text = ${fileId}::text OR filename = ${fileId})
        AND (
          user_id = ${userId}::text
          OR user_id IN (SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          OR user_id IN (SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          OR user_id IN (SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
        )
      RETURNING id
    `;
    return result.length > 0;
  } catch (error) {
    console.error("[Storage] Erreur renommage cloud_files:", error);
    return false;
  }
}

/**
 * Supprime un fichier Cloud dans Neon et met à jour l'usage.
 */
export async function deleteUserCloudFile(
  fileId: string,
  userId: string
): Promise<{ success: boolean; error?: string; notFound?: boolean }> {
  const sql = getRawClient();
  if (!sql) {
    return { error: "Base de données non disponible", success: false };
  }

  try {
    const existing = await sql<
      { id: string; size_bytes: number; user_id: string }[]
    >`
      SELECT id, size_bytes, user_id
      FROM cloud_files
      WHERE (id::text = ${fileId}::text OR filename = ${fileId})
        AND (
          user_id = ${userId}::text
          OR user_id IN (SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          OR user_id IN (SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          OR user_id IN (SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
        )
      LIMIT 1
    `;

    if (existing.length === 0) {
      return { error: "Fichier introuvable.", notFound: true, success: false };
    }

    const fileSize = Number(existing[0].size_bytes || 0);
    const fileOwner = existing[0].user_id;

    await sql`
      DELETE FROM cloud_files
      WHERE id = ${existing[0].id}
    `;

    await sql`
      UPDATE cloud_storage_usage
      SET bytes_used  = GREATEST(0, bytes_used - ${fileSize}),
          files_count = GREATEST(0, files_count - 1),
          updated_at  = NOW()
      -- Une SEULE ligne d'usage est décrémentée (celle du propriétaire du
      -- fichier en priorité) : un compte indexé à la fois par identifiant,
      -- e-mail et nom d'utilisateur voyait sinon chaque ligne décrémentée.
      WHERE user_id = (
        SELECT user_id FROM cloud_storage_usage
      WHERE (
        user_id = ${userId}::text
        OR user_id IN (SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
        OR user_id IN (SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
        OR user_id IN (SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
      )
        OR user_id = ${fileOwner}::text
        ORDER BY (user_id = ${fileOwner}::text) DESC, bytes_used DESC
        LIMIT 1
      )
    `.catch(() => []);

    return { success: true };
  } catch (error) {
    console.error("[Storage] Erreur suppression cloud_files:", error);
    return { error: "Erreur serveur lors de la suppression.", success: false };
  }
}
