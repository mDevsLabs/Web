import { tool } from "ai";
import { z } from "zod";
import {
  fetchUsageBundle,
  toUsageSummary,
  type UsageSummary,
} from "@/lib/account/usage";
import type { MaiUser } from "@/lib/auth/session";

export function getAccountUsage({
  maiUser,
  sessionToken,
}: {
  maiUser: MaiUser;
  sessionToken: string;
}) {
  return tool({
    description:
      "Récupère le forfait et la consommation de l'utilisateur connecté : forfait (Free/Plus/Pro/Max), tokens IA hebdomadaires consommés/limite et date de réinitialisation, images générées aujourd'hui, synthèse vocale et stockage cloud. Utilise-le pour toute question sur les quotas, la consommation, le forfait ou les limites. Après l'appel, commente brièvement les points notables (taux supérieur à 80 %, quota épuisé, réinitialisation proche) sans inventer de chiffres.",
    execute: async (): Promise<UsageSummary> => {
      const bundle = await fetchUsageBundle({
        fallbackUser: maiUser,
        sessionToken,
      });
      return toUsageSummary(bundle);
    },
    inputSchema: z.object({}),
  });
}
