import { getAgentChannelInfo } from "@/lib/agent/channel";
import { getAgentFlags } from "@/lib/agent/flags";
import { normalizeTier } from "@/lib/auth/plan";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getPersistedTier } from "@/lib/db/users";

// Le client a besoin de connaître les fonctionnalités réellement actives
// (Agent activé, plugins, MCP, artifacts, approbations, réflexion) et le canal
// de diffusion, pour adapter l'interface sans jamais décider de l'accès.
// Le tier exposé est celui persisté dans users.tier — la même source de vérité
// que la garde serveur — pour que l'interface affiche Agent au bon utilisateur.
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }

  const persistedTier = await getPersistedTier({ userId: session.userId });
  const tier = persistedTier.ok
    ? persistedTier.tier
    : normalizeTier(session.user.tier);

  return Response.json(
    {
      channel: getAgentChannelInfo(),
      flags: getAgentFlags(),
      tier,
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
