/**
 * Routes de l'API Site officielles (montées sous /api/site/...).
 * Centralise les chemins pour éviter les divergences entre composants clients et handlers BFF.
 */

export const SITE_API_ROUTES = {
  device: (id: string) => `/api/site/v1/devices/${encodeURIComponent(id)}`,

  // Appareils connectés
  devices: "/api/site/v1/devices",
  devicesOthers: "/api/site/v1/devices/others",

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

  // Statut des services
  status: "/api/site/v1/status",

  // Support
  supportUpload: "/api/site/support/upload",
} as const;
