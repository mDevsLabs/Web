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
const CACHE_TTL_MS = 15_000; // 15 secondes

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

export async function getMaiUser(
  tokenInput?: string | null
): Promise<MaiUser | null> {
  const token = tokenInput || (await getMaiSessionToken());
  if (!token) {
    return null;
  }

  // Vérifier le cache mémoire court
  const cached = userCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.user;
  }

  try {
    const res = await fetch(`${MAI_API_URL}/usage`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        // Récupération de l'id utilisateur (depuis data.id ou payload JWT)
        let userId: string | undefined = data.id ? String(data.id) : undefined;
        if (!userId) {
          const payload = decodeJwtPayload(token);
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

  // Fallback JWT si Val Town est temporairement indisponible ou en rate-limit
  const fallbackPayload = decodeJwtPayload(token);
  if (fallbackPayload && (fallbackPayload.email || fallbackPayload.sub)) {
    // Vérifier l'expiration du JWT si présente
    if (!fallbackPayload.exp || fallbackPayload.exp * 1000 > Date.now()) {
      const fallbackUser: MaiUser = {
        avatarUrl: fallbackPayload.avatarUrl || null,
        email: fallbackPayload.email || "",
        id: fallbackPayload.id
          ? String(fallbackPayload.id)
          : fallbackPayload.sub
            ? String(fallbackPayload.sub)
            : fallbackPayload.email || "",
        limit: Number(fallbackPayload.limit || 2_000_000),
        phone: fallbackPayload.phone || "",
        resetAt: fallbackPayload.resetAt,
        tier: fallbackPayload.tier || "Free",
        tokensUsed: Number(fallbackPayload.tokensUsed || 0),
        username: fallbackPayload.username || fallbackPayload.name || "Utilisateur",
        weekStart: fallbackPayload.weekStart,
      };

      // Mettre en cache pour quelques secondes
      userCache.set(token, {
        expiresAt: Date.now() + 5_000,
        user: fallbackUser,
      });
      return fallbackUser;
    }
  }

  return null;
}
