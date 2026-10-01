import { NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { enforceChatRateLimit } from "@/lib/chat/auth";
import { getScheduledMessageById } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { executeScheduledMessage } from "@/lib/planning/executor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // `requireUser` dérive l'identité canonique (`id || email`) ; cette route
  // lisait `user.id` seul et rejetait les comptes dont l'identifiant
  // persistant est l'adresse.
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { id } = await params;
  const item = await getScheduledMessageById({ id, userId: session.userId });
  if (!item) {
    return errorResponse("not_found", {
      message: "Message planifié introuvable.",
    });
  }

  try {
    // L'exécution manuelle déclenche une génération complète. Elle était le
    // seul chemin de dépense sans rate limit ni quota : les trois frères sous
    // `/agent/runs/[id]/` (approval, user-input, reorient) sont tous limités.
    await enforceChatRateLimit(request, session.userId);
  } catch (error: unknown) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    throw error;
  }

  try {
    const result = await executeScheduledMessage(id);
    if (result.deferred) {
      return errorResponse("quota_exceeded", {
        message:
          "Quota hebdomadaire atteint : l'exécution est reportée, elle repartira automatiquement.",
      });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    logError("Erreur exécution message planifié", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de l'exécution du message planifié.",
    });
  }
}
