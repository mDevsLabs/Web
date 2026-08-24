import { getMaiUser } from "@/lib/auth/session";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "chatId required" }, { status: 400 });
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
        chat.userId === maiUser?.id ||
        chat.userId === maiUser?.email ||
        chat.userId === maiUser?.username)
  );

  if (chat.visibility === "private" && !isOwner) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const isReadonly = !isOwner;

  return Response.json({
    isReadonly,
    messages: convertToUIMessages(messages),
    userId: chat.userId,
    visibility: chat.visibility,
  });
}
