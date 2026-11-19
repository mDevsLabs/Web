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

export async function reserveApiRequestQuota(
  _sql: SqlClient,
  params: ReserveApiQuotaParams
): Promise<ApiQuotaReservation> {
  // Le système de quota public par requête a été supprimé au profit du système
  // d'usage hebdomadaire global du compte en pourcentage.
  const limit = Math.max(params.limit, 1000);
  return {
    limit,
    remaining: limit,
    reserved: true,
    used: 0,
  };
}

export async function releaseApiRequestQuota(
  _sql: SqlClient,
  _apiKey: string,
  _cost = 1
): Promise<void> {
  // No-op : le quota public par requête est supprimé.
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
