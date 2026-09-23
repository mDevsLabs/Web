// Endpoints API centralisés : une seule source pour la construction des URLs
// côté client (préfixe NEXT_PUBLIC_BASE_PATH lu une fois). Les composants et
// hooks n'assemblent plus jamais de chemins à la main — un renommage de route
// ou un changement de base path ne touche que ce module.

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiUrl(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export const apiEndpoints = {
  agentFlags: () => apiUrl("/api/agent/flags"),
  agentModels: () => apiUrl("/api/models"),
  agentRunById: (runId: string) => apiUrl(`/api/agent/runs/${runId}`),
  agentRunSuggestedAction: (runId: string) =>
    apiUrl(`/api/agent/runs/${runId}/suggested-action`),
  agentRunsForChat: (chatId: string) =>
    apiUrl(`/api/agent/runs?chatId=${chatId}`),
  agentRunUserInput: (runId: string) =>
    apiUrl(`/api/agent/runs/${runId}/user-input`),
  agentSettings: () => apiUrl("/api/agent/settings"),

  chatById: (chatId: string) => apiUrl(`/api/chats/${chatId}`),
  chatExport: (chatId: string, format: "html" | "md" = "md") =>
    apiUrl(`/api/chats/${chatId}/export?format=${format}`),
  /** Navigation SPA vers une conversation (history.pushState). */
  chatPath: (chatId: string) => `${BASE_PATH}/chat/${chatId}`,
  chatStream: (chatId: string) => apiUrl(`/api/chat/${chatId}/stream`),

  document: (documentId: string) => apiUrl(`/api/document?id=${documentId}`),

  fileUpload: () => apiUrl("/api/files/upload"),

  messagesForChat: (chatId: string) => apiUrl(`/api/messages?chatId=${chatId}`),

  models: () => apiUrl("/api/models"),
} as const;
