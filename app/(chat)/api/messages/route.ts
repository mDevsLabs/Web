import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { getProjectAccess } from "@/lib/projects/access";
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

  // Espace projet partagé : un membre peut lire les conversations du projet
  // (lecture seule), même privées, parce qu'il fait partie de l'espace. Les
  // autres utilisateurs ne peuvent rien lire (garde serveur).
  let isProjectMember = false;
  if (!isOwner && chat.projectId && maiUser) {
    const access = await getProjectAccess({
      projectId: chat.projectId,
      userEmail: maiUser.email,
      userId: currentUserId ?? "",
    });
    isProjectMember = Boolean(access);
  }

  if (chat.visibility === "private" && !isOwner && !isProjectMember) {
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
