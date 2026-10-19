import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { deleteMemory, saveMemory } from "@/lib/wakies/queries";

/** PUT    /api/wakies/memories/:id — modification. */
/** DELETE /api/wakies/memories/:id — suppression. */

const schema = z.object({ text: z.string().trim().min(1).max(2000) }).strict();

export async function PUT(
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
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "La mémoire doit contenir entre 1 et 2 000 caractères.",
    });
  }
  const row = await saveMemory(identite.userId, parsed.data.text, id);
  return row ? json(row) : notFound("Mémoire introuvable.");
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(_request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const supprime = await deleteMemory(identite.userId, id);
  return supprime ? json({ ok: true }) : notFound("Mémoire introuvable.");
}
