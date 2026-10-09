"use server";

import { getSessionIdentity } from "@/lib/session-auth";
import { getUserImageUsageForUser, type UserImageUsageData } from "@/lib/image-usage";

// Note: aucun re-export de type ici. Dans un fichier "use server", Turbopack
// compile `export type { ... }` en ré-export runtime, ce qui référence un binding
// inexistant et provoque « ReferenceError: UserImageUsageData is not defined ».
// Les consommateurs importent le type directement depuis "@/lib/image-usage".

export async function getUserImageUsage(): Promise<{
  success: boolean;
  data?: UserImageUsageData;
  error?: string;
}> {
  const identity = await getSessionIdentity();
  if (!identity) {
    return { success: false, error: "Authentification requise." };
  }
  return getUserImageUsageForUser(identity.userId);
}
