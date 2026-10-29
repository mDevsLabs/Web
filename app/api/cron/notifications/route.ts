/**
 * ============================================================================
 * POST /api/cron/notifications — tick de réplication des notifications
 * ============================================================================
 *
 * POURQUOI UN TICK
 *
 * La table `Notification` de l'hôte est l'unique source de vérité de l'état
 * lu/non lu (migration 0063). Les notifications Vibe et Wakies y sont
 * RÉPLIQUÉES — mais pas par le navigateur : une page ouverte ne garantit
 * rien, et un événement reçu pendant que l'application était fermée doit
 * exister au réveil.
 *
 * Le tick est idempotent : la réplication passe par un `ON CONFLICT DO
 * NOTHING` sur `(origin, sourceId)`, donc un rejeu ne duplique rien. Le
 * retard de cinq minutes est le seul coût, et c'est celui qu'ont déjà les
 * notifications planifiées de mAI.
 *
 * CE QUE LE TICK NE FAIT PAS
 *
 * Il n'écrit JAMAIS dans les tables de Vibe ni de Wakies. Vibe appartient au
 * backend Val Town (qui fait du DDL à la volée) et Wakies a ses propres
 * tables : la politique de l'hôte est « lecture seule sur les tables
 * d'autrui ». Ce tick LIT les sources et ÉCRIT dans la table de l'hôte.
 *
 * L'IDENTITÉ
 *
 * L'hôte identifie un compte par une chaîne, Vibe par un entier. Le pont
 * est l'email, seule clé commune aux deux bases. Un compte sans email
 * n'est pas répliqué : c'est journalisé, jamais deviné.
 *
 * AUTHENTIFICATION : identique aux autres routes cron de l'hôte — `CRON_SECRET`
 * par en-tête uniquement, fail-closed en production.
 */
import { errorResponse } from "@/lib/api/error-response";
import {
  listVibeRecipients,
  replicateVibeNotifications,
  replicateWakiesNotifications,
} from "@/lib/notifications/replication";
import { timingSafeCompare } from "@/lib/security/timing";
import { listUsersWithWakies } from "@/lib/wakies/queries";

export const maxDuration = 120;

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
    console.error(
      "[cron/notifications] CRON_SECRET manquant en production — refusé"
    );
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  let vibe = 0;
  let wakies = 0;
  const echecs: string[] = [];

  // ── Vibe ──────────────────────────────────────────────────────────────
  // On parcourt les COMPTES, pas les notifications : le destinataire est
  // un `users.id` numérique de Vibe, et les notifications ne le portent pas.
  try {
    const destinataires = await listVibeRecipients();
    for (const email of destinataires) {
      try {
        vibe += await replicateVibeNotifications(email);
      } catch (error) {
        echecs.push(
          `vibe:${email}:${error instanceof Error ? error.message : "inconnu"}`
        );
      }
    }
  } catch (error) {
    echecs.push(
      `vibe:globaux:${error instanceof Error ? error.message : "inconnu"}`
    );
  }

  // ── Wakies ────────────────────────────────────────────────────────────
  try {
    const comptes = await listUsersWithWakies();
    for (const userId of comptes) {
      try {
        wakies += await replicateWakiesNotifications(userId);
      } catch (error) {
        echecs.push(
          `wakies:${userId}:${error instanceof Error ? error.message : "inconnu"}`
        );
      }
    }
  } catch (error) {
    echecs.push(
      `wakies:globaux:${error instanceof Error ? error.message : "inconnu"}`
    );
  }

  // Un échec partiel ne doit pas faire échouer le tick : la réplication
  // est idempotente, donc le tick suivant reprendra ce qui manque. Mais il
  // doit être VISIBLE — c'est le journal et le compteur.
  if (echecs.length > 0) {
    console.error("[cron/notifications] échecs partiels:", echecs);
  }

  return Response.json({
    echecs: echecs.length,
    repliquees: vibe + wakies,
    success: true,
    vibe,
    wakies,
  });
}
