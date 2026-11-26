import { type NextRequest, NextResponse } from "next/server";
import { resolveSpeechModelForRequest } from "@/lib/ai/catalog/media-models";
import { errorResponse, logError } from "@/lib/api/error-response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import {
  ALLOWED_AUDIO_FORMATS,
  audioFormatFromMime,
  buildAudioDataUrl,
  isPcmMimeType,
  normalizePlayableAudioBinary,
  parsePcmAudioParams,
  parseRequestedAudioFormat,
  resolveAudioMimeType,
  wrapPcm16AsWav,
} from "@/lib/audio/format";
import { requireUser } from "@/lib/auth/require-user";
import {
  estimateSpeechTokens,
  recordSpeechGeneration,
  releaseWeeklySpeechQuota,
  reserveWeeklySpeechQuota,
} from "@/lib/db/queries/generations";
import { getTierSpeechWeeklyLimit } from "@/lib/plans/tier-limits";

// Un corps de synthèse vocale se mesure en kilo-octets, pas en méga-octets :
// lire au-delà de ce plafond coûte de la mémoire pour un envoi qui sera refusé.
const SPEECH_BODY_MAX_BYTES = 64 * 1024;

// Plages des fournisseurs : le chemin HTTP ne bornait ni la taille du texte ni
// la vitesse, qui partaient tels quels vers l'amont.
const SPEECH_INPUT_MAX_LENGTH = 5000;
const SPEECH_SPEED_MIN = 0.25;
const SPEECH_SPEED_MAX = 4;
const SPEECH_FIELD_MAX_LENGTH = 120;

async function readBoundedJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > SPEECH_BODY_MAX_BYTES) {
    return null;
  }
  const raw = await request.text();
  if (raw.length > SPEECH_BODY_MAX_BYTES) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readShortString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed && trimmed.length <= SPEECH_FIELD_MAX_LENGTH
    ? trimmed
    : fallback;
}

