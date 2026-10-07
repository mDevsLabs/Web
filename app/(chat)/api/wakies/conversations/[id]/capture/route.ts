import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";
import {
  findConversation,
  getCapture,
  saveCapture,
} from "@/lib/wakies/queries";

/**
 * GET  /api/wakies/conversations/:id/capture — résultat mis de côté.
 * POST /api/wakies/conversations/:id/capture — enregistrement.
 *
 * La capture est le résultat qu'un Wakie prépare puis fait valider ; elle est
 * attachée à la conversation, donc scopée au compte comme elle.
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
  return json(await getCapture(identite.userId, id));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const value = await request.json().catch(() => null);
  if (value === null) {
    return notFound("Capture illisible.");
  }
  try {
    await saveCapture(identite.userId, id, value);
    return json({ ok: true });
  } catch {
    return errorResponse("invalid_request", {
      message: "Conversation introuvable sur ce compte.",
    });
  }
}
