import { sqlite } from "https://esm.town/v/std/sqlite";
import { neon } from "npm:@neondatabase/serverless";
import { jwtVerify, SignJWT } from "npm:jose";

// ─────────────────────────────────────────────
// Config & Données
// ─────────────────────────────────────────────
export const JWT_EXPIRY = "7d";
export const BCRYPT_ROUNDS = 12;

// ─────────────────────────────────────────────
// Rate limiting en mémoire (par clé : ip ou user)
// ─────────────────────────────────────────────

// Une Map qui ne fait que grossir permet de consommer la mémoire avec des clés
// arbitraires. On conserve donc une borne dure et on purge les fenêtres
// expirées à chaque nouvelle tentative.
export const RATE_LIMIT_MAX_BUCKETS = 10_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function pruneRateBuckets(now: number): void {
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}

function makeRoomForRateBucket(): void {
  if (rateBuckets.size < RATE_LIMIT_MAX_BUCKETS) return;
  const oldestKey = rateBuckets.keys().next().value;
  if (oldestKey !== undefined) rateBuckets.delete(oldestKey);
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(windowMs) || windowMs <= 0) {
    return false;
  }

  const now = Date.now();
  pruneRateBuckets(now);
  const bucket = rateBuckets.get(key);
  if (!bucket) {
    makeRoomForRateBucket();
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// ─────────────────────────────────────────────
// Runtime / résolution d'adresse IP
// ─────────────────────────────────────────────

type RuntimeWithEnv = {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

/**
 * Lit une variable dans Deno ou Node sans faire référence directe à un runtime
 * inexistant. Les backend Deno/Val Town et les tests Node utilisent le même
 * chemin de code.
 */
export function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & RuntimeWithEnv;

  if (runtime.Deno?.env?.get) {
    try {
      const value = runtime.Deno.env.get(name);
      if (value !== undefined && value !== "") return value;
    } catch {
      // Some runtimes expose Deno.env but deny access until permissions are granted.
    }
  }

  return runtime.process?.env?.[name];
}

type ParsedIp = { version: 4 | 6; bytes: Uint8Array; value: string };
type TrustedProxyRule = { network: ParsedIp; prefix: number };

function ipv4Bytes(value: string): Uint8Array | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const bytes = new Uint8Array(4);
  for (let i = 0; i < parts.length; i++) {
    if (!/^\d{1,3}$/.test(parts[i])) return null;
    const part = Number(parts[i]);
    if (part < 0 || part > 255) return null;
    bytes[i] = part;
  }
  return bytes;
}

