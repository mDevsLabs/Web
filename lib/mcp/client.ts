import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { safeFetchText } from "@/lib/web/safe-fetch";
import type {
  McpApprovalPolicy,
  McpJsonRpcRequest,
  McpJsonRpcResponse,
  McpServerConfig,
  McpToolCallResult,
  McpToolDefinition,
  McpToolOverride,
} from "./types";

// ── Helpers contrôle fin per-tool ──
export function isToolEnabled(
  config: McpServerConfig,
  toolName: string
): boolean {
  const override = config.toolOverrides?.[toolName] as
    | McpToolOverride
    | undefined;
  if (override && typeof override.enabled === "boolean") {
    return override.enabled;
  }
  return true; // par défaut tous activés
}

export function resolveRequireApproval(
  config: McpServerConfig,
  toolName: string
): McpApprovalPolicy {
  const override = config.toolOverrides?.[toolName] as
    | McpToolOverride
    | undefined;
  if (override?.requireApproval) {
    return override.requireApproval as McpApprovalPolicy;
  }
  return (config.requireApproval as McpApprovalPolicy) ?? "write_only";
}

export function getEffectiveTimeout(
  config: McpServerConfig,
  fallbackMs = 15_000
): number {
  return config.timeoutMs && config.timeoutMs >= 1000
    ? config.timeoutMs
    : fallbackMs;
}

export function checkGlobalKillSwitch(
  prefs: { globalKillSwitch?: boolean } | null
): void {
  if (prefs?.globalKillSwitch) {
    throw new Error(
      "MCP désactivé globalement (kill-switch activé dans les paramètres)."
    );
  }
}

export function checkAllowStdio(
  config: McpServerConfig,
  prefs: { allowStdio?: boolean } | null
): void {
  if (config.transport !== "stdio") {
    return;
  }
  if (process.env.MCP_STDIO_ENABLED !== "true") {
    throw new Error(
      "Le transport stdio est désactivé par la configuration serveur."
    );
  }
  if (prefs && prefs.allowStdio === false) {
    throw new Error(
      "Le transport stdio est désactivé dans les paramètres globaux MCP."
    );
  }
  if (!process.env.MCP_STDIO_ALLOWED_COMMANDS?.trim()) {
    throw new Error(
      "Le transport stdio exige une allowlist serveur de commandes."
    );
  }
}

// Rate-limit in-memory (par process) — fallback si pas de Redis
const _rateMap = new Map<string, number[]>();
export function checkRateLimit(serverId: string, limitPerMin: number): void {
  if (!limitPerMin || limitPerMin <= 0) {
    return;
  }
  const now = Date.now();
  const windowMs = 60_000;
  const arr = _rateMap.get(serverId) ?? [];
  const recent = arr.filter((t) => now - t < windowMs);
  if (recent.length >= limitPerMin) {
    throw new Error(
      `Rate limit dépassé (${limitPerMin}/min) pour ce serveur MCP.`
    );
  }
  recent.push(now);
  _rateMap.set(serverId, recent);
}

export function getFilteredTools(
  config: McpServerConfig,
  skillFilter?: string[] | null
): McpToolDefinition[] {
  const cache = (config.toolsCache as McpToolDefinition[]) ?? [];
  // 1) filtre global enabled
  let filtered = cache.filter((t) => isToolEnabled(config, t.name));
  // 2) filtre whitelist skill (si fourni)
  if (Array.isArray(skillFilter) && skillFilter.length > 0) {
    const set = new Set(skillFilter);
    filtered = filtered.filter((t) => set.has(t.name));
  }
  return filtered;
}

function buildHeaders(config: McpServerConfig): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    ...config.headers,
  };

  if (config.authType === "bearer" && config.authConfig?.token) {
    headers.Authorization = `Bearer ${config.authConfig.token}`;
  } else if (config.authType === "oauth2" && config.authConfig?.token) {
    headers.Authorization = `Bearer ${config.authConfig.token}`;
  } else if (
    config.authType === "basic" &&
    config.authConfig?.username &&
    config.authConfig?.password
  ) {
    const creds = Buffer.from(
      `${config.authConfig.username}:${config.authConfig.password}`
    ).toString("base64");
    headers.Authorization = `Basic ${creds}`;
  }

  return headers;
}

