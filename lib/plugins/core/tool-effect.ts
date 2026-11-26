import type { PluginManifest, PluginToolManifest } from "./types";

/**
 * Effet réel d'un outil de plugin : la seule question qui vaille pour décider où
 * il peut s'exécuter.
 *
 * Le manifeste d'un plugin ne déclare ses permissions qu'une fois, pour tous ses
 * outils, alors qu'un connecteur comme Google Agenda lit le calendrier ET y
 * écrit. Cette fonction est le seul endroit où la règle est écrite : `server.ts`
 * s'en sert pour filtrer les canaux, le menu `@` pour ne proposer que la lecture
 * en Chat, et l'adaptateur Agent pour annoncer les écritures à approuver.
 */

export type PluginToolEffect = "read" | "write";

export function toolEffect(
  manifest: PluginManifest,
  tool: PluginToolManifest
): PluginToolEffect {
  if (tool.effect) {
    return tool.effect;
  }
  // À défaut de déclaration, on reprend les permissions du plugin : un plugin
  // qui écrit quelque part est présumé écrire partout. Les quinze plugins
  // historiques sont en lecture pure, ils basculent donc tous sur "read".
  return manifest.permissions.writesUserData ||
    manifest.permissions.requiresApproval
    ? "write"
    : "read";
}

export function readToolIds(manifest: PluginManifest): string[] {
  return manifest.tools
    .filter((tool) => toolEffect(manifest, tool) === "read")
    .map((tool) => tool.id);
}

export function writeToolIds(manifest: PluginManifest): string[] {
  return manifest.tools
    .filter((tool) => toolEffect(manifest, tool) === "write")
    .map((tool) => tool.id);
}

export function hasReadTool(manifest: PluginManifest): boolean {
  return manifest.tools.some((tool) => toolEffect(manifest, tool) === "read");
}
