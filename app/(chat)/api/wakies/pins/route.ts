import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { definirEpingle, listerEpingles } from "@/lib/wakies/queries";

/**
 * GET  ?conversationId=:id — messages épinglés de la conversation.
 * POST { messageId, pinned } — épingle ou retire une épingle.
 *
 * Épingler est un geste du COMPTE : la route porte `userId` jusqu'à la
 * requête, et un message d'une conversation étrangère répond 404, jamais un
 * succès muet. Pas de pagination : la bande en haut du fil en affiche vingt
 * au plus, ce que la requête borne déjà.
 */

const schema = z
  .object({
    messageId: z.string().min(1).max(200),
    pinned: z.boolean(),
  })
  .strict();

export async function GET(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return errorResponse("invalid_request", {
      message: "conversationId requis.",
    });
  }
  const messages = await listerEpingles(identite.userId, conversationId);
  return json(
    {
      messages: messages.map((message) => ({
        conversationId: message.conversationId,
        createdAt: message.createdAt,
        id: message.id,
        parts: message.parts,
        pinnedAt: message.pinnedAt,
        role: message.role,
        seq: message.seq,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Requête d'épingle invalide.",
    });
  }
  const etat = await definirEpingle(
    identite.userId,
    parsed.data.messageId,
    parsed.data.pinned
  );
  if (!etat) {
    return errorResponse("not_found", {
      message: "Message introuvable sur ce compte.",
    });
  }
  return json({ ok: true, pinned: etat.pinned });
}
