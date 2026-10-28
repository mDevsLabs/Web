import type { WakiesQuotaKey } from "@/lib/plans/tier-limits";

/**
 * Quota Wakies atteint au moment d'une écriture ATOMIQUE (transaction +
 * verrou). Distinct d'un `Error` générique : les routes le traduisent en 429
 * explicite au lieu d'un 400 « erreur de saisie ».
 */
export class WakiesQuotaError extends Error {
  readonly limit: WakiesQuotaKey;
  readonly quota: number;
  readonly used: number;

  constructor(limit: WakiesQuotaKey, quota: number, used: number) {
    super(`Quota Wakies atteint (${limit}).`);
    this.name = "WakiesQuotaError";
    this.limit = limit;
    this.quota = quota;
    this.used = used;
  }
}