function ipv6Bytes(value: string): Uint8Array | null {
  let input = value.toLowerCase();
  if (input.includes("%")) input = input.split("%", 1)[0];

  // IPv4Mapped notation (::ffff:192.0.2.1).
  const lastColon = input.lastIndexOf(":");
  if (lastColon >= 0 && input.slice(lastColon + 1).includes(".")) {
    const embedded = ipv4Bytes(input.slice(lastColon + 1));
    if (!embedded) return null;
    const high = ((embedded[0] << 8) | embedded[1]).toString(16);
    const low = ((embedded[2] << 8) | embedded[3]).toString(16);
    input = `${input.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const halves = input.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const leftGroups = left.filter(Boolean);
  const rightGroups = right.filter(Boolean);
  const allGroups =
    halves.length === 2
      ? [...leftGroups, ...Array(Math.max(0, 8 - leftGroups.length - rightGroups.length)).fill("0"), ...rightGroups]
      : leftGroups;
  if (allGroups.length !== 8 || allGroups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return null;
  }

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    const group = Number.parseInt(allGroups[i], 16);
    bytes[i * 2] = (group >>> 8) & 0xff;
    bytes[i * 2 + 1] = group & 0xff;
  }
  return bytes;
}

function formatIp(version: 4 | 6, bytes: Uint8Array): string {
  if (version === 4) return Array.from(bytes).join(".");

  const groups = Array.from({ length: 8 }, (_, index) =>
    ((bytes[index * 2] << 8) | bytes[index * 2 + 1]).toString(16)
  );
  let bestStart = -1;
  let bestLength = 0;
  let currentStart = -1;
  let currentLength = 0;
  for (let index = 0; index <= groups.length; index++) {
    if (groups[index] === "0") {
      if (currentStart < 0) currentStart = index;
      currentLength += 1;
    } else if (currentStart >= 0) {
      if (currentLength > bestLength) {
        bestStart = currentStart;
        bestLength = currentLength;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }
  if (bestLength < 2) return groups.join(":");
  const left = groups.slice(0, bestStart).join(":");
  const right = groups.slice(bestStart + bestLength).join(":");
  return `${left}::${right}`;
}

function stripIpPort(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    const closing = trimmed.indexOf("]");
    if (closing > 0) return trimmed.slice(1, closing);
  }
  // Ne retire un port que lorsqu'il s'agit clairement d'une adresse IPv4.
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(trimmed)) {
    return trimmed.slice(0, trimmed.lastIndexOf(":"));
  }
  return trimmed;
}

function parseIp(value: unknown): ParsedIp | null {
  if (typeof value !== "string") return null;
  const stripped = stripIpPort(value);
  if (!stripped || stripped.length > 128) return null;

  const v4 = ipv4Bytes(stripped);
  if (v4) {
    return { bytes: v4, value: formatIp(4, v4), version: 4 };
  }
  const v6 = ipv6Bytes(stripped);
  return v6 ? { bytes: v6, value: formatIp(6, v6), version: 6 } : null;
}

function parseTrustedProxyRule(value: string): TrustedProxyRule | null {
  const [address, prefixText] = value.trim().split("/", 2);
  const network = parseIp(address);
  if (!network) return null;
  const maxPrefix = network.version === 4 ? 32 : 128;
  const prefix = prefixText === undefined ? maxPrefix : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) return null;
  return { network, prefix };
}

function readTrustedProxyConfig(): { enabled: boolean; allowAny: boolean; rules: TrustedProxyRule[] } {
  // Les noms multiples permettent de rester compatible avec les
  // conventions des différents proxys, sans jamais activer la confiance par
  // défaut. Une valeur booléenne doit être explicite.
  const values = [
    getEnv("TRUSTED_PROXY_IPS"),
    getEnv("TRUSTED_PROXY_CIDRS"),
    getEnv("TRUSTED_PROXIES"),
    getEnv("TRUSTED_PROXY"),
    getEnv("MAI_TRUSTED_PROXY"),
    getEnv("TRUST_PROXY_IPS"),
    getEnv("TRUST_PROXY_CIDRS"),
    getEnv("TRUST_PROXY"),
    getEnv("MAI_TRUST_PROXY"),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap((value) => value.split(/[\s,]+/))
    .map((value) => value.trim())
    .filter(Boolean);

  const allowAny = values.some((value) => /^(1|true|yes|on)$/i.test(value));
  const rules = values
    .filter((value) => !/^(0|false|no|off)$/i.test(value))
    .map(parseTrustedProxyRule)
    .filter((rule): rule is TrustedProxyRule => Boolean(rule));

  return { allowAny, enabled: allowAny || rules.length > 0, rules };
}

function requestHeader(c: any, name: string): string | undefined {
  try {
    return (
      c?.req?.header?.(name) ??
      c?.req?.raw?.headers?.get?.(name) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

function requestPeerIp(c: any): string | null {
  const candidates = [
    c?.remoteAddress,
    c?.req?.remoteAddress,
    c?.req?.raw?.remoteAddress,
    c?.req?.raw?.socket?.remoteAddress,
    c?.req?.raw?.connection?.remoteAddress,
    c?.env?.remoteAddress,
    c?.env?.request?.remoteAddress,
    c?.req?.raw?.cf?.clientIp,
  ];
  for (const candidate of candidates) {
    const parsed = parseIp(candidate);
    if (parsed) return parsed.value;
  }
  return null;
}

function ipMatchesRule(ip: ParsedIp, rule: TrustedProxyRule): boolean {
  if (ip.version !== rule.network.version) return false;
  const fullBytes = Math.floor(rule.prefix / 8);
  const remainingBits = rule.prefix % 8;
  for (let i = 0; i < fullBytes; i++) {
    if (ip.bytes[i] !== rule.network.bytes[i]) return false;
  }
  if (remainingBits === 0) return true;
  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (ip.bytes[fullBytes] & mask) === (rule.network.bytes[fullBytes] & mask);
}

/**
 * Résout l'IP cliente sans faire confiance implicitement à X-Forwarded-For.
 * Les en-têtes de forwarding ne sont acceptés que si l'opérateur a déclaré un
 * proxy de confiance via TRUSTED_PROXY* / TRUST_PROXY*. En mode CIDR, le pair
 * direct doit correspondre à la règle ; `TRUST_PROXY=true` est réservé aux
 * déploiements dont le runtime ne fournit pas l'adresse du pair.
 */
export function clientIp(c: any): string {
  const peer = requestPeerIp(c);
  const parsedPeer = peer ? parseIp(peer) : null;
  const proxy = readTrustedProxyConfig();
  const canTrustForwardedHeaders =
    proxy.enabled &&
    (proxy.allowAny ||
      Boolean(
        parsedPeer &&
          proxy.rules.some((rule) => ipMatchesRule(parsedPeer, rule))
      ));

  if (canTrustForwardedHeaders) {
    const forwardedCandidates: Array<string | undefined> = [
      requestHeader(c, "cf-connecting-ip"),
      requestHeader(c, "x-real-ip"),
    ];
    const forwardedFor = requestHeader(c, "x-forwarded-for");
    if (forwardedFor) {
      const chain = forwardedFor
        .split(",")
        .map((value) => parseIp(value))
        .filter((value): value is ParsedIp => Boolean(value));
      if (proxy.allowAny) {
        forwardedCandidates.push(chain[0]?.value);
      } else {
        // Un proxy peut ajouter une valeur spoofée à gauche de la chaîne.
        // On parcourt donc de droite à gauche et on s'arrête au premier
        // pair qui n'est pas dans la liste des proxys de confiance.
        for (let index = chain.length - 1; index >= 0; index--) {
          const candidate = chain[index];
          if (!proxy.rules.some((rule) => ipMatchesRule(candidate, rule))) {
            forwardedCandidates.push(candidate.value);
            break;
          }
        }
      }
    }

    for (const candidate of forwardedCandidates) {
      const parsed = parseIp(candidate);
      if (parsed) return parsed.value;
    }
  }

  return peer || "unknown";
}

export type Tier = "Free" | "Plus" | "Pro" | "Max";

const TIER_ALIASES: Record<string, Tier> = {
  free: "Free",
  gratuit: "Free",
  plus: "Plus",
  pro: "Pro",
  max: "Max",
};

/**
 * Normalise n'importe quelle représentation de forfait venant de la base, d'une clé API
 * ou d'un JWT ("gratuit", " PRO ", "max") en tier canonique.
 * Une valeur vide ou inconnue retombe sur "Free", comme l'ancien `MAP[t] || MAP["Free"]`.
 */
export function normalizeTier(tier?: string | null): Tier {
  return TIER_ALIASES[String(tier || "").trim().toLowerCase()] || "Free";
}

export function isPaidTier(tier?: string | null): boolean {
  return normalizeTier(tier) !== "Free";
}

// Limites de tokens mAI hebdomadaires (Input + Output)
export const TIER_LIMITS: Record<Tier, number> = {
  Free: 10_000_000,
  Plus: 20_000_000,
  Pro: 30_000_000,
  Max: 50_000_000,
};

export function getTierMaiTokenLimit(tier?: string | null): number {
  return TIER_LIMITS[normalizeTier(tier)];
}

// Limites de tokens Speech hebdomadaires
export const TIER_SPEECH_LIMITS: Record<Tier, number> = {
  Free: 30_000_000,
  Plus: 75_000_000,
  Pro: 150_000_000,
  Max: 300_000_000,
};

export function getTierSpeechLimit(tier?: string | null): number {
  return TIER_SPEECH_LIMITS[normalizeTier(tier)];
}

// Limites de requêtes API hebdomadaires (remise à zéro le lundi 00:00 UTC)
export const TIER_REQUEST_LIMITS: Record<Tier, number> = {
  Free: 500,
  Plus: 1500,
  Pro: 3000,
  Max: 7500,
};

export function getTierRequestLimit(tier?: string | null): number {
  return TIER_REQUEST_LIMITS[normalizeTier(tier)];
}

/**
 * Extrait le forfait (TIER_USER) encodé directement dans une clé API au format :
 * mai-TIER_USER-XXXXX-XXXXX (ex: mai-free-ABC12-defgh, mai-plus-..., mai-pro-..., mai-max-...)
 * Renvoie "Free", "Plus", "Pro", "Max" ou null si non présent.
 */
export function extractTierFromApiKey(apiKey: string | null | undefined): "Free" | "Plus" | "Pro" | "Max" | null {
  if (!apiKey || typeof apiKey !== "string") return null;
  const match = apiKey.trim().match(/^mai-(free|plus|pro|max)-/i);
  if (!match) return null;
  const t = match[1].toLowerCase();
  if (t === "free") return "Free";
  if (t === "plus") return "Plus";
  if (t === "pro") return "Pro";
  if (t === "max") return "Max";
  return null;
}

/**
 * Calcule l'augmentation temporaire de quota active pour un utilisateur et un type de service.
 */
export async function getUserQuotaBoost(
  sql: any,
  userId: string | null | undefined,
  quotaType: "mai" | "api" | "images" | "audio"
): Promise<number> {
  if (!sql || !userId) return 0;
  try {
    const rows = await sql`
      SELECT COALESCE(SUM(boost_amount), 0) as total_boost
      FROM user_quota_boosts
      WHERE (
        user_id = 'all'
        OR user_id = ${userId}::text
        OR user_id IN (
          SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text
        )
        OR user_id IN (
          SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text
        )
        OR user_id IN (
          SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text
        )
      )
        AND quota_type = ${quotaType}
        AND is_active = TRUE
        AND starts_at <= NOW()
        AND expires_at >= NOW()
    `;
    return Number(rows[0]?.total_boost || 0);
  } catch {
    return 0;
  }
}

// Limites quotidiennes de génération d'images
export const TIER_DAILY_IMAGE_LIMITS: Record<Tier, number> = {
  Free: 5,
  Plus: 10,
  Pro: 20,
  Max: 35,
};

export function getTierDailyImageLimit(tier?: string | null): number {
  return TIER_DAILY_IMAGE_LIMITS[normalizeTier(tier)];
}

// Coût en requêtes API par image générée (multiplié par le nombre d'images demandées)
export const TIER_IMAGE_REQUEST_COST: Record<Tier, number> = {
  Free: 100,
  Plus: 50,
  Pro: 25,
  Max: 10,
};

export function getTierImageRequestCost(tier?: string | null): number {
  return TIER_IMAGE_REQUEST_COST[normalizeTier(tier)];
}

// Limites de stockage Cloud par tier (en octets)
const GIB = 1024 * 1024 * 1024;

export const STORAGE_LIMITS_BYTES: Record<Tier, number> = {
  Free: 10 * GIB,
  Plus: 20 * GIB,
  Pro: 40 * GIB,
  Max: 60 * GIB,
};

export function getTierStorageLimitBytes(tier?: string | null): number {
  return STORAGE_LIMITS_BYTES[normalizeTier(tier)];
}

export type DbTransaction = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<any>;
  unsafe: (query: string, values?: unknown[]) => Promise<any>;
  query: (query: string, values?: unknown[]) => Promise<any>;
};

export type DbQuery = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<any>;
  unsafe: (query: string, values?: unknown[]) => Promise<any>;
  query: (query: string, values?: unknown[]) => Promise<any>;
  transaction: (
    queriesOrFn: any[] | ((txn: DbTransaction) => any[]),
    options?: any
  ) => Promise<any>;
};

let _cachedDb: DbQuery | null = null;
let _lastDbUrl: string | null = null;

export function getDb(): DbQuery {
  const rawUrl = getEnv("DATABASE_URL")?.trim();
  if (!rawUrl) {
    throw new Error("DATABASE_URL not set");
  }

  // Activer automatiquement le mode connection pooler Neon (-pooler) si disponible
  let url = rawUrl;
  if (url.includes('.neon.tech') && !url.includes('-pooler')) {
    url = url.replace(/@([^:]+)(\.neon\.tech)/, '@$1-pooler$2');
  }

  if (!_cachedDb || _lastDbUrl !== url) {
    _cachedDb = neon(url) as unknown as DbQuery;
    _lastDbUrl = url;
  }
  return _cachedDb;
}

export function getJwtSecret(): Uint8Array {
  const secret = getEnv("MAI_JWT_SECRET")?.trim() || getEnv("JWT_SECRET")?.trim();
  if (!secret) {
    // Ne jamais générer un secret de secours : un secret partagé par défaut
    // permettrait à quiconque de forger des sessions JWT.
    throw new Error("JWT secret is not configured");
  }
  if (secret.length < 32) {
    throw new Error("JWT secret must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

// ─────────────────────────────────────────────
// Helpers d'authentification & Utilitaires
// ─────────────────────────────────────────────
export async function signToken(
  payload: Record<string, unknown>
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyToken(
  token: string
): Promise<Record<string, unknown>> {
  // Vérif SQLite (legacy Val Town)
  try {
    const sqliteResult = await sqlite.execute({
      args: [token],
      sql: "SELECT 1 FROM token_blacklist WHERE token = ?",
    });
    if (sqliteResult && sqliteResult.rows && sqliteResult.rows.length > 0) {
      throw new Error("Token révoqué.");
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Token révoqué.") throw e;
  }

  // Vérif Postgres token_blacklist avec TTL 14j
  try {
    const sql = getDb();
    const pgResult =
      await sql`SELECT 1 FROM token_blacklist WHERE token = ${token} LIMIT 1`;
    if (pgResult && pgResult.length > 0) {
      throw new Error("Token révoqué.");
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Token révoqué.") throw e;
  }

  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as Record<string, unknown>;
}

export async function blacklistToken(token: string): Promise<boolean> {
  const normalizedToken = token?.trim();
  if (!normalizedToken) return false;

  const expiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ).toISOString();
  let stored = false;

  try {
    await sqlite.execute({
      args: [normalizedToken],
      sql: "INSERT OR IGNORE INTO token_blacklist (token) VALUES (?)",
    });
    stored = true;
  } catch {
    // PostgreSQL peut être la seule source disponible (ou inversement).
  }

  try {
    const sql = getDb();
    await sql`INSERT INTO token_blacklist (token, revoked_at, expires_at) VALUES (${normalizedToken}, NOW(), ${expiresAt}::timestamp) ON CONFLICT (token) DO NOTHING`;
    stored = true;
  } catch {
    // Une source peut être indisponible pendant un déploiement ; l'autre
    // blacklist suffit à révoquer le jeton si elle a bien été écrite.
  }

  // Nettoyage opportuniste des vieux tokens
  try {
    const sql = getDb();
    await sql`DELETE FROM token_blacklist WHERE expires_at < NOW() OR revoked_at < NOW() - INTERVAL '14 days'`;
  } catch {
    // Le nettoyage PostgreSQL est opportuniste.
  }
  try {
    await sqlite.execute({
      sql: "DELETE FROM token_blacklist WHERE revoked_at < datetime('now', '-14 days')",
      args: [],
    });
  } catch {
    // Le nettoyage SQLite est opportuniste.
  }

  // Ne jamais annoncer une déconnexion réussie si aucune source n'a pu être
  // écrite : l'appelant peut alors renvoyer une erreur explicite.
  return stored;
}

export function extractToken(req: Request): string | null {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  const match = auth?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

export function parseUserAgent(ua: string) {
  const uaLower = ua.toLowerCase();
  let os = "linux";
  let osVersion = "Linux";

  if (uaLower.includes("iphone")) {
    os = "apple";
    osVersion = "iPhone (iOS)";
  } else if (uaLower.includes("ipad")) {
    os = "apple";
    osVersion = "iPad (iPadOS)";
  } else if (uaLower.includes("mac os") || uaLower.includes("macintosh")) {
    os = "apple";
    osVersion = "macOS";
  } else if (
    uaLower.includes("windows nt 10.0") ||
    uaLower.includes("windows 11") ||
    uaLower.includes("windows 10")
  ) {
    os = "microsoft";
    osVersion = "Windows 10/11";
  } else if (uaLower.includes("win")) {
    os = "microsoft";
    osVersion = "Windows";
  } else if (uaLower.includes("android")) {
    os = "google";
    osVersion = "Android";
  } else if (uaLower.includes("ubuntu")) {
    os = "linux";
    osVersion = "Ubuntu Linux";
  } else if (uaLower.includes("debian")) {
    os = "linux";
    osVersion = "Debian Linux";
  } else if (uaLower.includes("fedora")) {
    os = "linux";
    osVersion = "Fedora Linux";
  }

  let model = "Navigateur Web";
  let version = "";

  if (uaLower.includes("mai-cli") || uaLower.includes("mai cli")) {
    model = "mAI CLI";
    version = "Terminal";
  } else if (uaLower.includes("pulse-extension") || uaLower.includes("pulse")) {
    model = "Pulse Extension";
    version = "Extension";
  } else if (uaLower.includes("edg/")) {
    model = "Microsoft Edge";
    const match = ua.match(/Edg\/([0-9.]+)/i);
    if (match) {
      version = `v${match[1].split(".")[0]}`;
    }
  } else if (uaLower.includes("opr/") || uaLower.includes("opera/")) {
    model = "Opera";
    const match = ua.match(/(?:OPR|Opera)\/([0-9.]+)/i);
    if (match) {
      version = `v${match[1].split(".")[0]}`;
    }
  } else if (uaLower.includes("chrome/")) {
    model = "Google Chrome";
    const match = ua.match(/Chrome\/([0-9.]+)/i);
    if (match) {
      version = `v${match[1].split(".")[0]}`;
    }
  } else if (uaLower.includes("firefox/")) {
    model = "Mozilla Firefox";
    const match = ua.match(/Firefox\/([0-9.]+)/i);
    if (match) {
      version = `v${match[1].split(".")[0]}`;
    }
  } else if (uaLower.includes("safari/") && !uaLower.includes("chrome")) {
    model = "Apple Safari";
    const match = ua.match(/Version\/([0-9.]+)/i);
    if (match) {
      version = `v${match[1].split(".")[0]}`;
    }
  }

  const fullVersion = version ? `${osVersion} • ${version}` : osVersion;
  const osLabel =
    os === "apple"
      ? "Apple"
      : os === "microsoft"
        ? "Windows"
        : os === "google"
          ? "Google"
          : "Linux";
  const deviceName = `${model} (${osLabel})`;

  return {
    device_model: model,
    device_name: deviceName,
    device_version: fullVersion,
    os,
  };
}

export function getWeekData() {
  const now = new Date();
  const day = now.getUTCDay() || 7;

  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - (day - 1));
  weekStart.setUTCHours(0, 0, 0, 0);

  const nextReset = new Date(weekStart);
  nextReset.setUTCDate(weekStart.getUTCDate() + 7);

  return {
    nextResetIso: nextReset.toISOString(),
    weekStartStr: weekStart.toISOString().split("T")[0],
  };
}

// ─────────────────────────────────────────────
// E-mails & Vérification (SQLite)
// ─────────────────────────────────────────────
let sqliteReady = false;

export async function initSQLite() {
  if (sqliteReady) return;
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      email TEXT,
      code TEXT,
      action TEXT,
      expires_at DATETIME,
      PRIMARY KEY (email, action)
    );
  `);
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      token TEXT PRIMARY KEY,
      revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqliteReady = true;
  console.log("[SQLite] Tables de vérification initialisées.");
}

