// Sélection du jeton de session mAI remis à Coder.
//
// Le cookie de session est httpOnly : seul le Main peut le lire. Plusieurs
// cookies peuvent cohabiter (anciens alias, autre sous-domaine, cookie de
// mesure), donc on ne prend pas le premier venu : les noms connus passent
// d'abord, puis on vérifie que la valeur est bien un JWT non expiré. Un cookie
// quelconque de forme `a.b.c` ne doit jamais être transmis à la place de la
// session — Coder afficherait alors un compte qui n'existe pas.

/** Noms déjà utilisés par le Web, du plus récent au plus ancien. */
export const SESSION_COOKIE_NAMES = [
  "mai_session_token",
  "__Secure-mai_session_token",
  "__Host-mai_session_token",
  "mai_token",
] as const;

export interface SessionCookie {
  name: string;
  value: string;
  expirationDate?: number;
}

export type JwtPayload = Record<string, unknown>;

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Décode le payload d'un JWT SANS vérifier sa signature.
 *
 * Sert uniquement à écarter un jeton manifestement expiré ou sans identité
 * avant de le confier à Coder. L'autorité reste le backend, qui vérifie la
 * signature et tranche via /usage.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return null;
  }
  const decoded = decodeBase64Url(parts[1]!);
  if (!decoded) {
    return null;
  }
  try {
    const payload = JSON.parse(decoded) as unknown;
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as JwtPayload)
      : null;
  } catch {
    return null;
  }
}

function identityOf(payload: JwtPayload): string {
  for (const key of ["sub", "email", "username", "user_id"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

/** Vrai si la valeur peut être remise à Coder comme jeton de session. */
export function isUsableSessionToken(
  value: string,
  now: number = Date.now()
): boolean {
  const token = value.trim();
  if (!token || token.length > 8192) {
    return false;
  }
  const payload = decodeJwtPayload(token);
  if (!payload || !identityOf(payload)) {
    return false;
  }
  const exp = payload.exp;
  if (
    typeof exp === "number" &&
    Number.isFinite(exp) &&
    exp * 1000 <= now
  ) {
    return false;
  }
  return true;
}

function isLikelySessionName(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    normalized.includes("session") ||
    normalized.includes("token") ||
    normalized.includes("auth")
  );
}

function latestValid(cookies: SessionCookie[]): SessionCookie | null {
  let selected: SessionCookie | null = null;
  for (const cookie of cookies) {
    if (!isUsableSessionToken(cookie.value)) {
      continue;
    }
    if (
      !selected ||
      (cookie.expirationDate ?? 0) >= (selected.expirationDate ?? 0)
    ) {
      selected = cookie;
    }
  }
  return selected;
}

/**
 * Choisit le jeton à transmettre. `cookies` peut contenir les cookies de
 * l'origine puis tous ceux de la session : l'ordre n'est pas significatif.
 */
export function pickSessionToken(
  cookies: readonly SessionCookie[],
  now: number = Date.now()
): string | null {
  const usable = cookies.filter((cookie) =>
    isUsableSessionToken(cookie.value, now)
  );

  for (const name of SESSION_COOKIE_NAMES) {
    const match = latestValid(usable.filter((cookie) => cookie.name === name));
    if (match) {
      return match.value.trim();
    }
  }

  // Repli : un cookie de session renommé (déploiement, préfixe) reste
  // utilisable s'il porte une identité. On préfère les noms évocateurs.
  const fallback = [...usable].sort((left, right) => {
    const score = (cookie: SessionCookie) =>
      (isLikelySessionName(cookie.name) ? 2 : 0) +
      (cookie.expirationDate ? 1 : 0);
    return score(right) - score(left);
  });
  const selected = latestValid(fallback);
  return selected?.value.trim() ?? null;
}

export function sessionTokenError(): string {
  return "Connectez-vous à votre compte mAI avant d’ouvrir Coder.";
}
