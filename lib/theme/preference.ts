// Préférence de thème partagée par toute la suite mAI.
//
// Pourquoi ce module : mAI (next-themes), Vibe (son propre contexte), le Site et
// Wakies doivent lire la MÊME décision. La valeur vit dans
// `user_preferences.theme` ; chaque surface l'applique localement, et toute
// écriture passe par `saveThemePreference`. Une valeur illisible vaut
// « system », comme un tier illisible vaut free : jamais de thème fantôme
// persisté puis rejoué.
//
// Client-safe volontairement : aucun import server-only ici (le module est
// appelé par des composants « use client » et par la validation de la route).

import { apiEndpoints } from "@/lib/client/api-endpoints";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

export function normalizeThemePreference(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : "system";
}

/**
 * Lit la préférence partagée. `null` si l'API est indisponible ou si la
 * session n'est pas authentifiée — l'appelant garde alors son thème local.
 */
export async function loadThemePreference(): Promise<ThemePreference | null> {
  try {
    const response = await fetch(apiEndpoints.userPreferences(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { theme?: unknown };
    return isThemePreference(data.theme) ? data.theme : null;
  } catch {
    return null;
  }
}

/**
 * Écrit la préférence partagée. Meilleur effort : un échec réseau ne doit
 * jamais bloquer le changement de thème local — on journalise, on continue.
 */
export function saveThemePreference(theme: ThemePreference): void {
  void fetch(apiEndpoints.userPreferences(), {
    body: JSON.stringify({ theme }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch((error) => {
    console.warn(
      "[theme] Préférence partagée non enregistrée :",
      error instanceof Error ? error.message : error
    );
  });
}
