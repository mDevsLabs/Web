import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { COACH_TITLE_MAX } from "@/lib/quizzly/coach";
import {
  lireConversationCoach,
  messageEchecFil,
  modifierConversationCoach,
} from "@/lib/quizzly/coach-store";
import { origineConfiance } from "@/lib/quizzly/http";

const corpsSchema = z
  .object({
    pinned: z.boolean().optional(),
    title: z.string().max(COACH_TITLE_MAX).optional(),
  })
  .strict()
  .refine(
    (valeur) => valeur.pinned !== undefined || valeur.title !== undefined,
    { message: "Rien à enregistrer." }
  );

type Contexte = { params: Promise<{ id: string }> };

export async function GET(_request: Request, contexte: Contexte) {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  const { id } = await contexte.params;
  try {
    const fil = await lireConversationCoach(session.userId, id);
    if (!fil) {
      return errorResponse("not_found", {
        message: "Cette conversation est introuvable.",
      });
    }
    return Response.json(fil, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("GET /api/quizzly/coach/conversations/[id]", error);
    return errorResponse("database_error");
  }
}

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
  const { id } = await contexte.params;
  const body = await request.json().catch(() => null);
  const parsed = corpsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  try {
    const resultat = await modifierConversationCoach({
      id,
      pinned: parsed.data.pinned,
      title: parsed.data.title,
      userId: session.userId,
    });
    if (!resultat.ok) {
      const code =
        resultat.code === "missing" ? "not_found" : "invalid_request";
      return errorResponse(code, {
        message: messageEchecFil(resultat.code, "conversation"),
      });
    }
    return Response.json(resultat.conversation, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("PATCH /api/quizzly/coach/conversations/[id]", error);
    return errorResponse("database_error");
  }
}
