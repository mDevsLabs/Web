import { z } from "zod";
import { getAgentFlags } from "@/lib/agent/flags";
import {
  loadAgentSettings,
  saveAgentSettings,
  toToolCategories,
} from "@/lib/agent/settings";
import { AGENT_TOOL_CATALOG } from "@/lib/agent/tools/catalog";
import { fetchUserModels } from "@/lib/ai/models.server";
import { getAgentModelsForTier } from "@/lib/ai/registry";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { normalizeTier } from "@/lib/auth/plan";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getPersistedTier } from "@/lib/db/users";

const patchSchema = z.object({
  autonomy: z.enum(["careful", "standard", "high"]).optional(),
  defaultModel: z.string().min(1).max(200).nullable().optional(),
  defaultProjectId: z.string().uuid().nullable().optional(),
  enabledCategories: z.array(z.string().max(40)).max(12).nullable().optional(),
  reasoningLevel: z.enum(["low", "medium", "high"]).optional(),
  toolPolicies: z
    .record(z.string().max(80), z.enum(["auto", "ask", "off"]))
    .optional(),
});

// Paramètres → Agent : la route renvoie aussi les capacités réellement
// disponibles (modèles compatibles, outils, flags) pour que l'interface
// n'affiche jamais un réglage inopérant.
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId, user } = session;

  const [settings, models] = await Promise.all([
    loadAgentSettings({ userId }),
    fetchUserModels(),
  ]);

  const flags = getAgentFlags();
  // Le forfait qui décide des capacités affichées est celui PERSISTÉ dans
  // `users.tier`. Le lire depuis la session (JWT ou cache mémoire de 2 minutes)
  // affichait les capacités de l'ancien forfait : un utilisateur venant de
  // passer en Plus continuait de voir l'interface Free (et réciproquement).
  const persistedTier = await getPersistedTier({ userId }).catch(() => null);
  const tier = normalizeTier(
    persistedTier?.ok ? persistedTier.tier : user.tier
  );

  return Response.json(
    {
      agentModels: getAgentModelsForTier(models, tier),
      flags,
      settings,
      tools: Object.values(AGENT_TOOL_CATALOG).map((tool) => ({
        category: tool.category,
        defaultPermission: tool.permissions.default,
        impact: tool.permissions.impact ?? (tool.permissions.destructive ? "deletion" : tool.permissions.readOnly ? "read" : "external_mutation"),
        description: tool.description,
        id: tool.id,
        name: tool.name,
      })),
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}

export async function PATCH(request: Request) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId } = session;

  try {
    const patch = patchSchema.parse(await request.json());
    const settings = await saveAgentSettings({
      patch: {
        autonomy: patch.autonomy,
        defaultModel: patch.defaultModel,
        defaultProjectId: patch.defaultProjectId,
        enabledCategories:
          patch.enabledCategories === undefined
            ? undefined
            : toToolCategories(patch.enabledCategories),
        reasoningLevel: patch.reasoningLevel,
        toolPolicies: patch.toolPolicies,
      },
      userId,
    });

    return Response.json({ settings, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(error),
      });
    }
    console.error("Erreur mise à jour des paramètres Agent :", error);
    return errorResponse("internal_error", {
      message: "Impossible d'enregistrer les paramètres Agent.",
    });
  }
}
