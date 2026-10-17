"use server";

import {
  getUserImageUsageForUser,
  type UserImageUsageData,
} from "@/lib/site/image-usage";
import { getSessionIdentity } from "@/lib/site/session-auth";

// Note: aucun re-export de type ici. Dans un fichier "use server", Turbopack
// compile `export type { ... }` en ré-export runtime, ce qui référence un binding
// inexistant et provoque « ReferenceError: UserImageUsageData is not defined ».
// Les consommateurs importent le type directement depuis "@/lib/site/image-usage".

export async function getUserImageUsage(): Promise<{
  success: boolean;
  data?: UserImageUsageData;
  error?: string;
}> {
  const identity = await getSessionIdentity();
  if (!identity) {
    return { error: "Authentification requise.", success: false };
  }
  return getUserImageUsageForUser(identity.userId);
}
