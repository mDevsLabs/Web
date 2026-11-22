import "server-only";

import { logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getUserPreferences } from "@/lib/db/queries";
import {
  countTodayImageGenerations,
  recordImageGeneration,
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
    // depuis un module serveur.
    let targetModel = "black-forest-labs/flux-1-schnell";
    let targetWidth = width;
    let targetHeight = height;
    const prefs = await getUserPreferences(params.userId).catch(() => null);
    if (prefs?.defaultImageModel) {
      targetModel = prefs.defaultImageModel;
    }
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

    // Quota journalier du forfait (même source que la route
    // /api/images/generations), vérifié avant l'appel payant. Forfait
    // illisible : limites Free, les plus strictes.
    const user = await getMaiUser(token).catch(() => null);
    const dailyLimit = getTierImageDailyLimit(user?.tier);
    try {
      const usedToday = await countTodayImageGenerations(params.userId);
      if (dailyLimit > 0 && usedToday >= dailyLimit) {
        return {
          error: `Votre quota journalier de génération d'images est épuisé (${usedToday}/${dailyLimit} images). Réinitialisation à minuit UTC.`,
          limit: dailyLimit,
          used: usedToday,
        };
      }
    } catch (quotaError) {
      logError("Vérification du quota de génération d'image", quotaError);
    }

    const cometApiKey = process.env.COMET_API_KEY?.trim();
    if (!cometApiKey) {
      return { error: "Génération d'image indisponible pour le moment." };
    }

    const res = await fetch("https://api.cometapi.com/v1/images/generations", {
      body: JSON.stringify({
        height: targetHeight,
        model: targetModel,
        n: 1,
        negative_prompt: negativePrompt || undefined,
        prompt,
        response_format: "url",
        size: `${targetWidth}x${targetHeight}`,
        width: targetWidth,
      }),
      headers: {
        Authorization: `Bearer ${cometApiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(IMAGE_UPSTREAM_TIMEOUT_MS),
    });
    // Le détail de l'erreur amont reste dans les journaux : il n'est jamais
    // relayé tel quel au modèle ni à l'utilisateur.
    if (!res.ok) {
      const errorPreview = await res
        .text()
        .then((txt) => txt.slice(0, 400))
        .catch(() => "");
      logError("Erreur amont génération d'image (CometAPI)", {
        body: errorPreview,
        model: targetModel,
        status: res.status,
      });
      return { error: IMAGE_GENERIC_ERROR };
    }
    const data = (await res.json().catch(() => ({}))) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      image_url?: string;
    };
    const rawUrl =
      data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.image_url;
    if (!rawUrl) {
      return { error: "Aucune image retournée" };
    }
    const imageUrl = formatImageSrc(rawUrl);

    // Persistance directe dans la table Neon mprojects_image_generations
    try {
      await recordImageGeneration({
        height: targetHeight,
        imageUrl,
        model: targetModel,
        negativePrompt,
        prompt,
        userId: params.userId,
        width: targetWidth,
      });
    } catch (dbErr) {
      logError("Erreur enregistrement image en base", dbErr);
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
