"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Le Site suit le thème de l'hôte.
 *
 * Le gabarit rend en clair (SSR, il ne connaît pas la préférence) ; au montage,
 * la racine reçoit `dark` et le `data-md-theme` correspondant dès que le thème
 * est résolu. Deux conséquences voulues :
 *
 *  - les styles propres au Site basculent par `.site-root.dark` (règles tenues
 *    dans `apps/site/app/globals.css`, régénérées dans `site.css`) ;
 *  - les composants `@mdevs/ui`, qui lisent `data-md-theme` sur la racine
 *    `.md-root`, prennent leurs jetons sombres — c'est la même racine.
 *
 * Aucun état parallèle : `html.dark` de next-themes reste l'unique décision,
 * et la préférence de thème partagée du compte l'alimente (voir
 * `components/common/theme-preference-sync.tsx`).
 */
export function SiteThemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.querySelector(".site-root");
    if (!root) return;
    const sombre = resolvedTheme === "dark";
    root.classList.toggle("dark", sombre);
    root.setAttribute("data-md-theme", sombre ? "dark" : "light");
  }, [resolvedTheme]);

  return null;
}
