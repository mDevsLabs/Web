import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  createScheduledMessage,
  getScheduledMessagesByUserId,
} from "@/lib/db/queries";

const createSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  chatId: z.string().uuid().nullable().optional(),
  cloudFileUrls: z.array(z.string()).default([]),
  createMode: z.enum(["new_chat", "existing_chat"]).default("new_chat"),
  customInstructions: z.string().max(4000).nullable().optional(),
  enabledTools: z.array(z.string()).default([]),
  modelId: z.string().min(1).default("google/gemini-2.5-flash"),
  prompt: z.string().min(1).max(5000),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  scheduledAt: z.string().datetime(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  title: z.string().min(1).max(100).default("Envoi planifié"),
});

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const userId = user.id || user.email;

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
    const parsed = createSchema.parse(json);
    const userId = user.id || user.email;

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
