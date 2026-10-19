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
  createPage,
  findConversation,
  findWakie,
  listMessages,
  listPages,
  wakieCanAccessSpace,
} from "@/lib/wakies/queries";

/**
 * POST /api/wakies/conversations/:id/page — enregistre la conversation en page.
 *
 * Le contenu est la reconstruction de l'échange en Markdown : une page sauvée
 * depuis une conversation doit être lisible SANS rouvrir la conversation. La
 * destination est l'espace PAR DÉFAUT du Wakie, et l'accès est vérifié —
 * un compte ne peut pas écrire dans un espace auquel son Wakie n'a pas accès.
 */
const schema = z
  .object({
    spaceId: z.string().min(1).optional(),
    title: z.string().trim().min(1).max(160),
  })
  .strict();

function texteDeConversation(
  messages: { role: string; parts: unknown }[]
): string {
  const lignes: string[] = [];
  for (const message of messages) {
    const parts = Array.isArray(message.parts) ? message.parts : [];
    const texte = parts
      .map((partie) => {
        const p = partie as { type?: string; text?: string };
        return p?.type === "text" ? (p.text ?? "") : "";
      })
      .join("")
      .trim();
    if (!texte) {
      continue;
    }
    lignes.push(
      message.role === "user" ? `**Vous.** ${texte}` : `**Wakie.** ${texte}`
    );
  }
  return lignes.join("\n\n");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const conversation = await findConversation(identite.userId, id);
  if (!conversation) {
    return notFound("Conversation introuvable.");
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const wakie = await findWakie(identite.userId, conversation.wakieId);
  const spaceId = parsed.data.spaceId ?? wakie?.spaceId;
  if (!spaceId) {
    return errorResponse("invalid_request", {
      message: "Ce Wakie n'a pas d'espace de destination défini.",
    });
  }
  if (
    !(await wakieCanAccessSpace(identite.userId, conversation.wakieId, spaceId))
  ) {
    return errorResponse("access_denied", {
      message: "Ce Wakie n'a pas accès à cet espace.",
    });
  }
  const limite = await enforceWakiesLimit({
    limit: "pages",
    tier: identite.tier,
    used: (await listPages(identite.userId, spaceId)).length,
  });
  if (limite) {
    return limite;
  }
  const messages = await listMessages(identite.userId, id);
  const page = await createPage(
    identite.userId,
    spaceId,
    {
      content: texteDeConversation(messages),
      title: parsed.data.title,
    },
    id
  );
  return json(page, { status: 201 });
}
