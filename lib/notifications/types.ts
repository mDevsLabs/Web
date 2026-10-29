// Types de notification — source unique, partagée par le client et le serveur.
//
// Cette liste est contrainte par la base : `Notification_type_check`
// (migration 0026, élargie par 0063). Elle vit dans `lib/` et non dans
// `hooks/` pour que les route handlers puissent s'en servir sans importer
// un module "use client".
//
// Toute évolution de la contrainte SQL DOIT se répercuter ici, sinon deux
// symptômes apparaissent : une route refuse un type que la base accepte, ou
// une notification est créée sans jamais consulter sa préférence.
//
// ── Les trois origines ─────────────────────────────────────────────────────
//
// Une notification vient de l'une de trois applications. L'ORIGINE est ce
// qui permet de les traiter différemment : une notification produite par mAI
// est créée et supprimée ici ; une notification Vibe ou Wakies est
// RÉPLIQUÉE depuis sa source, qui reste propriétaire de son état.
//
// `mai` est l'origine par défaut : une notification créée sans origine
// explicite est une notification mAI, comme avant l'unification.

/** Origine d'une notification : l'application qui l'a produite. */
export const NOTIFICATION_ORIGINS = ["mai", "vibe", "wakies"] as const;

export type NotificationOrigin = (typeof NOTIFICATION_ORIGINS)[number];

export function isNotificationOrigin(
  value: unknown
): value is NotificationOrigin {
  return (
    typeof value === "string" &&
    (NOTIFICATION_ORIGINS as readonly string[]).includes(value)
  );
}

/**
 * Libellé affiché pour regrouper les notifications par application.
 */
export const NOTIFICATION_ORIGIN_LABELS: Record<NotificationOrigin, string> = {
  mai: "mAI",
  vibe: "Vibe",
  wakies: "Wakies",
};

/**
 * Types produits par Vibe.
 *
 * Ces types sont contraints par la base (migration 0063) ET par la source
 * Vibe : une notification répliquée conserve le type qu'elle avait dans Vibe.
 */
export const VIBE_NOTIFICATION_TYPES = [
  "vibe_like",
  "vibe_repost",
  "vibe_reply",
  "vibe_mention",
  "vibe_quote",
  "vibe_follow",
  "vibe_dm",
  "vibe_ai_digest",
  "vibe_system",
] as const;

/** Types produits par Wakies. */
export const WAKIES_NOTIFICATION_TYPES = ["wakies_reply"] as const;

/** Types produits par mAI lui-même. */
export const MAI_NOTIFICATION_TYPES = [
  "agent_approval_required",
  "agent_run_failed",
  "agent_run_finished",
  "agent_user_input_required",
  "ai_response",
  "mcp_access_request",
  "mcp_created",
  "news",
  "planning_task_completed",
  "project_created",
  "project_member_joined",
  "quota_warning",
] as const;

export const NOTIFICATION_TYPES = [
  ...MAI_NOTIFICATION_TYPES,
  ...VIBE_NOTIFICATION_TYPES,
  ...WAKIES_NOTIFICATION_TYPES,
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Index de la préférence qui régit chaque type, quand elle existe.
 *
 * Les clés `vibe*` et `wakies*` sont des préférences LOGIQUES de l'écran
 * groupé des paramètres : elles ne sont pas des colonnes de
 * `user_notification_prefs`, parce que la décision pour Vibe et Wakies est
 * prise à la SOURCE (les réglages Vibe vivent dans `user_settings`, ceux de
 * Wakies dans `WakiesSettings`). Le tableau sert donc à documenter le
 * câblage, pas à interroger une colonne.
 */
export const NOTIFICATION_TYPE_TO_PREF_KEY: Record<NotificationType, string> = {
  agent_approval_required: "agentApprovalRequired",
  agent_run_failed: "agentRunFailed",
  agent_run_finished: "agentRunFinished",
  agent_user_input_required: "agentUserInputRequired",
  ai_response: "aiResponse",
  mcp_access_request: "mcpAccessRequest",
  mcp_created: "mcpCreated",
  news: "news",
  planning_task_completed: "planningTaskCompleted",
  project_created: "projectCreated",
  // Pas de colonne dédiée : la participation à un projet est un événement
  // factuel, régi par projectCreated.
  project_member_joined: "projectCreated",
  quota_warning: "quotaWarning",
  vibe_ai_digest: "vibeAiDigest",
  vibe_dm: "vibeDm",
  vibe_follow: "vibeFollow",
  // Vibe — la granularité fine (like / repost / reply / mention / quote /
  // follow) est celle des colonnes `notify_on_*` de `user_settings` côté
  // backend Vibe ; le tableau groupe ici les notifications de Vibe qui
  // partagent la même case.
  vibe_like: "vibeLike",
  vibe_mention: "vibeReply",
  vibe_quote: "vibeReply",
  vibe_reply: "vibeReply",
  vibe_repost: "vibeRepost",
  vibe_system: "vibeSystem",
  // Wakies — une seule case : les alertes de réponses terminées.
  wakies_reply: "wakiesReply",
};

/**
 * Origine déduite d'un type.
 *
 * Un type mAI ne peut pas être une notification Vibe : le type EST
 * l'information. Cette fonction sert aux chemins de secours (données
 * anciennes, imports).
 */
export function originForNotificationType(type: string): NotificationOrigin {
  if ((VIBE_NOTIFICATION_TYPES as readonly string[]).includes(type)) {
    return "vibe";
  }
  if ((WAKIES_NOTIFICATION_TYPES as readonly string[]).includes(type)) {
    return "wakies";
  }
  return "mai";
}
