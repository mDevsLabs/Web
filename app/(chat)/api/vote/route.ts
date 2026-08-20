import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { getChatById, getVotesByChatId, voteMessage } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const voteSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
  type: z.enum(["up", "down"]),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter chatId is required."
    ).toResponse();
  }

  const maiUser = await getMaiUser();

  if (!maiUser) {
    return new ChatbotError("unauthorized:vote").toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatbotError("not_found:chat").toResponse();
  }

  const currentUserId = maiUser.id || maiUser.email;
  if (chat.userId !== currentUserId && chat.userId !== maiUser.email) {
    return new ChatbotError("forbidden:vote").toResponse();
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  let chatId: string;
  let messageId: string;
  let type: "up" | "down";

  try {
    ({ chatId, messageId, type } = voteSchema.parse(await request.json()));
  } catch {
    return new ChatbotError(
      "bad_request:api",
      "Parameters chatId, messageId, and type are required."
    ).toResponse();
  }

  const maiUser = await getMaiUser();

  if (!maiUser) {
    return new ChatbotError("unauthorized:vote").toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatbotError("not_found:vote").toResponse();
  }

  const currentUserId = maiUser.id || maiUser.email;
  if (chat.userId !== currentUserId && chat.userId !== maiUser.email) {
    return new ChatbotError("forbidden:vote").toResponse();
  }

  await voteMessage({
    chatId,
    messageId,
    type,
  });

  return new Response("Message voted", { status: 200 });
}
