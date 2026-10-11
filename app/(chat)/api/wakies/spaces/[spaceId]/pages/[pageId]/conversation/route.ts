import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  enforceWakiesLimit,
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import {
  createConversation,
  deleteConversation,
  ensureSettings,
  findConversation,
  findPageInSpace,
  findWakie,
  finishPageConversation,
  listConversations,
  pageConversation,
  reservePageConversation,
} from "@/lib/wakies/queries";

const schema = z.object({ wakieId: z.string().min(1) }).strict();

/** Ouvre ou retrouve la conversation dédiée à un spécialiste sur cette page. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ spaceId: string; pageId: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await requireWakiesUser();
  if (isResponse(user)) return user;
  const { spaceId, pageId } = await params;
  const page = await findPageInSpace(user.userId, spaceId, pageId);
  if (!page) return notFound("Page introuvable.");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const wakie = await findWakie(user.userId, parsed.data.wakieId);
  if (!wakie) return notFound("Wakie introuvable.");
  const settings = await ensureSettings(user.userId);
  if (settings.paused) {
    return errorResponse("access_denied", {
      message: "Les Wakies sont en pause. Reactivez-les dans les réglages.",
    });
  }
  const previous = await pageConversation(page.id, wakie.id);
  if (previous?.ready) {
    const conversation = await findConversation(
      user.userId,
      previous.conversationId
    );
    if (conversation) return json(conversation);
  }
  const limitResult = await enforceWakiesLimit({
    limit: "conversations",
    tier: user.tier,
    used: (await listConversations(user.userId)).length,
  });
  if (limitResult) return limitResult;
  const conversation = await createConversation(user.userId, {
    title: `Page : ${page.title}`.slice(0, 120),
    wakieId: wakie.id,
  });
  const reserved = await reservePageConversation(
    page.id,
    wakie.id,
    conversation.id
  );
  if (!reserved) {
    const linked = await pageConversation(page.id, wakie.id);
    const existing = linked?.ready
      ? await findConversation(user.userId, linked.conversationId)
      : null;
    await deleteConversation(user.userId, conversation.id);
    return existing
      ? json(existing)
      : errorResponse("conflict", {
          message:
            "La conversation de la page est en cours d’ouverture. Réessayez dans un instant.",
        });
  }
  await finishPageConversation(page.id, wakie.id);
  return json(conversation, { status: 201 });
}
