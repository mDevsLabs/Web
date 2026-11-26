import "server-only";

import { resolveSpeechModelForRequest } from "@/lib/ai/catalog/media-models";
import { logError } from "@/lib/api/error-response";
import {
  buildAudioDataUrl,
  isPcmMimeType,
  normalizePlayableAudioBinary,
  parsePcmAudioParams,
  resolveAudioMimeType,
  wrapPcm16AsWav,
} from "@/lib/audio/format";
import { getMaiUser } from "@/lib/auth/session";
import { getUserPreferences } from "@/lib/db/queries";
import {
  estimateSpeechTokens,
  recordSpeechGeneration,
  releaseWeeklySpeechQuota,
  reserveWeeklySpeechQuota,
} from "@/lib/db/queries/generations";
import { getTierSpeechWeeklyLimit } from "@/lib/plans/tier-limits";

// Cœur de synthèse vocale, extrait de l'outil du Chat
// (lib/ai/tools/audio-generate.ts) pour être partagé avec Agent sans
// duplication : quota hebdomadaire Speech, préférences utilisateur (modèle,
// voix, vitesse), appel API mAI et gestion des deux formats de réponse.
// La prévisualisation temps réel (data-audioDelta) reste de la responsabilité
// de l'appelant via le callback onAudio.

