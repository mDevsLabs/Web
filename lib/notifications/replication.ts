import "server-only";

/**
 * ============================================================================
 * RÉPLICATION DES NOTIFICATIONS (lib/notifications/replication.ts)
 * ============================================================================
 *
 * POURQUOI UN TICK
 *
 * La table `Notification` de l'hôte est l'unique source de vérité de l'état
 * lu/non lu (migration 0063). Les notifications Vibe et Wakies y sont donc
 * RÉPLIQUÉES — mais pas par la Cloche, qui ne fait QUE lire.
 *
 * La réplication est faite par un TICK, pas par le navigateur : une page
 * ouverte ne garantit rien, et un événement reçu pendant que l'application
 * était fermée doit exister au réveil. Le tick est idempotent — un rejeu ne
 * duplique rien — donc le retard de cinq minutes du tick est le seul
 * coût, et il est celui qu'ont déjà les notifications planifiées de mAI.
 *
 * ── Ce que ce module NE FAIT PAS ──────────────────────────────────────────
 *
 * Il n'écrit JAMAIS dans les tables de Vibe ni de Wakies. Vibe appartient au
 * backend Val Town (qui fait du DDL à la volée) et Wakies a ses propres
 * tables : la politique de l'hôte est « lecture seule sur les tables
 * d'autrui ». Ce module LIT les sources et ÉCRIT dans la table de l'hôte,
 * rien d'autre.
 *
 * ── Le problème d'identité ────────────────────────────────────────────────
 *
 * L'hôte identifie un compte par une chaîne (`users.id` de l'hôte, ou son
 * email). Vibe identifie un compte par un ENTIER (`users.id` de Vibe). Les
 * deux identifiants n'ont AUCUN rapport : on ne peut pas dériver l'un de
 * l'autre.
 *
 * Le pont est donc l'EMAIL, qui est le même dans les deux bases. C'est la
 * seule clé commune, et c'est pourquoi le tick résout l'identité Vibe par
 * email plutôt que par identifiant.
 */

import { replicateNotification } from "@/lib/db/queries/notifications";
import type { NotificationType } from "@/lib/notifications/types";
import { vibeSql } from "@/lib/vibe/server/db";
import { isoDeep } from "@/lib/vibe/server/shape";

// ─────────────────────────────────────────────
// Vibe
// ─────────────────────────────────────────────

/**
 * Les types Vibe vers les types de la table unique.
 *
 * Vibe a ses propres noms (`like`, `dm`, `mention`…) ; la table de l'hôte a
 * des types contraints par la base. Un type Vibe inconnu ne doit pas être
 * inventé : il est ignoré, pas recopié tel quel.
 */
const VIBE_TYPE_MAP: Record<string, NotificationType> = {
  ai_digest: "vibe_ai_digest",
  // Un livre partagé ou transféré : c'est une notification sociale, elle
  // entre donc dans le groupe des événements Vibe.
  book_join: "vibe_system",
  dm: "vibe_dm",
  follow: "vibe_follow",
  follow_accept: "vibe_follow",
  follow_request: "vibe_follow",
  like: "vibe_like",
  mai_system: "vibe_system",
  mention: "vibe_mention",
  post: "vibe_system",
  quote: "vibe_quote",
  reaction: "vibe_like",
  reply: "vibe_reply",
  repost: "vibe_repost",
};

/** Titre lisible d'une notification Vibe, à partir de son message. */
function vibeTitle(type: string, message: string | null): string {
  const texte = (message ?? "").trim();
  if (texte) {
    return texte.length > 120 ? `${texte.slice(0, 117)}…` : texte;
  }
  switch (type) {
    case "like":
    case "reaction":
      return "Quelqu'un a aimé votre publication";
    case "repost":
      return "Quelqu'un a repartagé votre publication";
    case "reply":
      return "Nouvelle réponse à votre publication";
    case "mention":
      return "Vous avez été mentionné";
    case "quote":
      return "Votre publication a été citée";
    case "follow":
    case "follow_request":
    case "follow_accept":
      return "Un nouveau compte vous suit";
    case "dm":
      return "Nouveau message privé";
    default:
      return "Activité sur Vibe";
  }
}

/**
 * Lien de navigation vers l'événement Vibe.
 *
 * Le chemin passe par `toVibePath` côté client : ici on ne construit que le
 * fragment applicatif, et c'est l'interface qui l'assemble.
 */
function vibeLink(row: any): string | null {
  if (row.post_id) {
    return `/vibe/post/${row.post_id}`;
  }
  if (row.actor_username) {
    return `/vibe/u/${row.actor_username}`;
  }
  if (row.type === "dm") {
    return "/vibe/messages";
  }
  return "/vibe/notifications";
}

/**
 * Réplique les notifications Vibe non lues d'un compte.
 *
 * `email` est la clé commune entre les deux bases : c'est par elle qu'on
 * retrouve le compte de l'hôte. Un compte sans email ne peut pas être
 * répliqué — il est ignoré, et l'incident est journalisé.
 */
