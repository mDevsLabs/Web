"use client";

/**
 * ============================================================================
 * Fournisseur de thème des primitives `@mdevs/ui`
 * ============================================================================
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Les composants de la conversation (composer, carte d'accord, dialogue de
 * personnalisation, sélecteur de modèle) sont construits sur les primitives
 * `@mdevs/ui`, qui lisent leurs tokens `--md-*`. Sans fournisseur, ces
 * composants héritent de `--md-*` du `:root` global posé par `styles.css`,
 * mais les portails (`document.body`) et les surfaces imbriquées n'ont plus de
 * garantie de contexte — d'où un composant qui change d'apparence selon où il
 * est monté.
 *
 * LE THÈME VIENT DE L'HÔTE, JAMAIS DU SYSTÈME
 *
 * `styles.css` associe les tokens sombres à `.md-root[data-md-theme="dark"]` et
 * à un bloc `prefers-color-scheme: dark` qui cible `:root`. Avec `"system"`,
 * un système d'exploitation en mode sombre repeindrait Wakies en sombre alors
 * que l'utilisateur a choisi le thème clair dans mAI — et l'inverse est tout
 * aussi faux. `resolvedTheme` est le thème **résolu** par next-themes, c'est-à-
 * dire la préférence mAI (partagée par le compte) déjà appliquée au chat :
 * Wakies suit donc l'application qui l'héberge, sans état parallèle. La couche
 * sombre des surfaces propres à Wakies est décrite en fin de
 * `components/wakies/wakies-host.css`.
 *
 * CE QUE CE FOURNISSEUR NE FAIT PAS
 *
 * Il n'impose pas de fond de page (`AGENTS.md` du paquet) : `.wakies-root`
 * reste le porteur du fond et de la hauteur. Il ne touche pas non plus à la
 * navigation, qui appartient à la coquille.
 */

import { ThemeProvider } from "@mdevs/ui/primitives/theme-provider";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

export function WakiesThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  // À SSR, `resolvedTheme` est encore indécis : le rendu initial reste clair,
  // conformement au gabarit, et l'attribut bascule dès l'hydratation.
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <ThemeProvider className="h-full" theme={theme}>
      {children}
    </ThemeProvider>
  );
}
