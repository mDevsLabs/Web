import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { pageSettings } from "@/lib/wakies/pages";
import { findPage, setPageSettings } from "@/lib/wakies/queries";

/**
 * POST /api/wakies/pages/:id/settings — réglages de lecture d'une page.
 *
 * Route séparée du PATCH pour la même raison que l'épingle : régler la largeur
 * de la colonne ou afficher le titre n'est pas éditer le document. Passer par
 * le PATCH ferait varier la révision et coûterait sa sauvegarde, en 409, à
 * l'onglet ouvert sur la page pendant que l'utilisateur change un réglage.
 */

const schema = z
  .object({ settings: pageSettings.partial().nullable() })
  .strict();

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
  const page = await findPage(identite.userId, id);
  if (!page) return notFound("Page introuvable.");

  const actuel = pageSettings.parse(page.settings ?? {});
  const demande = parsed.data.settings;
  // `null` = aucun réglage, la page reprend son rendu par défaut. Un objet
  // partiel ne remplace QUE les clés envoyées : écraser les autres inventerait
  // un réglage que l'utilisateur n'a pas fait.
  const suivant = demande === null ? null : { ...actuel, ...demande };
  await setPageSettings(identite.userId, id, suivant);
  return json({ settings: suivant, success: true });
}