function parseMcpResponse<T>(rawText: string): McpJsonRpcResponse<T> {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  // Support SSE (Server-Sent Events) : 'event: message\ndata: {...}\n\n'
  const lines = trimmed.split(/\r?\n/);
  let lastData = "";
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("data:")) {
      const dataContent = trimmedLine.slice(5).trim();
      if (dataContent) {
        lastData = dataContent;
        try {
          const parsed = JSON.parse(dataContent);
          if (
            parsed &&
            (parsed.jsonrpc === "2.0" ||
              parsed.result !== undefined ||
              parsed.error !== undefined)
          ) {
            return parsed;
          }
        } catch {}
      }
    }
  }

  if (lastData) {
    try {
      return JSON.parse(lastData);
    } catch {}
  }

  throw new Error(
    `Réponse MCP non reconnue (ni JSON standard ni SSE avec data) : ${trimmed.slice(0, 200)}`
  );
}

async function sendHttpJsonRpc<T = unknown>(
  url: string,
  request: McpJsonRpcRequest,
  headers: Record<string, string>,
  timeoutMs = 15_000
): Promise<T> {
  const target = new URL(url);
  if (target.protocol !== "https:") {
    throw new Error("Le transport MCP distant exige HTTPS.");
  }
  const origin = target.origin;
  const response = await safeFetchText(url, {
    body: JSON.stringify(request),
    headers,
    maxBytes: 1_000_000,
    maxRedirects: 3,
    method: "POST",
    timeoutMs,
    tokenOriginAllowlist: [origin],
  });

  if (!response.ok) {
    const status = response.status ? ` (HTTP ${response.status})` : "";
    throw new Error(`Erreur serveur MCP${status}: ${response.error}`);
  }

  const data = parseMcpResponse<T>(response.text);
  if (data.error) {
    throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
  }

  return data.result as T;
}

/**
 * Exécution d'une commande locale via transport stdio
 */
async function callStdioProcess<T = Record<string, unknown>>(
  command: string,
  args: string[],
  env: Record<string, string>,
  inputRpc: McpJsonRpcRequest,
  timeoutMs = 15_000
): Promise<T> {
  if (typeof window !== "undefined" || !process?.versions?.node) {
    throw new Error(
      "Le transport stdio est réservé à l'environnement serveur Node.js"
    );
  }
  if (process.env.MCP_STDIO_ENABLED !== "true") {
    throw new Error(
      "Le transport stdio est désactivé par la configuration serveur."
    );
  }
  if (!command || command.length > 256 || /[\r\n\0;&|`$><]/.test(command)) {
    throw new Error("Commande stdio non autorisée.");
  }
  if (
    args.length > 64 ||
    args.some((arg) => arg.length > 2000 || arg.includes("\0"))
  ) {
    throw new Error("Arguments stdio trop volumineux ou non autorisés.");
  }

  const allowedCommands = new Set(
    (process.env.MCP_STDIO_ALLOWED_COMMANDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const commandName = command.split(/[\\/]/).pop() ?? command;
  if (!allowedCommands.has(command) && !allowedCommands.has(commandName)) {
    throw new Error("Commande stdio absente de l'allowlist serveur.");
  }

  const allowedEnvKeys = new Set(
    (process.env.MCP_STDIO_ALLOWED_ENV_KEYS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const explicitEnvKeys = Object.keys(env);
  if (explicitEnvKeys.some((key) => !allowedEnvKeys.has(key))) {
    throw new Error("Variable d'environnement stdio non autorisée.");
  }

  const { spawn } = await import("node:child_process");
  const safeEnv: Record<string, string> = {
    PATH: process.env.PATH ?? "",
  };
  for (const [key, value] of Object.entries(env)) {
    if (value.length > 4096) {
      throw new Error(
        `Variable d'environnement stdio trop volumineuse : ${key}.`
      );
    }
    safeEnv[key] = value;
  }

  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finishReject = (error: Error) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      reject(error);
    };
    const proc = spawn(command, args, {
      env: safeEnv as NodeJS.ProcessEnv,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams;
    timer = setTimeout(() => {
      proc.kill();
      finishReject(
        new Error(`Timeout d'exécution stdio (${timeoutMs / 1000}s)`)
      );
    }, timeoutMs);

    proc.stdout.on("data", (chunk: Buffer) => {
      if (stdoutData.length + chunk.length > 1_000_000) {
        proc.kill();
        finishReject(new Error("Réponse stdio trop volumineuse."));
        return;
      }
      stdoutData += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderrData = `${stderrData}${chunk.toString()}`.slice(0, 4000);
    });
    proc.on("error", (error) => finishReject(error));
    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (code !== 0 && !stdoutData.trim()) {
        reject(
          new Error(
            `Le processus stdio s'est terminé avec le code ${code}: ${stderrData}`
          )
        );
        return;
      }

      const lines = stdoutData.split("\n").filter((line) => line.trim());
      for (let index = lines.length - 1; index >= 0; index -= 1) {
        try {
          const parsed = JSON.parse(lines[index]);
          if (parsed.jsonrpc === "2.0") {
            if (parsed.error) {
              reject(new Error(parsed.error.message));
            } else {
              resolve(parsed.result as T);
            }
            return;
          }
        } catch {}
      }

      reject(
        new Error(
          `Réponse invalide du serveur stdio: ${stdoutData.slice(0, 300)}`
        )
      );
    });

    proc.stdin.write(`${JSON.stringify(inputRpc)}\n`);
    proc.stdin.end();
  });
}

