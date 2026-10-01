import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { safeFetchText } from "@/lib/web/safe-fetch";
import {
  assertMcpRuntimeEnabled,
  checkAllowStdio,
  checkGlobalKillSwitch,
  type McpRuntimePolicyInput,
  type McpRuntimePreferences,
} from "./policy";
import {
  isMcpSecretKey,
  looksLikeMcpSecret,
  redactMcpError,
  redactMcpText,
  redactMcpValue,
} from "./redaction";

export { checkAllowStdio, checkGlobalKillSwitch } from "./policy";

import type {
  McpApprovalPolicy,
  McpJsonRpcRequest,
  McpJsonRpcResponse,
  McpServerConfig,
  McpToolCallResult,
  McpToolDefinition,
  McpToolOverride,
} from "./types";

export const MCP_DEFAULT_TIMEOUT_MS = 15_000;
export const MCP_MIN_TIMEOUT_MS = 1000;
export const MCP_MAX_TIMEOUT_MS = 120_000;

export type McpRuntimePrefs = McpRuntimePolicyInput &
  Partial<McpRuntimePreferences>;

const APPROVAL_POLICIES = new Set<McpApprovalPolicy>([
  "always_allow",
  "ask_permission",
  "write_only",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "string");
}

// ── Helpers contrôle fin per-tool ──────────────────────────────────────────
export function isToolEnabled(
  config: McpServerConfig,
  toolName: string
): boolean {
  if (typeof toolName !== "string" || toolName.length === 0) return false;
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
  if (
    override?.requireApproval &&
    APPROVAL_POLICIES.has(override.requireApproval as McpApprovalPolicy)
  ) {
    return override.requireApproval as McpApprovalPolicy;
  }
  const serverPolicy = config.requireApproval as McpApprovalPolicy;
  return APPROVAL_POLICIES.has(serverPolicy) ? serverPolicy : "write_only";
}

function clampTimeout(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(
    MCP_MAX_TIMEOUT_MS,
    Math.max(MCP_MIN_TIMEOUT_MS, Math.floor(value))
  );
}

export function getEffectiveTimeout(
  config: McpServerConfig,
  fallbackMs = MCP_DEFAULT_TIMEOUT_MS
): number {
  return clampTimeout(
    typeof config.timeoutMs === "number" ? config.timeoutMs : Number.NaN,
    clampTimeout(fallbackMs, MCP_DEFAULT_TIMEOUT_MS)
  );
}

// Rate-limit in-memory (par process) — fallback si pas de Redis. Un UUID de
// serveur est global et unique : la clé ne permet pas à un utilisateur de
// contourner la limite d'un autre serveur.
const _rateMap = new Map<string, number[]>();
export function checkRateLimit(serverId: string, limitPerMin: number): void {
  if (!Number.isFinite(limitPerMin) || limitPerMin <= 0) return;
  const normalizedLimit = Math.max(1, Math.floor(limitPerMin));
  const now = Date.now();
  const windowMs = 60_000;
  const arr = (_rateMap.get(serverId) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );
  if (arr.length >= normalizedLimit) {
    throw new Error(
      `Rate limit dépassé (${normalizedLimit}/min) pour ce serveur MCP.`
    );
  }
  arr.push(now);
  _rateMap.set(serverId, arr);
}

/** Utile pour les tests et pour un worker qui recycle ses limites mémoire. */
export function clearMcpRateLimits(): void {
  _rateMap.clear();
}

export function getFilteredTools(
  config: McpServerConfig,
  skillFilter?: string[] | null
): McpToolDefinition[] {
  const cache = Array.isArray(config.toolsCache)
    ? (config.toolsCache as McpToolDefinition[])
    : [];
  let filtered = cache.filter(
    (tool): tool is McpToolDefinition =>
      Boolean(tool) &&
      typeof tool === "object" &&
      typeof (tool as McpToolDefinition).name === "string" &&
      (tool as McpToolDefinition).name.length > 0 &&
      isToolEnabled(config, (tool as McpToolDefinition).name)
  );
  // Un filtre explicite, même vide, est une liste blanche : il ne doit pas
  // retomber silencieusement sur « tous les outils ».
  if (skillFilter !== undefined && skillFilter !== null) {
    const set = new Set(skillFilter);
    filtered = filtered.filter((tool) => set.has(tool.name));
  }
  return filtered;
}

function validateHeaderName(name: string): void {
  if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) {
    throw new Error(`Nom d'en-tête MCP invalide : ${redactMcpText(name, 80)}.`);
  }
}

