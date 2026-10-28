"use client";

import { WrenchIcon } from "@mdevs/icons";
import { useState } from "react";
import { getPluginByToolId } from "@/lib/plugins/catalog";
import { cn } from "@/lib/utils";
import {
  getIntegrationByPluginId,
  getIntegrationProvider,
  type IntegrationDescriptor,
} from "./providers";

/**
 * Logos des connecteurs externes — assets réels dans `public/plugins/<id>.svg`.
 *
 * Deux renduS, parce que deux natures de marque :
 *
 *  - `monochrome: false` (Google, Slack, Discord, Docs) : `<img>` nu, en
 *    couleurs de marque. Surtout pas le `dark:invert` des logos MCP : inverser
 *    un logo multicolore détruit ses couleurs.
 *  - `monochrome: true` (GitHub, Notion) : le repère officiel n'existe qu'en
 *    noir, invisible sur un fond sombre. Il est rendu par **CSS mask +
 *    `currentColor`** (`.integration-logo`, `app/globals.css`), donc il suit le
 *    thème sans variante `dark:` et sans seconde copie du fichier — ce qui le
 *    rend aussi utilisable tel quel dans Wakies, qui n'a pas de thème sombre.
 *
 * Aucun logo n'est inventé : si l'asset manque, on retombe sur l'icône générique
 * d'outil, jamais sur le logo d'un autre service.
 */

export const INTEGRATION_LOGO_BASE = "/plugins";

export function integrationLogoSrc(providerId: string): string {
  const logoPath = getIntegrationProvider(providerId)?.logoPath;
  if (logoPath?.startsWith("/")) {
    return logoPath;
  }
  return `${INTEGRATION_LOGO_BASE}/${providerId}.svg`;
}

/** Le connecteur qui livre cet outil, s'il en est issu. */
export function integrationForToolId(
  toolId: string
): IntegrationDescriptor | undefined {
  const manifest = getPluginByToolId(toolId);
  return manifest ? getIntegrationByPluginId(manifest.id) : undefined;
}

export function IntegrationLogo({
  className,
  descriptor,
}: {
  className?: string;
  descriptor: IntegrationDescriptor;
}) {
  const [logoMissing, setLogoMissing] = useState(false);
  const src = integrationLogoSrc(descriptor.id);

  if (logoMissing) {
    return <WrenchIcon className={cn("shrink-0", className)} />;
  }

  if (descriptor.monochrome) {
    // Un `<span>` ne peut pas échouer au chargement : c'est le test
    // d'inventaire (`tests/unit/integration-logo-inventory.test.ts`) qui
    // garantit que le fichier existe, pas ce composant.
    return (
      <span
        aria-hidden
        className={cn("integration-logo shrink-0", className)}
        style={{
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`Logo ${descriptor.label}`}
      className={cn("shrink-0 object-contain", className)}
      onError={() => setLogoMissing(true)}
      src={src}
    />
  );
}

/**
 * Badge d'un outil du fil de conversation : le logo de l'application qui a
 * réellement répondu, ou l'icône d'outil hors connecteur.
 */
export function PluginToolLogo({
  className,
  toolId,
}: {
  className?: string;
  toolId: string;
}) {
  const descriptor = integrationForToolId(toolId);
  if (!descriptor) {
    return <WrenchIcon className={cn("size-4 shrink-0", className)} />;
  }
  return (
    <IntegrationLogo
      className={cn("size-4", className)}
      descriptor={descriptor}
    />
  );
}