export async function generateVerificationCode(
  email: string,
  action: string
): Promise<string> {
  // Assure que les tables SQLite existent (retry si l'init au démarrage a échoué)
  await initSQLite();

  const isDeletion = action === "delete_account";
  const length = isDeletion ? 8 : 6;
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  // Crypto PRNG (corrige Math.random prévisible)
  const range = max - min;
  const randomValue =
    crypto.getRandomValues(new Uint32Array(1))[0] / 0xff_ff_ff_ff;
  const code = Math.floor(min + randomValue * range)
    .toString()
    .padStart(length, "0");
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString(); // 10 minutes

  await sqlite.execute({
    args: [email, code, action, expiresAt],
    sql: "INSERT OR REPLACE INTO verification_codes (email, code, action, expires_at) VALUES (?, ?, ?, ?)",
  });

  return code;
}

export async function verifyVerificationCode(
  email: string,
  code: string,
  action: string
): Promise<boolean> {
  // Assure que les tables SQLite existent
  await initSQLite();

  const result = await sqlite.execute({
    args: [email, action],
    sql: "SELECT code, expires_at FROM verification_codes WHERE email = ? AND action = ?",
  });

  if (result.rows.length === 0) {
    return false;
  }

  const storedCode = result.rows[0][0] as string;
  const expiresAt = new Date(result.rows[0][1] as string);

  if (expiresAt < new Date()) {
    await sqlite.execute({
      args: [email, action],
      sql: "DELETE FROM verification_codes WHERE email = ? AND action = ?",
    });
    return false;
  }

  if (storedCode === code) {
    await sqlite.execute({
      args: [email, action],
      sql: "DELETE FROM verification_codes WHERE email = ? AND action = ?",
    });
    return true;
  }

  return false;
}

export { sqlite };