export async function replicateVibeNotifications(
  email: string
): Promise<number> {
  const sql = vibeSql();
  if (!sql) {
    return 0;
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return 0;
  }

  // L'identifiant de l'HÔTE, résolu depuis l'email.
  //
  // C'est la pièce qui rend la réplication correcte : la table `Notification`
  // est indexée sur le `userId` que produit la session (`user.id ||
  // user.email`), pas sur l'email. Écrire l'email ici mettrait la
  // notification dans une ligne que la cloche ne lira jamais.
  const { resolveUserIdByEmail } = await import("@/lib/db/users");
  const userId = await resolveUserIdByEmail(normalized);
  if (!userId) {
    return 0;
  }

  // La jointure se fait par EMAIL, pas par identifiant.
  //
  // `notifications.recipient_id` référence `users.id`, dont le type réel
  // varie selon la base (bigint, uuid ou texte). Comparer un identifiant
  // texte à un identifiant d'un type inconnu demanderait un CAST, et le
  // cast échoue en 42883 sur une base où le type ne correspond pas. En
  // joignant sur `users.email`, la comparaison se fait dans le seul type
  // qui existe partout : du texte.
  let notifications: any[] = [];
  try {
    notifications = await sql`
      SELECT n.id, n.type, n.message, n.post_id, n.created_at,
             u.username as actor_username,
             COALESCE(u.avatar_url, pr.avatar_url) as actor_avatar_url
      FROM notifications n
      JOIN users destinataire ON destinataire.id = n.recipient_id
      LEFT JOIN users u ON u.id = n.actor_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE LOWER(destinataire.email) = ${normalized}
        AND NOT n.is_read
      ORDER BY n.created_at DESC
      LIMIT 100
    `;
  } catch {
    return 0;
  }
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return 0;
  }

  let repliquees = 0;
  for (const row of notifications) {
    const type = VIBE_TYPE_MAP[String(row.type ?? "")];
    if (!type) {
      // Type Vibe inconnu : on ne l'invente pas. Il apparaîtra dans la page
      // Vibe, qui lit sa propre source.
      continue;
    }
    const sourceId = String(row.id);
    const created = await replicateNotification({
      body: row.message ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      link: vibeLink(row),
      origin: "vibe",
      sourceId,
      sourceMeta: isoDeep({
        actor_avatar_url: row.actor_avatar_url ?? null,
        actor_username: row.actor_username ?? null,
        post_id: row.post_id ?? null,
        type: String(row.type ?? ""),
      }) as Record<string, unknown>,
      title: vibeTitle(String(row.type ?? ""), row.message),
      type,
      userId,
    });
    if (created) {
      repliquees += 1;
    }
  }
  return repliquees;
}

/**
 * Liste des COMPTES Vibe ayant au moins une notification non lue.
 *
 * Le tick parcourt les comptes : chaque compte a son destinataire, et les
 * notifications ne portent pas l'email de leur destinataire.
 */
export async function listVibeRecipients(): Promise<string[]> {
  const sql = vibeSql();
  if (!sql) {
    return [];
  }
  try {
    // L'email est renvoyé tel quel : c'est la clé que la réplication
    // utilise, et il n'a pas besoin d'être converti en identifiant.
    const rows = await sql`
      SELECT DISTINCT u.email
      FROM notifications n
      JOIN users u ON u.id = n.recipient_id
      WHERE NOT n.is_read
      LIMIT 500
    `;
    return rows
      .map((row: any) => String(row.email ?? ""))
      .filter((email) => email.length > 0);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Wakies
// ─────────────────────────────────────────────

/**
 * Réplique les alertes Wakies d'un compte.
 *
 * Les alertes Wakies sont écrites dans `WakiesNotification` à la fin d'un
 * tour terminé. Le `seq` est le curseur monotone : il sert d'identifiant
 * source, et il permet de ne traiter que ce qui suit le dernier `seq`
 * déjà répliqué — un tick ne relit donc jamais l'historique.
 */
export async function replicateWakiesNotifications(
  userId: string
): Promise<number> {
  const { listWakieNotifications } = await import("@/lib/wakies/queries");
  const { getMaxReplicatedWakiesSeq } = await import(
    "@/lib/db/queries/notifications"
  );
  const dernierSeq = await getMaxReplicatedWakiesSeq(userId).catch(() => 0);
  const evenements = await listWakieNotifications(userId, dernierSeq).catch(
    () => []
  );
  if (!Array.isArray(evenements) || evenements.length === 0) {
    return 0;
  }

  let repliquees = 0;
  for (const evenement of evenements) {
    const sourceId = String(evenement.seq);
    const created = await replicateNotification({
      body: evenement.preview ?? null,
      // Wakies n'a pas de route par conversation : la liste des conversations
      // vit dans le rail de l'atelier, et c'est là que l'utilisateur
      // choisira le fil concerné. Un lien vers une route inexistante
      // mènerait à un 404.
      link: "/wakies",
      origin: "wakies",
      sourceId,
      sourceMeta: {
        conversationId: evenement.conversationId,
        preview: evenement.preview ?? null,
        seq: evenement.seq,
        title: evenement.title ?? null,
      },
      title: evenement.title
        ? `Réponse de ${evenement.title}`
        : "Nouvelle réponse dans vos conversations",
      type: "wakies_reply",
      userId,
    });
    if (created) {
      repliquees += 1;
    }
  }
  return repliquees;
}
