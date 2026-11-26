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

const ANON_PREF_CACHE_KEY = "mai_theme_pref_anon_until";
const ANON_PREF_CACHE_MS = 10 * 60_000;

function stripBasePath(pathname: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || "/";
  }
  return pathname;
}

function clearAnonThemeCache(): void {
  try {
    window.sessionStorage.removeItem(ANON_PREF_CACHE_KEY);
  } catch {
    // sessionStorage indisponible (navigation privée stricte, sandbox).
  }
}

function shouldSkipThemeFetch(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  const route = stripBasePath(window.location.pathname);
  // Sur les écrans purement publics ou d'authentification, inutile de lancer
  // une requête 401 vers Vercel/Neon à chaque chargement.
  if (
    route === "/login" ||
    route.startsWith("/login/") ||
    route === "/register" ||
    route.startsWith("/register/")
  ) {
    clearAnonThemeCache();
    return true;
  }
  if (route === "/maintenance" || route.startsWith("/maintenance/")) {
    return true;
  }
  try {
    const raw = window.sessionStorage.getItem(ANON_PREF_CACHE_KEY);
    if (raw && Number(raw) > Date.now()) {
      return true;
    }
  } catch {
    // sessionStorage indisponible.
  }
  return false;
}

/**
 * Lit la préférence partagée. `null` si l'API est indisponible ou si la
 * session n'est pas authentifiée — l'appelant garde alors son thème local.
 */
export async function loadThemePreference(): Promise<ThemePreference | null> {
  if (shouldSkipThemeFetch()) {
    return null;
  }
  try {
    const response = await fetch(apiEndpoints.userPreferences(), {
      headers: { Accept: "application/json" },
    });
    if (response.status === 401) {
      try {
        window.sessionStorage.setItem(
          ANON_PREF_CACHE_KEY,
          String(Date.now() + ANON_PREF_CACHE_MS)
        );
      } catch {
        // sessionStorage indisponible.
      }
      return null;
    }
    if (!response.ok) {
      return null;
    }
    clearAnonThemeCache();
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
  if (typeof window !== "undefined") {
    clearAnonThemeCache();
  }
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
