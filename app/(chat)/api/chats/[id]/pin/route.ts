import { z } from "zod";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { hashChatPin, verifyChatPin } from "@/lib/chat/pin-hash";
import {
  clearChatUnlockCookie,
  setChatUnlockCookie,
} from "@/lib/chat/unlock-cookie";
import { isChatUnlockConfigured } from "@/lib/chat/unlock-token";
import {
  deleteChatSecurity,
  getChatById,
  getChatSecurity,
  upsertChatSecurity,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { checkChatPinAttempt, resetChatPinAttempt } from "@/lib/ratelimit";

const pinValue = z
  .string()
  .regex(/^\d{4,6}$/, "Le code PIN doit contenir 4 à 6 chiffres.");

const saveSchema = z
  .object({
    confirmPin: pinValue,
    currentPin: pinValue.optional(),
    pin: pinValue,
  })
  .refine((value) => value.pin === value.confirmPin, {
    message: "Les deux codes PIN ne correspondent pas.",
    path: ["confirmPin"],
  });

const removeSchema = z.object({ currentPin: pinValue });

function invalidId() {
  return errorResponse("invalid_request", {
    message: "Identifiant de conversation invalide.",
  });
}

// Routes de gestion du PIN : réservées au propriétaire, à tout forfait.
// `POST` crée ou remplace, `DELETE` retire. Une conversation privée ou Agent
// ne peut pas être sécurisée ; le retrait reste possible sur une ligne
// résiduelle pour ne jamais enfermer un propriétaire.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return invalidId();
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
    if (
      !chatOwnerMatches({
        chatUserId: chat.userId,
        email: user.email,
        userId,
        username: user.username,
      })
    ) {
      return errorResponse("access_denied");
    }
    if (chat.visibility !== "public") {
      return errorResponse("invalid_request", {
        message: "Seules les conversations publiques peuvent être sécurisées.",
      });
    }
    if (chat.mode !== "chat") {
      return errorResponse("invalid_request", {
        message: "Seules les conversations classiques peuvent être sécurisées.",
      });
    }
    if (!isChatUnlockConfigured()) {
      return errorResponse("service_unavailable", {
        message:
          "Le verrouillage des conversations n'est pas configuré sur cette instance (MAI_JWT_SECRET absent).",
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: parsed.error.issues[0]?.message ?? "Données invalides.",
      });
    }

    const existing = await getChatSecurity({ chatId: id });
    if (existing) {
      if (!parsed.data.currentPin) {
        return errorResponse("invalid_request", {
          message: "Le code PIN actuel est requis pour modifier la protection.",
        });
      }
      const limited = await checkChatPinAttempt({ chatId: id, userId });
      if (!limited.allowed) {
        return errorResponse("rate_limited", {
          details: { retryAfterSeconds: limited.retryAfterSeconds },
          message: "Trop de tentatives. Réessayez dans quelques minutes.",
        });
      }
      if (!verifyChatPin(parsed.data.currentPin, existing.pinHash)) {
        return errorResponse("access_denied", {
          message: "Code PIN actuel incorrect.",
        });
      }
      await resetChatPinAttempt({ chatId: id, userId });
    }

    const saved = await upsertChatSecurity({
      chatId: id,
      pinHash: hashChatPin(parsed.data.pin),
    });
    if (!saved) {
      return errorResponse("invalid_request", {
        message:
          "Seules les conversations publiques peuvent être sécurisées. Vérifiez la visibilité de la conversation.",
      });
    }

    const cookieSet = await setChatUnlockCookie({
      chatId: id,
      pinUpdatedAt: saved.pinUpdatedAt.getTime(),
      userId,
    });
    if (!cookieSet) {
      return errorResponse("service_unavailable", {
        message:
          "Le verrouillage des conversations n'est pas configuré sur cette instance (MAI_JWT_SECRET absent).",
      });
    }

    return Response.json({ isSecure: true, secured: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("POST chat pin error:", error);
    return errorResponse("database_error");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return invalidId();
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
    if (
      !chatOwnerMatches({
        chatUserId: chat.userId,
        email: user.email,
        userId,
        username: user.username,
      })
    ) {
      return errorResponse("access_denied");
    }

    const existing = await getChatSecurity({ chatId: id });
    if (!existing) {
      await clearChatUnlockCookie(id);
      return Response.json({ isSecure: false, secured: false });
    }

    const body = await request.json().catch(() => null);
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: parsed.error.issues[0]?.message ?? "Code PIN actuel requis.",
      });
    }

    const limited = await checkChatPinAttempt({ chatId: id, userId });
    if (!limited.allowed) {
      return errorResponse("rate_limited", {
        details: { retryAfterSeconds: limited.retryAfterSeconds },
        message: "Trop de tentatives. Réessayez dans quelques minutes.",
      });
    }
    if (!verifyChatPin(parsed.data.currentPin, existing.pinHash)) {
      return errorResponse("access_denied", {
        message: "Code PIN actuel incorrect.",
      });
    }
    await resetChatPinAttempt({ chatId: id, userId });

    await deleteChatSecurity({ chatId: id });
    await clearChatUnlockCookie(id);
    return Response.json({ isSecure: false, secured: false });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("DELETE chat pin error:", error);
    return errorResponse("database_error");
  }
}
