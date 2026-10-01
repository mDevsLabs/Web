import {
  getMcpServersByUserId,
  getUserMcpPrefs,
  updateMcpServerSync,
} from "@/lib/db/queries";
import type { McpServer } from "@/lib/db/schema";
import { createMcpChatTools, mcpServerToConfig } from "@/lib/mcp/chat-tools";
import {
  fetchMcpTools,
  getFilteredTools,
  validateMcpConfig,
} from "@/lib/mcp/client";
import { toMcpRuntimePreferences } from "@/lib/mcp/policy";
import { redactMcpError, redactMcpText } from "@/lib/mcp/redaction";
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

function cloneServer(server: McpServer): McpServer {
  return {
    ...server,
    args: Array.isArray(server.args) ? [...(server.args as string[])] : [],
    authConfig:
      server.authConfig && typeof server.authConfig === "object"
        ? { ...(server.authConfig as Record<string, unknown>) }
        : {},
    env:
      server.env && typeof server.env === "object"
        ? { ...(server.env as Record<string, unknown>) }
        : {},
    headers:
      server.headers && typeof server.headers === "object"
        ? { ...(server.headers as Record<string, unknown>) }
        : {},
    toolOverrides:
      server.toolOverrides && typeof server.toolOverrides === "object"
        ? { ...(server.toolOverrides as Record<string, unknown>) }
        : {},
    toolsCache: Array.isArray(server.toolsCache)
      ? [...(server.toolsCache as unknown[])]
      : [],
  };
}

function withoutInlineSecrets(server: McpServer): McpServer {
  return {
    ...server,
    authConfig: {},
    env: {},
    headers: {},
  } as McpServer;
}

function publicServerList(
  servers: Awaited<ReturnType<typeof getMcpServersByUserId>>
): McpServer[] {
  return servers.map(withoutInlineSecrets);
}

function emptyContext(
  userMcpServers: Awaited<ReturnType<typeof getMcpServersByUserId>>
): McpContext {
  return {
    hasMcpEnabled: false,
    mcpAddendum: "",
    mcpToolKeys: [],
    mcpTools: {},
    userMcpServers: publicServerList(userMcpServers),
  };
}

function isMcpRequested(
  skillMcpServerIds: string[],
  requestedTools: string[],
  serverIds?: readonly string[] | null
): boolean {
  if (serverIds !== undefined && serverIds !== null) {
    return true;
  }
  return (
    skillMcpServerIds.length > 0 ||
    requestedTools.some(
      (tool) =>
        tool === "mcp" || tool.startsWith("mcp_") || tool.startsWith("mcp:")
    )
  );
}

