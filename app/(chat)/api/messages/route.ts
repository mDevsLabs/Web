import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getChatLockState } from "@/lib/chat/security";
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

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return errorResponse("auth_required");
  }

  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return errorResponse("not_found", {
      message: "Conversation introuvable ou supprimée.",
    });
  }

  const currentUserId = maiUser.id || maiUser.email;
  const isOwner = chatOwnerMatches({
    chatUserId: chat.userId,
    email: maiUser.email,
    userId: currentUserId,
    username: maiUser.username,
  });

  // Espace projet partagé : un membre peut lire les conversations du projet
  // (lecture seule), même privées, parce qu'il fait partie de l'espace. Les
  // autres utilisateurs ne peuvent rien lire (garde serveur).
  let isProjectMember = false;
  if (!isOwner && chat.projectId) {
    const access = await getProjectAccess({
      projectId: chat.projectId,
      userEmail: maiUser.email,
      userId: currentUserId,
    });
    isProjectMember = Boolean(access);
  }

  if (chat.visibility === "private" && !isOwner && !isProjectMember) {
    return errorResponse("access_denied");
  }

  // Le propriétaire n'est pas exempté : le PIN protège la conversation à
  // chaque nouvelle session navigateur. Le locked est un succès (200) pour que
  // l'interface puisse afficher l'écran de saisie au lieu d'une erreur.
  const lockState = await getChatLockState({
    chat,
    email: maiUser.email,
    userId: currentUserId,
    username: maiUser.username,
  });
  if (lockState.locked) {
    return Response.json({
      chatId: chat.id,
      isOwner: lockState.isOwner,
      isReadonly: !lockState.isOwner,
      isSecure: true,
      locked: true,
      visibility: chat.visibility,
    });
  }

  const isReadonly = !isOwner;
  const messages = await getMessagesByChatId({ id: chatId });

  return Response.json({
    chatId: chat.id,
    isOwner: lockState.isOwner,
    isReadonly,
    isSecure: lockState.isSecure,
    locked: false,
    messages: convertToUIMessages(messages),
    userId: chat.userId,
    visibility: chat.visibility,
  });
}
