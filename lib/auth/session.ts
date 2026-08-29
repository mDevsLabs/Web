import { cookies } from "next/headers";
import { MAI_API_URL, MAI_SESSION_COOKIE } from "@/lib/constants";

export { MAI_SESSION_COOKIE } from "@/lib/constants";

export type MaiUser = {
  id?: string;
  username: string;
  email: string;
  phone?: string;
  tier: "Free" | "Plus" | "Pro" | "Max" | string;
  avatarUrl?: string | null;
  tokensUsed: number;
  limit: number;
  resetAt?: string;
  weekStart?: string;
};

export async function getMaiSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(MAI_SESSION_COOKIE)?.value;
    return token || null;
  } catch {
    return null;
  }
}

export async function setMaiSessionToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(MAI_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

const userCache = new Map<string, { user: MaiUser; expiresAt: number }>();
const CACHE_TTL_MS = 120_000; // 2 minutes de cache en mémoire

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payloadStr =
        typeof Buffer === "undefined"
          ? atob(parts[1])
          : Buffer.from(parts[1], "base64").toString("utf-8");
      return JSON.parse(payloadStr);
    }
  } catch {}
  return null;
}

export async function removeMaiSessionToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MAI_SESSION_COOKIE)?.value;
  if (token) {
    userCache.delete(token);
  }
  cookieStore.delete(MAI_SESSION_COOKIE);
}

// Rafraîchissement asynchrone non-bloquant des quotas mAI
function triggerBackgroundUsageRefresh(token: string) {
  fetch(`${MAI_API_URL}/usage`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data && !data.error) {
        const cached = userCache.get(token);
        if (cached) {
          cached.user.tokensUsed = Number(data.tokensUsed || cached.user.tokensUsed);
          cached.user.limit = Number(data.limit || cached.user.limit);
          cached.user.tier = data.tier || cached.user.tier;
          cached.expiresAt = Date.now() + CACHE_TTL_MS;
        }
      }
    })
    .catch(() => {});
}

export async function getMaiUser(
  tokenInput?: string | null
): Promise<MaiUser | null> {
  const token = tokenInput || (await getMaiSessionToken());
  if (!token) {
    return null;
  }

  // 1. Cache mémoire valide
  const cached = userCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.user;
  }

  // 2. Décodage immédiat depuis le JWT local (instantané < 1ms)
  const payload = decodeJwtPayload(token);
  if (payload && (payload.email || payload.sub)) {
    // Vérifier l'expiration du JWT si présente
    if (!payload.exp || payload.exp * 1000 > Date.now()) {
      const user: MaiUser = {
        avatarUrl: payload.avatarUrl || null,
        email: payload.email || "",
        id: payload.id ? String(payload.id) : payload.sub ? String(payload.sub) : payload.email || "",
        limit: Number(payload.limit || 2_000_000),
        phone: payload.phone || "",
        resetAt: payload.resetAt,
        tier: payload.tier || "Free",
        tokensUsed: Number(payload.tokensUsed || 0),
        username: payload.username || payload.name || "Utilisateur",
        weekStart: payload.weekStart,
      };

      userCache.set(token, { expiresAt: Date.now() + CACHE_TTL_MS, user });
      // Lancer le rafraîchissement d'usage en arrière-plan sans bloquer la requête
      triggerBackgroundUsageRefresh(token);
      return user;
    }
  }

  // 3. Fallback réseau si JWT non présent
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${MAI_API_URL}/usage`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        let userId: string | undefined = data.id ? String(data.id) : undefined;
        if (!userId && payload) {
          userId = payload?.sub ? String(payload.sub) : undefined;
        }

        const user: MaiUser = {
          avatarUrl: data.avatarUrl || null,
          email: data.email || "",
          id: userId || data.email,
          limit: Number(data.limit || 2_000_000),
          phone: data.phone || "",
          resetAt: data.resetAt,
          tier: data.tier || "Free",
          tokensUsed: Number(data.tokensUsed || 0),
          username: data.username || "Utilisateur",
          weekStart: data.weekStart,
        };

        userCache.set(token, { expiresAt: Date.now() + CACHE_TTL_MS, user });
        return user;
      }
    }
  } catch (error) {
    console.error("Erreur récupération utilisateur mAI:", error);
  }

  return null;
}
