import crypto from "node:crypto";

/**
 * Secret utilisé pour signer les jetons de bypass de maintenance.
 * Repose sur les secrets existants de l'environnement ou sur un sel interne.
 */
function getBypassSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.MCP_ENCRYPTION_KEY ||
    process.env.MAI_BUILD_ID ||
    "mai-maintenance-internal-hmac-key"
  );
}

/**
 * Génère un code d'accès aléatoire pour une nouvelle fenêtre de maintenance.
 * Format : MAI-MAINT-XXXXXX
 */
export function generateMaintenanceAccessCode(): string {
  const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `MAI-MAINT-${hex}`;
}

/**
 * Calcule la signature HMAC d'une maintenance et de son code d'accès.
 */
function computeSignature(maintenanceId: string, accessCode: string): string {
  const secret = getBypassSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${maintenanceId}:${accessCode.trim().toUpperCase()}`)
    .digest("hex");
}

/**
 * Crée le jeton de bypass scellé à stocker dans le cookie pour la maintenance active.
 */
export function createMaintenanceBypassToken(
  maintenanceId: string,
  accessCode: string
): string {
  const sig = computeSignature(maintenanceId, accessCode);
  return `${maintenanceId}.${sig}`;
}

/**
 * Vérifie si un jeton de bypass correspond exactement à la maintenance active
 * et à son code d'accès configuré.
 *
 * Règle stricte « un code = une maintenance » :
 * Si la maintenance change (nouvel ID) ou si le code change, l'ancien jeton
 * devient immédiatement invalide.
 */
export function isMaintenanceBypassValid(
  token: string | null | undefined,
  activeMaintenanceId: string | null | undefined,
  activeAccessCode: string | null | undefined
): boolean {
  if (!token || !activeMaintenanceId || !activeAccessCode) {
    return false;
  }

  const cleanActiveCode = activeAccessCode.trim().toUpperCase();
  if (!cleanActiveCode) {
    // Si aucun code d'accès n'est défini sur la maintenance, aucun bypass n'est permis.
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [tokenId, tokenSig] = parts;
  if (tokenId !== activeMaintenanceId) {
    // Le jeton a été émis pour une autre maintenance : invalidation immédiate
    return false;
  }

  const expectedSig = computeSignature(activeMaintenanceId, cleanActiveCode);

  try {
    const a = Buffer.from(tokenSig, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
