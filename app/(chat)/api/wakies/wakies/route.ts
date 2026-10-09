import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getWakiesQuota } from "@/lib/plans/tier-limits";
import {
  badRequest,
  isResponse,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { validateWakiesModel } from "@/lib/wakies/model-access";
import {
  createWakie,
  listWakies,
  WakiesQuotaError,
} from "@/lib/wakies/queries";
import { WAKIE_AVATARS } from "@/lib/wakies/shared/avatars";

/**
 * POST /api/wakies/wakies — création d'un Wakie.
 *
 * Le chemin s'appelait `/api/dots` dans le gabarit : le renommage
 * OpenDots/Dot → Wakies/Wakie va jusque dans le contrat d'API, pour qu'aucun
 * appel, aucune capture réseau et aucun script tiers ne conserve l'ancien nom.
 *
 * QUOTA
 *
 * Le contrôle et l'insertion se font dans UNE transaction, sous verrou
 * consultatif (`createWakie`). Un `COUNT` suivi d'un `INSERT` séparés
 * laissait passer deux créations simultanées à la limite : sur Plus (6
 * Wakies), un compte à 5 pouvait en créer 7.
 */

const schema = z
  .object({
    // Mascotte choisie parmi les images de /wakies ; absente = défaut.
    avatar: z.enum(WAKIE_AVATARS).nullable().optional(),
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
    // Sélection d'outils. Absente = réglage par défaut ; `null` = effacer ;
    // un tableau = choix explicite, éventuellement vide. Les identifiants
    // sont revalidés côté serveur à chaque tour : une valeur inconnue ici
    // n'accorde aucun accès.
    mcpServerIds: z
      .array(z.string().min(1).max(64))
      .max(50)
      .nullable()
      .optional(),
    memoryAllowed: z.boolean(),
    // Modèle IA par défaut des nouvelles conversations. Le catalogue des
    // modèles est dynamique (API mAI) : on borne la forme, l'accès est tranché
    // par le backend au moment de l'appel.
    model: z.string().trim().min(1).max(200).nullable().optional(),
    name: z.string().trim().min(1).max(40),
    pluginIds: z.array(z.string().min(1).max(64)).max(50).nullable().optional(),
    researchAllowed: z.boolean(),
    skillDeliveryEnabled: z.boolean().optional(),
    skillIds: z.array(z.string().min(1).max(64)).max(50).nullable().optional(),
    skillParams: z
      .record(z.string().min(1).max(64), z.record(z.string(), z.string()))
      .nullable()
      .optional(),
    spaceId: z.string().min(1),
    spaceIds: z.array(z.string().min(1)).min(1).max(100).optional(),
    toolIds: z.array(z.string().min(1).max(64)).max(60).nullable().optional(),
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
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
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
  const modelError = await validateWakiesModel(
    parsed.data.model,
    identite.tier
  );
  if (modelError) return modelError;
  if (parsed.data.learningContainerId && !parsed.data.skillDeliveryEnabled) {
    return errorResponse("invalid_request", {
      message:
        "L'apprentissage exige l'activation explicite de la livraison de compétences.",
    });
  }
  try {
    const wakie = await createWakie(
      identite.userId,
      parsed.data,
      getWakiesQuota(identite.tier, "wakies")
    );
    return json(wakie, { status: 201 });
  } catch (erreur) {
    if (erreur instanceof WakiesQuotaError) {
      // 429 et non 400 : le compte est connu, la demande est valide, c'est la
      // limite qui l'a refusée. `used` est le compte réellement relevé dans la
      // transaction, donc il tient compte des créations concurrentes.
      return errorResponse("quota_exceeded", {
        details: {
          limit: "wakies",
          quota: erreur.limite,
          used: erreur.utilise,
        },
        message: `Limite de ${erreur.limite} Wakies atteinte pour ce forfait. Supprimez-en une avant d'en créer une nouvelle.`,
      });
    }
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
