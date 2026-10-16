"use client";

/**
 * Applique la préférence de thème PARTAGÉE (user_preferences.theme) au
 * next-themes local, une seule fois au montage.
 *
 * Pendant la session, le choix local reste maître (aucun re-render ne doit
 * ramener un thème serveur périmé au milieu d'un réglage) ; au chargement,
 * c'est le compte qui tranche : un utilisateur qui a choisi « sombre » sur un
 * autre appareil le retrouve ici. Site et Wakies suivent ensuite sans code
 * supplémentaire, puisqu'ils lisent la classe `dark` posée par next-themes sur
 * `<html>`.
 */

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { loadThemePreference } from "@/lib/theme/preference";

// Clé de stockage par défaut de next-themes (attribut `attribute="class"` dans
// app/layout.tsx) : lue pour trancher quand `theme` n'est pas encore résolu.
const NEXT_THEMES_STORAGE_KEY = "theme";

export function ThemePreferenceSync() {
  const { setTheme, theme } = useTheme();
  const themeRef = useRef(theme);
  const didSyncRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (didSyncRef.current) {
      return;
    }
    didSyncRef.current = true;

    let cancelled = false;
    void loadThemePreference().then((shared) => {
      if (cancelled || !shared) {
        return;
      }
      const current =
        themeRef.current ??
        window.localStorage.getItem(NEXT_THEMES_STORAGE_KEY) ??
        "system";
      if (shared !== current) {
        setTheme(shared);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  return null;
}
