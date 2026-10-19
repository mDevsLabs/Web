/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DMs & NOTIFICATIONS (vibe-dms.ts)
 * Point d'entrée : orchestration des routes + réexports du socle partagé.
 * Le module est scindé (limite de taille Val Town) en :
 *  - vibe-dms-core.ts              socle partagé (tables, compte mAI, helpers)
 *  - vibe-dms-conversations.ts     recherche, conversations, messages, envoi
 *  - vibe-dms-message-actions.ts   épinglage, recherche, non-lu, réactions, mAI
 *  - vibe-dms-moderation.ts        blocage, signalement, renommage, suppression
 *  - vibe-dms-notifications.ts     notifications et compteur non-lus
 *  - vibe-dms-groups.ts            groupes, masquage, traductions
 * ============================================================================
 */
import type { Hono } from "npm:hono@4";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { registerDMDirectRoutes } from "./vibe-dms-conversations.ts";
import { ensureDMTables, ensureMAIAccount } from "./vibe-dms-core.ts";
import { registerDMGroupRoutes } from "./vibe-dms-groups.ts";
import { registerDMMessageActionRoutes } from "./vibe-dms-message-actions.ts";
import { registerDMModerationRoutes } from "./vibe-dms-moderation.ts";
import { registerDMNotificationRoutes } from "./vibe-dms-notifications.ts";

export {
  DM_MESSAGE_CHARS_FREE,
  DM_MESSAGE_CHARS_PAID,
  ensureMAIAccount,
  getMAIUserId,
  publishScheduledDMs,
} from "./vibe-dms-core.ts";

export function registerVibeDMsRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  ensureDMTables();
  ensureMAIAccount();
  registerDMDirectRoutes(app, registerMulti);
  registerDMMessageActionRoutes(app, registerMulti);
  registerDMModerationRoutes(app, registerMulti);
  registerDMNotificationRoutes(app, registerMulti);
  registerDMGroupRoutes(app, registerMulti);
}
