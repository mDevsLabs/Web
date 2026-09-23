import { isNativeToolId } from "@/lib/ai/tools/ids";
import {
  PLUGIN_CATALOG_VERSION,
  PLUGIN_CATEGORIES,
  PLUGIN_MANIFESTS,
} from "./catalog.generated";
import type {
  PluginCatalogEntry,
  PluginCategory,
  PluginManifest,
} from "./types";

export { PLUGIN_CATALOG_VERSION, PLUGIN_CATEGORIES };

export const PLUGIN_MANIFEST_LIST: PluginManifest[] = [
  ...PLUGIN_MANIFESTS,
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

export const PLUGIN_TOOL_IDS: string[] = PLUGIN_MANIFEST_LIST.flatMap((plugin) =>
  plugin.tools.map((tool) => tool.id)
);

// Ids fournis par un plugin et absents du registre natif : eux seuls peuvent
// être retirés quand le plugin n'est pas installé/activé. Un identifiant
// implémenté nativement n'est jamais filtré, et la validation interdit à un
// plugin de réutiliser un tel identifiant (scripts/validate-plugins.ts).
export const PLUGIN_ONLY_TOOL_IDS: string[] = PLUGIN_TOOL_IDS.filter(
  (toolId) => !isNativeToolId(toolId)
);

const PLUGIN_ONLY_TOOL_ID_SET: ReadonlySet<string> = new Set(
  PLUGIN_ONLY_TOOL_IDS
);

export function isPluginOnlyToolId(toolId: string): boolean {
  return PLUGIN_ONLY_TOOL_ID_SET.has(toolId);
}

export function getPluginManifest(
  pluginId: string
): PluginManifest | undefined {
  return PLUGIN_MANIFEST_LIST.find((p) => p.id === pluginId);
}

export function getPluginByToolId(toolId: string): PluginManifest | undefined {
  return PLUGIN_MANIFEST_LIST.find((plugin) =>
    plugin.tools.some((tool) => tool.id === toolId)
  );
}

export function isPluginToolId(toolId: string): boolean {
  return PLUGIN_TOOL_IDS.includes(toolId);
}

export function getPluginCategory(
  categoryId: string
): PluginCategory | undefined {
  return PLUGIN_CATEGORIES.find((c) => c.id === categoryId);
}

export function getCategoryLabel(categoryId: string): string {
  return getPluginCategory(categoryId)?.label ?? "Autres";
}

// Recherche utilisée par la page Plugins : nom, description, tags, catégorie
// et nom d'outil.
export function matchesPluginQuery(
  plugin: PluginManifest,
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [
    plugin.name,
    plugin.description,
    plugin.id,
    ...plugin.tools.flatMap((tool) => [tool.label, tool.description]),
    getCategoryLabel(plugin.category),
    ...plugin.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterPlugins<T extends PluginManifest>(
  plugins: T[],
  rawQuery: string,
  categoryId: string | null
): T[] {
  return plugins.filter(
    (p) =>
      (!categoryId || p.category === categoryId) &&
      matchesPluginQuery(p, rawQuery)
  );
}

export type PluginInstallationLite = {
  pluginId: string;
  version: string | null;
  isEnabled: boolean;
};

// Fusionne le catalogue statique avec l'état d'installation de l'utilisateur.
export function buildCatalogEntries(
  installations: PluginInstallationLite[]
): PluginCatalogEntry[] {
  const byId = new Map(installations.map((i) => [i.pluginId, i]));
  return PLUGIN_MANIFEST_LIST.map((manifest) => {
    const installation = byId.get(manifest.id);
    return {
      ...manifest,
      enabled: installation?.isEnabled ?? false,
      installed: Boolean(installation),
      installedVersion: installation?.version ?? null,
      updateAvailable: Boolean(
        installation?.version && installation.version !== manifest.version
      ),
    };
  });
}
