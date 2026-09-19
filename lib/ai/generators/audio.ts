import "server-only";

import { MAI_API_URL } from "@/lib/constants";

// Cœur de synthèse vocale, extrait de l'outil du Chat
// (lib/ai/tools/audio-generate.ts) pour être partagé avec Agent sans
// duplication : quota hebdomadaire Speech, préférences utilisateur (modèle,
// voix, vitesse), appel API mAI et gestion des deux formats de réponse.
// La prévisualisation temps réel (data-audioDelta) reste de la responsabilité
// de l'appelant via le callback onAudio.

export type AudioGenerationRequest = {
  speed?: number;
  text: string;
  voice?: string;
};

export type AudioGenerationResult = {
  audio_url?: string;
  character_count?: number;
  error?: string;
  id?: string;
  limit?: number;
  model?: string;
  text?: string;
  tokens_used?: number;
  used?: number;
  voice?: string;
};

export async function generateAudioViaMai(params: {
  onAudio?: (audioUrl: string) => void;
  request: AudioGenerationRequest;
  resolveToken: () => string | null;
  userId: string;
}): Promise<AudioGenerationResult> {
  const { text } = params.request;
  try {
    const token = params.resolveToken();
    if (!token) {
      return {
        error:
          "Génération audio non disponible sans session valide. Redirige vers /audio.",
      };
    }

    // Vérification préalable du quota Speech hebdomadaire
    try {
      const usageRes = await fetch(`${MAI_API_URL}/v1/audio/usage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usageRes.ok) {
        const usageData = (await usageRes.json()) as {
          tokensUsed?: number;
          weeklyLimit?: number;
        };
        const weeklyLimit = Number(usageData.weeklyLimit ?? 0);
        const tokensUsed = Number(usageData.tokensUsed ?? 0);
        const estimatedTokens = Math.max(1, Math.ceil(text.length / 3.5));
        if (
          weeklyLimit > 0 &&
          (tokensUsed >= weeklyLimit ||
            tokensUsed + estimatedTokens > weeklyLimit)
        ) {
          return {
            error: `Votre quota hebdomadaire Speech est atteint (${tokensUsed}/${weeklyLimit} tokens). Mettez à niveau votre forfait pour continuer.`,
            limit: weeklyLimit,
            used: tokensUsed,
          };
        }
      }
    } catch (quotaError) {
      console.warn(
        "Avertissement vérification quota génération audio:",
        quotaError
      );
    }

    // Préférences utilisateur : modèle, voix et vitesse par défaut.
    let targetModel = "deepgram/flux-tts:free";
    let targetVoice = params.request.voice || "flux-alexis-en";
    let targetSpeed = params.request.speed || 1.0;
    try {
      const prefRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/user/preferences`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (prefRes.ok) {
        const prefs = (await prefRes.json()) as {
          defaultAudioModel?: string;
          defaultAudioSpeed?: number;
          defaultAudioVoice?: string;
        };
        if (prefs.defaultAudioModel) {
          targetModel = prefs.defaultAudioModel;
        }
        if (!params.request.voice && prefs.defaultAudioVoice) {
          targetVoice = prefs.defaultAudioVoice;
        }
        if (!params.request.speed && prefs.defaultAudioSpeed) {
          targetSpeed = prefs.defaultAudioSpeed;
        }
      }
    } catch (prefError) {
      // Repli volontaire : préférences indisponibles → valeurs par défaut.
      console.warn("Préférences audio illisibles:", prefError);
    }

    const res = await fetch(`${MAI_API_URL}/v1/audio/speech`, {
      body: JSON.stringify({
        format: "json",
        input: text,
        model: targetModel,
        response_format: "mp3",
        return_json: true,
        speed: targetSpeed,
        voice: targetVoice,
      }),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-user-id": params.userId,
      },
      method: "POST",
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = (await res.json().catch(() => ({}))) as {
        audio_url?: string;
        audioContent?: string;
        character_count?: number;
        error?: { message?: string } | string;
        id?: string;
        model?: string;
        tokens_used?: number;
      };
      if (!res.ok) {
        return {
          error:
            (typeof data?.error === "string"
              ? data.error
              : data?.error?.message || "") || "Erreur de génération audio.",
        };
      }

      const audioUrl =
        data?.audio_url ||
        (data?.audioContent ? `data:audio/mp3;base64,${data.audioContent}` : "");
      if (!audioUrl) {
        return { error: "Aucun flux audio retourné." };
      }

      params.onAudio?.(audioUrl);

      return {
        audio_url: audioUrl,
        character_count: data?.character_count || text.length,
        id: data?.id,
        model: data?.model || "Flux TTS",
        text,
        tokens_used: data?.tokens_used || Math.ceil(text.length / 3.5),
        voice: targetVoice,
      };
    }

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const audioUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;

      params.onAudio?.(audioUrl);

      return {
        audio_url: audioUrl,
        character_count: text.length,
        model: "Flux TTS",
        text,
        tokens_used: Math.ceil(text.length / 3.5),
        voice: targetVoice,
      };
    }

    const errText = await res.text().catch(() => "");
    // Jamais de contenu amont brut renvoyé à l'utilisateur (fuite) —
    // tracé côté serveur uniquement.
    console.warn("Erreur TTS amont:", res.status, errText.slice(0, 300));
    return { error: "Erreur lors de la génération audio." };
  } catch (error) {
    console.warn("Erreur de génération audio:", error);
    return { error: "Erreur de génération audio." };
  }
}
