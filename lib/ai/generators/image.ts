import "server-only";

import {
  CometImageError,
  generateCometImage,
} from "@/lib/ai/catalog/comet-image-client";
import { resolveCometImageModelForRequest } from "@/lib/ai/catalog/media-models";
import { logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getUserPreferences } from "@/lib/db/queries";
import {
  confirmImageGenerationReservation,
  releaseImageGenerationReservation,
  reserveDailyImageQuota,
} from "@/lib/db/queries/generations";
import { getTierImageDailyLimit } from "@/lib/plans/tier-limits";
import { formatImageSrc } from "@/lib/utils";

// Cœur de génération d'image, extrait de l'outil du Chat
// (lib/ai/tools/image-generate.ts) pour être partagé avec Agent sans
// duplication : quotas, préférences utilisateur, appel API mAI et
// normalisation de l'URL. La prévisualisation temps réel (data-imageDelta)
// reste de la responsabilité de l'appelant via le callback onImage.

export type ImageGenerationRequest = {
  height?: number;
  negativePrompt?: string;
  prompt: string;
  width?: number;
};

export type ImageGenerationResult = {
  error?: string;
  height?: number;
  image_url?: string;
  limit?: number;
  prompt?: string;
  used?: number;
  width?: number;
};

type MaiSessionTokenGetter = () => Promise<string | null>;

const IMAGE_UPSTREAM_TIMEOUT_MS = 120_000;
const IMAGE_GENERIC_ERROR = "Erreur de génération d'image.";

export async function generateImageViaMai(params: {
  onImage?: (imageUrl: string) => void;
  request: ImageGenerationRequest;
  // Résolution du token mAI : le Chat la tire de la session, Agent du contexte.
  resolveToken: MaiSessionTokenGetter;
  userId: string;
}): Promise<ImageGenerationResult> {
  const { prompt, negativePrompt } = params.request;
  const width = params.request.width || 1024;
  const height = params.request.height || 1024;

  try {
    const token = await params.resolveToken();
    if (!token) {
      return {
        error:
          "Génération d'image non disponible sans session valide. Redirige vers /images.",
      };
    }

    // Préférences utilisateur : lecture directe en base, sans fetch relatif
    // depuis un module serveur, puis résolution contre le catalogue CometAPI actif.
    let targetWidth = width;
    let targetHeight = height;
    const prefs = await getUserPreferences(params.userId).catch(() => null);
    const resolvedModel = await resolveCometImageModelForRequest({
      allowLegacyFallback: true,
      requestedModel: prefs?.defaultImageModel,
    });
    if (!resolvedModel.ok) {
      return { error: resolvedModel.message };
    }
    const targetModel = resolvedModel.model.id;
    if (
      params.request.width === undefined &&
      params.request.height === undefined &&
      prefs?.defaultImageSize
    ) {
      const parts = prefs.defaultImageSize.split("x");
      if (parts.length === 2) {
        targetWidth = Number(parts[0]) || 1024;
        targetHeight = Number(parts[1]) || 1024;
      }
    }

    const cometApiKey = process.env.COMET_API_KEY?.trim();
    if (!cometApiKey) {
      return { error: "Génération d'image indisponible pour le moment." };
    }

    // Réservation atomique du quota journalier AVANT l'appel payant
    // (BUG-001 & BUG-003). En cas d'échec DB, refus (fail-closed).
    const user = await getMaiUser(token).catch(() => null);
    const dailyLimit = getTierImageDailyLimit(user?.tier);
    let reservation: Awaited<ReturnType<typeof reserveDailyImageQuota>>;
    try {
      reservation = await reserveDailyImageQuota({
        dailyLimit,
        height: targetHeight,
        model: targetModel,
        negativePrompt,
        prompt,
        userId: params.userId,
        width: targetWidth,
      });
    } catch (quotaError) {
      logError("Réservation du quota de génération d'image", quotaError);
      return {
        error:
          "Quota de génération d'images momentanément invérifiable. Réessayez dans un instant.",
      };
    }
    if (!reservation.ok) {
      return {
        error: `Votre quota journalier de génération d'images est épuisé (${reservation.used}/${reservation.limit} images). Réinitialisation à minuit UTC.`,
        limit: reservation.limit,
        used: reservation.used,
      };
    }

    const releaseReservation = async () => {
      try {
        await releaseImageGenerationReservation({
          reservationId: reservation.reservationId,
          userId: params.userId,
        });
      } catch (releaseError) {
        logError("Erreur libération réservation quota image", releaseError);
      }
    };

    let generated: { b64_json?: string; url?: string };
    try {
      generated = await generateCometImage({
        apiKey: cometApiKey,
        height: targetHeight,
        modelId: targetModel,
        prompt,
        signal: AbortSignal.timeout(IMAGE_UPSTREAM_TIMEOUT_MS),
        width: targetWidth,
      });
    } catch (genError) {
      await releaseReservation();
      // Le détail de l'erreur amont reste dans les journaux : il n'est jamais
      // relayé tel quel au modèle ni à l'utilisateur.
      logError("Erreur amont génération d'image (CometAPI)", {
        body: genError instanceof Error ? genError.message : String(genError),
        model: targetModel,
        status:
          genError instanceof CometImageError ? genError.status : undefined,
      });
      return { error: IMAGE_GENERIC_ERROR };
    }
    const rawUrl = generated.url || generated.b64_json;
    if (!rawUrl) {
      await releaseReservation();
      return { error: "Aucune image retournée" };
    }
    const imageUrl = formatImageSrc(rawUrl);

    // Confirmation de la réservation dans la table Neon mprojects_image_generations
    try {
      await confirmImageGenerationReservation({
        imageUrl,
        reservationId: reservation.reservationId,
        userId: params.userId,
      });
    } catch (dbErr) {
      logError("Erreur confirmation réservation image en base", dbErr);
    }

    params.onImage?.(imageUrl);

    return {
      height: targetHeight,
      image_url: imageUrl,
      prompt,
      width: targetWidth,
    };
  } catch (error) {
    logError("Erreur de génération d'image", error);
    return { error: IMAGE_GENERIC_ERROR };
  }
}
