import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getWakiesQuota } from "@/lib/plans/tier-limits";
import {
  badRequest,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
  wakiesQuotaResponse,
} from "@/lib/wakies/http";
import { createSpaceWithinQuota, listSpaces } from "@/lib/wakies/queries";
import { WakiesQuotaError } from "@/lib/wakies/quota-error";

/**
 * GET  /api/wakies/spaces — espaces du compte.
 * POST /api/wakies/spaces — création.
 *
 * L'ouverture de Wakies ne crée aucun espace automatiquement. Un nouvel
 * utilisateur commence à zéro et crée explicitement son premier Espace.
 */

const schema = z
  .object({
    description: z.string().max(500).optional(),
    name: z.string().trim().min(1).max(60),
  })
  .strict();

export async function GET() {
  const identite = await requireWakiesUser();
  if (identite instanceof Response) {
    return identite;
  }
  return json(await listSpaces(identite.userId));
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
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
  try {
    // Quota lu depuis le forfait, mais TRANCHÉ dans la transaction : deux
    // créations simultanées ne peuvent pas dépasser la dernière place.
    const space = await createSpaceWithinQuota(
      identite.userId,
      parsed.data,
      getWakiesQuota(identite.tier, "spaces")
    );
    return json(space, { status: 201 });
  } catch (erreur) {
    if (erreur instanceof WakiesQuotaError) {
      return wakiesQuotaResponse(erreur);
    }
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
