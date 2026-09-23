/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — CERCLE PRIVÉ (vibe-circle.ts)
 * Gestion du cercle privé (audience 'circle' des posts) : table circle_members,
 * ajout / retrait / liste des membres.
 * Enregistré par vibe.ts (registerVibeRoutes).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import { isBlockEitherWay, type RegisterMultiFn } from "./vibe-common.ts";

let circleTableReady = false;

/**
 * Crée la table circle_members si absente (idempotent).
 * Les requêtes des feeds s'appuient sur (user_id = auteur, member_user_id = lecteur).
 */
export async function ensureCircleTable(): Promise<void> {
  if (circleTableReady) return;
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS circle_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL,
      member_user_id BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, member_user_id)
    )
  `;
  circleTableReady = true;
}

/**
 * Enregistre les routes de gestion du cercle privé.
 */
export function registerVibeCircleRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  const authenticate = async (c: any): Promise<number | null> => {
    const token = extractToken(c.req.raw);
    if (!token) return null;
    try {
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      return userId && !Number.isNaN(userId) ? userId : null;
    } catch {
      return null;
    }
  };

  const resolveTargetId = async (sql: any, c: any): Promise<number | null> => {
    const rawParam = c.req.param("username") || "";
    const targetUsername = rawParam.toLowerCase().trim().replace(/^@/, "");
    if (!targetUsername) return null;
    const rows =
      await sql`SELECT id FROM users WHERE LOWER(username) = ${targetUsername} LIMIT 1`;
    return rows.length > 0 ? Number(rows[0].id) : null;
  };

  // 1. LISTE des membres de mon cercle privé
  const handleListCircle = async (c: any) => {
    try {
      const currentUserId = await authenticate(c);
      if (!currentUserId) return c.json({ error: "Non authentifié." }, 401);

      await ensureCircleTable().catch(() => {});
      const sql = getDb();
      const rows = await sql`
        SELECT cm.member_user_id, u.username,
               COALESCE(pr.display_name, u.username) AS display_name,
               COALESCE(pr.avatar_url, u.avatar_url) AS avatar_url,
               cm.created_at
        FROM circle_members cm
        JOIN users u ON u.id = cm.member_user_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE cm.user_id = ${currentUserId}
        ORDER BY cm.created_at DESC
      `;
      return c.json({ circle: rows, success: true });
    } catch (err: any) {
      console.error("[List Circle Error]:", err);
      return c.json({ circle: [], success: true });
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/users/circle",
      "/vibe/users/circle",
      "/v1/users/circle",
      "/api/vibe/circle",
      "/vibe/circle",
      "/v1/circle",
    ],
    handleListCircle
  );

  // 2. STATUT : ce compte est-il dans mon cercle ?
  const handleGetCircleStatus = async (c: any) => {
    try {
      const currentUserId = await authenticate(c);
      if (!currentUserId) return c.json({ error: "Non authentifié." }, 401);

      await ensureCircleTable().catch(() => {});
      const sql = getDb();
      const targetId = await resolveTargetId(sql, c);
      if (targetId === null)
        return c.json({ error: "Utilisateur introuvable." }, 404);

      const rows = await sql`
        SELECT 1 FROM circle_members
        WHERE user_id = ${currentUserId} AND member_user_id = ${targetId}
        LIMIT 1
      `;
      return c.json({ in_circle: rows.length > 0, success: true });
    } catch (err: any) {
      console.error("[Circle Status Error]:", err);
      return c.json({ error: "Erreur lecture du cercle." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/users/:username/circle",
      "/vibe/users/:username/circle",
      "/v1/users/:username/circle",
    ],
    handleGetCircleStatus
  );

  // 3. AJOUT / RETRAIT d'un membre (toggle si in_circle absent du body)
  const handleToggleCircleMember = async (c: any) => {
    try {
      const currentUserId = await authenticate(c);
      if (!currentUserId) return c.json({ error: "Non authentifié." }, 401);

      await ensureCircleTable().catch(() => {});
      const sql = getDb();
      const targetId = await resolveTargetId(sql, c);
      if (targetId === null)
        return c.json({ error: "Utilisateur introuvable." }, 404);
      if (targetId === currentUserId) {
        return c.json(
          { error: "Impossible de s'ajouter soi-même à son cercle." },
          400
        );
      }

      const existing = await sql`
        SELECT 1 FROM circle_members
        WHERE user_id = ${currentUserId} AND member_user_id = ${targetId}
        LIMIT 1
      `;

      const body = await c.req.json().catch(() => ({}) as any);
      const inCircle =
        body.in_circle === undefined
          ? existing.length === 0
          : Boolean(body.in_circle);

      if (inCircle) {
        // Blocage (dans un sens ou l'autre) : interdit d'ajouter au cercle
        if (await isBlockEitherWay(currentUserId, targetId)) {
          return c.json(
            {
              blocked: true,
              error:
                "Impossible d'ajouter ce compte à votre cercle : un blocage est actif.",
            },
            403
          );
        }
        await sql`
          INSERT INTO circle_members (user_id, member_user_id)
          VALUES (${currentUserId}, ${targetId})
          ON CONFLICT (user_id, member_user_id) DO NOTHING
        `;
      } else {
        await sql`
          DELETE FROM circle_members
          WHERE user_id = ${currentUserId} AND member_user_id = ${targetId}
        `;
      }

      return c.json({ in_circle: inCircle, success: true });
    } catch (err: any) {
      console.error("[Toggle Circle Member Error]:", err);
      return c.json({ error: "Erreur lors de la mise à jour du cercle." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/users/:username/circle",
      "/vibe/users/:username/circle",
      "/v1/users/:username/circle",
    ],
    handleToggleCircleMember
  );
}
