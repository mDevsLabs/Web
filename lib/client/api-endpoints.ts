// Endpoints API centralisés : une seule source pour la construction des URLs
// côté client (préfixe NEXT_PUBLIC_BASE_PATH lu une fois). Les composants et
// hooks n'assemblent plus jamais de chemins à la main — un renommage de route
// ou un changement de base path ne touche que ce module.

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiUrl(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export const apiEndpoints = {
  /** Navigation SPA vers une conversation (history.pushState). */
  chatPath: (chatId: string) => `${BASE_PATH}/chat/${chatId}`,

  chatById: (chatId: string) => apiUrl(`/api/chats/${chatId}`),
  chatExport: (chatId: string, format: "html" | "md" = "md") =>
    apiUrl(`/api/chats/${chatId}/export?format=${format}`),
  chatStream: (chatId: string) => apiUrl(`/api/chat/${chatId}/stream`),

  document: (documentId: string) => apiUrl(`/api/document?id=${documentId}`),

  agentFlags: () => apiUrl("/api/agent/flags"),
  agentModels: () => apiUrl("/api/models"),
  agentRunsForChat: (chatId: string) =>
    apiUrl(`/api/agent/runs?chatId=${chatId}`),
  agentRunById: (runId: string) => apiUrl(`/api/agent/runs/${runId}`),
  agentRunUserInput: (runId: string) =>
    apiUrl(`/api/agent/runs/${runId}/user-input`),
  agentRunSuggestedAction: (runId: string) =>
    apiUrl(`/api/agent/runs/${runId}/suggested-action`),
  agentSettings: () => apiUrl("/api/agent/settings"),

  messagesForChat: (chatId: string) =>
    apiUrl(`/api/messages?chatId=${chatId}`),

  models: () => apiUrl("/api/models"),

  fileUpload: () => apiUrl("/api/files/upload"),
} as const;
