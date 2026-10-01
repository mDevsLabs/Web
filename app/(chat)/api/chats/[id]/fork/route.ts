import { NextResponse } from "next/server";
import { z } from "zod";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de la discussion est invalide.",
    });
  }
  const maiUser = await getMaiUser();
  if (!maiUser) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }
  const userId = maiUser.id;
  if (!userId) {
    return errorResponse("auth_required", {
      message: "Session utilisateur invalide.",
    });
  }

  const body = await request.json().catch(() => ({}));
  const bodySchema = z.object({
    upToMessageId: z.string().uuid().nullish(),
  });
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Le paramètre 'upToMessageId' est invalide.",
    });
  }
  const upToMessageId: string | null = parsed.data.upToMessageId ?? null;

  const chat = await getChatById({ id });
  if (!chat) {
    return errorResponse("not_found", {
      message: "Discussion introuvable.",
    });
  }
  if (
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: maiUser.email,
      userId: maiUser.id,
      username: maiUser.username,
    })
  ) {
    return errorResponse("access_denied");
  }

  const messages = await getMessagesByChatId({ id });
  let toClone = messages;
  if (upToMessageId) {
    const idx = messages.findIndex((m) => m.id === upToMessageId);
    if (idx !== -1) {
      toClone = messages.slice(0, idx + 1);
    }
  }

  const newId = generateUUID();
  await saveChat({
    agentId: (chat as any).agentId ?? null,
    customInstructions: (chat as any).customInstructions ?? null,
    id: newId,
    mode: (chat as any).mode ?? "chat",
    projectId: (chat as any).projectId ?? null,
    skillId: (chat as any).skillId ?? null,
    tags: (chat as any).tags ?? [],
    temperatureOverride: (chat as any).temperatureOverride ?? null,
    title: `${chat.title} (branche)`,
    userId,
    visibility: chat.visibility as any,
  });

  if (toClone.length > 0) {
    // Clone with new UUIDs to avoid PK collision, but keep chatId new
    const clonedMessages = toClone.map((m) => ({
      attachments: (m as any).attachments ?? [],
      chatId: newId,
      createdAt: new Date(),
      id: generateUUID(),
      parts: m.parts as any,
      role: m.role,
    }));
    await saveMessages({ messages: clonedMessages as any });
  }

  return NextResponse.json({ id: newId });
}
