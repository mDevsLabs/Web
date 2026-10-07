import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  enforceWakiesLimit,
  isResponse,
  json,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { listMemories, saveMemory } from "@/lib/wakies/queries";

/**
 * POST /api/wakies/memories — une préférence ou un contexte pour les Wakies.
 *
 * Les mémoires sont ce qui donne au Wakie un contexte stable : elles entrent
 * dans l'invite de recherche ET dans celle du chat. Le quota suit celui des
 * mémoires du chat (`memoryEntries` est déjà dans TIER_LIMITS, mais il borne
 * `UserMemory`) : ici c'est `wakies.memories`, lu et non recalculé.
 */

const schema = z.object({ text: z.string().trim().min(1).max(2000) }).strict();

export async function POST(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "La mémoire doit contenir entre 1 et 2 000 caractères.",
    });
  }
  const limite = await enforceWakiesLimit({
    limit: "memories",
    tier: identite.tier,
    used: (await listMemories(identite.userId)).length,
  });
  if (limite) {
    return limite;
  }
  const row = await saveMemory(identite.userId, parsed.data.text);
  return json(row, { status: 201 });
}
