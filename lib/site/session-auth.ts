import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { MAI_SESSION_COOKIE } from "@/lib/constants";

/**
 * Vérification serveur de la session mAI (JWT HS256 signé par le backend Val Town).
 * L'identité provient exclusivement du token signé ou validé par le backend — jamais d'un en-tête ou d'un champ non vérifié.
 */

export type SessionIdentity = {
  userId: string;
  tier: string;
};

function getSecret(): Uint8Array | null {
  const secret = process.env.MAI_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function verifyMaiSessionToken(
  token: string | null | undefined
): Promise<SessionIdentity | null> {
  const secret = getSecret();
  if (!secret || !token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      requiredClaims: ["exp"],
    });
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
      return null;
    }
    const userId = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!userId) return null;
    return {
      tier: typeof payload.tier === "string" ? payload.tier : "Free",
      userId,
    };
  } catch {
    return null;
  }
}

/**
 * Résolution de l'identité de session :
 * 1. Chemin rapide : validation cryptographique locale HS256 via MAI_JWT_SECRET.
 * 2. Si la vérification locale échoue (secret absent, signature non vérifiée localement),
 *    délègue à l'API distante émettrice via getMaiUser (chemin canonique mAI).
 * 3. Ne retourne une identité que si la session est légitimement confirmée.
 */
export async function resolveSessionIdentity(
  token: string | null | undefined
): Promise<SessionIdentity | null> {
  const cleanToken = token?.trim();
  if (!cleanToken) return null;

  const localIdentity = await verifyMaiSessionToken(cleanToken);
  if (localIdentity) {
    return localIdentity;
  }

  // Fallback canonique : l'API distante tranche.
  const remoteUser = await getMaiUser(cleanToken);
  if (remoteUser && (remoteUser.id || remoteUser.email)) {
    return {
      tier: remoteUser.tier || "Free",
      userId: remoteUser.id || remoteUser.email,
    };
  }

  return null;
}

function extractToken(req: NextRequest): string {
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (bearer) return bearer;
  return (
    req.cookies.get(MAI_SESSION_COOKIE)?.value ||
    req.cookies.get("mai_token")?.value ||
    ""
  );
}

export type SessionAuthResult =
  | { ok: true; identity: SessionIdentity }
  | { ok: false; response: NextResponse };

export async function authenticateSession(
  req: NextRequest
): Promise<SessionAuthResult> {
  const identity = await resolveSessionIdentity(extractToken(req));
  if (!identity) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: "unauthorized",
            message: "Session invalide ou expirée. Reconnectez-vous.",
          },
        },
        { status: 401 }
      ),
    };
  }
  return { identity, ok: true };
}

/** Pour les Server Actions : identité dérivée du cookie de session signé ou validé. */
export async function getSessionIdentity(): Promise<SessionIdentity | null> {
  const store = await cookies();
  const token =
    store.get(MAI_SESSION_COOKIE)?.value || store.get("mai_token")?.value || "";
  return resolveSessionIdentity(token);
}
