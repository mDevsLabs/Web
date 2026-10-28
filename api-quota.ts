/**
 * Réservation atomique du quota API hebdomadaire.
 *
 * Le quota est global au COMPTE (somme de request_count de toutes ses clés).
 * Le contrôle et le débit partagent donc une seule décision transactionnelle :
 * la réservation incrémente une clé du compte avant l'appel fournisseur, sous
 * verrou consultatif PostgreSQL. Deux requêtes simultanées ne peuvent plus
 * lire le même `used=9` puis dépasser une limite de 10.
 *
 * En cas d'échec du handler, `releaseApiRequestQuota` rend la place réservée.
 * La libération est bornée (GREATEST 0) et appelée une seule fois par requête.
 *
 * Module sans import Deno : testable avec un double de SqlClient.
 */

import type { SqlClient } from "./openrouter-models.ts";

export type ApiQuotaReservation =
  | {
      limit: number;
      remaining: number;
      reserved: true;
      used: number;
    }
  | {
      limit: number;
      reason: "account" | "key";
      remaining: 0;
      reserved: false;
      used: number;
    };

export type ReserveApiQuotaParams = {
  apiKey: string;
  /** Coût en requêtes API de l'opération (1 par défaut, >1 pour une image). */
  cost?: number;
  limit: number;
  userId: string;
  weekStartStr: string;
};

type SqlWithTransaction = SqlClient & {
  transaction?: (queries: unknown[]) => Promise<unknown[]>;
};

export async function reserveApiRequestQuota(
  sql: SqlClient,
  params: ReserveApiQuotaParams
): Promise<ApiQuotaReservation> {
  const lockKey = `api-quota:${params.userId}`;
  const cost = Math.max(
    1,
    Math.floor(Number.isFinite(params.cost) ? Number(params.cost) : 1)
  );

  const lockQuery = sql`
    SELECT pg_advisory_xact_lock(hashtext(${lockKey}))
  `;
  const resetQuery = sql`
    UPDATE mprojects_api_keys k
    SET request_count = 0, usage_period_start = ${params.weekStartStr}::date
    WHERE k.usage_period_start IS DISTINCT FROM ${params.weekStartStr}::date
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id::text = ${params.userId}::text
          AND (k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email)
      )
  `;
  const reserveQuery = sql`
    WITH account_keys AS (
      SELECT k.api_key, k.request_count, k.usage_period_start
      FROM mprojects_api_keys k
      JOIN users u
        ON k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email
      WHERE u.id::text = ${params.userId}::text
    ), totals AS (
      SELECT COALESCE(SUM(CASE WHEN usage_period_start = ${params.weekStartStr}::date
        THEN request_count ELSE 0 END), 0) AS total
      FROM account_keys
    ), reserved AS (
      UPDATE mprojects_api_keys
      SET request_count = request_count + ${cost}::int, last_used_at = NOW()
      WHERE api_key = ${params.apiKey}::text
        AND (SELECT total FROM totals) + ${cost}::int <= ${params.limit}::int
        AND (max_limit IS NULL OR max_limit <= 0 OR request_count + ${cost}::int <= max_limit)
      RETURNING request_count
    )
    SELECT
      (SELECT total FROM totals)::text AS total,
      (SELECT COUNT(*) FROM reserved)::int AS reserved_count,
      (SELECT request_count FROM mprojects_api_keys WHERE api_key = ${params.apiKey}::text)::text AS key_count,
      (SELECT max_limit FROM mprojects_api_keys WHERE api_key = ${params.apiKey}::text) AS key_max
  `;

  let rows: any[];
  const maybeTransactional = sql as SqlWithTransaction;
  if (typeof maybeTransactional.transaction === "function") {
    const results = await maybeTransactional.transaction([
      lockQuery,
      resetQuery,
      reserveQuery,
    ]);
    rows = (results?.[2] as any[]) || [];
  } else {
    // Repli pour les doubles de test / pilotes sans transaction : les deux
    // requêtes restent conditionnelles côté base, mais sans verrou consultatif.
    await resetQuery;
    rows = (await reserveQuery) as any[];
  }

  const row = rows?.[0] || {};
  const used = Number(row.total || 0);
  const reserved = Number(row.reserved_count || 0) > 0;
  const keyCount = Number(row.key_count || 0);
  const keyMax = Number(row.key_max || 0);

  if (reserved) {
    return {
      limit: params.limit,
      remaining: Math.max(0, params.limit - used - cost),
      reserved: true,
      used,
    };
  }

  return {
    limit: params.limit,
    reason: keyMax > 0 && keyCount >= keyMax ? "key" : "account",
    remaining: 0,
    reserved: false,
    used,
  };
}

export async function releaseApiRequestQuota(
  sql: SqlClient,
  apiKey: string,
  cost = 1
): Promise<void> {
  const amount = Math.max(
    1,
    Math.floor(Number.isFinite(cost) ? Number(cost) : 1)
  );
  await sql`
    UPDATE mprojects_api_keys
    SET request_count = GREATEST(request_count - ${amount}::int, 0)
    WHERE api_key = ${apiKey}::text
  `;
}

export type ApiQuotaGateResult =
  | {
      status: "reserved";
      limit: number;
      remaining: number;
      used: number;
    }
  | {
      status: "account_exhausted";
      limit: number;
      used: number;
    }
  | {
      status: "key_exhausted";
      limit: number;
      used: number;
    }
  | {
      status: "unavailable";
      error: unknown;
    };

/**
 * Porte de quota appelée par le middleware AVANT le handler.
 * Une indisponibilité de l'autorité ne laisse jamais passer : elle se traduit
 * par `unavailable`, que l'appelant doit convertir en 503 explicite.
 */
export async function reserveApiQuotaOrRefuse(
  sql: SqlClient,
  params: ReserveApiQuotaParams
): Promise<ApiQuotaGateResult> {
  try {
    const reservation = await reserveApiRequestQuota(sql, params);
    if (reservation.reserved) {
      return {
        limit: reservation.limit,
        remaining: reservation.remaining,
        status: "reserved",
        used: reservation.used,
      };
    }
    return {
      limit: reservation.limit,
      status:
        reservation.reason === "key" ? "key_exhausted" : "account_exhausted",
      used: reservation.used,
    };
  } catch (error) {
    return { error, status: "unavailable" };
  }
}
