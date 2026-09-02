import { NextResponse } from "next/server";
import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteScheduledMessage,
  getScheduledMessageById,
  updateScheduledMessage,
} from "@/lib/db/queries";

const patchSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  chatId: z.string().uuid().nullable().optional(),
  cloudFileUrls: z.array(z.string()).optional(),
  createMode: z.enum(["new_chat", "existing_chat"]).optional(),
  customInstructions: z.string().max(4000).nullable().optional(),
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
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id || user.email;
  const message = await getScheduledMessageById({ id, userId });

  if (!message) {
    return NextResponse.json(
      { error: "Message planifié introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json(message);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id || user.email;

  try {
    const json = await request.json();
    const parsed = patchSchema.parse(json);

    const existing = await getScheduledMessageById({ id, userId });
    if (!existing) {
      return NextResponse.json(
        { error: "Message planifié introuvable" },
        { status: 404 }
      );
    }

    // Une planification terminée, échouée ou annulée qui est modifiée (ou
    // réactivée) doit repartir en "pending" pour être de nouveau exécutée.
    const terminalStatuses = ["cancelled", "completed", "failed"];
    const effectiveStatus =
      parsed.status ??
      (terminalStatuses.includes(existing.status) ? "pending" : undefined);
    const isReset = effectiveStatus === "pending" && existing.status !== "pending";

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
      userId,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Message planifié introuvable ou échec de mise à jour" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur de mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const userId = user.id || user.email;

  const success = await deleteScheduledMessage({ id, userId });
  if (!success) {
    return NextResponse.json(
      { error: "Message introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
