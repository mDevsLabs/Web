/**
 * ============================================================================
 * GET /api/cron/vibe — publication des vibes & DMs programmés
 * ============================================================================
 *
 * POURQUOI CETTE ROUTE
 *
 * Le backend Val Town publiait les posts planifiés arrivés à échéance PAR
 * EFFET DE BORD dans ses GET (`publishDuePosts()`, `vibe-posts-core.ts:48`) :
 * une lecture qui écrit. Les lecteurs RSC de Vibe sont en lecture stricte
 * (règle de l'hôte § 6.2 des AGENTS) — l'échéance doit donc être portée par
 * un tick. La publication paresseuse du backend reste en place pour
 * l'application mobile : cette route ne fait qu'assurer que l'interface web
 * converge, au pire avec cinq minutes de retard.
 *
 * CONCURRENCE : deux ticks (ou un tick et la publication mobile) ne peuvent
 * pas publier le même post — `FOR UPDATE SKIP LOCKED` rend chaque ligne à un
 * seul acteur ; l'UPDATE est idempotent (`status='scheduled'` dans la
 * condition).
 *
 * Colonnes `status`/`scheduled_at`/`send_at` : ajoutées paresseusement par le
 * backend. Sur une base qui ne les a pas encore, l'UPDATE échoue en 42703 →
 * compteur 0, pas de crash.
 *
 * AUTHENTIFICATION : identique aux autres routes cron de l'hôte —
 * `CRON_SECRET` par en-tête uniquement, fail-closed en production.
 */
import { errorResponse } from "@/lib/api/error-response";
import { timingSafeCompare } from "@/lib/security/timing";
import { vibeSql } from "@/lib/vibe/server/db";

export const maxDuration = 60;

async function isAuthorized(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const enTete = request.headers.get("authorization");
    const secret = request.headers.get("x-cron-secret");
    return (
      timingSafeCompare(enTete, `Bearer ${cronSecret}`) ||
      timingSafeCompare(secret, cronSecret)
    );
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[cron/vibe] CRON_SECRET manquant en production — refusé");
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const sql = vibeSql();
  if (!sql) {
    // Pas de DATABASE_URL : rien à publier ici, le backend s'en charge.
    return Response.json({ dms: 0, posts: 0, skipped: "no_db", success: true });
  }

  const duePosts: any[] = await sql`
    UPDATE posts
    SET status = 'published', published_at = NOW(), updated_at = NOW()
    WHERE id IN (
      SELECT id FROM posts
      WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()
      ORDER BY scheduled_at
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, author_id
  `.catch(() => []);

  for (const p of duePosts) {
    await sql`
      INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
      VALUES (${p.author_id}, ${p.author_id}, 'mai_system', ${String(p.id)}::uuid, 'Votre vibe planifiée a été publiée.')
    `.catch(() => {});
  }

  const dueDms: any[] = await sql`
    UPDATE direct_messages
    SET status = 'sent', send_at = NULL
    WHERE id IN (
      SELECT id FROM direct_messages
      WHERE status = 'scheduled' AND send_at IS NOT NULL AND send_at <= NOW()
      ORDER BY send_at
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    )
    RETURNING recipient_id, sender_id
  `.catch(() => []);

  for (const m of dueDms) {
    await sql`
      INSERT INTO notifications (recipient_id, actor_id, type, message)
      VALUES (${m.recipient_id}, ${m.sender_id}, 'dm', 'vous a envoyé un message')
    `.catch(() => {});
  }

  return Response.json({
    dms: dueDms.length,
    posts: duePosts.length,
    success: true,
  });
}