function validateHeaderValue(name: string, value: unknown): string {
  if (typeof value !== "string" || value.length > 8192) {
    throw new Error(`Valeur d'en-tête MCP invalide : ${name}.`);
  }
  if (/[\r\n\0]/.test(value)) {
    throw new Error(`Caractères de contrôle dans l'en-tête MCP : ${name}.`);
  }
  return value;
}

function stringAuthConfig(config: McpServerConfig): Record<string, string> {
  const raw = config.authConfig;
  if (raw === undefined) return {};
  if (!isStringRecord(raw)) {
    throw new Error("Configuration d'authentification MCP invalide.");
  }
  for (const [key, value] of Object.entries(raw)) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(key)) {
      throw new Error("Champ d'authentification MCP invalide.");
    }
    validateHeaderValue(`authConfig.${key}`, value);
  }
  return { ...raw };
}

/** Effectue le contrôle de cohérence transport/auth et construit les headers
 * runtime. Les valeurs restent côté serveur.
 */
export function buildMcpHeaders(
  config: McpServerConfig
): Record<string, string> {
  const authType = config.authType;
  if (
    !["none", "bearer", "basic", "oauth2", "custom_headers"].includes(authType)
  ) {
    throw new Error("Type d'authentification MCP non supporté.");
  }
  const headers: Record<string, string> = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
  };
  const configuredHeaders = config.headers ?? {};
  if (!isStringRecord(configuredHeaders)) {
    throw new Error("En-têtes MCP invalides.");
  }
  for (const [name, value] of Object.entries(configuredHeaders)) {
    validateHeaderName(name);
    headers[name] = validateHeaderValue(name, value);
  }
  const auth = stringAuthConfig(config);
  const hasAuthorization = Object.keys(headers).some(
    (name) => name.toLowerCase() === "authorization"
  );

  if (authType === "bearer" || authType === "oauth2") {
    if (hasAuthorization) {
      throw new Error(
        "Un en-tête Authorization manuel ne peut pas contourner le token MCP."
      );
    }
    if (!auth.token || /\s/.test(auth.token)) {
      throw new Error(
        authType === "oauth2"
          ? "Jeton OAuth MCP absent ou invalide : configurez-le avant l'appel."
          : "Jeton Bearer MCP absent ou invalide : configurez-le avant l'appel."
      );
    }
    headers.Authorization = `Bearer ${auth.token}`;
    return headers;
  }

  if (authType === "basic") {
    if (hasAuthorization) {
      throw new Error("Un en-tête Authorization manuel est ambigu pour Basic.");
    }
    if (!auth.username || !auth.password || auth.username.includes(":")) {
      throw new Error("Identifiants Basic MCP incomplets ou invalides.");
    }
    const credentials = Buffer.from(
      `${auth.username}:${auth.password}`,
      "utf8"
    ).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
    return headers;
  }

  if (authType === "custom_headers") {
    // Les secrets kind=auth sont fusionnés dans headers par
    // mergeMcpSecrets. Les champs client OAuth ne sont pas des en-têtes.
    for (const [key, value] of Object.entries(auth)) {
      if (key === "clientId" || key === "clientSecret" || key === "tokenUrl") {
        continue;
      }
      validateHeaderName(key);
      headers[key] = validateHeaderValue(key, value);
    }
    if (
      Object.keys(headers).every(
        (key) => key === "Accept" || key === "Content-Type"
      )
    ) {
      throw new Error(
        "Authentification custom_headers sans en-tête personnalisé."
      );
    }
    return headers;
  }

  // none : aucun credential implicite ne doit être transporté par erreur.
  if (
    Object.keys(auth).length > 0 ||
    hasAuthorization ||
    Object.keys(config.headers ?? {}).some((name) => isMcpSecretKey(name))
  ) {
    throw new Error("Credentials présents avec authType=none.");
  }
  return headers;
}

function validateEnvMap(env: unknown): Record<string, string> {
  if (env === undefined) return {};
  if (!isStringRecord(env))
    throw new Error("Variables d'environnement MCP invalides.");
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(key)) {
      throw new Error("Nom de variable d'environnement MCP invalide.");
    }
    validateHeaderValue(`env.${key}`, value);
    out[key] = value;
  }
  return out;
}

