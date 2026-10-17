import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { findConversation, pageForConversation } from "@/lib/wakies/queries";

/**
 * GET /api/wakies/conversations/:id/page-context — page en cours dans cette
 * conversation, ou `null`.
 *
 * Le port sépare ici deux notions que le gabarit confondait : la conversation
 * « d'une page » (une page ↔ une conversation, pour l'édition) et la page
 * issue d'une conversation (une conversation ↔ une page, pour l'archivage).
 * Le contexte demandé est le PREMIER sens : c'est la page que ce fil édite.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  if (!(await findConversation(identite.userId, id))) {
    return notFound("Conversation introuvable.");
  }
  const page = await pageForConversation(identite.userId, id);
  return json(
    page ? { id: page.id, spaceId: page.spaceId, title: page.title } : null,
    { headers: { "Cache-Control": "no-store" } }
  );
}
