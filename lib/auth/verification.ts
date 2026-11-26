import "server-only";

import { dbReady, getRawClient } from "@/lib/db/queries/connection";

export const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Génère un code OTP aléatoire et l'enregistre de manière atomique dans Neon PostgreSQL.
 * Durée de validité : 10 minutes.
 */
export async function generateVerificationCode(
  email: string,
  action: string
): Promise<string> {
  const isDeletion = action === "delete_account";
  const length = isDeletion ? 8 : 6;
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const range = max - min;

  const randomValue =
    crypto.getRandomValues(new Uint32Array(1))[0] / 0xff_ff_ff_ff;
  const code = Math.floor(min + randomValue * range)
    .toString()
    .padStart(length, "0");
  // Le client `postgres` partagé avec Drizzle a ses sérialiseurs de `Date`
  // modifiés : passer une instance `Date` brute dans un gabarit SQL lève
  // `ERR_INVALID_ARG_TYPE`. On passe toujours une chaîne ISO + cast explicite.
  const expiresAtIso = new Date(Date.now() + 10 * 60_000).toISOString();

  await dbReady();
  const sql = getRawClient();
  if (!sql) throw new Error("Base de données indisponible.");

  const cleanEmail = email.trim().toLowerCase();
  await sql`
    INSERT INTO verification_codes (email, action, code, expires_at, attempts)
    VALUES (${cleanEmail}, ${action}, ${code}, ${expiresAtIso}::timestamptz, 0)
    ON CONFLICT (email, action)
    DO UPDATE SET
      code = EXCLUDED.code,
      expires_at = EXCLUDED.expires_at,
      attempts = 0
  `;

  return code;
}

/**
 * Régénère un code OTP pour une demande existante sans réinitialiser les tentatives.
 */
export async function regenerateVerificationCode(
  email: string,
  action: string
): Promise<{ code: string; expiresAt: string } | null> {
  await dbReady();
  const sql = getRawClient();
  if (!sql) throw new Error("Base de données indisponible.");

  const cleanEmail = email.trim().toLowerCase();
  const rows = await sql<{ attempts: number; expires_at: Date }[]>`
    SELECT attempts, expires_at FROM verification_codes
    WHERE email = ${cleanEmail} AND action = ${action}
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  const { attempts, expires_at: expiresAtDate } = rows[0];
  const expiresAtMs = new Date(expiresAtDate).getTime();

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
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  const expiresAtIso = expiresAt.toISOString();

  const updated = await sql<{ email: string }[]>`
    UPDATE verification_codes
    SET code = ${code}, expires_at = ${expiresAtIso}::timestamptz
    WHERE email = ${cleanEmail} AND action = ${action} AND attempts = ${attempts}
    RETURNING email
  `;

  if (updated.length === 0) return null;
  return { code, expiresAt: expiresAt.toISOString() };
}

/**
 * Vérifie un code OTP de façon atomique avec limitation stricte des tentatives.
 */
export async function verifyVerificationCode(
  email: string,
  code: string,
  action: string
): Promise<boolean> {
  await dbReady();
  const sql = getRawClient();
  if (!sql) throw new Error("Base de données indisponible.");

  const cleanEmail = email.trim().toLowerCase();
  const normalizedCode = String(code).trim();
  const nowIso = new Date().toISOString();

  // Consommation atomique si code valide et non expiré
  const accepted = await sql<{ email: string }[]>`
    DELETE FROM verification_codes
    WHERE email = ${cleanEmail}
      AND code = ${normalizedCode}
      AND action = ${action}
      AND expires_at >= ${nowIso}::timestamptz
      AND attempts < ${MAX_VERIFICATION_ATTEMPTS}
    RETURNING email
  `;

  if (accepted.length > 0) {
    return true;
  }

  // Si échec : incrémenter atomiquement le compteur de tentatives
  const failedAttempt = await sql<{ attempts: number }[]>`
    UPDATE verification_codes
    SET attempts = attempts + 1
    WHERE email = ${cleanEmail}
      AND action = ${action}
      AND code != ${normalizedCode}
      AND expires_at >= ${nowIso}::timestamptz
      AND attempts < ${MAX_VERIFICATION_ATTEMPTS}
    RETURNING attempts
  `;

  if (
    failedAttempt.length > 0 &&
    Number(failedAttempt[0].attempts) >= MAX_VERIFICATION_ATTEMPTS
  ) {
    await sql`
      DELETE FROM verification_codes
      WHERE email = ${cleanEmail} AND action = ${action}
    `;
  } else if (failedAttempt.length === 0) {
    await sql`
      DELETE FROM verification_codes
      WHERE email = ${cleanEmail}
        AND action = ${action}
        AND (expires_at < ${nowIso}::timestamptz OR attempts >= ${MAX_VERIFICATION_ATTEMPTS})
    `;
  }

  return false;
}
