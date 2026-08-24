import { NextResponse } from "next/server";
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
  const maiUser = await getMaiUser();
  if (!maiUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userId = maiUser.id || maiUser.email;

  const body = await request.json().catch(() => ({}));
  const upToMessageId: string | null = body.upToMessageId ?? null;

  const chat = await getChatById({ id });
  if (!chat) {
    return NextResponse.json({ error: "Chat introuvable" }, { status: 404 });
  }
  if (chat.userId !== userId && chat.userId !== maiUser.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    customInstructions: (chat as any).customInstructions ?? null,
    id: newId,
    modeId: (chat as any).modeId ?? "standard",
    projectId: (chat as any).projectId ?? null,
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