export async function loadMcpContext(params: {
  userId: string;
  chatId: string;
  isToolApprovalFlow: boolean;
  messages: any[] | null;
  skillMcpServerIds: string[];
  skillMcpToolFilter: Record<string, string[] | null> | null;
  requestedTools: string[];
  serverIds?: readonly string[] | null;
}): Promise<McpContext> {
  const {
    userId,
    chatId,
    isToolApprovalFlow,
    messages,
    skillMcpServerIds,
    skillMcpToolFilter,
    requestedTools,
    serverIds,
  } = params;

  const wantsMcp = isMcpRequested(skillMcpServerIds, requestedTools, serverIds);
  // Ne touche ni aux secrets ni au réseau si le Chat n'a pas explicitement
  // demandé MCP. Le kill-switch est lu avant toute découverte.
  if (!wantsMcp) return emptyContext([]);
  if (serverIds !== undefined && serverIds !== null && serverIds.length === 0) {
    return emptyContext([]);
  }

  const allUserMcpServers = await getMcpServersByUserId({ userId }).catch(
    () => []
  );
  const userMcpServers =
    serverIds === undefined || serverIds === null
      ? allUserMcpServers
      : allUserMcpServers.filter((server) => serverIds.includes(server.id));
  let prefs: ReturnType<typeof toMcpRuntimePreferences>;
  try {
    const stored = await getUserMcpPrefs(userId);
    prefs = toMcpRuntimePreferences(stored);
    if (prefs.globalKillSwitch) return emptyContext(userMcpServers);
  } catch {
    // Fail closed : une panne de lecture des préférences ne doit pas
    // transformer une Chat en chemin d'accès MCP.
    return emptyContext(userMcpServers);
  }

  const enabledServers = userMcpServers.filter(
    (server) =>
      server.isEnabled &&
      !(server.transport === "stdio" && prefs?.allowStdio === false)
  );
  const runtimeServers: McpServer[] = [];

  for (const original of enabledServers) {
    const server = cloneServer(original);
    try {
      // Chargement AVANT toute découverte. Une erreur de lecture des secrets
      // est fail-closed : on ne tente pas une découverte sans authentification.
      const secrets = await loadMcpSecretDescriptors({
        serverId: server.id,
        userId,
      });
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

      const config = mcpServerToConfig(server);
      config.timeoutMs = server.timeoutMs ?? prefs.defaultTimeoutMs;
      config.rateLimitPerMin =
        server.rateLimitPerMin ?? prefs.defaultRateLimitPerMin;
      if (!server.toolsCache || (server.toolsCache as unknown[]).length === 0) {
        try {
          const discoveredTools = await fetchMcpTools(config, prefs);
          const safeTools = Array.isArray(discoveredTools)
            ? discoveredTools
            : [];
          server.toolsCache = safeTools as any;
          // La découverte est faite avec la configuration effective, mais la
          // ligne DB ne reçoit que le cache public des outils.
          original.toolsCache = safeTools as any;
          await updateMcpServerSync({
            id: server.id,
            success: true,
            toolsCache: safeTools,
            userId,
          }).catch(() => {});
        } catch (error: unknown) {
          // Pas de stack, URL, token ou corps amont dans les logs du Chat.
          console.warn(
            `[mcp] discovery_failed server=${server.id} reason=${redactMcpError(error, "unavailable")}`
          );
        }
      }
      // Même si le cache existait déjà, ne jamais exposer un outil avec une
      // configuration runtime invalide ou une auth manquante.
      validateMcpConfig(config);
      runtimeServers.push(server);
    } catch {
      // Ne pas exposer un serveur dont l'auth/les secrets ne peuvent pas être
      // lus. Le Chat continue simplement sans cet outil.
    }
  }

  // Filtrage MCP par le skill actif : serveurs restreints à ses IDs + whitelist
  // d'outils par serveur. Un tableau vide est une whitelist vide (fail-closed).
  const skillMcpActive = skillMcpServerIds.length > 0;
  let scopedMcpServers = runtimeServers;
  if (skillMcpActive) {
    scopedMcpServers = runtimeServers.filter((server) =>
      skillMcpServerIds.includes(server.id)
    );
    for (const server of scopedMcpServers) {
      const filter = skillMcpToolFilter?.[server.id];
      if (Array.isArray(filter)) {
        const config = mcpServerToConfig(server);
        server.toolsCache = getFilteredTools(config, filter) as any;
      }
    }
  }

  const approvedToolIds = new Set<string>();
  if (isToolApprovalFlow && messages) {
    for (const message of messages) {
      for (const part of (message.parts as any[]) ?? []) {
        if (
          (part.state === "approval-responded" ||
            part.state === "output-available") &&
          part.approval?.approved !== false
        ) {
          if (part.toolName && String(part.toolName).startsWith("mcp_")) {
            approvedToolIds.add(String(part.toolName));
          }
          if (part.toolCallId) approvedToolIds.add(String(part.toolCallId));
          if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            approvedToolIds.add(part.type.replace(/^tool-/, ""));
          }
        }
      }
    }
  }

  const mcpTools = createMcpChatTools({
    approvedToolIds,
    chatId,
    prefs,
    servers: scopedMcpServers,
    userId,
  });
  const mcpToolKeys = Object.keys(mcpTools);
  const hasMcpEnabled = mcpToolKeys.length > 0;

  let mcpAddendum = "";
  if (hasMcpEnabled) {
    const activeServerNames = [
      ...new Set(
        scopedMcpServers.map((server) => redactMcpText(server.name, 120))
      ),
    ].join(", ");
    mcpAddendum = `Tu as accès à des outils externes connectés via le protocole MCP (${activeServerNames}). Outils MCP disponibles: ${mcpToolKeys.join(", ")}. Lorsque l'utilisateur demande une action ou une recherche, tu DOIS appeler directement l'outil MCP correspondant et ne JAMAIS affirmer que tu n'as pas accès à cet outil.`;
  }

  return {
    hasMcpEnabled,
    mcpAddendum,
    mcpToolKeys,
    mcpTools,
    userMcpServers: publicServerList(userMcpServers),
  };
}
