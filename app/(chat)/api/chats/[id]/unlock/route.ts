import { z } from "zod";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { verifyChatPin } from "@/lib/chat/pin-hash";
import { setChatUnlockCookie } from "@/lib/chat/unlock-cookie";
import { isChatUnlockConfigured } from "@/lib/chat/unlock-token";
import { getChatById, getChatSecurity } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { getProjectAccess } from "@/lib/projects/access";
import { checkChatPinAttempt, resetChatPinAttempt } from "@/lib/ratelimit";

const unlockSchema = z.object({
  pin: z
    .string()
    .regex(/^\d{4,6}$/, "Le code PIN doit contenir 4 à 6 chiffres."),
});

// Déverrouille une conversation pour la session navigateur courante. Le
// propriétaire, un membre de projet et un visiteur d'une conversation publique
// passent par ici ; les règles d'accès sont les mêmes que /api/messages.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return errorResponse("invalid_request", {
      message: "Identifiant de conversation invalide.",
    });
  }

  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  const { user, userId } = session;

  try {
    const chat = await getChatById({ id });
    if (!chat) {
      return errorResponse("not_found", {
        message: "Conversation introuvable.",
      });
    }

    const isOwner = chatOwnerMatches({
      chatUserId: chat.userId,
      email: user.email,
      userId,
      username: user.username,
    });

    if (!isOwner && chat.visibility === "private") {
      let isProjectMember = false;
      if (chat.projectId) {
        const access = await getProjectAccess({
          projectId: chat.projectId,
          userEmail: user.email,
          userId,
        });
        isProjectMember = Boolean(access);
      }
      if (!isProjectMember) {
        return errorResponse("access_denied");
      }
    }

    const security = await getChatSecurity({ chatId: id });
    if (!security) {
      return Response.json({ unlocked: true });
    }
    if (!isChatUnlockConfigured()) {
      return errorResponse("service_unavailable", {
        message:
          "Le verrouillage des conversations n'est pas configuré sur cette instance (MAI_JWT_SECRET absent).",
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = unlockSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: parsed.error.issues[0]?.message ?? "Code PIN requis.",
      });
    }

    const limited = await checkChatPinAttempt({ chatId: id, userId });
    if (!limited.allowed) {
      return errorResponse("rate_limited", {
        details: { retryAfterSeconds: limited.retryAfterSeconds },
        message: "Trop de tentatives. Réessayez dans quelques minutes.",
      });
    }

    if (!verifyChatPin(parsed.data.pin, security.pinHash)) {
      return errorResponse("access_denied", {
        message: "Code PIN incorrect.",
      });
    }
    await resetChatPinAttempt({ chatId: id, userId });

    const cookieSet = await setChatUnlockCookie({
      chatId: id,
      pinUpdatedAt: security.pinUpdatedAt.getTime(),
      userId,
    });
    if (!cookieSet) {
      return errorResponse("service_unavailable", {
        message:
          "Le verrouillage des conversations n'est pas configuré sur cette instance (MAI_JWT_SECRET absent).",
      });
    }

    return Response.json({ unlocked: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("POST chat unlock error:", error);
    return errorResponse("database_error");
  }
}
