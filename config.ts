import { sqlite } from "https://esm.town/v/std/sqlite";
import { type NeonQueryFunction, neon } from "npm:@neondatabase/serverless";
import { jwtVerify, SignJWT } from "npm:jose";
import type {} from "./api-context.ts";
import {
  AccountBlockedError,
  AuthAuthorityUnavailableError,
  evaluateRevocationProbes,
} from "./auth-revocation.ts";

// ─────────────────────────────────────────────
// Config & Données
// ─────────────────────────────────────────────
export const JWT_EXPIRY = "7d";
export const BCRYPT_ROUNDS = 12;
const MAX_VERIFICATION_ATTEMPTS = 5;

// ─────────────────────────────────────────────
// Rate limiting en mémoire (par clé : ip ou user)
// ─────────────────────────────────────────────
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  // `>=` et non `>` : à l'instant exact d'expiration la fenêtre est close, et
  // la fenêtre annoncée vaut `windowMs`, pas `windowMs + 1`.
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/**
 * Limiteur PARTAGÉ (SQLite Val Town) pour les parcours de sécurité qui doivent
 * couvrir plusieurs isolates : connexion, inscription, vérification de code,
 * renvoi de code. Un compteur uniquement en mémoire se contourne en répartissant
 * les requêtes sur plusieurs instances.
 *
 * Politique d'indisponibilité : repli explicite sur le seau LOCAL (dégradé,
 * journalisé). Un attaquant ne gagne alors qu'un facteur « nombre d'isolates »,
 * jamais une absence totale de limite, et les utilisateurs légitimes ne sont
 * pas enfermés dehors par une panne de SQLite.
 */
export async function rateLimitShared(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now();
  const resetAt = now + windowMs;
  try {
    await initSQLite();
    const result = await sqlite.execute({
      args: [key, resetAt, now, now, resetAt],
      sql: `INSERT INTO request_rate_limits (bucket_key, hits, reset_at)
            VALUES (?, 1, ?)
            ON CONFLICT(bucket_key) DO UPDATE SET
              hits = CASE WHEN request_rate_limits.reset_at <= ? THEN 1 ELSE request_rate_limits.hits + 1 END,
              reset_at = CASE WHEN request_rate_limits.reset_at <= ? THEN ? ELSE request_rate_limits.reset_at END
            RETURNING hits`,
    });
    const hits = Number(result?.rows?.[0]?.[0] ?? 1);
    return hits <= limit;
  } catch (error) {
    console.error(
      "[ratelimit] Limiteur partagé indisponible, repli local:",
      error instanceof Error ? error.message : String(error)
    );
    return rateLimit(key, limit, windowMs);
  }
}

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-f:]+$/i;

function normalizeIp(value: string | undefined): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  let candidate = raw;
  if (candidate.startsWith("[")) {
    const closing = candidate.indexOf("]");
    candidate = closing > 0 ? candidate.slice(1, closing) : candidate;
  } else if (candidate.includes(":")) {
    // « 198.51.100.4:8080 » : le suffixe est un port, pas une adresse IPv6.
    const lastColon = candidate.lastIndexOf(":");
    const hostPart = candidate.slice(0, lastColon);
    const portPart = candidate.slice(lastColon + 1);
    if (IPV4_RE.test(hostPart) && /^\d+$/.test(portPart)) {
      candidate = hostPart;
    }
  }
  candidate = candidate.trim();
  if (IPV4_RE.test(candidate)) {
    const octets = candidate.split(".").map(Number);
    if (octets.every((o) => Number.isInteger(o) && o >= 0 && o <= 255)) {
      return candidate;
    }
    return null;
  }
  if (IPV6_RE.test(candidate) && candidate.includes(":")) {
    return candidate.toLowerCase();
  }
  return null;
}

/**
 * Adresse cliente pour les limites de sécurité.
 *
 * Le proxy de bord du déploiement ajoute l'adresse qu'il observe en DERNIÈRE
 * position de X-Forwarded-For. Lire la première valeur revenait à lire une
 * valeur fournie par le client : elle changeait à chaque requête et
 * contournait tous les seaux. On ne retient donc que la dernière entrée
 * syntaxiquement valide, puis x-real-ip, sinon « unknown ».
 */
export function clientIp(c: any): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part: string) => normalizeIp(part))
      .filter((value: string | null): value is string => Boolean(value));
    if (parts.length > 0) {
      return parts.at(-1) as string;
    }
  }
  return normalizeIp(c.req.header("x-real-ip")) || "unknown";
}

export type Tier = "Free" | "Plus" | "Pro" | "Max";

const TIER_ALIASES: Record<string, Tier> = {
  free: "Free",
  gratuit: "Free",
  max: "Max",
  plus: "Plus",
  pro: "Pro",
};

