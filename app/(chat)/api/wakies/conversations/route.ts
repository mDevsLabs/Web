import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  enforceWakiesLimit,
  isResponse,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import {
  createConversation,
  ensureSettings,
  listConversations,
} from "@/lib/wakies/queries";

/**
 * POST /api/wakies/conversations — ouvre une conversation avec un Wakie.
 *
 * Le gabarit créait d'abord le thread chez Intelligence, puis le liait
 * localement ; une panne du service distant laissait une conversation vide.
 * Ici la ligne EST la conversation : il n'y a rien à synchroniser, et une
 * conversation existe ou n'existe pas.
 */

const schema = z
  .object({
    title: z.string().trim().min(1).max(120).default("Une nouvelle idée"),
    wakieId: z.string().min(1),
  })
  .strict();

export async function GET() {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  return json(await listConversations(identite.userId));
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
      message: zodIssuesMessage(parsed.error),
    });
  }
  const reglage = await ensureSettings(identite.userId);
  if (reglage.paused) {
    return errorResponse("access_denied", {
      message: "Les Wakies sont en pause. Reactivez-les dans les réglages.",
    });
  }
  const limite = await enforceWakiesLimit({
    limit: "conversations",
    tier: identite.tier,
    used: (await listConversations(identite.userId)).length,
  });
  if (limite) {
    return limite;
  }
  try {
    const conversation = await createConversation(identite.userId, parsed.data);
    return json(conversation, { status: 201 });
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