export async function POST(req: NextRequest) {
  try {
    // Session vérifiée obligatoire : la simple présence d'un cookie suffisait
    // auparavant à déclencher un appel payé avec la clé de la plateforme.
    const auth = await requireUser();
    if (!auth) {
      return errorResponse("auth_required", {
        message: "Non authentifié. Veuillez vous connecter.",
      });
    }
    const { user, userId } = auth;

    const limited = await enforceApiRateLimit({
      action: "audio_generation",
      request: req,
      userId,
    });
    if (limited) {
      return limited;
    }

    // Corps borné avant toute lecture de quota : la taille du texte est la seule
    // donnée que l'appelant contrôle, et elle était transmise telle quelle.
    const parsed = await readBoundedJson(req);
    if (!parsed || typeof parsed !== "object") {
      return errorResponse("invalid_request", {
        message: "Corps de requête invalide.",
      });
    }
    const body = parsed as Record<string, unknown>;
    const rawInput = body.input || body.prompt || body.text || "";

    if (typeof rawInput !== "string" || !rawInput.trim()) {
      return errorResponse("invalid_request", {
        message: "Le texte à synthétiser est obligatoire.",
      });
    }
    const input = rawInput.trim();

    if (input.length > SPEECH_INPUT_MAX_LENGTH) {
      return errorResponse("invalid_request", {
        details: { limit: SPEECH_INPUT_MAX_LENGTH },
        message: `Le texte à synthétiser dépasse ${SPEECH_INPUT_MAX_LENGTH} caractères.`,
      });
    }

    const requestedModel = readShortString(body.model, "");
    const requestedVoice = readShortString(body.voice, "");
    const requestedFormat = parseRequestedAudioFormat(body.response_format);
    if (!requestedFormat) {
      return errorResponse("invalid_request", {
        details: { allowed: ALLOWED_AUDIO_FORMATS },
        message: `Format audio non pris en charge. Formats autorisés : ${ALLOWED_AUDIO_FORMATS.join(", ")}.`,
      });
    }

    // `Number("abc")` vaut NaN et traversait le calcul de quota. On borne
    // explicitement, et une valeur illisible retombe sur le défaut.
    const rawSpeed = Number(body.speed);
    const speed = Number.isFinite(rawSpeed)
      ? Math.min(Math.max(rawSpeed, SPEECH_SPEED_MIN), SPEECH_SPEED_MAX)
      : 1.0;

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return errorResponse("service_unavailable", {
        message: "La synthèse vocale n'est pas configurée.",
      });
    }

    const tier = user.tier || "Free";
    const resolved = await resolveSpeechModelForRequest({
      allowLegacyFallback: true,
      requestedFormat,
      requestedModel,
      requestedSpeed: speed,
      requestedVoice,
      tier,
    });
    if (!resolved.ok) {
      const apiCode =
        resolved.status === 403
          ? "model_access_denied"
          : resolved.status === 404
            ? "not_found"
            : resolved.status === 503
              ? "service_unavailable"
              : "invalid_request";
      return errorResponse(apiCode, {
        details: { reason: resolved.code },
        message: resolved.message,
        status: resolved.status,
      });
    }

    const model = resolved.model.id;
    const voice = resolved.voice;
    const responseFormat = resolved.responseFormat;

    // Réservation atomique et verrouillée du quota Speech hebdomadaire AVANT
    // l'appel externe (BUG-001 & BUG-003) : aucune concurrence ni erreur
    // d'enregistrement post-génération ne peut contourner le quota.
    const weeklyLimit = getTierSpeechWeeklyLimit(tier);
    const tokensUsed = estimateSpeechTokens(input);
    const reservation = await reserveWeeklySpeechQuota({
      tokens: tokensUsed,
      userId,
      userKeys: [user.id, user.email, user.username],
      weeklyLimit,
    });
    if (!reservation.ok) {
      return errorResponse("quota_exceeded", {
        details: { limit: reservation.limit, used: reservation.used },
        message:
          "Votre quota hebdomadaire de synthèse vocale est épuisé. Réinitialisation lundi à minuit UTC.",
      });
    }

    const releaseReservation = async () => {
      try {
        await releaseWeeklySpeechQuota({
          tokens: tokensUsed,
          userId,
          weekStart: reservation.weekStart,
        });
      } catch (releaseErr) {
        logError("Erreur libération réservation quota Speech", releaseErr);
      }
    };

    let openRouterRes: Response;
    try {
      openRouterRes = await fetch("https://openrouter.ai/api/v1/audio/speech", {
        body: JSON.stringify({
          input,
          ...resolved.payload,
        }),
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mai.mdevs.fr",
          "X-Title": "mAI Speech",
        },
        method: "POST",
        signal: AbortSignal.timeout(60_000),
      });
    } catch (fetchErr) {
      await releaseReservation();
      throw fetchErr;
    }

    // Le détail de l'erreur amont reste dans les journaux serveur : il n'est
    // jamais relayé tel quel au navigateur.
    if (!openRouterRes.ok) {
      await releaseReservation();
      const upstreamDetail = await openRouterRes.text().catch(() => "");
      logError(
        "Erreur amont audio/generations",
        new Error(
          `HTTP ${openRouterRes.status}: ${upstreamDetail.slice(0, 500)}`
        )
      );
      return errorResponse("upstream_error", {
        message: "Le service de synthèse vocale a renvoyé une erreur.",
      });
    }

    const contentType = openRouterRes.headers.get("content-type") || "";
    let audioUrl = "";
    let resolvedMimeType = resolveAudioMimeType({
      requestedFormat: responseFormat,
      upstreamContentType: contentType,
    });

    try {
      if (contentType.includes("application/json")) {
        const json = (await openRouterRes.json().catch(() => null)) as {
          audio_url?: unknown;
          audioContent?: unknown;
          content_type?: unknown;
          format?: unknown;
          mime_type?: unknown;
        } | null;
        resolvedMimeType = resolveAudioMimeType({
          jsonFormat: json?.format,
          jsonMimeType: json?.mime_type ?? json?.content_type,
          requestedFormat: responseFormat,
        });
        if (typeof json?.audio_url === "string" && json.audio_url) {
          audioUrl = json.audio_url;
        } else if (
          typeof json?.audioContent === "string" &&
          json.audioContent
        ) {
          if (isPcmMimeType(resolvedMimeType)) {
            const wavBytes = wrapPcm16AsWav(
              Buffer.from(json.audioContent, "base64"),
              parsePcmAudioParams(
                typeof json.mime_type === "string"
                  ? json.mime_type
                  : contentType
              )
            );
            resolvedMimeType = "audio/wav";
            audioUrl = buildAudioDataUrl(
              Buffer.from(wavBytes).toString("base64"),
              "audio/wav"
            );
          } else {
            audioUrl = buildAudioDataUrl(json.audioContent, resolvedMimeType);
          }
        }
      } else {
        const arrayBuf = await openRouterRes.arrayBuffer();
        if (arrayBuf.byteLength > 0) {
          const normalized = normalizePlayableAudioBinary({
            bytes: new Uint8Array(arrayBuf),
            requestedFormat: responseFormat,
            upstreamContentType: contentType,
          });
          resolvedMimeType = normalized.mimeType;
          audioUrl = buildAudioDataUrl(
            Buffer.from(normalized.bytes).toString("base64"),
            normalized.mimeType
          );
        }
      }
    } catch (readErr) {
      await releaseReservation();
      throw readErr;
    }

    // Une réponse sans audio était annoncée comme un succès : on libère la
    // réservation et on renvoie une erreur explicite.
    if (!audioUrl) {
      await releaseReservation();
      return errorResponse("upstream_error", {
        message: "Aucun flux audio n'a été retourné.",
      });
    }

    const resolvedFormat = audioFormatFromMime(
      resolvedMimeType,
      responseFormat
    );

    // Le quota est déjà durablement réservé et confirmé avant la réponse.
    // L'historique reste enregistré sans pouvoir annuler la comptabilisation.
    try {
      await recordSpeechGeneration({
        audioUrl,
        characterCount: input.length,
        inputText: input,
        model,
        tokensCount: tokensUsed,
        userId,
        voice,
      });
    } catch (historyErr) {
      logError("Erreur enregistrement historique audio", historyErr);
    }

    return NextResponse.json({
      audio_url: audioUrl,
      character_count: input.length,
      created: Math.floor(Date.now() / 1000),
      format: resolvedFormat,
      id: `audio_${Date.now()}`,
      mime_type: resolvedMimeType,
      model,
      success: true,
      text: input,
      tokens_used: tokensUsed,
      voice,
    });
  } catch (error: unknown) {
    logError("Erreur API audio/generations", error);
    return errorResponse("internal_error", {
      message: "Erreur interne du serveur lors de la synthèse vocale.",
    });
  }
}
