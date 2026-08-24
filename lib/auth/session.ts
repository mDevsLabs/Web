import { cookies } from "next/headers";
import { MAI_API_URL, MAI_SESSION_COOKIE } from "@/lib/constants";
export { MAI_SESSION_COOKIE } from "@/lib/constants";
export { getUserApiKey } from "@/lib/db/api-keys";

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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  });
}

export async function removeMaiSessionToken() {
  const cookieStore = await cookies();
  cookieStore.delete(MAI_SESSION_COOKIE);
}

export async function getMaiUser(tokenInput?: string | null): Promise<MaiUser | null> {
  const token = tokenInput || (await getMaiSessionToken());
  if (!token) return null;

  try {
    const res = await fetch(`${MAI_API_URL}/usage`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.error) return null;

    // Récupération de l'id utilisateur (depuis data.id ou payload JWT)
    let userId: string | undefined = data.id ? String(data.id) : undefined;
    if (!userId) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadStr =
            typeof Buffer !== "undefined"
              ? Buffer.from(parts[1], "base64").toString("utf-8")
              : atob(parts[1]);
          const payload = JSON.parse(payloadStr);
          userId = payload.sub ? String(payload.sub) : undefined;
        }
      } catch {}
    }

    return {
      id: userId || data.email,
      username: data.username || "Utilisateur",
      email: data.email || "",
      phone: data.phone || "",
      tier: data.tier || "Free",
      avatarUrl: data.avatarUrl || null,
      tokensUsed: Number(data.tokensUsed || 0),
      limit: Number(data.limit || 500000),
      resetAt: data.resetAt,
      weekStart: data.weekStart,
    };
  } catch (error) {
    console.error("Erreur récupération utilisateur mAI:", error);
    return null;
  }
}
