// DTO de sortie des serveurs et journaux MCP.
//
// Règle unique : aucune valeur secrète ne sort de la base ou d'un message
// d'erreur. Les colonnes JSON `authConfig`, `env` et `headers` sont conservées
// dans la forme (les composants lisent `server.headers` sans casser) mais
// toujours vidées, et remplacées par `secretKeys` — la liste des NOMS de clés
// configurées. Les métadonnées libres (cache d'outils, overrides, erreurs)
// passent aussi par la redaction : une ancienne ligne ou une réponse d'un
// fournisseur ne doit pas contourner cette garantie.

import { isMcpSecretKey, redactMcpText, redactMcpValue } from "./redaction";

export type McpSecretKeys = {
  auth: string[];
  env: string[];
  header: string[];
};

export type McpServerDto = {
  args: string[];
  authType: string;
  avgLatencyMs: number;
  callCount: number;
  command: string | null;
  createdAt: Date | null;
  description: string;
  // Toujours vides : les valeurs vivent dans `mcp_server_secret` (chiffrées).
  authConfig: Record<string, never>;
  env: Record<string, never>;
  headers: Record<string, never>;
  icon: string;
  id: string;
  isEnabled: boolean;
  lastCallAt: Date | null;
  lastSyncAt: Date | null;
  name: string;
  rateLimitPerMin: number;
  requireApproval: string;
  secretKeys: McpSecretKeys;
  templateId: string | null;
  timeoutMs: number;
  toolOverrides: Record<string, unknown>;
  toolsCache: unknown[];
  transport: string;
  updatedAt: Date | null;
  uptimeStatus: string;
  url: string | null;
};

export type McpLogDto = {
  actionType: string;
  approvalStatus: string;
  chatId: string | null;
  createdAt: Date | string | null;
  durationMs: number;
  error: string | null;
  id: string;
  inputPayload: unknown;
  outputPayload: unknown;
  serverId: string | null;
  serverName: string;
  toolName: string;
  userId: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? redactMcpText(value, 2000) : fallback;
}

function safeDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const number = finiteNumber(value, fallback);
  return Math.min(max, Math.max(min, Math.floor(number)));
}

/** Noms de clés uniquement — jamais les valeurs. */
function keyNames(value: unknown): string[] {
  return Object.keys(asRecord(value))
    .map((key) => redactMcpText(key, 120))
    .sort();
}

/**
 * Masque un argument qui porte une valeur secrète (`--token=abc`,
 * `API_KEY:abc`). Le reste de l'argument est conservé : la commande doit
 * rester modifiable dans l'interface.
 */
export function redactArgument(argument: string): string {
  const eq = argument.indexOf("=");
  if (eq > 0) {
    const name = argument.slice(0, eq);
    if (isMcpSecretKey(name) || isMcpSecretKey(name.replace(/^--/, ""))) {
      return `${name}=${"***"}`;
    }
    // `--header=Authorization:Bearer ...` porte le secret dans la valeur.
    if (
      /^--?header$/i.test(name.replace(/^--/, "")) ||
      /^header$/i.test(name)
    ) {
      return `${name}=${"***"}`;
    }
    return redactMcpText(argument, 2000);
  }
  const colon = argument.indexOf(":");
  if (colon > 0) {
    const name = argument.slice(0, colon);
    if (isMcpSecretKey(name) || isMcpSecretKey(name.replace(/^--/, ""))) {
      return `${name}:${"***"}`;
    }
    return redactMcpText(argument, 2000);
  }
  return redactMcpText(argument, 2000);
}

/**
 * Nettoie une URL destinée au client : identifiants retirés, paramètres et
 * fragments ressemblant à un secret masqués. Une URL invalide n'est pas
 * renvoyée telle quelle (elle peut contenir n'importe quoi).
 */
export function sanitizeUrlForClient(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  // Une URL MCP doit être HTTP(S). Ne pas exposer un autre scheme dans un DTO.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }
  parsed.username = "";
  parsed.password = "";
  for (const [name] of [...parsed.searchParams.entries()]) {
    const value = parsed.searchParams.get(name) ?? "";
    if (isMcpSecretKey(name) || isMcpSecretKey(name.replace(/[-_]/g, ""))) {
      parsed.searchParams.set(name, "***");
    } else {
      // Redact known provider token shapes even behind an innocuous key.
      const redacted = redactMcpText(value, 2000);
      if (redacted !== value) parsed.searchParams.set(name, "***");
    }
  }
  if (parsed.hash) {
    const hash = parsed.hash.slice(1);
    const [hashKey] = hash.split("=");
    if (isMcpSecretKey(hashKey ?? "") || redactMcpText(hash, 2000) !== hash) {
      parsed.hash = "#***";
    }
  }
  // Dernière défense : un secret de type glpat- ne doit pas survivre dans
  // le pathname, même si une intégration l'y a placé.
  const pathname = redactMcpText(parsed.pathname, 2000);
  parsed.pathname = pathname;
  return redactMcpText(parsed.toString(), 4000);
}

