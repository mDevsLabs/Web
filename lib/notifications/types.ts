// Types de notification — source unique, partagée par le client et le serveur.
//
// Cette liste est contrainte par la base : `Notification_type_check`
// (migration 0026). Elle vit dans `lib/` et non dans `hooks/` pour que les
// route handlers puissent s'en servir sans importer un module "use client".
//
// Toute évolution de la contrainte SQL DOIT se répercuter ici, sinon deux
// symptômes apparaissent : une route refuse un type que la base accepte, ou
// une notification est créée sans jamais consulter sa préférence.

export const NOTIFICATION_TYPES = [
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

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Index de la préférence qui régit chaque type, quand elle existe. */
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
};
