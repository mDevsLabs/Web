import { eq } from "drizzle-orm";
import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { dbReady, getDb } from "@/lib/db/queries";
import { wakiesConversation } from "@/lib/db/schema";
import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { deleteConversation, findConversation } from "@/lib/wakies/queries";

/**
 * PATCH  /api/wakies/conversations/:id — renommage.
 * DELETE /api/wakies/conversations/:id — suppression (messages inclus, en cascade).
 */

const schema = z.object({ title: z.string().trim().min(1).max(120) }).strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  if (!(await findConversation(identite.userId, id))) {
    return notFound("Conversation introuvable.");
  }
  await dbReady();
  const [row] = await getDb()
    .update(wakiesConversation)
    .set({ title: parsed.data.title, updatedAt: new Date() })
    .where(eq(wakiesConversation.id, id))
    .returning();
  return json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const supprime = await deleteConversation(identite.userId, id);
  if (!supprime) {
    return notFound("Conversation introuvable.");
  }
  // Messages, appels, captures et pages liées partent en cascade : les clés
  // étrangères sont « on delete cascade », rien à nettoyer à la main.
  return json({ ok: true });
}
