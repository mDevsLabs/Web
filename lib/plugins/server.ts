import "server-only";

import type { Tool } from "ai";
import { PLUGIN_MANIFEST_LIST } from "./catalog";
import { PLUGIN_DEFINITIONS } from "./server.generated";
import type { PluginDefinition, PluginToolDeps } from "./types";

export const PLUGIN_DEFINITION_LIST: PluginDefinition[] = PLUGIN_DEFINITIONS;

export function getPluginDefinition(
  pluginId: string
): PluginDefinition | undefined {
  return PLUGIN_DEFINITION_LIST.find((d) => d.manifest.id === pluginId);
}

export function getPluginDefinitionByToolId(
  toolId: string
): PluginDefinition | undefined {
  return PLUGIN_DEFINITION_LIST.find((definition) =>
    definition.manifest.tools.some((tool) => tool.id === toolId)
  );
}

export function getPluginIdForToolId(toolId: string): string | undefined {
  return getPluginDefinitionByToolId(toolId)?.manifest.id;
}

export function isKnownPluginToolId(toolId: string): boolean {
  return PLUGIN_DEFINITION_LIST.some((definition) =>
    definition.manifest.tools.some((tool) => tool.id === toolId)
  );
}

// Tous les hints de plugins, indexés par identifiant d'outil : fusionnés avec
// TOOL_SYSTEM_HINTS au moment de construire l'addendum de prompt.
export function getPluginSystemHints(): Record<string, string> {
  const hints: Record<string, string> = {};
  for (const definition of PLUGIN_DEFINITION_LIST) {
    for (const manifestTool of definition.manifest.tools) {
      hints[manifestTool.id] = manifestTool.systemHint;
    }
  }
  return hints;
}

export function getPluginToolIds(): string[] {
  return PLUGIN_MANIFEST_LIST.flatMap((plugin) =>
    plugin.tools.map((tool) => tool.id)
  );
}

// Convertit une liste d'identifiants de plugins en identifiants d'outils IA
// (utilisés par `activeTools` de streamText et par les mentions @).
export function getToolIdsForPluginIds(pluginIds: string[]): string[] {
  const allowed = new Set(pluginIds);
  return PLUGIN_DEFINITION_LIST.filter((definition) =>
    allowed.has(definition.manifest.id)
  ).flatMap((definition) =>
    definition.manifest.tools.map((tool) => tool.id)
  );
}

// Instancie les outils des plugins autorisés. `pluginIds` vide/absent = tous
// les plugins du catalogue (usage interne/tests).
export function createPluginTools(
  deps: PluginToolDeps,
  pluginIds?: string[]
): Record<string, Tool> {
  const allowed = pluginIds ? new Set(pluginIds) : null;
  const tools: Record<string, Tool> = {};
  for (const definition of PLUGIN_DEFINITION_LIST) {
    if (allowed && !allowed.has(definition.manifest.id)) {
      continue;
    }
    const created = definition.createTools(deps);
    for (const manifestTool of definition.manifest.tools) {
      const implementation = created[manifestTool.id];
      if (!implementation) {
        throw new Error(
          `Le plugin « ${definition.manifest.id} » ne fournit pas l'outil « ${manifestTool.id} ».`
        );
      }
      tools[manifestTool.id] = implementation;
    }
  }
  return tools;
}
