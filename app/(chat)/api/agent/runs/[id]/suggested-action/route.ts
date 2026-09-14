import { z } from "zod";
import { executeSuggestedAction } from "@/lib/agent/suggested-actions/registry";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getAgentRunById } from "@/lib/db/agent-queries";

// Exécution d'une SuggestedAction : le frontend ne transmet que l'identifiant
// du registre et le payload ; le serveur revérifie l'existence du run, sa
// propriété, l'action (registre), le schéma du payload et les outils qui
// étaient activés. Aucune opération arbitraire inventée par le modèle.

const bodySchema = z.object({
  actionId: z.string().min(1).max(60),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_request", { message: "Requête invalide." });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }

  const run = await getAgentRunById({ id, userId });
  if (!run) {
    return errorResponse("not_found", { message: "Run introuvable." });
  }

  // Les catégories d'outils activées pendant le run, déduites du snapshot de
  // permissions (source de vérité persistée à la création du run).
  const enabledCategories = Object.keys(run.toolPolicySnapshot);

  const outcome = await executeSuggestedAction({
    actionId: parsed.data.actionId,
    enabledToolCategories: enabledCategories,
    payload: parsed.data.payload ?? {},
    runId: id,
    userId,
  });

  if (!outcome.ok) {
    const messages: Record<string, string> = {
      invalid_payload: "Paramètres d'action invalides.",
      no_result:
        "Cette action a besoin d'un livrable produit par le run : aucun n'a été trouvé.",
      not_found: "Run, projet ou livrable introuvable.",
      not_permitted: "Action non permise avec les outils de ce run.",
      unknown_action: "Action suggérée inconnue.",
    };
    return errorResponse("invalid_request", {
      message: messages[outcome.reason] ?? "Action suggérée indisponible.",
    });
  }

  return Response.json(outcome, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