function validateRemoteUrl(raw: string | null | undefined): URL {
  if (!raw || raw.length > 4096) {
    throw new Error("URL MCP distante manquante ou trop longue.");
  }
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    throw new Error("URL MCP distante invalide.");
  }
  if (target.protocol !== "https:") {
    throw new Error("Le transport MCP distant exige HTTPS.");
  }
  if (target.username || target.password) {
    throw new Error("Les identifiants ne sont pas autorisés dans l'URL MCP.");
  }
  for (const [key, value] of target.searchParams.entries()) {
    if (looksLikeMcpSecret(key) || looksLikeMcpSecret(value)) {
      throw new Error("Un secret ne doit pas être placé dans l'URL MCP.");
    }
  }
  if (
    target.hash &&
    (looksLikeMcpSecret(target.hash) || target.hash.includes("="))
  ) {
    throw new Error("Un fragment/secret n'est pas autorisé dans l'URL MCP.");
  }
  return target;
}

/** Validation de base avant toute découverte ou tout appel sortant. */
export function validateMcpConfig(config: McpServerConfig): void {
  if (!config || typeof config !== "object") {
    throw new Error("Configuration MCP invalide.");
  }
  if (!["sse", "http", "stdio", "websocket"].includes(config.transport)) {
    throw new Error("Transport MCP non supporté.");
  }
  if (config.transport === "websocket") {
    throw new Error("Le transport WebSocket MCP n'est pas encore supporté.");
  }
  const env = validateEnvMap(config.env);
  // We validate the command/args even for discovery so a malformed stdio
  // configuration cannot be persisted and discovered later.
  if (config.transport === "stdio") {
    if (
      typeof config.command !== "string" ||
      config.command.length === 0 ||
      config.command.length > 256 ||
      /[\r\n\0;&|`$><]/.test(config.command)
    ) {
      throw new Error("Commande stdio non autorisée.");
    }
    const args = config.args ?? [];
    if (
      !Array.isArray(args) ||
      args.length > 64 ||
      args.some(
        (arg) =>
          typeof arg !== "string" || arg.length > 2000 || /[\r\n\0]/.test(arg)
      )
    ) {
      throw new Error("Arguments stdio trop volumineux ou non autorisés.");
    }
  } else {
    validateRemoteUrl(config.url);
  }
  // Les credentials d'un serveur stdio sont des variables d'environnement ;
  // bearer décrit ici le type de secret et non un en-tête HTTP. On ne doit
  // donc pas exiger un token HTTP pour Brave/Notion/Stripe. Les auth HTTP
  // sont validées seulement pour les transports distants.
  void env;
  if (config.transport !== "stdio") buildMcpHeaders(config);
}

function normalizeCommandForPlatform(value: string): string {
  return process.platform === "win32" ? value.toLowerCase() : value;
}

function parseMcpResponse<T>(rawText: string): McpJsonRpcResponse<T> {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as McpJsonRpcResponse<T>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Réponse MCP JSON invalide.");
    }
    return parsed;
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
          const parsed = JSON.parse(dataContent) as McpJsonRpcResponse<T>;
          if (
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed) &&
            (parsed.jsonrpc === "2.0" ||
              parsed.result !== undefined ||
              parsed.error !== undefined)
          ) {
            return parsed;
          }
        } catch {
          // Continue to the next SSE data line.
        }
      }
    }
  }

  if (lastData) {
    try {
      const parsed = JSON.parse(lastData) as McpJsonRpcResponse<T>;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to the sanitized error below.
    }
  }

  throw new Error(
    `Réponse MCP non reconnue : ${redactMcpText(trimmed.slice(0, 200), 200)}`
  );
}

async function sendHttpJsonRpc<T = unknown>(
  url: string,
  request: McpJsonRpcRequest,
  headers: Record<string, string>,
  timeoutMs = MCP_DEFAULT_TIMEOUT_MS
): Promise<T> {
  const target = validateRemoteUrl(url);
  const origin = target.origin;
  const response = await safeFetchText(url, {
    body: JSON.stringify(request),
    headers,
    maxBytes: 1_000_000,
    maxRedirects: 3,
    method: "POST",
    timeoutMs: clampTimeout(timeoutMs, MCP_DEFAULT_TIMEOUT_MS),
    tokenOriginAllowlist: [origin],
  });

  if (!response.ok) {
    const status = response.status ? ` (HTTP ${response.status})` : "";
    throw new Error(
      `Erreur serveur MCP${status}: ${redactMcpText(response.error || "réponse refusée", 500)}`
    );
  }

  const data = parseMcpResponse<T>(response.text);
  if (data.error) {
    throw new Error(
      `MCP Error ${data.error.code}: ${redactMcpText(String(data.error.message ?? "erreur inconnue"), 500)}`
    );
  }

  return data.result as T;
}

/** Exécution d'une commande locale via transport stdio. */
async function callStdioProcess<T = Record<string, unknown>>(
  command: string,
  args: string[],
  env: Record<string, string>,
  inputRpc: McpJsonRpcRequest,
  timeoutMs = MCP_DEFAULT_TIMEOUT_MS
): Promise<T> {
  if (
    typeof window !== "undefined" ||
    typeof process === "undefined" ||
    !process.versions?.node
  ) {
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
    args.some((arg) => arg.length > 2000 || /[\r\n\0]/.test(arg))
  ) {
    throw new Error("Arguments stdio trop volumineux ou non autorisés.");
  }

  const normalize = normalizeCommandForPlatform;
  const allowedCommands = new Set(
    (process.env.MCP_STDIO_ALLOWED_COMMANDS ?? "")
      .split(",")
      .map((value) => normalize(value.trim()))
      .filter(Boolean)
  );
  const commandName = command.split(/[\\/]/).pop() ?? command;
  if (
    !allowedCommands.has(normalize(command)) &&
    !allowedCommands.has(normalize(commandName))
  ) {
    throw new Error("Commande stdio absente de l'allowlist serveur.");
  }

  const normalizeEnvKey = (value: string) =>
    process.platform === "win32" ? value.toLowerCase() : value;
  const allowedEnvKeys = new Set(
    (process.env.MCP_STDIO_ALLOWED_ENV_KEYS ?? "")
      .split(",")
      .map((value) => normalizeEnvKey(value.trim()))
      .filter(Boolean)
  );
  if (
    Object.keys(env).some((key) => !allowedEnvKeys.has(normalizeEnvKey(key)))
  ) {
    throw new Error("Variable d'environnement stdio non autorisée.");
  }

  const { spawn } = await import("node:child_process");
  const safeEnv: Record<string, string> = {
    PATH: process.env.PATH ?? process.env.Path ?? "",
  };
  for (const [key, value] of Object.entries(env)) {
    if (value.length > 4096) {
      throw new Error(
        `Variable d'environnement stdio trop volumineuse : ${redactMcpText(key, 80)}.`
      );
    }
    safeEnv[key] = value;
  }

  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      callback();
    };
    const proc = spawn(command, args, {
      env: safeEnv as NodeJS.ProcessEnv,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams;
    timer = setTimeout(() => {
      proc.kill();
      finish(() =>
        reject(new Error(`Timeout d'exécution stdio (${timeoutMs / 1000}s)`))
      );
    }, timeoutMs);

    proc.stdout.on("data", (chunk: Buffer) => {
      if (stdoutData.length + chunk.length > 1_000_000) {
        proc.kill();
        finish(() => reject(new Error("Réponse stdio trop volumineuse.")));
        return;
      }
      stdoutData += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderrData = `${stderrData}${chunk.toString()}`.slice(0, 4000);
    });
    (proc as any).on("error", (error: Error) => finish(() => reject(error)));
    (proc as any).on("close", (code: number | null) => {
      if (settled) return;
      if (code !== 0 && !stdoutData.trim()) {
        finish(() =>
          reject(
            new Error(
              `Le processus stdio s'est terminé avec le code ${code}: ${redactMcpText(stderrData, 1000)}`
            )
          )
        );
        return;
      }

      const lines = stdoutData.split("\n").filter((line) => line.trim());
      for (let index = lines.length - 1; index >= 0; index -= 1) {
        try {
          const parsed = JSON.parse(lines[index]) as {
            error?: { message?: string };
            jsonrpc?: string;
            result?: T;
          };
          if (parsed.jsonrpc === "2.0") {
            if (parsed.error) {
              finish(() =>
                reject(
                  new Error(
                    redactMcpText(
                      String(parsed.error?.message ?? "Erreur stdio"),
                      1000
                    )
                  )
                )
              );
            } else {
              finish(() => resolve(parsed.result as T));
            }
            return;
          }
        } catch {
          // Try the previous line.
        }
      }

      finish(() =>
        reject(
          new Error(
            `Réponse invalide du serveur stdio: ${redactMcpText(stdoutData.slice(0, 300), 300)}`
          )
        )
      );
    });

    try {
      proc.stdin.write(`${JSON.stringify(inputRpc)}\n`);
      proc.stdin.end();
    } catch (error) {
      finish(() =>
        reject(
          error instanceof Error
            ? error
            : new Error("Écriture stdio impossible.")
        )
      );
    }
  });
}

function makeRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Récupère la liste des outils exposés par le serveur MCP. */
export async function fetchMcpTools(
  config: McpServerConfig,
  prefs?: McpRuntimePrefs | null
): Promise<McpToolDefinition[]> {
  assertMcpRuntimeEnabled(config, prefs);
  validateMcpConfig(config);
  const req: McpJsonRpcRequest = {
    id: makeRequestId("list"),
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
  };
  const timeout = getEffectiveTimeout(config);

  if (config.transport === "stdio") {
    checkAllowStdio(config, prefs);
    if (!config.command)
      throw new Error("Commande manquante pour le transport stdio");
    const result = await callStdioProcess<{ tools?: McpToolDefinition[] }>(
      config.command,
      config.args ?? [],
      config.env ?? {},
      req,
      timeout
    );
    return Array.isArray(result?.tools) ? result.tools : [];
  }

  const targetUrl = config.url;
  if (!targetUrl) throw new Error("URL manquante pour le serveur MCP");
  const headers = buildMcpHeaders(config);
  try {
    const result = await sendHttpJsonRpc<{ tools?: McpToolDefinition[] }>(
      targetUrl,
      req,
      headers,
      timeout
    );
    return Array.isArray(result?.tools) ? result.tools : [];
  } catch (error: unknown) {
    const errMsg = redactMcpError(error).toLowerCase();
    if (errMsg.includes("initializ") || errMsg.includes("-32002")) {
      // Some MCP servers require the official initialize handshake first.
      try {
        await sendHttpJsonRpc(
          targetUrl,
          {
            id: makeRequestId("init"),
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
        const retryResult = await sendHttpJsonRpc<{
          tools?: McpToolDefinition[];
        }>(targetUrl, req, headers, timeout);
        return Array.isArray(retryResult?.tools) ? retryResult.tools : [];
      } catch {
        // Preserve the original error, which is more useful to the caller.
      }
    }
    throw error;
  }
}

/** Appelle un outil spécifique sur le serveur MCP. */
export async function callMcpTool(
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>,
  prefs?: McpRuntimePrefs | null
): Promise<McpToolCallResult> {
  assertMcpRuntimeEnabled(config, prefs);
  if (!isToolEnabled(config, toolName)) {
    throw new Error(
      `Outil "${redactMcpText(toolName, 120)}" désactivé pour ce serveur MCP.`
    );
  }
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new Error("Arguments d'appel MCP invalides.");
  }
  validateMcpConfig(config);
  if (config.id) checkRateLimit(config.id, config.rateLimitPerMin ?? 60);

  const req: McpJsonRpcRequest = {
    id: makeRequestId("call"),
    jsonrpc: "2.0",
    method: "tools/call",
    params: { arguments: args, name: toolName },
  };
  const timeout = getEffectiveTimeout(config);
  if (config.transport === "stdio") {
    checkAllowStdio(config, prefs);
    if (!config.command) throw new Error("Commande stdio manquante");
    return callStdioProcess<McpToolCallResult>(
      config.command,
      config.args ?? [],
      config.env ?? {},
      req,
      timeout
    );
  }

  const targetUrl = config.url;
  if (!targetUrl) throw new Error("URL du serveur MCP manquante");
  return sendHttpJsonRpc<McpToolCallResult>(
    targetUrl,
    req,
    buildMcpHeaders(config),
    timeout
  );
}

/** Teste la connexion à un serveur MCP et découvre ses outils. */
export async function testMcpConnection(
  config: McpServerConfig,
  prefs?: McpRuntimePrefs | null
): Promise<{
  message: string;
  success: boolean;
  tools: McpToolDefinition[];
  toolsCount: number;
}> {
  try {
    const tools = await fetchMcpTools(config, prefs);
    const safeTools = redactMcpValue(tools) as McpToolDefinition[];
    return {
      message: `Connexion réussie ! ${safeTools.length} outil(s) détecté(s).`,
      success: true,
      tools: safeTools,
      toolsCount: safeTools.length,
    };
  } catch (error: unknown) {
    return {
      message: `Échec de la connexion : ${redactMcpError(error)}`,
      success: false,
      tools: [],
      toolsCount: 0,
    };
  }
}
