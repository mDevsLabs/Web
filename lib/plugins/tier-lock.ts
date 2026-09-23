import { type CanonicalTier, tierMeetsMinimum } from "@/lib/auth/plan";
import type { PluginCatalogEntry, PluginManifest } from "./types";

// Marque les plugins hors forfait : le serveur refuse leur installation et
// l'interface ne propose plus l'action (jamais de faux bouton actif). Une seule
// implémentation pour les deux routes /api/plugins.
export function withTierLock(
  entries: PluginCatalogEntry[],
  tier: string | null | undefined
): PluginCatalogEntry[] {
  return entries.map((entry) => ({
    ...entry,
    locked: !tierMeetsMinimum(tier, entry.minTier),
  }));
}

export function canUsePlugin(
  manifest: Pick<PluginManifest, "minTier">,
  tier: string | null | undefined
): boolean {
  return tierMeetsMinimum(tier, manifest.minTier as CanonicalTier);
}

export function pluginTierMessage(
  manifest: Pick<PluginManifest, "minTier" | "name">
): string {
  return `Le plugin « ${manifest.name} » nécessite le forfait ${manifest.minTier}.`;
}
