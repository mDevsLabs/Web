/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — API ADAPTER (vibe.ts)
 * Root orchestrator mounting all modular Vibe & mAI sub-routes
 * Compatible with https://mai.val.run (/v1/, /vibe/, /api/vibe/)
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { registerVibeBooksRoutes } from "./vibe-books.ts";
import { registerVibeCircleRoutes } from "./vibe-circle.ts";
import { createRegisterMulti } from "./vibe-common.ts";
import { registerVibeDMsRoutes } from "./vibe-dms.ts";
import { registerVibeFeedRoutes } from "./vibe-feed.ts";
import { registerVibeMAIRoutes } from "./vibe-mai.ts";
import { registerVibePostsRoutes } from "./vibe-posts.ts";
import { registerVibeSettingsRoutes } from "./vibe-settings.ts";
import { registerVibeUsersRoutes } from "./vibe-users.ts";

export { registerVibeBooksRoutes } from "./vibe-books.ts";
export { registerVibeDMsRoutes } from "./vibe-dms.ts";
export { registerVibeFeedRoutes } from "./vibe-feed.ts";
export { registerVibeMAIRoutes } from "./vibe-mai.ts";
export { MAIAgentFleet } from "./vibe-mai-fleet.ts";
export { registerVibePostsRoutes } from "./vibe-posts.ts";
// Re-export core classes & types for external modules and tests
export {
  type FeedTunerWeights,
  HybridRecommender,
  type PostCandidate,
  type RecommendationSignal,
} from "./vibe-recommender.ts";
export { registerVibeSettingsRoutes } from "./vibe-settings.ts";
export { registerVibeUsersRoutes } from "./vibe-users.ts";

/**
 * Registers all Vibe Social Network and mAI Engine routes on the main Hono application
 */
export function registerVibeRoutes(app: Hono) {
  const registerMulti = createRegisterMulti(app);

  // Mount modular route domains
  // Feed avant Posts : l'ordre d'enregistrement fait foi dans le routeur Hono,
  // la route statique /v1/posts/top (feed) doit primer sur /v1/posts/:id (posts).
  registerVibeFeedRoutes(app, registerMulti);
  registerVibePostsRoutes(app, registerMulti);
  registerVibeUsersRoutes(app, registerMulti);
  registerVibeDMsRoutes(app, registerMulti);
  registerVibeSettingsRoutes(app, registerMulti);
  registerVibeMAIRoutes(app, registerMulti);
  registerVibeCircleRoutes(app, registerMulti);
  registerVibeBooksRoutes(app, registerMulti);
}
