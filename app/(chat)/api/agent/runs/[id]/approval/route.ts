import { z } from "zod";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { approvalDecisionSchema } from "@/lib/agent/contracts";
import { paramsHashOf } from "@/lib/agent/params-hash";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { enforceChatRateLimit } from "@/lib/chat/auth";
import {
  decideApprovalRequest,
  expireApprovalRequestById,
  getPendingApprovalForRun,
} from "@/lib/db/agent-foundation-queries";
import { getAgentRunById } from "@/lib/db/agent-queries";
import { ChatbotError } from "@/lib/errors";

// Décision d'une approbation Agent. L'approbation porte sur les paramètres
// EXACTS présentés : le hash est recalculé depuis l'exécution d'outil persistée,
// donc toute modification du ToolCall invalide l'accord. L'écriture est atomique
// (statut pending requis) : une double décision est impossible. La route ne
// exécute jamais l'outil elle-même — la reprise passe par POST /api/agent, où
// les contrôles d'accès, de forfait, de quota et de permissions sont réappliqués.

const bodySchema = z.object({
  decision: approvalDecisionSchema,
  requestId: z.uuid().optional(),
  toolCallId: z.string().min(1).max(200).optional(),
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
    console.error(
      "Erreur non gérée dans la décision d'approbation Agent :",
      error
    );
    return errorResponse("internal_error", {
      message: "La décision d'approbation a échoué.",
    });
  }
}

async function handlePost(request: Request, params: Promise<{ id: string }>) {
  const { id } = await params;

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

  const pending = await getPendingApprovalForRun({ runId: run.id });
  if (!pending) {
    return errorResponse("not_found", {
      message: "Aucune approbation en attente pour ce run.",
    });
  }
  if (parsed.data.requestId && parsed.data.requestId !== pending.id) {
    return errorResponse("invalid_request", {
      message: "Cette demande d'approbation n'est plus en attente.",
    });
  }

  // Les paramètres approuvés sont ceux de la demande persistée, écrite par le
  // serveur à partir de l'appel d'outil présenté : le client ne fournit jamais
  // le hash, il ne peut donc pas élargir l'accord. L'exécution revérifie ensuite
  // que l'appel en cours porte exactement ces paramètres.
  const expectedHash = paramsHashOf(pending.params);
  if (expectedHash !== pending.paramsHash) {
    await expireApproval({ id: pending.id });
    return errorResponse("invalid_request", {
      message:
        "Les paramètres de l'action ont changé : une nouvelle demande d'approbation est nécessaire.",
    });
  }

  const decision = await decideApprovalRequest({
    decision: parsed.data.decision.decision,
    denyReason:
      parsed.data.decision.decision === "deny"
        ? parsed.data.decision.reason
        : null,
    id: pending.id,
    paramsHash: expectedHash,
  });

  if (!decision.ok) {
    return errorResponse(
      decision.reason === "not_found" ? "not_found" : "invalid_request",
      {
        message:
          decision.reason === "hash_mismatch"
            ? "Les paramètres de l'action ont changé : une nouvelle demande est nécessaire."
            : "Cette demande d'approbation n'est plus en attente.",
      }
    );
  }

  return Response.json(
    {
      decision: parsed.data.decision.decision,
      ok: true,
      requestId: pending.id,
      resume: { chatId: run.chatId, runId: run.id },
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

async function expireApproval({ id }: { id: string }): Promise<void> {
  await expireApprovalRequestById({ id });
}
