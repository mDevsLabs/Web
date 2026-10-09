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
 * `theme="light"` EST CONTRACTUEL
 *
 * `styles.css` associe les tokens sombres à `.md-root[data-md-theme="dark"]` et
 * à un bloc `prefers-color-scheme: dark` qui cible `:root`. Avec `"system"`,
 * un système d'exploitation en mode sombre repeindrait Wakies en sombre — ce
 * que la règle n° 1 de `docs/3-wakies/AGENTS.md` interdit explicitement :
 * Wakies a son propre thème clair, sans variante sombre.
 *
 * CE QUE CE FOURNISSEUR NE FAIT PAS
 *
 * Il n'impose pas de fond de page (`AGENTS.md` du paquet) : `.wakies-root`
 * reste le porteur du fond et de la hauteur. Il ne touche pas non plus à la
 * navigation, qui appartient à la coquille.
 */

import { ThemeProvider } from "@mdevs/ui/primitives/theme-provider";
import type { ReactNode } from "react";

export function WakiesThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      className="h-full"
      // Verbe : le thème clair de Wakies, jamais `system`.
      theme="light"
    >
      {children}
    </ThemeProvider>
  );
}
