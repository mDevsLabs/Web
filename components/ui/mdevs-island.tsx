"use client";

import { ThemeProvider } from "@mdevs/ui/primitives/theme-provider";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

/**
 * Porte la variante achromatique du paquet (`chatgpt`, sans verre) sans
 * envelopper le shell du chat. `.md-root` annule les marges des titres et
 * des paragraphes de tout son sous-arbre : `display: contents` évite une
 * boîte de layout, les jetons restent hérités.
 */
export function MdevsIsland({ children }: { children: ReactNode }) {
  const theme = useMdevsTheme();

  return (
    <ThemeProvider
      className="contents"
      glass={false}
      theme={theme}
      variant="chatgpt"
    >
      {children}
    </ThemeProvider>
  );
}

export function useMdevsTheme(): "light" | "dark" {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? "dark" : "light";
}

/** À poser sur un nœud déjà positionné (dialogue, menu, infobulle). */
export function mdevsScopeProps(theme: "light" | "dark") {
  return {
    "data-md-glass": "off" as const,
    "data-md-theme": theme,
    "data-md-variant": "chatgpt" as const,
  };
}
