import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  badRequest,
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import {
  ajouterAmi,
  findWakie,
  listerAmis,
  retirerAmi,
  trouverWakiePublic,
} from "@/lib/wakies/queries";

/**
 * GET    /api/wakies/friends — mes Wakies amis.
 * POST   /api/wakies/friends {wakieId} — ajoute un Wakie PUBLIC en ami.
 * DELETE /api/wakies/friends?wakieId= — retire un ami.
 *
 * Un ami est un ABONNEMENT à un Wakie public : on ne peut donc pas s'ajouter
 * soi-même (409, l'état n'aurait aucun sens) ni un Wakie privé (404 : son
 * existence même n'est pas publique). L'ajout est idempotent — un double-clic
 * ne produit pas d'erreur — et la retrait est silencieux si l'ami n'existait
 * pas : dans les deux cas, l'état demandé est atteint.
 *
 * `ownerUserId` est dénormalisé par `ajouterAmi` à partir de la ligne réelle
 * du Wakie, jamais d'une valeur fournie par le client.
 */

const schema = z.object({ wakieId: z.string().uuid() }).strict();

export async function GET() {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  return json(
    { amis: await listerAmis(identite.userId) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const origine = rejectCrossOriginMutation(request);
  if (origine) return origine;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Identifiant de Wakie invalide.",
    });
  }
  // L'ordre compte : « c'est déjà le mien » est un refus explicite et non un
  // 404 déguisé — l'utilisateur a le droit de savoir pourquoi.
  if (await findWakie(identite.userId, parsed.data.wakieId)) {
    return errorResponse("invalid_request", {
      message: "Ce Wakie vous appartient déjà.",
    });
  }
  if (!(await trouverWakiePublic(parsed.data.wakieId))) {
    return notFound("Wakie public introuvable.");
  }
  await ajouterAmi(identite.userId, parsed.data.wakieId);
  return json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const origine = rejectCrossOriginMutation(request);
  if (origine) return origine;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const wakieId = new URL(request.url).searchParams.get("wakieId") ?? "";
  if (!z.string().uuid().safeParse(wakieId).success) {
    return badRequest("Identifiant de Wakie invalide.");
  }
  const retire = await retirerAmi(identite.userId, wakieId);
  return json({ ok: true, retire });
}