export type AudioGenerationRequest = {
  model?: string;
  recordHistory?: boolean;
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

const SPEECH_SPEED_MIN = 0.25;
const SPEECH_SPEED_MAX = 4;
const SPEECH_UPSTREAM_TIMEOUT_MS = 60_000;
const SPEECH_GENERIC_ERROR = "Erreur de génération audio.";

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
    if (!text.trim()) {
      return { error: "Le texte à synthétiser est obligatoire." };
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return { error: "Synthèse vocale indisponible pour le moment." };
    }

    // Réservation atomique et verrouillée du quota Speech hebdomadaire AVANT
    // l'appel payant (BUG-001 & BUG-003). En cas d'échec de lecture/réservation
    // en base, on refuse (fail-closed).
    const user = await getMaiUser(token).catch(() => null);
    const weeklyLimit = getTierSpeechWeeklyLimit(user?.tier);
    const tokensUsed = estimateSpeechTokens(text);
    let reservation: Awaited<ReturnType<typeof reserveWeeklySpeechQuota>>;
    try {
      reservation = await reserveWeeklySpeechQuota({
        tokens: tokensUsed,
        userId: params.userId,
        userKeys: [user?.id, user?.email, user?.username, params.userId],
        weeklyLimit,
      });
    } catch (quotaError) {
      logError("Réservation du quota Speech impossible", quotaError);
      return {
        error:
          "Quota Speech momentanément invérifiable. Réessayez dans un instant.",
      };
    }
    if (!reservation.ok) {
      return {
        error:
          "Votre quota hebdomadaire de synthèse vocale est épuisé. Réinitialisation lundi à minuit UTC.",
        limit: reservation.limit,
        used: reservation.used,
      };
    }

    const releaseReservation = async () => {
      try {
        await releaseWeeklySpeechQuota({
          tokens: tokensUsed,
          userId: params.userId,
          weekStart: reservation.weekStart,
        });
      } catch (releaseError) {
        logError("Erreur libération réservation quota Speech", releaseError);
      }
    };

    // Préférences utilisateur : lecture directe en base Neon, puis validation
    // contre le catalogue Speech réel et le forfait de l'utilisateur.
    const prefs = await getUserPreferences(params.userId).catch(() => null);
    const requestedModel = params.request.model || prefs?.defaultAudioModel;
    const requestedVoice = params.request.voice || prefs?.defaultAudioVoice;
    const rawSpeed = params.request.speed ?? prefs?.defaultAudioSpeed ?? 1.0;
    const numericSpeed = Number(rawSpeed);
    const safeSpeed = Number.isFinite(numericSpeed)
      ? Math.min(Math.max(numericSpeed, SPEECH_SPEED_MIN), SPEECH_SPEED_MAX)
      : 1.0;

    const resolved = await resolveSpeechModelForRequest({
      allowLegacyFallback: true,
      requestedFormat: "mp3",
      requestedModel,
      requestedSpeed: safeSpeed,
      requestedVoice,
      tier: user?.tier,
    });
    if (!resolved.ok) {
      await releaseReservation();
      return { error: resolved.message };
    }

    const targetModel = resolved.model.id;
    const targetVoice = resolved.voice;
    const responseFormat = resolved.responseFormat;

    let res: Response;
    try {
      res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
        body: JSON.stringify({
          input: text,
          ...resolved.payload,
        }),
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mai.mdevs.fr",
          "X-Title": "mAI Speech",
        },
        method: "POST",
        signal: AbortSignal.timeout(SPEECH_UPSTREAM_TIMEOUT_MS),
      });
    } catch (fetchError) {
      await releaseReservation();
      throw fetchError;
    }

    // Le détail de l'erreur amont reste dans les journaux : il n'est jamais
    // relayé tel quel au modèle ni à l'utilisateur.
    if (!res.ok) {
      await releaseReservation();
      logError("Erreur amont synthèse vocale", {
        model: targetModel,
        status: res.status,
      });
      return { error: SPEECH_GENERIC_ERROR };
    }

    const contentType = res.headers.get("content-type") || "";
    let audioUrl = "";

    try {
      if (contentType.includes("application/json")) {
        const data = (await res.json().catch(() => ({}))) as {
          audio_url?: string;
          audioContent?: string;
          content_type?: string;
          format?: string;
          mime_type?: string;
        };
        const mimeType = resolveAudioMimeType({
          jsonFormat: data?.format,
          jsonMimeType: data?.mime_type ?? data?.content_type,
          requestedFormat: responseFormat,
        });
        if (data?.audio_url) {
          audioUrl = data.audio_url;
        } else if (data?.audioContent) {
          if (isPcmMimeType(mimeType)) {
            const wavBytes = wrapPcm16AsWav(
              Buffer.from(data.audioContent, "base64"),
              parsePcmAudioParams(data.mime_type ?? contentType)
            );
            audioUrl = buildAudioDataUrl(
              Buffer.from(wavBytes).toString("base64"),
              "audio/wav"
            );
          } else {
            audioUrl = buildAudioDataUrl(data.audioContent, mimeType);
          }
        }
      } else {
        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength > 0) {
          const normalized = normalizePlayableAudioBinary({
            bytes: new Uint8Array(arrayBuf),
            requestedFormat: responseFormat,
            upstreamContentType: contentType,
          });
          audioUrl = buildAudioDataUrl(
            Buffer.from(normalized.bytes).toString("base64"),
            normalized.mimeType
          );
        }
      }
    } catch (readError) {
      await releaseReservation();
      throw readError;
    }

    if (!audioUrl) {
      await releaseReservation();
      return { error: "Aucun flux audio retourné." };
    }

    // Le quota est déjà acté avant l'appel externe : l'historique ne peut plus
    // annuler la comptabilisation en cas d'erreur d'écriture.
    if (params.request.recordHistory !== false) {
      try {
        await recordSpeechGeneration({
          audioUrl,
          characterCount: text.length,
          inputText: text,
          model: targetModel,
          tokensCount: tokensUsed,
          userId: params.userId,
          voice: targetVoice,
        });
      } catch (historyErr) {
        logError("Erreur enregistrement audio en base", historyErr);
      }
    }

    params.onAudio?.(audioUrl);

    return {
      audio_url: audioUrl,
      character_count: text.length,
      model: targetModel,
      text,
      tokens_used: tokensUsed,
      voice: targetVoice,
    };
  } catch (error) {
    logError("Erreur de génération audio", error);
    return { error: SPEECH_GENERIC_ERROR };
  }
}
