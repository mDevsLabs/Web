"use server";

import { getDb, listApiKeys } from "@/lib/site/api-key-manager";
import { getSessionIdentity } from "@/lib/site/session-auth";
import { getUserQuotaBoost } from "@/lib/site/tiers";

/**
 * Métadonnées d'usage API sûres pour les écrans compte.
 *
 * Contrat stable pour le coordinateur et les écrans compte :
 * - `keyRef` est le préfixe public exact servant à la sélection serveur ;
 * - aucun champ `key`, `apiKey`, `secretKey` ou segment secret n'est sérialisé.
 */
export interface UserApiKeyUsage {
  createdAt: string;
  isActive: boolean;
  keyRef: string;
  lastUsedAt: string | null;
  maxLimit: number | null;
  name: string;
  plan: string;
  requestCount: number;
}

export type GetUserApiUsageResult =
  | {
      success: true;
      apiBoost: number;
      keys: UserApiKeyUsage[];
    }
  | {
      success: false;
      error: string;
    };

export async function getUserApiUsage(): Promise<GetUserApiUsageResult> {
  try {
    const identity = await getSessionIdentity();
    if (!identity) {
      return { error: "Authentification requise.", success: false };
    }

    const keys = await listApiKeys(identity.userId);
    const database = getDb();
    const apiBoost = database
      ? await getUserQuotaBoost(database, identity.userId, "api")
      : 0;

    return {
      apiBoost,
      keys: keys.map((key) => ({
        createdAt: key.createdAt,
        isActive: key.isActive,
        keyRef: key.keyRef,
        lastUsedAt: key.lastUsedAt,
        maxLimit: key.maxLimit,
        name: key.name,
        plan: key.plan,
        requestCount: key.usageCount,
      })),
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'usage API:", error);
    return { error: "Impossible de récupérer l'usage API", success: false };
  }
}
