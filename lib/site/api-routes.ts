/**
 * Routes de l'API Site officielles (montées sous /api/site/...).
 * Centralise les chemins pour éviter les divergences entre composants clients et handlers BFF.
 */

export const SITE_API_ROUTES = {
  // Exécuteur de requêtes API
  apiExecutor: "/api/site/account/api-executor",
  device: (id: string) => `/api/site/v1/devices/${encodeURIComponent(id)}`,

  // Appareils connectés
  devices: "/api/site/v1/devices",
  devicesOthers: "/api/site/v1/devices/others",
  devKey: (id: string) => `/api/site/dev-keys/${encodeURIComponent(id)}`,
  // Clés API de développement
  devKeys: "/api/site/dev-keys",

  // GitHub BFF
  githubActivity: (repo?: string) =>
    repo
      ? `/api/site/github/activity?repo=${encodeURIComponent(repo)}`
      : "/api/site/github/activity",
  githubReleases: (repo: string, showPreRelease = false) =>
    `/api/site/github/releases?repo=${encodeURIComponent(repo)}${
      showPreRelease ? "&pre=true" : ""
    }`,
  githubStats: (repo: string) =>
    `/api/site/github/stats?repo=${encodeURIComponent(repo)}`,

  // Modèles
  models: "/api/site/v1/models",
  modelsAudio: "/api/site/v1/models/audio",
  modelsImages: "/api/site/v1/models/images",
  modelsMai: "/api/site/v1/models/mai",

  // Statut des services
  status: "/api/site/v1/status",

  // Support
  supportUpload: "/api/site/support/upload",
} as const;
