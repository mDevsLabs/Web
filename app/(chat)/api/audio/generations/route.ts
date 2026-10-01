import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { getUserApiKey } from "@/lib/db/api-keys";

// Un corps de synthèse vocale se mesure en kilo-octets, pas en méga-octets :
// lire au-delà de ce plafond coûte de la mémoire pour un envoi qui sera refusé.
const SPEECH_BODY_MAX_BYTES = 64 * 1024;

// Plages des fournisseurs : le chemin HTTP ne bornait ni la taille du texte ni
// la vitesse, qui partaient tels quels vers l'amont.
const SPEECH_INPUT_MAX_LENGTH = 5000;
const SPEECH_SPEED_MIN = 0.25;
const SPEECH_SPEED_MAX = 4;

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

export async function POST(req: NextRequest) {
  try {
    const user = await getMaiUser();
    let authHeader = "";

    if (user?.id) {
      const apiKey = await getUserApiKey(user.id);
      if (apiKey) {
        authHeader = `Bearer ${apiKey}`;
      }
    }

    if (!authHeader) {
      const token = await getMaiSessionToken();
      if (token) {
        authHeader = `Bearer ${token}`;
      }
    }

    if (!authHeader) {
      return errorResponse("auth_required", {
        message: "Non authentifié. Veuillez vous connecter.",
      });
    }

    const limited = await enforceApiRateLimit({
      action: "audio_generation",
      request: req,
      userId: user ? user.id || user.email : null,
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
    const input = body.input || body.prompt || body.text || "";

    if (!input || typeof input !== "string" || !input.trim()) {
      return errorResponse("invalid_request", {
        message: "Le texte à synthétiser est obligatoire.",
      });
    }

    if (input.length > SPEECH_INPUT_MAX_LENGTH) {
      return errorResponse("invalid_request", {
        details: { limit: SPEECH_INPUT_MAX_LENGTH },
        message: `Le texte à synthétiser dépasse ${SPEECH_INPUT_MAX_LENGTH} caractères.`,
      });
    }

    const model = body.model || "deepgram/flux-tts:free";
    const voice = body.voice || "flux-alexis-en";
    const response_format = body.response_format || "mp3";

    // `Number("abc")` vaut NaN et traversait le calcul de quota. On borne
    // explicitement, et une valeur illisible retombe sur le défaut.
    const rawSpeed = Number(body.speed);
    const speed = Number.isFinite(rawSpeed)
      ? Math.min(Math.max(rawSpeed, SPEECH_SPEED_MIN), SPEECH_SPEED_MAX)
      : 1.0;

    // Pré-contrôle de quota Speech, purement informatif : le backend applique la
    // limite de toute façon, donc une panne de cette lecture ne doit pas
    // bloquer une synthèse légitime.
    const usage = await upstreamJson<{
      tokensUsed?: number;
      weeklyLimit?: number;
    }>({ path: "/v1/audio/usage", token: authHeader });
    if (usage.ok) {
      const weeklyLimit = Number(usage.data.weeklyLimit ?? 0);
      const tokensUsed = Number(usage.data.tokensUsed ?? 0);
      const estimatedTokens = Math.max(1, Math.ceil(input.trim().length / 3.5));
      if (
        weeklyLimit > 0 &&
        (tokensUsed >= weeklyLimit ||
          tokensUsed + estimatedTokens > weeklyLimit)
      ) {
        return errorResponse("quota_exceeded", {
          details: { limit: weeklyLimit, used: tokensUsed },
          message: `Votre quota hebdomadaire Speech est atteint (${tokensUsed}/${weeklyLimit} tokens). Mettez à niveau votre forfait pour continuer.`,
        });
      }
    } else {
      console.warn(
        "Pré-contrôle de quota audio indisponible, la décision revient à l'amont :",
        usage.payload.message
      );
    }

    // Cette route n'utilise pas `upstreamJson` : l'amont peut renvoyer du JSON OU
    // un flux binaire audio, selon le fournisseur. Le client amont normalise le
    // JSON et son erreur ; la branche binaire reste gérée ici, sur le même
    // `fetch` mais avec un délai de génération.
    const maiRes = await fetch(`${MAI_API_URL}/v1/audio/speech`, {
      body: JSON.stringify({
        format: "json",
        input: input.trim(),
        model,
        response_format,
        return_json: true,
        speed,
        voice,
      }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(60_000),
    });

    // Si le serveur a renvoyé du JSON
    const contentType = maiRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await maiRes.json().catch(() => null);
      if (!maiRes.ok) {
        const payload = normalizeUpstreamError(json, maiRes.status);
        return NextResponse.json(payload, { status: payload.status });
      }
      // Réponse announced JSON mais corps illisible : on n'indexe pas `null`.
      if (!json || typeof json !== "object") {
        return errorResponse("upstream_error", {
          message: "Réponse inattendue du service de synthèse vocale.",
        });
      }
      return NextResponse.json({
        audio_url:
          json.audio_url ||
          (json.audioContent
            ? `data:audio/mp3;base64,${json.audioContent}`
            : ""),
        character_count: json.character_count || input.length,
        created: json.created || Math.floor(Date.now() / 1000),
        id: json.id || `audio_${Date.now()}`,
        model: json.model || model,
        success: true,
        text: input.trim(),
        tokens_used: json.tokens_used || Math.ceil(input.length / 3.5),
        usage: json.usage,
        voice,
      });
    }

    // Si le serveur a renvoyé un flux binaire audio brut
    if (maiRes.ok) {
      const arrayBuf = await maiRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const base64 = buffer.toString("base64");
      const mime = response_format === "wav" ? "audio/wav" : "audio/mpeg";
      const audioUrl = `data:${mime};base64,${base64}`;

      return NextResponse.json({
        audio_url: audioUrl,
        character_count: input.length,
        created: Math.floor(Date.now() / 1000),
        id: `audio_${Date.now()}`,
        model,
        success: true,
        text: input.trim(),
        tokens_used: Math.ceil(input.length / 3.5),
        voice,
      });
    }

    const errText = await maiRes.text().catch(() => "");
    const payload = normalizeUpstreamError(
      errText ? { error: errText } : null,
      maiRes.status,
      { message: "Erreur lors de la synthèse vocale." }
    );
    return NextResponse.json(payload, { status: payload.status });
  } catch (error: unknown) {
    logError("Erreur API audio/generations", error);
    return errorResponse("internal_error", {
      message: "Erreur interne du serveur lors de la synthèse vocale.",
    });
  }
}
