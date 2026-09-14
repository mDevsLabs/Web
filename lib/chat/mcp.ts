import { getMcpServersByUserId, updateMcpServerSync } from "@/lib/db/queries";
import { createMcpChatTools } from "@/lib/mcp/chat-tools";
import { fetchMcpTools, getFilteredTools } from "@/lib/mcp/client";
import {
  loadMcpSecretDescriptors,
  mergeMcpSecrets,
} from "@/lib/mcp/secrets-config";

export type McpContext = {
  userMcpServers: Awaited<ReturnType<typeof getMcpServersByUserId>>;
  mcpTools: Record<string, any>;
  mcpToolKeys: string[];
  hasMcpEnabled: boolean;
  mcpAddendum: string;
};

export async function loadMcpContext(params: {
  userId: string;
  chatId: string;
  isToolApprovalFlow: boolean;
  messages: any[] | null;
  skillMcpServerIds: string[];
  skillMcpToolFilter: Record<string, string[] | null> | null;
  requestedTools: string[];
}): Promise<McpContext> {
  const {
    userId,
    chatId,
    isToolApprovalFlow,
    messages,
    skillMcpServerIds,
    skillMcpToolFilter,
    requestedTools,
  } = params;

  // Charger les serveurs MCP de l'utilisateur et auto-découvrir les outils si toolsCache est vide
  const userMcpServers = await getMcpServersByUserId({ userId }).catch(
    () => []
  );

  // Auto-découverte à chaud si un serveur activé n'a pas encore son toolsCache
  for (const server of userMcpServers) {
    if (
      server.isEnabled &&
      (!server.toolsCache || (server.toolsCache as any[]).length === 0)
    ) {
      try {
        const discoveredTools = await fetchMcpTools(server as any);
        if (discoveredTools && discoveredTools.length > 0) {
          server.toolsCache = discoveredTools as any;
          await updateMcpServerSync({
            id: server.id,
            success: true,
            toolsCache: discoveredTools,
            userId,
          }).catch(() => {});
        }
      } catch (syncErr) {
        console.error(
          `Auto-découverte outils MCP échouée pour ${server.name}:`,
          syncErr
        );
      }
    }
  }

  // Secrets chiffrés : déchiffrés ici (serveur uniquement) et fusionnés dans la
  // configuration d'appel. C'est le seul chemin par lequel un token atteint le
  // serveur MCP : jamais depuis le client, jamais depuis la ligne McpServer.
  for (const server of userMcpServers) {
    if (!server.isEnabled) {
      continue;
    }
    const secrets = await loadMcpSecretDescriptors({
      serverId: server.id,
      userId,
    });
    if (secrets.length === 0) {
      continue;
    }
    const merged = mergeMcpSecrets({
      authConfig: server.authConfig,
      authType: server.authType,
      env: server.env,
      headers: server.headers,
      secrets,
    });
    server.authConfig = merged.authConfig;
    server.env = merged.env;
    server.headers = merged.headers;
  }

  // Filtrage MCP par le skill actif : serveurs restreints à ses IDs +
  // whitelist d'outils par serveur (mcpToolFilter)
  const skillMcpActive = skillMcpServerIds.length > 0;
  let scopedMcpServers = userMcpServers;
  if (skillMcpActive) {
    scopedMcpServers = userMcpServers.filter(
      (s) => s.isEnabled && skillMcpServerIds.includes(s.id)
    );
    for (const server of scopedMcpServers) {
      const filter = skillMcpToolFilter?.[server.id] ?? null;
      if (Array.isArray(filter) && filter.length > 0) {
        server.toolsCache = getFilteredTools(server as any, filter) as any;
      }
    }
  }

  const approvedToolIds = new Set<string>();
  if (isToolApprovalFlow && messages) {
    for (const m of messages) {
      for (const p of (m.parts as any[]) ?? []) {
        if (
          (p.state === "approval-responded" ||
            p.state === "output-available") &&
          p.approval?.approved !== false
        ) {
          if (p.toolName) approvedToolIds.add(String(p.toolName));
          if (p.toolCallId) approvedToolIds.add(String(p.toolCallId));
          if (typeof p.type === "string" && p.type.startsWith("tool-")) {
            approvedToolIds.add(p.type.replace(/^tool-/, ""));
          }
        }
      }
    }
  }

  const mcpTools = createMcpChatTools({
    approvedToolIds,
    chatId,
    servers: scopedMcpServers,
    userId,
  });
  const mcpToolKeys = Object.keys(mcpTools);

  const hasMcpEnabled =
    skillMcpActive ||
    requestedTools.some(
      (t) => t === "mcp" || t.startsWith("mcp_") || t.startsWith("mcp:")
    );

  // Consigne explicite pour le modèle lorsque des outils MCP sont actifs
  let mcpAddendum = "";
  if (hasMcpEnabled && mcpToolKeys.length > 0) {
    const activeServerNames = userMcpServers
      .filter((s) => s.isEnabled)
      .map((s) => s.name)
      .join(", ");
    mcpAddendum = `Tu as accès à des outils externes connectés via le protocole MCP (${activeServerNames}). Outils MCP disponibles: ${mcpToolKeys.join(", ")}. Lorsque l'utilisateur demande une action ou une recherche (par exemple lister des commits, dépôts, pull requests GitHub, fichiers, etc.), tu DOIS appeler directement les outils MCP correspondants et ne JAMAIS affirmer que tu n'as pas accès à Git ou aux outils MCP.`;
  }

  return {
    hasMcpEnabled,
    mcpAddendum,
    mcpToolKeys,
    mcpTools,
    userMcpServers,
  };
}
