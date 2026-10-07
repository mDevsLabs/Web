import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  enforceWakiesLimit,
  isResponse,
  json,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { createWakie, listWakies } from "@/lib/wakies/queries";

/**
 * POST /api/wakies/wakies — création d'un Wakie.
 *
 * Le chemin s'appelait `/api/dots` dans le gabarit : le renommage
 * OpenDots/Dot → Wakies/Wakie va jusque dans le contrat d'API, pour qu'aucun
 * appel, aucune capture réseau et aucun script tiers ne conserve l'ancien nom.
 */

const schema = z
  .object({
    instructions: z.string().trim().min(3).max(2000),
    // Conteneur d'apprentissage Intelligence : hors périmètre du port, il est
    // conservé pour ne pas perdre la donnée si un compte l'exploite.
    learningContainerId: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .nullable()
      .optional(),
    memoryAllowed: z.boolean(),
    name: z.string().trim().min(1).max(40),
    researchAllowed: z.boolean(),
    skillDeliveryEnabled: z.boolean().optional(),
    spaceId: z.string().min(1),
    spaceIds: z.array(z.string().min(1)).min(1).max(100).optional(),
  })
  .strict();

export async function GET() {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  return json(await listWakies(identite.userId));
}

export async function POST(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  if (parsed.data.learningContainerId && !parsed.data.skillDeliveryEnabled) {
    return errorResponse("invalid_request", {
      message:
        "L'apprentissage exige l'activation explicite de la livraison de compétences.",
    });
  }
  const limite = await enforceWakiesLimit({
    limit: "wakies",
    tier: identite.tier,
    used: (await listWakies(identite.userId)).length,
  });
  if (limite) {
    return limite;
  }
  try {
    const wakie = await createWakie(identite.userId, parsed.data);
    return json(wakie, { status: 201 });
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