/**
 * Récupère la liste des outils exposés par le serveur MCP
 */
export async function fetchMcpTools(
  config: McpServerConfig
): Promise<McpToolDefinition[]> {
  const req: McpJsonRpcRequest = {
    id: `list-${Date.now()}`,
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
  };

  const timeout = getEffectiveTimeout(config);
  if (config.transport === "stdio") {
    checkAllowStdio(config, null);
    if (!config.command) {
      throw new Error("Commande manquante pour le transport stdio");
    }
    const result = await callStdioProcess<{
      tools?: McpToolDefinition[];
    }>(config.command, config.args ?? [], config.env ?? {}, req, timeout);
    return (result?.tools as McpToolDefinition[]) ?? [];
  }

  let targetUrl = config.url;
  if (targetUrl === "https://mcp-github-server.example.com/sse") {
    targetUrl = "https://api.githubcopilot.com/mcp/";
  }
  if (!targetUrl) {
    throw new Error("URL manquante pour le serveur MCP");
  }

  const headers = buildHeaders(config);
  try {
    const result = await sendHttpJsonRpc<{ tools: McpToolDefinition[] }>(
      targetUrl,
      req,
      headers,
      timeout
    );
    return result?.tools ?? [];
  } catch (err: any) {
    const errMsg = String(err.message || "").toLowerCase();
    if (errMsg.includes("initializ") || errMsg.includes("-32002")) {
      // Tentative d'initialisation MCP officielle
      try {
        await sendHttpJsonRpc(
          targetUrl,
          {
            id: `init-${Date.now()}`,
            jsonrpc: "2.0",
            method: "initialize",
            params: {
              capabilities: {},
              clientInfo: { name: "mAI-Web", version: "1.0.0" },
              protocolVersion: "2024-11-05",
            },
          },
          headers,
          timeout
        );
        // Retry tools/list
        const retryResult = await sendHttpJsonRpc<{
          tools: McpToolDefinition[];
        }>(targetUrl, req, headers, timeout);
        return retryResult?.tools ?? [];
      } catch {}
    }
    throw err;
  }
}

/**
 * Appelle un outil spécifique sur le serveur MCP
 */
export async function callMcpTool(
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>
): Promise<McpToolCallResult> {
  // contrôle fin per-tool : bloquer si désactivé
  if (!isToolEnabled(config, toolName)) {
    throw new Error(`Outil "${toolName}" désactivé pour ce serveur MCP.`);
  }
  // rate-limit (si serverId dispo, sinon skip)
  if (config.id) {
    checkRateLimit(config.id, config.rateLimitPerMin ?? 60);
  }

  const req: McpJsonRpcRequest = {
    id: `call-${Date.now()}`,
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      arguments: args,
      name: toolName,
    },
  };

  const timeout = getEffectiveTimeout(config);
  if (config.transport === "stdio") {
    checkAllowStdio(config, null);
    if (!config.command) {
      throw new Error("Commande stdio manquante");
    }
    const result = await callStdioProcess<McpToolCallResult>(
      config.command,
      config.args ?? [],
      config.env ?? {},
      req,
      timeout
    );
    return result;
  }

  let targetUrl = config.url;
  if (targetUrl === "https://mcp-github-server.example.com/sse") {
    targetUrl = "https://api.githubcopilot.com/mcp/";
  }
  if (!targetUrl) {
    throw new Error("URL du serveur MCP manquante");
  }

  const headers = buildHeaders(config);
  return await sendHttpJsonRpc<McpToolCallResult>(
    targetUrl,
    req,
    headers,
    timeout
  );
}

/**
 * Teste la connexion à un serveur MCP et découvre ses outils
 */
export async function testMcpConnection(config: McpServerConfig): Promise<{
  message: string;
  success: boolean;
  tools: McpToolDefinition[];
  toolsCount: number;
}> {
  try {
    const tools = await fetchMcpTools(config);
    return {
      message: `Connexion réussie ! ${tools.length} outil(s) détecté(s).`,
      success: true,
      tools,
      toolsCount: tools.length,
    };
  } catch (err: any) {
    return {
      message: `Échec de la connexion : ${err.message}`,
      success: false,
      tools: [],
      toolsCount: 0,
    };
  }
}
