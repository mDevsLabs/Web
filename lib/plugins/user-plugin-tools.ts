import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { defineTool, toRegisteredTool } from "@/lib/agent/tools/define-tool";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import {
  listUserPlugins,
  readUserOauthResource,
} from "@/lib/plugins/user-plugin-store";

/**
 * Outil unique des plugins OAuth créés par le compte.
 * Un plugin MCP n'en a pas besoin : ses outils viennent du serveur MCP lié.
 * Ici, seule une lecture GET vers l'hôte déclaré est possible.
 */

const inputSchema = z.object({
  path: z.string().min(1).max(300),
  pluginId: z.string().uuid(),
  query: z.record(z.string(), z.string().max(200)).optional(),
});

async function enabledOauth(userId: string) {
  const plugins = await listUserPlugins(userId);
  return plugins.filter(
    (plugin) => plugin.kind === "oauth" && plugin.isEnabled
  );
}

export async function customPluginChatTools(userId: string) {
  const plugins = await enabledOauth(userId);
  if (plugins.length === 0) {
    return { addendum: "", ids: [] as string[], tools: {} };
  }
  const names = plugins
    .map((plugin) => `${plugin.name} (${plugin.id})`)
    .join(", ");
  return {
    addendum: `Plugins OAuth personnels, lecture seule : ${names}. Utilise readCustomPlugin avec le pluginId et un chemin GET relatif à l'URL d'API du plugin.`,
    ids: ["readCustomPlugin"],
    tools: {
      readCustomPlugin: tool({
        description: `Lit en GET une ressource d'un plugin OAuth personnel. Plugins disponibles : ${names}.`,
        execute: async ({ path, pluginId, query }) =>
          readUserOauthResource({ path, pluginId, query, userId }),
        inputSchema,
      }),
    },
  };
}

export async function listCustomPluginAgentTools(userId: string) {
  const plugins = await enabledOauth(userId);
  if (plugins.length === 0) {
    return [];
  }
  const names = plugins
    .map((plugin) => `${plugin.name} (${plugin.id})`)
    .join(", ");
  const agentTool = defineTool<z.infer<typeof inputSchema>>({
    availability: {
      categories: ["plugins"],
      requires: { tools: true },
      tiers: "all",
    },
    category: "plugins",
    description: `Lecture GET d'un plugin OAuth personnel. Plugins : ${names}.`,
    execute: async (input) => {
      const output = await readUserOauthResource({
        path: input.path,
        pluginId: input.pluginId,
        query: input.query,
        userId,
      });
      if (output && typeof output === "object" && "error" in output) {
        return toolFailure("tool_failed", String(output.error), {
          category: "permanent",
          retryable: false,
        });
      }
      const source =
        output &&
        typeof output === "object" &&
        "source" in output &&
        output.source &&
        typeof output.source === "object" &&
        "url" in output.source &&
        typeof output.source.url === "string"
          ? [
              {
                id: `custom-${input.pluginId}`,
                kind: "plugin" as const,
                title:
                  "title" in output.source &&
                  typeof output.source.title === "string"
                    ? output.source.title
                    : "Plugin",
                url: output.source.url,
              },
            ]
          : [];
      return toolSuccess(output, source);
    },
    id: "readCustomPlugin",
    name: "Lire un plugin personnel",
    permissions: { default: "auto", impact: "read", readOnly: true },
    schema: inputSchema,
    source: "plugin",
  });
  return [toRegisteredTool(agentTool)];
}
