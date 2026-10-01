import { z } from "zod";
import { getAgentFlags } from "@/lib/agent/flags";
import { loadAgentSettings, saveAgentSettings } from "@/lib/agent/settings";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { isPaidTier, normalizeTier } from "@/lib/auth/plan";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getPersistedTier } from "@/lib/db/users";

// Préférence d'écran d'accueil : Chat ou Agent.
//
// Endpoint volontairement minimal. L'AgentModeProvider est monté au niveau du
// layout, donc cette route est appelée à chaque chargement — or
// /api/agent/settings va chercher le catalogue de modèles chez le fournisseur.
// Dupliquer ici une simple lecture de colonne coûte une requête au lieu d'un
// aller-retour réseau complet, sur chaque page.
//
// L'interface n'est pas une frontière : ce GET renvoie aussi `canUseAgent` pour
// que l'accueil sache s'il a le droit d'afficher l'écran Agent, sans refaire le
// calcul côté client.

const patchSchema = z.object({
  defaultMode: z.enum(["chat", "agent"]),
});

async function resolveCanUseAgent(userId: string, fallbackTier: string) {
  if (!getAgentFlags()["agent.enabled"]) {
    return false;
  }
  const persisted = await getPersistedTier({ userId }).catch(() => null);
  return isPaidTier(
    normalizeTier(persisted?.ok ? persisted.tier : fallbackTier)
  );
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId, user } = session;

  const settings = await loadAgentSettings({ userId });
  const canUseAgent = await resolveCanUseAgent(userId, user.tier);

  return Response.json(
    {
      canUseAgent,
      // Un « agent » enregistré sur un compte qui n'y a plus droit ne doit pas
      // être resservi : l'accueil retomberait sur Chat de toute façon, autant
      // que la valeur affichée soit cohérente.
      defaultMode: canUseAgent ? settings.defaultMode : "chat",
    },
    { headers: { "Cache-Control": "private, no-cache, no-store" } }
  );
}

export async function PATCH(request: Request) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId, user } = session;

  let patch: z.infer<typeof patchSchema>;
  try {
    patch = patchSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(error),
      });
    }
    return errorResponse("invalid_request", {
      message: "Le corps de la requête doit être un JSON valide.",
    });
  }

  // Même garde que /api/agent/settings : enregistrer « agent » pour un compte
  // qui ne peut pas l'utiliser produirait une préférence muette, puis un écran
  // qui ne correspond jamais au réglage.
  if (patch.defaultMode === "agent") {
    const canUseAgent = await resolveCanUseAgent(userId, user.tier);
    if (!canUseAgent) {
      return errorResponse("plan_required", {
        message:
          "Le mode Agent nécessite un forfait payant et n'est pas disponible sur ce compte.",
      });
    }
  }

  try {
    const settings = await saveAgentSettings({
      patch: { defaultMode: patch.defaultMode },
      userId,
    });
    return Response.json({ defaultMode: settings.defaultMode, success: true });
  } catch (error) {
    console.error("Erreur d'enregistrement du mode par défaut :", error);
    return errorResponse("internal_error", {
      message: "Impossible d'enregistrer le mode par défaut.",
    });
  }
}
