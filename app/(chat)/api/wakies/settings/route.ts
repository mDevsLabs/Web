import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { json, requireWakiesUser } from "@/lib/wakies/http";
import { updateSettings } from "@/lib/wakies/queries";

/**
 * PATCH /api/wakies/settings — réglages du compte (pause, recherche, mémoire).
 *
 * Le gabarit exposait la même chose en JSON libre sur une ligne SQLite
 * globale. Ici la ligne est PORTE PAR COMPTE (`WakiesSettings.userId`), donc
 * mettre en pause n'arrête que les Wakies de son propriétaire.
 */

const schema = z
  .object({
    memoryAllowed: z.boolean().optional(),
    name: z.string().trim().min(1).max(40).optional(),
    paused: z.boolean().optional(),
    researchAllowed: z.boolean().optional(),
  })
  .strict();

export async function PATCH(request: Request) {
  const identite = await requireWakiesUser();
  if (identite instanceof Response) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const settings = await updateSettings(identite.userId, parsed.data);
  return json(settings);
}
