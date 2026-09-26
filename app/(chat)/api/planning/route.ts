import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  createScheduledMessage,
  getScheduledMessagesByUserId,
} from "@/lib/db/queries";
import { requireOwnedPlanningChat } from "@/lib/planning/chat-access";
import { SCHEDULE_TOOL_MODES } from "@/lib/planning/tool-mode";
import { buildNullableCustomInstructionsSchema } from "@/lib/plans/custom-instructions";

// customInstructions est borné par le forfait de l'utilisateur : le schéma
// est construit après résolution de la session (voir POST).
const buildCreateSchema = (tier?: string | null) =>
  z.object({
    agentId: z.string().uuid().nullable().optional(),
    chatId: z.string().uuid().nullable().optional(),
    cloudFileUrls: z.array(z.string()).default([]),
    createMode: z.enum(["new_chat", "existing_chat"]).default("new_chat"),
    customInstructions: buildNullableCustomInstructionsSchema(tier),
    // Obsolète : conservé pour accepter les anciens clients, plus lu par
    // l'exécuteur (le périmètre est désormais porté par `toolMode`).
    enabledTools: z.array(z.string()).default([]),
    modelId: z.string().min(1).default(DEFAULT_CHAT_MODEL),
    prompt: z.string().min(1).max(5000),
    recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
    scheduledAt: z.string().datetime(),
    temperature: z.number().min(0).max(2).nullable().optional(),
    title: z.string().min(1).max(100).default("Envoi planifié"),
    toolMode: z.enum(SCHEDULE_TOOL_MODES).default("auto"),
  });

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const userId = user.id;
  if (!userId) {
    return errorResponse("auth_required", {
      message: "Session utilisateur invalide.",
    });
  }

  const messages = await getScheduledMessagesByUserId({
    status,
    userId,
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  try {
    const json = await request.json();
    const parsed = buildCreateSchema(user.tier).parse(json);
    const userId = user.id;
    if (!userId) {
      return errorResponse("auth_required", {
        message: "Session utilisateur invalide.",
      });
    }

    if (parsed.chatId) {
      const access = await requireOwnedPlanningChat({
        chatId: parsed.chatId,
        user,
      });
      if (access.response) {
        return access.response;
      }
    } else if (parsed.createMode === "existing_chat") {
      return errorResponse("invalid_request", {
        message: "Une conversation existante doit être sélectionnée.",
      });
    }

    const scheduledDate = new Date(parsed.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return errorResponse("invalid_request", {
        message: "Date de planification invalide.",
      });
    }

    const created = await createScheduledMessage({
      agentId: parsed.agentId,
      chatId: parsed.chatId,
      cloudFileUrls: parsed.cloudFileUrls,
      createMode: parsed.createMode,
      customInstructions: parsed.customInstructions,
      enabledTools: parsed.enabledTools,
      modelId: parsed.modelId,
      prompt: parsed.prompt,
      recurrence: parsed.recurrence,
      scheduledAt: scheduledDate,
      temperature: parsed.temperature,
      title: parsed.title,
      toolMode: parsed.toolMode,
      userId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((e) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return errorResponse("invalid_request", {
        message: `Données invalides : ${issues}`,
      });
    }
    logError("Erreur création message planifié", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la planification du message.",
    });
  }
}
