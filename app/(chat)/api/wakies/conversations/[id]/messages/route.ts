import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { findConversation, listMessages } from "@/lib/wakies/queries";

/**
 * GET /api/wakies/conversations/:id/messages — historique de la conversation.
 *
 * Dans le gabarit, l'historique était Asking chez Intelligence à chaque
 * ouverture. Ici il est dans `WakiesMessage`, dans l'ordre d'écriture (`seq`),
 * et la lecture est scopée au compte : une conversation d'un autre compte
 * renvoie 404, pas 403 — l'existence même ne doit pas être devinée.
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
  const rows = await listMessages(id);
  return json(
    rows.map((row) => ({
      createdAt: row.createdAt,
      id: row.id,
      parts: row.parts,
      role: row.role,
    })),
    { headers: { "Cache-Control": "no-store" } }
  );
}