/**
 * Normalise n'importe quelle représentation de forfait venant de la base, d'une clé API
 * ou d'un JWT ("gratuit", " PRO ", "max") en tier canonique.
 * Une valeur vide ou inconnue retombe sur "Free", comme l'ancien `MAP[t] || MAP["Free"]`.
 */
export function normalizeTier(tier?: string | null): Tier {
  return (
    TIER_ALIASES[
      String(tier || "")
        .trim()
        .toLowerCase()
    ] || "Free"
  );
}

export function isPaidTier(tier?: string | null): boolean {
  return normalizeTier(tier) !== "Free";
}

// Limites de tokens mAI hebdomadaires (Input + Output)
export const TIER_LIMITS: Record<Tier, number> = {
  Free: 10_000_000,
  Max: 50_000_000,
  Plus: 20_000_000,
  Pro: 30_000_000,
};

export function getTierMaiTokenLimit(tier?: string | null): number {
  return TIER_LIMITS[normalizeTier(tier)];
}

// Limites de tokens Speech hebdomadaires
export const TIER_SPEECH_LIMITS: Record<Tier, number> = {
  Free: 30_000_000,
  Max: 300_000_000,
  Plus: 75_000_000,
  Pro: 150_000_000,
};

export function getTierSpeechLimit(tier?: string | null): number {
  return TIER_SPEECH_LIMITS[normalizeTier(tier)];
}

// Limites de requêtes API hebdomadaires (remise à zéro le lundi 00:00 UTC)
export const TIER_REQUEST_LIMITS: Record<Tier, number> = {
  Free: 500,
  Max: 7500,
  Plus: 1500,
  Pro: 3000,
};

export function getTierRequestLimit(tier?: string | null): number {
  return TIER_REQUEST_LIMITS[normalizeTier(tier)];
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
  Max: 35,
  Plus: 10,
  Pro: 20,
};

export function getTierDailyImageLimit(tier?: string | null): number {
  return TIER_DAILY_IMAGE_LIMITS[normalizeTier(tier)];
}

// Nombre de Stories Vibe publiables par jour. Table à part de
// TIER_DAILY_IMAGE_LIMITS : une story n'est pas une image générée par l'IA, et
// partager les compteurs corromprait les deux quotas (voyez
// vibe_story_usage_daily dans la migration 026).
//
// `null` = illimité, réservé au forfait Max — la valeur n'est PAS ramenée à un
// nombre par un quelconque défaut : l'appelant doit traiter `null` explicitement.
//
// Ce quota n'est jamais affiché dans /settings (choix produit) : il n'a donc pas
// de pendant dans lib/plans/tier-limits.ts, côté Next.
export const TIER_DAILY_STORY_LIMITS: Record<Tier, number | null> = {
  Free: 1,
  Max: null,
  Plus: 5,
  Pro: 10,
};

/** Limite quotidienne de stories. `null` = illimité (Max) : aucune vérification. */
export function getTierDailyStoryLimit(tier?: string | null): number | null {
  return TIER_DAILY_STORY_LIMITS[normalizeTier(tier)];
}

// Coût en requêtes API par image générée (multiplié par le nombre d'images demandées)
export const TIER_IMAGE_REQUEST_COST: Record<Tier, number> = {
  Free: 100,
  Max: 10,
  Plus: 50,
  Pro: 25,
};

export function getTierImageRequestCost(tier?: string | null): number {
  return TIER_IMAGE_REQUEST_COST[normalizeTier(tier)];
}

// Limites de stockage Cloud par tier (en octets)
const GIB = 1024 * 1024 * 1024;

export const STORAGE_LIMITS_BYTES: Record<Tier, number> = {
  Free: 10 * GIB,
  Max: 60 * GIB,
  Plus: 20 * GIB,
  Pro: 40 * GIB,
};

export function getTierStorageLimitBytes(tier?: string | null): number {
  return STORAGE_LIMITS_BYTES[normalizeTier(tier)];
}

// Taille maximale d'UN SEUL fichier envoyé via /upload-file (images, vidéos,
// documents d'un post ou d'un message). À ne pas confondre avec
// STORAGE_LIMITS_BYTES ci-dessus, qui est le quota de stockage Cloud cumulé.
//
// Le plafonnement par forfait rétablit la parole tenue par l'interface
// (`lib/vibe/services/tierLimits.ts` annonçait 1 Go aux payants alors que le
// serveur refusait tout ce qui dépassait 50 Mo, quel que soit le compte).
//
// La borne des Stories Vibe (50 Mo, tous forfaits) est un contrat produit
// distinct : elle est recontrôlée à la création de la story, pas ici.
const MIB = 1024 * 1024;

