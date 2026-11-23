import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveCometImageModelForRequest } from "@/lib/ai/catalog/media-models";
import { errorResponse, logError } from "@/lib/api/error-response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { requireUser } from "@/lib/auth/require-user";
import {
  confirmImageGenerationReservation,
  releaseImageGenerationReservation,
  reserveDailyImageQuota,
} from "@/lib/db/queries/generations";
import { getTierImageDailyLimit } from "@/lib/plans/tier-limits";
import { formatImageSrc } from "@/lib/utils";

const IMAGE_DIMENSION_DEFAULT = 1024;
const IMAGE_DIMENSION_MIN = 64;
const IMAGE_DIMENSION_MAX = 4096;
const IMAGE_UPSTREAM_TIMEOUT_MS = 120_000;

// Dimension tolérante : absente, nulle ou vide → valeur par défaut ; sinon un
// entier borné (le navigateur n'impose aucune taille à l'amont).
const dimensionSchema = z.preprocess(
  (value) =>
    value === null || value === undefined || value === "" ? undefined : value,
  z.coerce
    .number()
    .int()
    .min(IMAGE_DIMENSION_MIN)
    .max(IMAGE_DIMENSION_MAX)
    .default(IMAGE_DIMENSION_DEFAULT)
);

const imageRequestSchema = z.object({
  height: dimensionSchema,
  model: z.string().trim().max(120).nullish(),
  negative_prompt: z.string().trim().max(2000).nullish(),
  prompt: z.string().trim().min(1).max(4000),
  width: dimensionSchema,
});

type CometImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  id?: string;
  image_url?: string;
};

export async function POST(req: NextRequest) {
  try {
    // Session vérifiée obligatoire avant tout appel payé avec la clé plateforme.
    const auth = await requireUser();
    if (!auth) {
      return errorResponse("auth_required");
    }
    const { user, userId } = auth;

    const limited = await enforceApiRateLimit({
      action: "image_generation",
      request: req,
      userId,
    });
    if (limited) {
      return limited;
    }

    const parsed = imageRequestSchema.safeParse(
      await req.json().catch(() => null)
    );
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message:
          "Requête invalide : description obligatoire (4000 caractères max) et dimensions entre 64 et 4096 px.",
      });
    }
    const { height, prompt, width } = parsed.data;
    const resolvedModel = await resolveCometImageModelForRequest({
      allowLegacyFallback: true,
      requestedModel: parsed.data.model,
    });
    if (!resolvedModel.ok) {
      return errorResponse(
        resolvedModel.status === 503 ? "service_unavailable" : "invalid_request",
        {
          code: resolvedModel.code,
          message: resolvedModel.message,
          status: resolvedModel.status,
        }
      );
    }
    const model = resolvedModel.model.id;
    const negativePrompt = parsed.data.negative_prompt || undefined;

    const cometKey = process.env.COMET_API_KEY?.trim();
    if (!cometKey) {
      return errorResponse("service_unavailable", {
        message: "Génération d'image indisponible pour le moment.",
      });
    }

    // Réservation atomique et verrouillée du quota journalier AVANT l'appel
    // externe (BUG-001 & BUG-003) : protège contre la concurrence et empêche
    // tout contournement si l'écriture post-génération échoue.
    const dailyLimit = getTierImageDailyLimit(user.tier || "Free");
    const reservation = await reserveDailyImageQuota({
      dailyLimit,
      height,
      model,
      negativePrompt,
      prompt,
      userId,
      width,
    });
    if (!reservation.ok) {
      return errorResponse("quota_exceeded", {
        details: { limit: reservation.limit, used: reservation.used },
        message: `Votre quota journalier de génération d'images est épuisé (${reservation.used}/${reservation.limit} images). Réinitialisation à minuit UTC.`,
      });
    }

    const releaseReservation = async () => {
      try {
        await releaseImageGenerationReservation({
          reservationId: reservation.reservationId,
          userId,
        });
      } catch (releaseErr) {
        logError("Erreur libération réservation quota image", releaseErr);
      }
    };

    let res: Response;
    try {
      res = await fetch("https://api.cometapi.com/v1/images/generations", {
        body: JSON.stringify({
          height,
          model,
          n: 1,
          negative_prompt: negativePrompt,
          prompt,
          response_format: "url",
          size: `${width}x${height}`,
          width,
        }),
        headers: {
          Authorization: `Bearer ${cometKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(IMAGE_UPSTREAM_TIMEOUT_MS),
      });
    } catch (fetchErr) {
      await releaseReservation();
      throw fetchErr;
    }

    // Le détail de l'erreur amont reste dans les journaux, jamais côté client.
    if (!res.ok) {
      await releaseReservation();
      const errorPreview = await res
        .text()
        .then((txt) => txt.slice(0, 400))
        .catch(() => "");
      logError("Erreur amont génération d'image (CometAPI)", {
        body: errorPreview,
        model,
        status: res.status,
      });
      return errorResponse("upstream_error", {
        message: "Le fournisseur d'images a renvoyé une erreur. Réessayez.",
      });
    }

    const data = (await res
      .json()
      .catch(() => null)) as CometImageResponse | null;
    const first = data?.data?.[0];
    const rawImage = first?.url || first?.b64_json || data?.image_url || "";
    if (!rawImage) {
      await releaseReservation();
      return errorResponse("upstream_error", {
        message: "Aucune image retournée par le fournisseur.",
      });
    }

    // Confirmation de la réservation existante : même si cette mise à jour
    // échoue, la ligne `pending` reste comptabilisée (aucun contournement).
    try {
      await confirmImageGenerationReservation({
        imageUrl: formatImageSrc(rawImage),
        reservationId: reservation.reservationId,
        userId,
      });
    } catch (dbErr) {
      logError("Erreur confirmation réservation image en base", dbErr);
    }

    // Projection minimale : seuls les champs lus par l'interface sont renvoyés.
    return NextResponse.json({
      data: [{ b64_json: first?.b64_json, url: first?.url }],
      id: data?.id,
      image_url: data?.image_url,
    });
  } catch (err) {
    logError("Erreur génération d'image", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la génération de l'image.",
    });
  }
}
