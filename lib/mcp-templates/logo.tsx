"use client";

import { useState } from "react";
import { PluginIcon } from "@/lib/plugins/icon";
import type { McpTemplateManifest } from "./types";

// Vrai logo du service (assets réels dans public/mcp/<id>.svg, source
// Simple Icons — licence CC0, utilisable librement). Correspondance
// identifiant → fichier, établie une fois pour toutes :
//
//   brave-search → /mcp/brave-search.svg   (Brave)
//   github       → /mcp/github.svg         (GitHub)
//   linear       → /mcp/linear.svg         (Linear)
//   notion       → /mcp/notion.svg         (Notion)
//   sentry       → /mcp/sentry.svg         (Sentry)
//   slack        → /mcp/slack.svg          (Slack)
//   stripe       → /mcp/stripe.svg         (Stripe)
//   supabase     → /mcp/supabase.svg       (Supabase)
//
// Aucun logo n'est inventé : si un asset manque (nouveau template), le composant
// retombe sur l'icône lucide déclarée par le manifeste (jamais le logo d'un
// autre service). Le fill #000 est recoloré par CSS (currentColor) pour rester
// lisible en thème clair et sombre.

export const MCP_LOGO_BASE = "/mcp";

export function mcpLogoSrc(templateId: string): string {
  return `${MCP_LOGO_BASE}/${templateId}.svg`;
}

export function McpTemplateLogo({
  className,
  manifest,
}: {
  className?: string;
  manifest: Pick<McpTemplateManifest, "icon" | "id" | "name">;
}) {
  const [logoMissing, setLogoMissing] = useState(false);

  if (logoMissing) {
    // Repli honnête : icône générique du manifeste, jamais un logo d'un autre
    // service. L'inventaire identifiant → fichier reste la référence.
    return <PluginIcon className={className} icon={manifest.icon} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`Logo ${manifest.name}`}
      className={className}
      onError={() => setLogoMissing(true)}
      src={mcpLogoSrc(manifest.id)}
    />
  );
}