export const MEDIA_UPLOAD_LIMITS_BYTES: Record<Tier, number> = {
  Free: 50 * MIB,
  Max: GIB,
  Plus: GIB,
  Pro: GIB,
};

/**
 * Taille maximale autorisée pour un envoi, selon le forfait.
 * Un forfait illisible retombe sur `Free` : la limite se réduit, ne s'étend jamais.
 */
export function getTierMediaUploadLimitBytes(tier?: string | null): number {
  return MEDIA_UPLOAD_LIMITS_BYTES[normalizeTier(tier)];
}

let _cachedDb: NeonQueryFunction<false, false> | null = null;
let _lastDbUrl: string | null = null;

export function getDb() {
  const rawUrl =
    (typeof (globalThis as any).Deno === "undefined"
      ? null
      : (globalThis as any).Deno.env?.get("DATABASE_URL")) ||
    (typeof process === "undefined" ? null : process.env?.DATABASE_URL);
  if (!rawUrl) {
    throw new Error("DATABASE_URL not set");
  }

  // Activer automatiquement le mode connection pooler Neon (-pooler) si disponible
  let url = rawUrl;
  if (url.includes(".neon.tech") && !url.includes("-pooler")) {
    url = url.replace(/@([^:]+)(\.neon\.tech)/, "@$1-pooler$2");
  }

  if (!_cachedDb || _lastDbUrl !== url) {
    _cachedDb = neon<false, false>(url);
    _lastDbUrl = url;
  }
  return _cachedDb;
}

export function getJwtSecret(): Uint8Array {
  const denoSecret =
    typeof Deno === "undefined"
      ? null
      : Deno.env.get("MAI_JWT_SECRET") || Deno.env.get("JWT_SECRET");
  const nodeSecret =
    typeof process === "undefined"
      ? null
      : process.env.MAI_JWT_SECRET || process.env.JWT_SECRET;
  const secret = denoSecret || nodeSecret || "";
  const encoded = new TextEncoder().encode(secret);
  if (encoded.byteLength < 32) {
    throw new Error(
      "MAI_JWT_SECRET doit être configuré avec au moins 32 octets."
    );
  }
  return encoded;
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
  // Valider d’abord la signature et l’expiration : aucun accès réseau pour un JWT invalide.
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    requiredClaims: ["exp"],
  });
  // Une seule autorité « révoqué » suffit. Une autorité muette rend l'état
  // INCONNU : le jeton n'est alors jamais accepté sur sa seule signature, et
  // l'appelant reçoit une erreur temporaire (503) au lieu d'un refus définitif.
  const revocation = await evaluateRevocationProbes([
    async () => {
      try {
        const result = await sqlite.execute({
          args: [token],
          sql: "SELECT 1 FROM token_blacklist WHERE token = ?",
        });
        return result?.rows?.length ? "revoked" : "active";
      } catch {
        return "unavailable";
      }
    },
    async () => {
      try {
        const sql = getDb();
        const rows =
          await sql`SELECT 1 FROM token_blacklist WHERE token = ${token} LIMIT 1`;
        return rows.length > 0 ? "revoked" : "active";
      } catch {
        return "unavailable";
      }
    },
  ]);
  if (revocation === "revoked") throw new Error("Token révoqué.");
  if (revocation === "unknown") {
    throw new AuthAuthorityUnavailableError(
      "État de révocation du jeton indisponible."
    );
  }

  // L'état du compte est vérifié à chaque usage du jeton : un blocage
  // administrateur ne dépend ni de la liste noire ni de l'expiration.
  const subject = payload.sub ? String(payload.sub) : "";
  if (subject) {
    try {
      const sql = getDb();
      const users = await sql`
        SELECT is_blocked FROM users
        WHERE id::text = ${subject}::text
           OR username = ${subject}::text
           OR email = ${subject}::text
        LIMIT 1
      `;
      if (users.length > 0 && users[0].is_blocked === true) {
        throw new AccountBlockedError();
      }
    } catch (error) {
      if (error instanceof AccountBlockedError) throw error;
      throw new AuthAuthorityUnavailableError("État du compte indisponible.");
    }
  }

  return payload as Record<string, unknown>;
}

export async function blacklistToken(token: string) {
  const expiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ).toISOString();
  try {
    await sqlite.execute({
      args: [token],
      sql: "INSERT OR IGNORE INTO token_blacklist (token) VALUES (?)",
    });
  } catch {}
  try {
    const sql = getDb();
    await sql`INSERT INTO token_blacklist (token, revoked_at, expires_at) VALUES (${token}, NOW(), ${expiresAt}::timestamp) ON CONFLICT (token) DO NOTHING`;
  } catch {}
  // Nettoyage opportuniste des vieux tokens
  try {
    const sql = getDb();
    await sql`DELETE FROM token_blacklist WHERE expires_at < NOW() OR revoked_at < NOW() - INTERVAL '14 days'`;
  } catch {}
  try {
    await sqlite.execute({
      args: [],
      sql: "DELETE FROM token_blacklist WHERE revoked_at < datetime('now', '-14 days')",
    });
  } catch {}
}

