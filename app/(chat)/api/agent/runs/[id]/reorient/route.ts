import { z } from "zod";
import { submitReorientation } from "@/lib/agent/reorientation/service";
import { ACTIVE_AGENT_RUN_STATUSES } from "@/lib/agent/types";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { enforceChatRateLimit } from "@/lib/chat/auth";
import { getAgentRunById } from "@/lib/db/agent-queries";
import { ChatbotError } from "@/lib/errors";

// Réorientation d'un run en cours : l'intervention utilisateur est mise en
// file ORDONNÉE en base et appliquée par le runtime au prochain point sûr
// (fin d'étape), jamais en plein appel d'outil. La route authentifie, vérifie
// la propriété du run et n'accepte qu'un run actif : une réorientation sur un
// run terminé est refusée (run_not_active) — l'utilisateur écrit dans le chat
// plutôt. Idempotence : chaque POST crée une instruction distincte (seq) ;
// un double-clic produit deux instructions ordonnées, pas un état corrompu.

const bodySchema = z.object({
  instruction: z.object({
    stopRequested: z.boolean().optional(),
    text: z.string().min(1).max(2000),
  }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await handlePost(request, params);
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("Erreur non gérée dans la réorientation Agent :", error);
    return errorResponse("internal_error", {
      message: "La réorientation a échoué.",
    });
  }
}

async function handlePost(
  request: Request,
  routeParams: Promise<{ id: string }>
) {
  const { id } = await routeParams;

  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;
  await enforceChatRateLimit(request, userId);

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
  if (!ACTIVE_AGENT_RUN_STATUSES.includes(run.status)) {
    return errorResponse("invalid_request", {
      message:
        "Ce run n'est plus actif (run_not_active) : écrivez dans la conversation pour relancer Agent.",
    });
  }

  const result = await submitReorientation({
    instruction: {
      stopRequested: parsed.data.instruction.stopRequested ?? false,
      text: parsed.data.instruction.text,
    },
    runId: run.id,
  });
  if (!result.ok) {
    return errorResponse("invalid_request", {
      message: "Instruction de réorientation invalide.",
    });
  }

  return Response.json(
    {
      instructionId: result.instruction.id,
      ok: true,
      seq: result.instruction.seq,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
