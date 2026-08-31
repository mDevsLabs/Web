import { NextResponse } from "next/server";
import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  createScheduledMessage,
  getScheduledMessagesByUserId,
} from "@/lib/db/queries";

const createSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  chatId: z.string().uuid().nullable().optional(),
  createMode: z.enum(["new_chat", "existing_chat"]).default("new_chat"),
  customInstructions: z.string().max(4000).nullable().optional(),
  enabledTools: z.array(z.string()).default([]),
  modelId: z.string().min(1).default("google/gemini-2.5-flash"),
  prompt: z.string().min(1).max(5000),
  scheduledAt: z.string().datetime(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  title: z.string().min(1).max(100).default("Envoi planifié"),
});

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = createSchema.parse(json);
    const userId = user.id || user.email;

    const scheduledDate = new Date(parsed.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Date de planification invalide" },
        { status: 400 }
      );
    }

    const created = await createScheduledMessage({
      agentId: parsed.agentId,
      chatId: parsed.chatId,
      createMode: parsed.createMode,
      customInstructions: parsed.customInstructions,
      enabledTools: parsed.enabledTools,
      modelId: parsed.modelId,
      prompt: parsed.prompt,
      scheduledAt: scheduledDate,
      temperature: parsed.temperature,
      title: parsed.title,
      userId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Données invalides" },
      { status: 400 }
    );
  }
}
