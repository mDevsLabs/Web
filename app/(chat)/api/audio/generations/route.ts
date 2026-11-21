import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { requireUser } from "@/lib/auth/require-user";
import {
  addWeeklySpeechUsage,
  estimateSpeechTokens,
  getWeeklySpeechUsage,
  recordSpeechGeneration,
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

    const model = readShortString(body.model, "deepgram/flux-tts:free");
    const voice = readShortString(body.voice, "flux-alexis-en");
    const responseFormat = readShortString(body.response_format, "mp3");

    // `Number("abc")` vaut NaN et traversait le calcul de quota. On borne
    // explicitement, et une valeur illisible retombe sur le défaut.
    const rawSpeed = Number(body.speed);
    const speed = Number.isFinite(rawSpeed)
      ? Math.min(Math.max(rawSpeed, SPEECH_SPEED_MIN), SPEECH_SPEED_MAX)
      : 1.0;

    // Quota Speech hebdomadaire du forfait, contrôlé côté serveur AVANT l'appel
    // payant. Une lecture de quota en échec refuse la requête (fail-closed).
    const tier = user.tier || "Free";
    const weeklyLimit = getTierSpeechWeeklyLimit(tier);
    const tokensUsed = estimateSpeechTokens(input);
    const usage = await getWeeklySpeechUsage([
      user.id,
      user.email,
      user.username,
    ]);
    if (weeklyLimit > 0 && usage.tokensUsed + tokensUsed > weeklyLimit) {
      return errorResponse("quota_exceeded", {
        details: { limit: weeklyLimit, used: usage.tokensUsed },
        message:
          "Votre quota hebdomadaire de synthèse vocale est épuisé. Réinitialisation lundi à minuit UTC.",
      });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return errorResponse("service_unavailable", {
        message: "La synthèse vocale n'est pas configurée.",
      });
    }

    const openRouterRes = await fetch(
      "https://openrouter.ai/api/v1/audio/speech",
      {
        body: JSON.stringify({
          input,
          model,
          response_format: responseFormat,
          speed,
          voice,
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
      }
    );

    // Le détail de l'erreur amont reste dans les journaux serveur : il n'est
    // jamais relayé tel quel au navigateur.
    if (!openRouterRes.ok) {
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

    if (contentType.includes("application/json")) {
      const json = (await openRouterRes.json().catch(() => null)) as {
        audio_url?: unknown;
        audioContent?: unknown;
      } | null;
      if (typeof json?.audio_url === "string" && json.audio_url) {
        audioUrl = json.audio_url;
      } else if (typeof json?.audioContent === "string" && json.audioContent) {
        audioUrl = `data:audio/mp3;base64,${json.audioContent}`;
      }
    } else {
      const arrayBuf = await openRouterRes.arrayBuffer();
      if (arrayBuf.byteLength > 0) {
        audioUrl = `data:audio/mp3;base64,${Buffer.from(arrayBuf).toString("base64")}`;
      }
    }

    // Une réponse sans audio était annoncée comme un succès.
    if (!audioUrl) {
      return errorResponse("upstream_error", {
        message: "Aucun flux audio n'a été retourné.",
      });
    }

    // Comptabilisation du quota et historique : un échec d'écriture est
    // journalisé sans faire perdre l'audio déjà généré.
    const [usageWrite, historyWrite] = await Promise.allSettled([
      addWeeklySpeechUsage(userId, tokensUsed),
      recordSpeechGeneration({
        audioUrl,
        characterCount: input.length,
        inputText: input,
        model,
        tokensCount: tokensUsed,
        userId,
        voice,
      }),
    ]);
    if (usageWrite.status === "rejected") {
      logError("Erreur comptabilisation quota Speech", usageWrite.reason);
    }
    if (historyWrite.status === "rejected") {
      logError("Erreur enregistrement historique audio", historyWrite.reason);
    }

    return NextResponse.json({
      audio_url: audioUrl,
      character_count: input.length,
      created: Math.floor(Date.now() / 1000),
      id: `audio_${Date.now()}`,
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
