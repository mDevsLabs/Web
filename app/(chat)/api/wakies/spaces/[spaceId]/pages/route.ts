import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  enforceWakiesLimit,
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { createPage, listPages, spaceExists } from "@/lib/wakies/queries";

/**
 * GET  /api/wakies/spaces/:spaceId/pages — pages d'un espace.
 * POST /api/wakies/spaces/:spaceId/pages — création (page manuelle ou issue
 *      d'une revue).
 *
 * Les deux lectures passent par `spaceExists(userId, …)` : un espace d'un autre
 * compte est un 404, pas une liste vide — sinon l'interface afficherait « aucun
 * espace » pour un compte qui en possède.
 */

const schema = z
  .object({
    content: z.string().max(100_000).optional(),
    parentId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(160),
  })
  .strict();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { spaceId } = await params;
  if (!(await spaceExists(identite.userId, spaceId))) {
    return notFound("Espace introuvable.");
  }
  return json(await listPages(identite.userId, spaceId));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { spaceId } = await params;
  if (!(await spaceExists(identite.userId, spaceId))) {
    return notFound("Espace introuvable.");
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const limite = await enforceWakiesLimit({
    limit: "pages",
    tier: identite.tier,
    used: (await listPages(identite.userId, spaceId)).length,
  });
  if (limite) {
    return limite;
  }
  try {
    const page = await createPage(identite.userId, spaceId, parsed.data);
    return json(page, { status: 201 });
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
