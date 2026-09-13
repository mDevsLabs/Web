import { getAgentChannelInfo } from "@/lib/agent/channel";
import { getAgentFlags } from "@/lib/agent/flags";
import { normalizeTier } from "@/lib/auth/plan";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";

// Le client a besoin de connaître les fonctionnalités réellement actives
// (Agent activé, plugins, MCP, artifacts, approbations, réflexion) et le canal
// de diffusion, pour adapter l'interface sans jamais décider de l'accès.
export async function GET() {
  // Le statut d'abonnement peut changer sans que le JWT soit renouvelé
  // (upgrade Plus notamment). Toujours lire la source d'abonnement distante.
  const session = await requireUser(true);
  if (!session) {
    return unauthorizedResponse();
  }

  return Response.json(
    {
      channel: getAgentChannelInfo(),
      flags: getAgentFlags(),
      tier: normalizeTier(session.user.tier),
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
