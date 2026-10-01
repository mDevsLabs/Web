import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteScheduledMessage,
  getScheduledMessageById,
  updateScheduledMessage,
} from "@/lib/db/queries";
import { requireOwnedPlanningChat } from "@/lib/planning/chat-access";
import { SCHEDULE_TOOL_MODES } from "@/lib/planning/tool-mode";
import { buildNullableCustomInstructionsSchema } from "@/lib/plans/custom-instructions";

// customInstructions est borné par le forfait de l'utilisateur : le schéma
// est construit après résolution de la session (voir PATCH).
const buildPatchSchema = (tier?: string | null) =>
  z.object({
    agentId: z.string().uuid().nullable().optional(),
    chatId: z.string().uuid().nullable().optional(),
    cloudFileUrls: z.array(z.string()).optional(),
    createMode: z.enum(["new_chat", "existing_chat"]).optional(),
    customInstructions: buildNullableCustomInstructionsSchema(tier),
    // Obsolète : accepté pour compat, plus lu par l'exécuteur.
    enabledTools: z.array(z.string()).optional(),
    modelId: z.string().min(1).optional(),
    prompt: z.string().min(1).max(5000).optional(),
    recurrence: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
    scheduledAt: z.string().datetime().optional(),
    status: z
      .enum(["pending", "processing", "completed", "failed", "cancelled"])
      .optional(),
    temperature: z.number().min(0).max(2).nullable().optional(),
    title: z.string().min(1).max(100).optional(),
    toolMode: z.enum(SCHEDULE_TOOL_MODES).optional(),
  });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { id } = await params;
  const userId = user.id;
  if (!userId) {
    return errorResponse("auth_required", {
      message: "Session utilisateur invalide.",
    });
  }
  const message = await getScheduledMessageById({ id, userId });

  if (!message) {
    return errorResponse("not_found", {
      message: "Message planifié introuvable.",
    });
  }

  return NextResponse.json(message);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { id } = await params;
  const userId = user.id;
  if (!userId) {
    return errorResponse("auth_required", {
      message: "Session utilisateur invalide.",
    });
  }

  try {
    const json = await request.json();
    const parsed = buildPatchSchema(user.tier).parse(json);

    const existing = await getScheduledMessageById({ id, userId });
    if (!existing) {
      return errorResponse("not_found", {
        message: "Message planifié introuvable.",
      });
    }

    if (
      (parsed.createMode === "existing_chat" ||
        existing.createMode === "existing_chat") &&
      !parsed.chatId &&
      !existing.chatId
    ) {
      return errorResponse("invalid_request", {
        message:
          "Une planification existante doit garder une conversation valide.",
      });
    }

    const targetChatIds = [existing.chatId, parsed.chatId].filter(
      (chatId): chatId is string =>
        typeof chatId === "string" && chatId.length > 0
    );
    for (const chatId of new Set(targetChatIds)) {
      const access = await requireOwnedPlanningChat({ chatId, user });
      if (access.response) {
        return access.response;
      }
    }

    // Une planification terminée, échouée ou annulée qui est modifiée (ou
    // réactivée) doit repartir en "pending" pour être de nouveau exécutée.
    const terminalStatuses = ["cancelled", "completed", "failed"];
    const effectiveStatus =
      parsed.status ??
      (terminalStatuses.includes(existing.status) ? "pending" : undefined);
    const isReset =
      effectiveStatus === "pending" && existing.status !== "pending";

    const updated = await updateScheduledMessage({
      agentId: parsed.agentId,
      chatId: parsed.chatId,
      cloudFileUrls: parsed.cloudFileUrls,
      createMode: parsed.createMode,
      customInstructions: parsed.customInstructions,
      enabledTools: parsed.enabledTools,
      id,
      // Réactivation : on efface la trace de l'exécution précédente
      ...(isReset
        ? { executedAt: null, lastError: null, resultChatId: null }
        : {}),
      modelId: parsed.modelId,
      prompt: parsed.prompt,
      recurrence: parsed.recurrence,
      scheduledAt: parsed.scheduledAt
        ? new Date(parsed.scheduledAt)
        : undefined,
      status: effectiveStatus,
      temperature: parsed.temperature,
      title: parsed.title,
      toolMode: parsed.toolMode,
      userId,
    });

    if (!updated) {
      return errorResponse("not_found", {
        message: "Message planifié introuvable ou échec de la mise à jour.",
      });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((e) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return errorResponse("invalid_request", {
        message: `Données invalides : ${issues}`,
      });
    }
    logError("Erreur mise à jour message planifié", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la mise à jour du message planifié.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { id } = await params;
  const userId = user.id;
  if (!userId) {
    return errorResponse("auth_required", {
      message: "Session utilisateur invalide.",
    });
  }

  const success = await deleteScheduledMessage({ id, userId });
  if (!success) {
    return errorResponse("not_found", { message: "Message introuvable." });
  }

  return NextResponse.json({ success: true });
}
