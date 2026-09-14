import { errorResponse } from "@/lib/api/error-response";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { getMaiUser } from "@/lib/auth/session";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return errorResponse("invalid_request", {
      message: "Le paramètre 'chatId' est obligatoire.",
    });
  }

  const [maiUser, chat, messages] = await Promise.all([
    getMaiUser(),
    getChatById({ id: chatId }),
    getMessagesByChatId({ id: chatId }),
  ]);

  if (!chat) {
    return Response.json({
      isReadonly: false,
      messages: [],
      userId: null,
      visibility: "private",
    });
  }

  const currentUserId = maiUser?.id || maiUser?.email;
  const isOwner = Boolean(
    currentUserId &&
      (chat.userId === currentUserId ||
        chatOwnerMatches({
          chatUserId: chat.userId,
          email: maiUser?.email,
          userId: maiUser?.id,
          username: maiUser?.username,
        }))
  );

  if (chat.visibility === "private" && !isOwner) {
    return errorResponse("access_denied");
  }

  const isReadonly = !isOwner;

  return Response.json({
    chatId: chat.id,
    isReadonly,
    messages: convertToUIMessages(messages),
    userId: chat.userId,
    visibility: chat.visibility,
  });
}
