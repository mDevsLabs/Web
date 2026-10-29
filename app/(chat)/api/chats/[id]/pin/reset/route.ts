import { z } from "zod";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import {
  generateChatPinResetCode,
  hashChatPin,
  hashChatPinResetCode,
} from "@/lib/chat/pin-hash";
import { setChatUnlockCookie } from "@/lib/chat/unlock-cookie";
import { isChatUnlockConfigured } from "@/lib/chat/unlock-token";
import {
  clearChatPinResetCode,
  getChatById,
  getChatSecurity,
  resetChatPinWithCode,
  setChatPinResetCode,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { checkChatPinResetSend, resetChatPinAttempt } from "@/lib/ratelimit";
import { sendVerificationEmail } from "@/lib/site/email";

const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_SEND_COOLDOWN_MS = 60 * 1000;

const pinValue = z
  .string()
  .regex(/^\d{4,6}$/, "Le code PIN doit contenir 4 à 6 chiffres.");

const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres."),
    confirmPin: pinValue,
    pin: pinValue,
  })
  .refine((value) => value.pin === value.confirmPin, {
    message: "Les deux codes PIN ne correspondent pas.",
    path: ["confirmPin"],
  });

function invalidId() {
  return errorResponse("invalid_request", {
    message: "Identifiant de conversation invalide.",
  });
}

function maskEmail(email: string): string {
  return email.replace(/(.{2}).*(@.*)/, "$1***$2");
}

// La réinitialisation est la seule voie de secours quand le PIN est oublié.
// Elle exige un compte connecté propriétaire ET un code à 6 chiffres envoyé à
// l'e-mail du compte. Le code est stocké haché, expire en 10 minutes et ne
// peut être tenté que cinq fois.
export async function POST(
  _request: Request,
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
    if (!isChatUnlockConfigured()) {
      return errorResponse("service_unavailable", {
        message:
          "Le verrouillage des conversations n'est pas configuré sur cette instance (MAI_JWT_SECRET absent).",
      });
    }

    const email = (user.email || "").trim();
    if (!email?.includes("@")) {
      return errorResponse("invalid_request", {
        message:
          "Aucune adresse e-mail n'est associée à ce compte. La conversation peut être supprimée, mais pas réinitialisée.",
      });
    }

    const existing = await getChatSecurity({ chatId: id });
    if (!existing) {
      return errorResponse("invalid_request", {
        message: "Cette conversation n'est pas protégée par un code PIN.",
      });
    }

    const lastSentAt = existing.resetLastSentAt?.getTime() ?? 0;
    const cooldownRemaining =
      RESET_SEND_COOLDOWN_MS - (Date.now() - lastSentAt);
    if (cooldownRemaining > 0) {
      return errorResponse("rate_limited", {
        details: { retryAfterSeconds: Math.ceil(cooldownRemaining / 1000) },
        message:
          "Un code a déjà été envoyé récemment. Réessayez dans un instant.",
      });
    }

    const limited = await checkChatPinResetSend({ chatId: id, userId });
    if (!limited.allowed) {
      return errorResponse("rate_limited", {
        details: { retryAfterSeconds: limited.retryAfterSeconds },
        message: "Trop de demandes de réinitialisation. Réessayez plus tard.",
      });
    }

    const code = generateChatPinResetCode();
    const sentAt = new Date();
    await setChatPinResetCode({
      chatId: id,
      codeHash: hashChatPinResetCode({ chatId: id, code }),
      expiresAt: new Date(sentAt.getTime() + RESET_CODE_TTL_MS),
      sentAt,
    });

    const sent = await sendVerificationEmail(email, code, "secure_chat_reset");
    if (!sent) {
      await clearChatPinResetCode({ chatId: id });
      return errorResponse("service_unavailable", {
        message:
          "L'envoi du code a échoué. Vérifiez la configuration e-mail de l'instance et réessayez.",
      });
    }

    return Response.json({ email: maskEmail(email), sent: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("POST chat pin reset error:", error);
    return errorResponse("database_error");
  }
}

export async function PUT(
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
    if (!isChatUnlockConfigured()) {
      return errorResponse("service_unavailable", {
        message:
          "Le verrouillage des conversations n'est pas configuré sur cette instance (MAI_JWT_SECRET absent).",
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: parsed.error.issues[0]?.message ?? "Données invalides.",
      });
    }

    const now = new Date();
    const result = await resetChatPinWithCode({
      chatId: id,
      codeHash: hashChatPinResetCode({
        chatId: id,
        code: parsed.data.code,
      }),
      now,
      pinHash: hashChatPin(parsed.data.pin),
    });

    if (!result.ok) {
      switch (result.reason) {
        case "missing":
          return errorResponse("invalid_request", {
            message: "Cette conversation n'est pas protégée par un code PIN.",
          });
        case "expired":
          return errorResponse("invalid_request", {
            message:
              "Le code a expiré ou n'a jamais été demandé. Demandez un nouveau code.",
          });
        case "too_many":
          return errorResponse("rate_limited", {
            message:
              "Trop de tentatives sur ce code. Demandez un nouveau code.",
          });
        default:
          return errorResponse("access_denied", {
            message: "Code de réinitialisation incorrect.",
          });
      }
    }

    const cookieSet = await setChatUnlockCookie({
      chatId: id,
      pinUpdatedAt: result.pinUpdatedAt.getTime(),
      userId,
    });
    if (!cookieSet) {
      return errorResponse("service_unavailable", {
        message:
          "Le verrouillage des conversations n'est pas configuré sur cette instance (MAI_JWT_SECRET absent).",
      });
    }
    await resetChatPinAttempt({ chatId: id, userId });

    return Response.json({ isSecure: true, secured: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("PUT chat pin reset error:", error);
    return errorResponse("database_error");
  }
}