/** Convertit une ligne `McpServer` en DTO sans secret. */
export function toMcpServerDto(row: unknown): McpServerDto {
  const record = asRecord(row);
  const authConfig = asRecord(record.authConfig);
  const args = Array.isArray(record.args)
    ? record.args.filter((arg): arg is string => typeof arg === "string")
    : [];
  const toolsCache = Array.isArray(record.toolsCache)
    ? redactMcpValue(record.toolsCache)
    : [];
  const overrides = redactMcpValue(asRecord(record.toolOverrides));

  return {
    args: args.map(redactArgument),
    authConfig: {},
    authType: safeString(record.authType, "none") || "none",
    avgLatencyMs: finiteNumber(record.avgLatencyMs, 0),
    callCount: finiteNumber(record.callCount, 0),
    command:
      typeof record.command === "string"
        ? redactMcpText(record.command, 512)
        : null,
    createdAt: safeDate(record.createdAt),
    description: safeString(record.description),
    env: {},
    headers: {},
    icon: safeString(record.icon, "server") || "server",
    id: safeString(record.id),
    isEnabled: record.isEnabled !== false,
    lastCallAt: safeDate(record.lastCallAt),
    lastSyncAt: safeDate(record.lastSyncAt),
    name: safeString(record.name),
    rateLimitPerMin: boundedInteger(record.rateLimitPerMin, 60, 1, 1000),
    requireApproval:
      typeof record.requireApproval === "string"
        ? record.requireApproval
        : "write_only",
    secretKeys: {
      auth: keyNames(authConfig),
      env: keyNames(record.env),
      header: keyNames(record.headers),
    },
    templateId:
      typeof record.templateId === "string" ? record.templateId : null,
    timeoutMs: boundedInteger(record.timeoutMs, 15_000, 1000, 120_000),
    toolOverrides:
      overrides && typeof overrides === "object" && !Array.isArray(overrides)
        ? (overrides as Record<string, unknown>)
        : {},
    toolsCache: Array.isArray(toolsCache) ? toolsCache : [],
    transport: typeof record.transport === "string" ? record.transport : "sse",
    updatedAt: safeDate(record.updatedAt),
    uptimeStatus:
      typeof record.uptimeStatus === "string" ? record.uptimeStatus : "unknown",
    url: sanitizeUrlForClient(
      typeof record.url === "string" ? record.url : null
    ),
  };
}

/** Idem, sur une collection (les non-objets sont écartés, jamais renvoyés bruts). */
export function toMcpServerDtoList(rows: unknown): McpServerDto[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => Boolean(row) && typeof row === "object")
    .map((row) => toMcpServerDto(row));
}

/** DTO redacted d'un journal MCP, compatible avec les champs historiques. */
export function toMcpLogDto(row: unknown): McpLogDto {
  const record = asRecord(row);
  return {
    actionType: safeString(record.actionType, "read") || "read",
    approvalStatus:
      safeString(record.approvalStatus, "auto_approved") || "auto_approved",
    chatId: typeof record.chatId === "string" ? record.chatId : null,
    createdAt: safeDate(record.createdAt) ?? null,
    durationMs: finiteNumber(record.durationMs, 0),
    error:
      typeof record.error === "string"
        ? redactMcpText(record.error, 1000)
        : null,
    id: safeString(record.id),
    inputPayload: redactMcpValue(record.inputPayload) ?? null,
    outputPayload: redactMcpValue(record.outputPayload) ?? null,
    serverId: typeof record.serverId === "string" ? record.serverId : null,
    serverName: safeString(record.serverName),
    toolName: safeString(record.toolName),
    userId: safeString(record.userId),
  };
}

export function toMcpLogDtoList(rows: unknown): McpLogDto[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => Boolean(row) && typeof row === "object")
    .map((row) => toMcpLogDto(row));
}
