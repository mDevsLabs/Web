import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { findPage, togglePagePin } from "@/lib/wakies/queries";

/**
 * POST /api/wakies/pages/:id/pin — épingle ou libère une page.
 *
 * Une route séparée du PATCH, et non un champ de plus : épingler n'est pas
 * éditer. Le PATCH exige `expectedRevision` — deux onglets ouverts sur la même
 * page se disputeraient la dernière révision pour un simple clic sur une
 * épingle, et l'un des deux perdrait son brouillon en 409.
 */

const schema = z.object({ pinned: z.boolean() }).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const { id } = await params;
  // Une page d'un autre compte répond comme une page absente.
  if (!(await findPage(identite.userId, id))) {
    return notFound("Page introuvable.");
  }
  await togglePagePin(identite.userId, id, parsed.data.pinned);
  return json({ pinned: parsed.data.pinned, success: true });
}
