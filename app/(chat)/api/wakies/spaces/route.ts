import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  enforceWakiesLimit,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { createSpace, listSpaces } from "@/lib/wakies/queries";

/**
 * GET  /api/wakies/spaces — espaces du compte.
 * POST /api/wakies/spaces — création.
 *
 * Un compte qui n'a jamais ouvert Wakies n'a ni espace, ni Wakie, ni
 * conversation : `ensureStarterWorkspace` (lib/wakies/onboarding.ts) crée
 * l'ensemble de départ au premier chargement de l'application.
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
  const limite = await enforceWakiesLimit({
    limit: "spaces",
    tier: identite.tier,
    used: (await listSpaces(identite.userId)).length,
  });
  if (limite) {
    return limite;
  }
  try {
    const space = await createSpace(identite.userId, parsed.data);
    return json(space, { status: 201 });
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
