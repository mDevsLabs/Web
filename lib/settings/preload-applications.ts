"use client";

import { preload } from "swr";
import { fetcher } from "@/lib/utils";
import { ApiService } from "@/lib/vibe/services/api";

/** Clés SWR partagées par l'onglet Applications et son préchargement. */
export const VIBE_SETTINGS_KEY = "applications:vibe-settings";
export const VIBE_CIRCLE_KEY = "applications:vibe-circle";
export const WAKIES_SETTINGS_KEY = "/api/wakies/settings";

/**
 * Amorce les réglages des applications dès l'ouverture des paramètres, avant
 * que l'onglet soit affiché. Les clés sont celles que l'onglet relit.
 */
export function preloadApplicationSettings() {
  preload("/api/user/preferences", fetcher);
  preload("/api/models/speech", fetcher);
  preload("/api/blackline/settings", fetcher);
  preload("/api/quizzly/resume", fetcher);
  preload(VIBE_SETTINGS_KEY, () => ApiService.getSettings());
  preload(VIBE_CIRCLE_KEY, () => ApiService.getCircle());
  preload(WAKIES_SETTINGS_KEY, fetcher);
}