export function extractToken(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7);
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
      attempts INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (email, action)
    );
  `);
  // Migration additive pour les bases SQLite déjà créées.
  const verificationCodeColumns = await sqlite.execute(
    "PRAGMA table_info(verification_codes)"
  );
  if (
    !verificationCodeColumns.rows.some(
      (row: any) => String(row[1]) === "attempts"
    )
  ) {
    await sqlite.execute(
      "ALTER TABLE verification_codes ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0"
    );
  }
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      token TEXT PRIMARY KEY,
      revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS request_rate_limits (
      bucket_key TEXT PRIMARY KEY,
      hits INTEGER NOT NULL DEFAULT 0,
      reset_at INTEGER NOT NULL
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
    sql: "INSERT OR REPLACE INTO verification_codes (email, code, action, expires_at, attempts) VALUES (?, ?, ?, ?, 0)",
  });

  return code;
}

/**
 * Régénère le code d'une demande DÉJÀ existante, sans remettre le compteur
 * d'essais à zéro. Renvoie null si aucune demande vivante n'existe : un renvoi
 * ne crée jamais de code pour une adresse ou une action arbitraire.
 */
export async function regenerateVerificationCode(
  email: string,
  action: string
): Promise<{ code: string; expiresAt: string } | null> {
  await initSQLite();
  const current = await sqlite.execute({
    args: [email, action],
    sql: "SELECT code, attempts, expires_at FROM verification_codes WHERE email = ? AND action = ?",
  });
  if (current.rows.length === 0) {
    return null;
  }
  const [, attemptsRaw, expiresAtRaw] = current.rows[0] as any[];
  const attempts = Number(attemptsRaw || 0);
  const expiresAtMs = new Date(String(expiresAtRaw)).getTime();
  if (
    !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= Date.now() ||
    attempts >= MAX_VERIFICATION_ATTEMPTS
  ) {
    return null;
  }
  const length = action === "delete_account" ? 8 : 6;
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const randomValue =
    crypto.getRandomValues(new Uint32Array(1))[0] / 0xff_ff_ff_ff;
  const code = Math.floor(min + randomValue * (max - min))
    .toString()
    .padStart(length, "0");
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const updated = await sqlite.execute({
    args: [code, expiresAt, email, action, attempts],
    sql: "UPDATE verification_codes SET code = ?, expires_at = ? WHERE email = ? AND action = ? AND attempts = ? RETURNING email",
  });
  if (updated.rows.length === 0) {
    // Course avec une vérification concurrente : ne jamais ressusciter un code.
    return null;
  }
  return { code, expiresAt };
}

export async function verifyVerificationCode(
  email: string,
  code: string,
  action: string
): Promise<boolean> {
  await initSQLite();

  const now = new Date().toISOString();
  const normalizedCode = String(code).trim();
  // La consommation et le compteur sont atomiques pour résister aux essais concurrents.
  const accepted = await sqlite.execute({
    args: [email, normalizedCode, action, now, MAX_VERIFICATION_ATTEMPTS],
    sql: "DELETE FROM verification_codes WHERE email = ? AND code = ? AND action = ? AND expires_at >= ? AND attempts < ? RETURNING email",
  });
  if (accepted.rows.length > 0) {
    return true;
  }

  const failedAttempt = await sqlite.execute({
    args: [email, action, normalizedCode, now, MAX_VERIFICATION_ATTEMPTS],
    sql: "UPDATE verification_codes SET attempts = attempts + 1 WHERE email = ? AND action = ? AND code != ? AND expires_at >= ? AND attempts < ? RETURNING attempts",
  });
  if (
    failedAttempt.rows.length > 0 &&
    Number(failedAttempt.rows[0][0]) >= MAX_VERIFICATION_ATTEMPTS
  ) {
    await sqlite.execute({
      args: [email, action],
      sql: "DELETE FROM verification_codes WHERE email = ? AND action = ?",
    });
  } else if (failedAttempt.rows.length === 0) {
    // Nettoie un code expiré ou déjà verrouillé.
    await sqlite.execute({
      args: [email, action, now, MAX_VERIFICATION_ATTEMPTS],
      sql: "DELETE FROM verification_codes WHERE email = ? AND action = ? AND (expires_at < ? OR attempts >= ?)",
    });
  }

  return false;
}

export { sqlite };
