import { safeFetchText } from "@/lib/web/safe-fetch";
import { redactMcpText } from "./redaction";
import type {
  McpServerConfig,
  McpToolCallResult,
  McpToolDefinition,
} from "./types";

/**
 * Pont MCP HTTP intégré pour Brave Search et Slack.
 *
 * Permet d'installer et d'exécuter les modèles MCP `brave-search`
 * (`https://mcp.search.brave.com/mcp`) et `slack` (`https://mcp.slack.com/mcp`)
 * en transport HTTP standard avec leur jeton personnel chiffré, sans dépendre
 * d'une commande `npx` stdio ni d'un flux OAuth interactif bloquant.
 */

const BRAVE_MCP_URL = "https://mcp.search.brave.com/mcp";
const SLACK_MCP_URL = "https://mcp.slack.com/mcp";

const BRAVE_TOOLS: McpToolDefinition[] = [
  {
    description:
      "Recherche web Brave Search : pages web, titres, URLs et extraits pertinents.",
    inputSchema: {
      properties: {
        count: {
          description: "Nombre de résultats (1 à 20, défaut 10).",
          maximum: 20,
          minimum: 1,
          type: "number",
        },
        query: {
          description: "Requête de recherche web.",
          type: "string",
        },
      },
      required: ["query"],
      type: "object",
    },
    name: "brave_web_search",
  },
  {
    description: "Recherche d'actualités récentes via l'API Brave News Search.",
    inputSchema: {
      properties: {
        count: {
          description: "Nombre d'articles (1 à 20, défaut 10).",
          maximum: 20,
          minimum: 1,
          type: "number",
        },
        query: {
          description: "Sujet ou mots-clés d'actualité.",
          type: "string",
        },
      },
      required: ["query"],
      type: "object",
    },
    name: "brave_news_search",
  },
];

const SLACK_TOOLS: McpToolDefinition[] = [
  {
    description:
      "Liste les canaux publics et privés accessibles au bot dans l'espace de travail Slack.",
    inputSchema: {
      properties: {
        limit: {
          description: "Nombre maximum de canaux à retourner (1 à 100).",
          maximum: 100,
          minimum: 1,
          type: "number",
        },
      },
      type: "object",
    },
    name: "slack_list_channels",
  },
  {
    description: "Lit les derniers messages d'un canal Slack (channel_id).",
    inputSchema: {
      properties: {
        channel_id: {
          description: "Identifiant du canal Slack (ex: C01234567).",
          type: "string",
        },
        limit: {
          description: "Nombre de messages (1 à 50, défaut 20).",
          maximum: 50,
          minimum: 1,
          type: "number",
        },
      },
      required: ["channel_id"],
      type: "object",
    },
    name: "slack_get_channel_history",
  },
  {
    description: "Lit les réponses d'un fil de discussion Slack.",
    inputSchema: {
      properties: {
        channel_id: {
          description: "Identifiant du canal Slack.",
          type: "string",
        },
        thread_ts: {
          description: "Timestamp du message parent (ex: 1700000000.000100).",
          type: "string",
        },
      },
      required: ["channel_id", "thread_ts"],
      type: "object",
    },
    name: "slack_get_thread_replies",
  },
  {
    description:
      "Envoie un message dans un canal Slack (ou répond dans un fil via thread_ts).",
    inputSchema: {
      properties: {
        channel_id: {
          description: "Identifiant du canal Slack.",
          type: "string",
        },
        text: {
          description: "Texte du message à publier.",
          type: "string",
        },
        thread_ts: {
          description: "Timestamp optionnel du fil de discussion.",
          type: "string",
        },
      },
      required: ["channel_id", "text"],
      type: "object",
    },
    name: "slack_post_message",
  },
];

export type BuiltinMcpBridgeKind = "brave-search" | "slack";

export function resolveBuiltinHttpBridge(
  config: Pick<McpServerConfig, "url">
): BuiltinMcpBridgeKind | null {
  const rawUrl = config.url?.trim().replace(/\/+$/, "");
  if (!rawUrl) return null;
  if (rawUrl === BRAVE_MCP_URL) return "brave-search";
  if (rawUrl === SLACK_MCP_URL) return "slack";
  return null;
}

function resolveBearerOrEnvToken(
  config: McpServerConfig,
  envKey: string,
  headerKey?: string
): string {
  const auth = config.authConfig as Record<string, unknown> | undefined;
  const fromAuth = typeof auth?.token === "string" ? auth.token.trim() : "";
  if (fromAuth) return fromAuth;

  if (headerKey && config.headers) {
    for (const [k, v] of Object.entries(config.headers)) {
      if (k.toLowerCase() === headerKey.toLowerCase() && v.trim()) {
        return v.trim();
      }
    }
  }

  const fromEnv = config.env?.[envKey]?.trim() ?? "";
  if (fromEnv) return fromEnv;

  throw new Error(
    "Jeton MCP absent ou invalide : configurez-le dans la fiche du serveur avant l'appel."
  );
}

export async function listBuiltinBridgeTools(
  kind: BuiltinMcpBridgeKind,
  config: McpServerConfig
): Promise<McpToolDefinition[]> {
  if (kind === "brave-search") {
    resolveBearerOrEnvToken(config, "BRAVE_API_KEY", "X-Subscription-Token");
    return BRAVE_TOOLS;
  }
  resolveBearerOrEnvToken(config, "SLACK_BOT_TOKEN");
  return SLACK_TOOLS;
}

