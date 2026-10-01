// Endpoints API centralisés : une seule source pour la construction des URLs
// côté client (préfixe NEXT_PUBLIC_BASE_PATH lu une fois). Les composants et
// hooks n'assemblent plus jamais de chemins à la main — un renommage de route
// ou un changement de base path ne touche que ce module.

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiUrl(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Route de page, préfixée comme les endpoints.
 *
 * Les `router.push("/…")` en dur sortent de l'application quand un base path
 * est actif (mode démo) : le préfixe doit passer par ici, comme pour les routes
 * API.
 */
export function pagePath(path: string): string {
  return apiUrl(path);
}

export const apiEndpoints = {
  agentFlags: () => apiUrl("/api/agent/flags"),
  /** Préférence d'écran d'accueil (Chat | Agent) — route légère, sans catalogue. */
  agentMode: () => apiUrl("/api/agent/mode"),
  agentModels: () => apiUrl("/api/models"),
  agentRunById: (runId: string) => apiUrl(`/api/agent/runs/${runId}`),
  agentRunSuggestedAction: (runId: string) =>
    apiUrl(`/api/agent/runs/${runId}/suggested-action`),
  agentRunsForChat: (chatId: string) =>
    apiUrl(`/api/agent/runs?chatId=${chatId}`),
  agentRunUserInput: (runId: string) =>
    apiUrl(`/api/agent/runs/${runId}/user-input`),
  agentSettings: () => apiUrl("/api/agent/settings"),
  /** Bots de l'utilisateur (gardé côté serveur : forfait Plus minimum). */
  agents: () => apiUrl("/api/agents"),
  /** Générations audio de l'utilisateur. La route n'accepte aucun paramètre. */
  audioHistory: () => apiUrl("/api/audio/history"),
  /** Catalogue des modèles audio. */
  audioModels: () => apiUrl("/api/models/audio"),

  chatById: (chatId: string) => apiUrl(`/api/chats/${chatId}`),
  chatExport: (chatId: string, format: "html" | "md" = "md") =>
    apiUrl(`/api/chats/${chatId}/export?format=${format}`),
  /** Navigation SPA vers une conversation (history.pushState). */
  chatPath: (chatId: string) => pagePath(`/chat/${chatId}`),
  chatStream: (chatId: string) => apiUrl(`/api/chat/${chatId}/stream`),

  document: (documentId: string) => apiUrl(`/api/document?id=${documentId}`),

  fileUpload: () => apiUrl("/api/files/upload"),

  /** Générations d'images de l'utilisateur (l'amont plafonne à 50). */
  imageHistory: () => apiUrl("/api/images/history"),
  /** Catalogue des modèles d'image. */
  imageModels: () => apiUrl("/api/models/images"),
  /** Serveurs MCP de l'utilisateur (gardé côté serveur : forfait Plus minimum). */
  mcpServers: () => apiUrl("/api/mcp"),

  messagesForChat: (chatId: string) => apiUrl(`/api/messages?chatId=${chatId}`),

  models: () => apiUrl("/api/models"),
  /** Recherche globale : discussions, messages, projets et fichiers Cloud. */
  search: (query: string, limit = 20) =>
    apiUrl(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  /**
   * Index de recherche interne : un point d'entrée unique pour toutes les
   * sources du compte.
   *
   * `sources` vide = toutes les sources. `offset` est l'unique curseur : la
   * pagination est globale, donc partagée par toutes les sources, ce qui
   * suppose que la source d'un OFFSET suive `nextOffset` de la réponse.
   */
  searchIndex: (params: {
    limit: number;
    offset: number;
    query: string;
    sources: string[];
  }) => {
    const query = new URLSearchParams({
      limit: String(params.limit),
      offset: String(params.offset),
      q: params.query,
    });
    if (params.sources.length > 0) {
      query.set("sources", params.sources.join(","));
    }
    return apiUrl(`/api/recherche?${query.toString()}`);
  },
  /** Skills de l'utilisateur — ouvert à tous les forfaits. */
  skills: () => apiUrl("/api/skills"),
  /**
   * Statistiques de consommation. La query string est déjà construite par
   * `buildStatsQueryString` (lib/stats/stats-types.ts) : la page ne l'assemble
   * pas à la main, sinon les deux côtés divergeraient sur le nom des filtres.
   */
  stats: (queryString: string) =>
    apiUrl(`/api/stats${queryString ? `?${queryString}` : ""}`),
} as const;
