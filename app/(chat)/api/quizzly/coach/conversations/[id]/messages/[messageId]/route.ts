import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { COACH_REPLY_MAX } from "@/lib/quizzly/coach";
import {
  messageEchecFil,
  modifierMessageCoach,
} from "@/lib/quizzly/coach-store";
import { origineConfiance } from "@/lib/quizzly/http";

const corpsSchema = z
  .object({
    pinned: z.boolean().optional(),
    text: z.string().max(COACH_REPLY_MAX).optional(),
  })
  .strict()
  .refine(
    (valeur) => valeur.pinned !== undefined || valeur.text !== undefined,
    {
      message: "Rien à enregistrer.",
    }
  );

type Contexte = { params: Promise<{ id: string; messageId: string }> };

export async function PATCH(request: Request, contexte: Contexte) {
  if (!origineConfiance(request)) {
    return errorResponse("access_denied", {
      message: "Origine de la requête non autorisée.",
    });
  }
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  const { id, messageId } = await contexte.params;
  const body = await request.json().catch(() => null);
  const parsed = corpsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  try {
    const resultat = await modifierMessageCoach({
      conversationId: id,
      messageId,
      pinned: parsed.data.pinned,
      text: parsed.data.text,
      userId: session.userId,
    });
    if (!resultat.ok) {
      const code =
        resultat.code === "missing" ? "not_found" : "invalid_request";
      return errorResponse(code, {
        message: messageEchecFil(resultat.code, "message"),
      });
    }
    return Response.json(resultat.message, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("PATCH /api/quizzly/coach/messages", error);
    return errorResponse("database_error");
  }
}
