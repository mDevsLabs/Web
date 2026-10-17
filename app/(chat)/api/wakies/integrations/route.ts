import { listIntegrationStatuses } from "@/lib/integrations/status";
import { json, requireWakiesUser } from "@/lib/wakies/http";

/**
 * État des connecteurs pour le menu `@` de Wakies.
 *
 * La projection est celle du produit principal — un seul `lib/integrations/status.ts`
 * — pour que Wakies ne redéfinisse jamais seul ce qu'est « connecté », et ne
 * transporte ni jeton ni identité d'un autre compte.
 */
export async function GET() {
  const identite = await requireWakiesUser();
  if (identite instanceof Response) return identite;

  const integrations = await listIntegrationStatuses({
    userId: identite.userId,
  });
  return json({ integrations }, { headers: { "Cache-Control": "no-store" } });
}