export async function callBuiltinBridgeTool(
  kind: BuiltinMcpBridgeKind,
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number
): Promise<McpToolCallResult> {
  if (kind === "brave-search") {
    return callBraveTool(config, toolName, args, timeoutMs);
  }
  return callSlackTool(config, toolName, args, timeoutMs);
}

async function callBraveTool(
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number
): Promise<McpToolCallResult> {
  const token = resolveBearerOrEnvToken(
    config,
    "BRAVE_API_KEY",
    "X-Subscription-Token"
  );
  const query = typeof args.query === "string" ? args.query.trim() : "";
  if (!query) {
    throw new Error("Le paramètre « query » est requis pour Brave Search.");
  }
  const rawCount = Number(args.count ?? 10);
  const count = Number.isFinite(rawCount)
    ? Math.min(20, Math.max(1, Math.floor(rawCount)))
    : 10;

  const endpoint =
    toolName === "brave_news_search"
      ? "https://api.search.brave.com/res/v1/news/search"
      : "https://api.search.brave.com/res/v1/web/search";

  const url = new URL(endpoint);
  url.searchParams.set("q", query.slice(0, 400));
  url.searchParams.set("count", String(count));

  const res = await safeFetchText(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": token,
    },
    maxBytes: 1_000_000,
    maxRedirects: 1,
    method: "GET",
    sensitiveHeaders: ["X-Subscription-Token"],
    timeoutMs,
    tokenOriginAllowlist: ["https://api.search.brave.com"],
  });

  if (!res.ok) {
    throw new Error(
      `Erreur Brave Search (HTTP ${res.status ?? 500}) : ${redactMcpText(res.error || "requête refusée", 300)}`
    );
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(res.text);
  } catch {
    throw new Error("Réponse JSON Brave Search invalide.");
  }

  const rawItems: any[] =
    toolName === "brave_news_search"
      ? Array.isArray(parsed?.results)
        ? parsed.results
        : []
      : Array.isArray(parsed?.web?.results)
        ? parsed.web.results
        : [];

  const items = rawItems.slice(0, count).map((item) => ({
    description: String(item?.description ?? "").slice(0, 400),
    title: String(item?.title ?? "").slice(0, 200),
    url: String(item?.url ?? "").slice(0, 500),
  }));

  return {
    content: [
      {
        text: JSON.stringify({ count: items.length, results: items }, null, 2),
        type: "text",
      },
    ],
    isError: false,
  };
}

async function callSlackTool(
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number
): Promise<McpToolCallResult> {
  const token = resolveBearerOrEnvToken(config, "SLACK_BOT_TOKEN");
  const base = "https://slack.com/api";
  let url = "";
  let method: "GET" | "POST" = "GET";
  let body: string | undefined;

  if (toolName === "slack_list_channels") {
    const limit = Math.min(100, Math.max(1, Number(args.limit ?? 25) || 25));
    url = `${base}/conversations.list?exclude_archived=true&types=public_channel,private_channel&limit=${limit}`;
  } else if (toolName === "slack_get_channel_history") {
    const channelId = String(args.channel_id ?? "").trim();
    if (!channelId) {
      throw new Error("Le paramètre « channel_id » est requis.");
    }
    const limit = Math.min(50, Math.max(1, Number(args.limit ?? 20) || 20));
    url = `${base}/conversations.history?channel=${encodeURIComponent(channelId)}&limit=${limit}`;
  } else if (toolName === "slack_get_thread_replies") {
    const channelId = String(args.channel_id ?? "").trim();
    const threadTs = String(args.thread_ts ?? "").trim();
    if (!channelId || !threadTs) {
      throw new Error(
        "Les paramètres « channel_id » et « thread_ts » sont requis."
      );
    }
    url = `${base}/conversations.replies?channel=${encodeURIComponent(channelId)}&ts=${encodeURIComponent(threadTs)}&limit=30`;
  } else if (toolName === "slack_post_message") {
    const channelId = String(args.channel_id ?? "").trim();
    const text = String(args.text ?? "").trim();
    const threadTs =
      typeof args.thread_ts === "string" ? args.thread_ts.trim() : "";
    if (!channelId || !text) {
      throw new Error("Les paramètres « channel_id » et « text » sont requis.");
    }
    url = `${base}/chat.postMessage`;
    method = "POST";
    body = JSON.stringify({
      channel: channelId,
      text: text.slice(0, 3000),
      ...(threadTs ? { thread_ts: threadTs } : {}),
    });
  } else {
    throw new Error(`Outil Slack MCP inconnu : ${redactMcpText(toolName, 80)}`);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...(body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
  };

  const res = await safeFetchText(url, {
    body,
    headers,
    maxBytes: 1_000_000,
    maxRedirects: 1,
    method,
    sensitiveHeaders: ["Authorization"],
    timeoutMs,
    tokenOriginAllowlist: ["https://slack.com"],
  });

  if (!res.ok) {
    throw new Error(
      `Erreur Slack MCP (HTTP ${res.status ?? 500}) : ${redactMcpText(res.error || "requête refusée", 300)}`
    );
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(res.text);
  } catch {
    throw new Error("Réponse JSON Slack invalide.");
  }

  if (parsed?.ok !== true) {
    throw new Error(
      `Slack a refusé l'appel (${redactMcpText(String(parsed?.error ?? "slack_error"), 80)}).`
    );
  }

  return {
    content: [
      {
        text: JSON.stringify(parsed, null, 2),
        type: "text",
      },
    ],
    isError: false,
  };
}
