/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — API CLIENT (src/services/api.ts)
 * Façade publique modulaire pour les appels API Vibe
 *
 * Toutes les méthodes sont modularisées dans ./api/ :
 *   - ./api/base.ts       : Configuration, tokens, cache, requêtes réseau
 *   - ./api/settings.ts   : Paramètres, notifications, RGPD
 *   - ./api/mai.ts        : Modèles d'IA, mAI chat, TTS/voix, quotas
 *   - ./api/books.ts      : VibeBooks, cercles de lecture
 *   - ./api/stories.ts    : Stories de 24h, rail, vues, quotas
 *   - ./api/users.ts      : Profils, comptes, abonnements, modération
 *   - ./api/messages.ts   : DMs, discussions de groupe, réactions
 *   - ./api/posts.ts      : Publications, fil d'actualité, commentaires
 * ============================================================================
 */

import { ApiPostsService } from "./api/posts";

export * from "./api/base";
export * from "./api/posts";
export * from "./api/messages";
export * from "./api/stories";
export * from "./api/users";
export * from "./api/books";
export * from "./api/mai";
export * from "./api/settings";

/**
 * Client API statique principal Vibe.
 * Hérite de l'intégralité des modules métiers par chaîne d'héritage statique TypeScript.
 */
export class ApiService extends ApiPostsService {}
