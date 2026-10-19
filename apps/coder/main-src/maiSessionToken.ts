// Validation minimale du jeton de session remis par mAI Desktop.
//
// On ne vérifie pas la signature ici : le backend reste l'autorité. En
// revanche, on refuse un jeton expiré ou sans identité avant de remplacer le
// compte local, sinon Coder afficherait un profil vide ou obsolète.
export function decodeMaiJwtPayload(
  token: string
): Record<string, unknown> | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return null;
  }
  try {
    const normalized = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(
      Buffer.from(padded, "base64").toString("utf8")
    ) as unknown;
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function isUsableMaiSessionToken(
  value: string,
  now: number = Date.now()
): boolean {
  const token = value.trim();
  if (!token || token.length > 8192) {
    return false;
  }
  const payload = decodeMaiJwtPayload(token);
  if (!payload) {
    return false;
  }
  const hasIdentity = ["sub", "email", "username", "user_id"].some((key) => {
    const identity = payload[key];
    return (
      (typeof identity === "string" && identity.trim().length > 0) ||
      (typeof identity === "number" && Number.isFinite(identity))
    );
  });
  if (!hasIdentity) {
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
