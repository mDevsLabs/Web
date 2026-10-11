/**
 * ============================================================================
 * VIBE — MISE EN FORME DES LIGNES (lib/vibe/server/shape.ts)
 * ============================================================================
 *
 * Les composants Vibe sont écrits contre les réponses JSON du backend : alias
 * snake_case bruts (`is_verified`, `has_liked`, `actor_username`…), camelCase
 * uniquement là où le backend camélise (`/v1/me`, `vibe-users.ts:98-112`). Un
 * lecteur serveur qui diverge de ces formes casse l'UI sans erreur visible.
 * Les mappers de ce module sont donc des répliques, référencées handler par
 * handler dans les `queries/*` — pas des entités Drizzle.
 *
 * Deux pièges de transport corrigés ici : le driver renvoie des `Date` et des
 * `string` pour les agrégats (`COUNT`/`SUM`), là où le JSON de l'API donnait
 * des chaînes ISO et des nombres. `iso()` et `num()` rétablissent la parité.
 */
import "server-only";

// ── Primitives ──────────────────────────────────────────────────────────────

/** Timestamp → chaîne ISO, comme le ferait un `JSON.stringify` de réponse API. */
export function iso(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

/** Colonne numérique ou agrégat (`COUNT`/`SUM` en string) → number. */
export function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Conversion profonde Date → chaîne ISO. Le transport JSON de l'API faisait ce
 * travail gratuitement ; une frontière RSC, elle, préserve les objets `Date`
 * — et le client Vibe fait `new Date(post.published_at)` ou compare des
 * chaînes. Les graines de lecture doivent donc voyager en strings.
 */
export function isoDeep(value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(isoDeep);
  }
  if (
    value &&
    typeof value === "object" &&
    (value.constructor === Object || value.constructor === undefined)
  ) {
    const out: Record<string, any> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = isoDeep(entry);
    }
    return out;
  }
  return value;
}

// ── Forfaits et quotas (réplique backend) ───────────────────────────────────

type Tier = "Free" | "Plus" | "Pro" | "Max";

const TIER_ALIASES: Record<string, Tier> = {
  free: "Free",
  gratuit: "Free",
  max: "Max",
  plus: "Plus",
  pro: "Pro",
};

/** Normalise un tier de la base — retombe sur Free, jamais l'inverse. */
export function normalizeVibeTier(tier?: string | null): Tier {
  return (
    TIER_ALIASES[
      String(tier || "")
        .trim()
        .toLowerCase()
    ] || "Free"
  );
}

/** Limites hebdo de tokens mAI — miroir `config.ts:74-83`. */
const MAI_TOKEN_LIMITS: Record<Tier, number> = {
  Free: 10_000_000,
  Max: 50_000_000,
  Plus: 20_000_000,
  Pro: 30_000_000,
};

/** Génération d'images/jour — miroir `config.ts:166-175`. */
const DAILY_IMAGE_LIMITS: Record<Tier, number> = {
  Free: 5,
  Max: 35,
  Plus: 10,
  Pro: 20,
};

/** Semaine UTC (lundi→dimanche) — réplique `config.ts:425-440`. */
export function getVibeWeekData(): {
  nextResetIso: string;
  weekStartStr: string;
} {
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

// ── Payload /v1/me ──────────────────────────────────────────────────────────

/**
 * Réplique exacte du corps de `handleMe` (`vibe-users.ts:97-123`) :
 * `{ profile, quotas, user }`, camelCase pour le profil, snake_case pour
 * l'utilisateur. `row` = ligne de la jointure `users ⨝ profiles`.
 */
export function buildMePayload(
  row: any,
  tokensUsedRaw: unknown,
  imagesUsedRaw: unknown
): { profile: any; quotas: any; user: any } {
  const tier = row.tier || "Free";
  const tokenLimit = MAI_TOKEN_LIMITS[normalizeVibeTier(tier)];
  const imageLimit = DAILY_IMAGE_LIMITS[normalizeVibeTier(tier)];
  const tokensUsed = num(tokensUsedRaw);
  const imagesUsed = num(imagesUsedRaw);
  const { nextResetIso } = getVibeWeekData();

  return {
    profile: {
      avatarUrl: row.avatar_url,
      bannerUrl: row.banner_url,
      bio: row.bio || "",
      displayName: row.display_name || row.username,
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      id: row.id,
      interests: row.interests || [],
      is_verified: Boolean(row.is_verified),
      location: row.location || "",
      postsCount: row.posts_count || 0,
      username: row.username,
      website: row.website || "",
    },
    quotas: {
      dailyImages: {
        limit: imageLimit,
        percent: Math.min(100, Math.round((imagesUsed / imageLimit) * 100)),
        used: imagesUsed,
      },
      resetAt: nextResetIso,
      tier,
      weeklyTokens: {
        limit: tokenLimit,
        percent: Math.min(100, Math.round((tokensUsed / tokenLimit) * 100)),
        used: tokensUsed,
      },
    },
    user: {
      avatar_url: row.avatar_url,
      created_at: iso(row.created_at),
      email: row.email,
      id: row.id,
      is_verified: Boolean(row.is_verified),
      tier: row.tier,
      username: row.username,
    },
  };
}
