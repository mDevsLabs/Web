/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI CHAT & QUOTAS (vibe-mai.ts)
 * Point d'entrée : orchestration des routes mAI + réexports du socle partagé.
 * Le module est scindé (limite de taille Val Town) en :
 *  - vibe-mai-core.ts           socle partagé (tables, helpers, détection, formatage)
 *  - vibe-mai-chat.ts           chat mAI + réponse /mai en commentaire
 *  - vibe-mai-conversations.ts  historique et CRUD des conversations
 *  - vibe-mai-execute.ts        régénération, exécution/refus d'outils
 *  - vibe-mai-settings.ts       quotas, modulation, catalogue des outils
 * Les outils sensibles nécessitent une approbation explicite de l'utilisateur
 * sauf si le réglage `mai_auto_approve_tools` est activé.
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { ensureMAIConversations } from "./vibe-mai-core.ts";
import { registerVibeMAIChatRoutes } from "./vibe-mai-chat.ts";
import { registerVibeMAIConversationRoutes } from "./vibe-mai-conversations.ts";
import { registerVibeMAIExecuteRoutes } from "./vibe-mai-execute.ts";
import { registerVibeMAISettingsRoutes } from "./vibe-mai-settings.ts";

export { buildPostContext, getOpenRouterKey } from "./vibe-mai-core.ts";
export { generateMAICommentAnswer } from "./vibe-mai-chat.ts";

export function registerVibeMAIRoutes(app: Hono, registerMulti: RegisterMultiFn) {
  ensureMAIConversations();
  registerVibeMAIChatRoutes(app, registerMulti);
  registerVibeMAIConversationRoutes(app, registerMulti);
  registerVibeMAIExecuteRoutes(app, registerMulti);
  registerVibeMAISettingsRoutes(app, registerMulti);
}
