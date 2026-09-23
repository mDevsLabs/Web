import "server-only";

import { MAI_API_URL } from "@/lib/constants";
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

    // Préférences utilisateur : modèle et format par défaut, avec repli local
    // sur les valeurs canoniques (comportement identique à l'outil du Chat).
    let targetModel = "black-forest-labs/flux-1-schnell";
    let targetWidth = width;
    let targetHeight = height;
    try {
      const prefRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/user/preferences`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (prefRes.ok) {
        const prefs = (await prefRes.json()) as {
          defaultImageModel?: string;
          defaultImageSize?: string;
        };
        if (prefs.defaultImageModel) {
          targetModel = prefs.defaultImageModel;
        }
        if (
          params.request.width === undefined &&
          params.request.height === undefined &&
          prefs.defaultImageSize
        ) {
          const parts = prefs.defaultImageSize.split("x");
          if (parts.length === 2) {
            targetWidth = Number(parts[0]) || 1024;
            targetHeight = Number(parts[1]) || 1024;
          }
        }
      }
    } catch {}

    // Vérification préalable du quota journalier disponible
    try {
      const usageRes = await fetch(`${MAI_API_URL}/v1/images/usage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usageRes.ok) {
        const usageData = (await usageRes.json()) as {
          dailyLimit?: number;
          remaining?: number;
          usedToday?: number;
        };
        const dailyLimit = Number(usageData.dailyLimit ?? 0);
        const usedToday = Number(usageData.usedToday ?? 0);
        const remaining = Number(usageData.remaining ?? dailyLimit - usedToday);
        if (dailyLimit > 0 && (usedToday >= dailyLimit || remaining <= 0)) {
          return {
            error: `Votre quota journalier de génération d'images est épuisé (${usedToday}/${dailyLimit} images). Réinitialisation à minuit UTC.`,
            limit: dailyLimit,
            used: usedToday,
          };
        }
      }
    } catch (quotaError) {
      console.warn(
        "Avertissement vérification quota génération image:",
        quotaError
      );
    }

    const res = await fetch(`${MAI_API_URL}/v1/images/generations`, {
      body: JSON.stringify({
        height: targetHeight,
        model: targetModel,
        negative_prompt: negativePrompt || undefined,
        prompt,
        width: targetWidth,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-user-id": params.userId,
      },
      method: "POST",
    });
    const data = (await res.json().catch(() => ({}))) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message?: string } | string;
      image_url?: string;
      quota?: unknown;
    };
    if (!res.ok) {
      return {
        error:
          (typeof data?.error === "string"
            ? data.error
            : data?.error?.message || "") || "Erreur génération image",
      };
    }
    const rawUrl =
      data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.image_url;
    if (!rawUrl) {
      return { error: "Aucune image retournée" };
    }
    const imageUrl = formatImageSrc(rawUrl);

    params.onImage?.(imageUrl);

    return {
      height: targetHeight,
      image_url: imageUrl,
      prompt,
      width: targetWidth,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message
          ? error.message
          : "Erreur génération image",
    };
  }
}
