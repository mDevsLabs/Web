import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import {
  createScheduledMessage,
  getScheduledMessagesByUserId,
} from "@/lib/db/queries";
import { requireOwnedPlanningChat } from "@/lib/planning/chat-access";
import {
  isValidIANATimezone,
  type MonthlyPolicy,
} from "@/lib/planning/recurrence";
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
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    // Obsolète : conservé pour accepter les anciens clients, plus lu par
    // l'exécuteur (le périmètre est désormais porté par `toolMode`).
    enabledTools: z.array(z.string()).default([]),
    hour: z.number().int().min(0).max(23).nullable().optional(),
    minute: z.number().int().min(0).max(59).nullable().optional(),
    modelId: z.string().min(1).default(DEFAULT_CHAT_MODEL),
    monthlyPolicy: z.enum(["clamp", "report", "skip"]).optional(),
    prompt: z.string().min(1).max(5000),
    recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
    scheduledAt: z.string().datetime(),
    temperature: z.number().min(0).max(2).nullable().optional(),
    // Récurrence calendaire (migration 0046) : vérité = heure murale dans le
    // fuseau de la tâche. Un fuseau illisible est refusé, jamais deviné : une
    // clé valide mais inconnue du serveur décalerait toutes les exécutions.
    timezone: z
      .string()
      .max(64)
      .refine(isValidIANATimezone, {
        message:
          "Fuseau horaire invalide (nom IANA attendu, ex. Europe/Paris).",
      })
      .optional(),
    title: z.string().min(1).max(100).default("Envoi planifié"),
    toolMode: z.enum(SCHEDULE_TOOL_MODES).default("auto"),
  });

export async function GET(request: Request) {
  // `requireUser` est le seul endroit qui dérive l'identité canonique
  // (`id || email`). Cette route lisait `user.id` seul : pour un compte dont
  // l'identifiant persistant EST l'adresse, toute la planification répondait
  // « non authentifié » alors que les autres espaces de travail fonctionnaient.
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { userId } = session;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";

  const messages = await getScheduledMessagesByUserId({
    status,
    userId,
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }
  const { user, userId } = session;

  try {
    const json = await request.json();
    const parsed = buildCreateSchema(user.tier).parse(json);

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

    // Une tâche non récurrente programmée dans le passé ne partirait qu'à la
    // prochaine saisie du cron et n'a aucune utilité : refus explicite.
    if (parsed.recurrence === "none" && scheduledDate.getTime() <= Date.now()) {
      return errorResponse("invalid_request", {
        message: "L'heure d'exécution est déjà passée.",
      });
    }

    // Cohérence des champs calendaires : une récérence qui n'est pas mensuelle
    // n'a pas de jour visé, et le fuseau est requis dès qu'il y a récurrence.
    if (
      parsed.recurrence === "monthly" &&
      parsed.dayOfMonth === undefined &&
      parsed.timezone === undefined
    ) {
      return errorResponse("invalid_request", {
        message:
          "Pour une récurrence mensuelle, précisez le jour du mois et le fuseau horaire.",
      });
    }

    const created = await createScheduledMessage({
      agentId: parsed.agentId,
      chatId: parsed.chatId,
      cloudFileUrls: parsed.cloudFileUrls,
      createMode: parsed.createMode,
      customInstructions: parsed.customInstructions,
      dayOfMonth: parsed.dayOfMonth ?? null,
      enabledTools: parsed.enabledTools,
      hour: parsed.hour ?? null,
      minute: parsed.minute ?? null,
      modelId: parsed.modelId,
      monthlyPolicy:
        (parsed.monthlyPolicy as MonthlyPolicy | undefined) ?? null,
      prompt: parsed.prompt,
      recurrence: parsed.recurrence,
      scheduledAt: scheduledDate,
      temperature: parsed.temperature,
      timezone: parsed.timezone ?? null,
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
