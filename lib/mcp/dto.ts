// DTO de sortie des serveurs MCP.
//
// Règle unique : aucun secret ne sort de la base. Les colonnes JSON
// `authConfig`, `env` et `headers` sont conservées dans la forme (les
// composants lisent `server.headers` sans casser) mais TOUJOURS vidées, et
// remplacées par `secretKeys` — la liste des NOMS de clés configurées, ce qui
// suffit à l'interface (« token configuré ») sans jamais exposer de valeur.
//
// Sont également nettoyés :
//  • l'URL (identifiants `user:pass@`, paramètres de requête / fragments
//    contenant un jeton ou une clé) ;
//  • les arguments stdio (`--token=…`, `API_KEY:…`).
//
// Testé par tests/unit/mcp-secrets.test.ts : aucune valeur secrète ne doit
// apparaître dans la sortie sérialisée.

const SECRET_KEY_PATTERN =
  /(pass(word|wd)?|secret|token|api[-_]?key|auth|credential|signature|sig|session|cookie|bearer|private[-_]?key)/i;

const SECRET_QUERY_PARAMS =
  /^(access[-_]?token|api[-_]?key|apikey|auth|authorization|code|credential|key|password|passwd|pwd|refresh[-_]?token|secret|sig|signature|token)$/i;

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

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

/** Noms de clés uniquement — jamais les valeurs. */
function keyNames(value: unknown): string[] {
  return Object.keys(asRecord(value)).sort();
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
    if (SECRET_KEY_PATTERN.test(name)) {
      return `${name}=***`;
    }
    return argument;
  }
  const colon = argument.indexOf(":");
  if (colon > 0) {
    const name = argument.slice(0, colon);
    if (SECRET_KEY_PATTERN.test(name)) {
      return `${name}:***`;
    }
  }
  return argument;
}

/**
 * Nettoie une URL destinée au client : identifiants retirés, paramètres et
 * fragments ressemblant à un secret masqués. Une URL invalide n'est pas
 * renvoyée telle quelle (elle peut contenir n'importe quoi).
 */
export function sanitizeUrlForClient(
  raw: string | null | undefined
): string | null {
  if (!raw) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  parsed.username = "";
  parsed.password = "";
  for (const name of [...parsed.searchParams.keys()]) {
    if (SECRET_QUERY_PARAMS.test(name)) {
      parsed.searchParams.set(name, "***");
    }
  }
  if (parsed.hash && SECRET_KEY_PATTERN.test(parsed.hash)) {
    parsed.hash = "#***";
  }
  return parsed.toString();
}

/** Convertit une ligne `McpServer` en DTO sans secret. */
export function toMcpServerDto(row: unknown): McpServerDto {
  const record = asRecord(row);
  const authConfig = asRecord(record.authConfig);
  const args = Array.isArray(record.args)
    ? record.args.filter((arg): arg is string => typeof arg === "string")
    : [];

  return {
    args: args.map(redactArgument),
    authConfig: {},
    authType: typeof record.authType === "string" ? record.authType : "none",
    avgLatencyMs: Number(record.avgLatencyMs ?? 0),
    callCount: Number(record.callCount ?? 0),
    command: typeof record.command === "string" ? record.command : null,
    createdAt: (record.createdAt as Date | null) ?? null,
    description:
      typeof record.description === "string" ? record.description : "",
    env: {},
    headers: {},
    icon: typeof record.icon === "string" ? record.icon : "server",
    id: String(record.id ?? ""),
    isEnabled: record.isEnabled !== false,
    lastCallAt: (record.lastCallAt as Date | null) ?? null,
    lastSyncAt: (record.lastSyncAt as Date | null) ?? null,
    name: typeof record.name === "string" ? record.name : "",
    rateLimitPerMin: Number(record.rateLimitPerMin ?? 60),
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
    timeoutMs: Number(record.timeoutMs ?? 15_000),
    toolOverrides: asRecord(record.toolOverrides),
    toolsCache: Array.isArray(record.toolsCache) ? record.toolsCache : [],
    transport: typeof record.transport === "string" ? record.transport : "sse",
    updatedAt: (record.updatedAt as Date | null) ?? null,
    uptimeStatus:
      typeof record.uptimeStatus === "string" ? record.uptimeStatus : "unknown",
    url: sanitizeUrlForClient(
      typeof record.url === "string" ? record.url : null
    ),
  };
}

/** Idem, sur une collection (les non-objets sont écartés, jamais renvoyés bruts). */
export function toMcpServerDtoList(rows: unknown): McpServerDto[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter((row) => Boolean(row) && typeof row === "object")
    .map((row) => toMcpServerDto(row));
}
