import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { getUserApiKey } from "@/lib/db/api-keys";

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

    const body = await req.json().catch(() => ({}));
    const input = body.input || body.prompt || body.text || "";

    if (!input || typeof input !== "string" || !input.trim()) {
      return errorResponse("invalid_request", {
        message: "Le texte à synthétiser est obligatoire.",
      });
    }

    const model = body.model || "deepgram/flux-tts:free";
    const voice = body.voice || "flux-alexis-en";
    const speed = body.speed === undefined ? 1.0 : Number(body.speed);
    const response_format = body.response_format || "mp3";

    // Vérification préalable du quota Speech avant d'envoyer la requête
    try {
      const usageRes = await fetch(`${MAI_API_URL}/v1/audio/usage`, {
        cache: "no-store",
        headers: {
          Authorization: authHeader,
        },
      });
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        const weeklyLimit = Number(usageData.weeklyLimit ?? 0);
        const tokensUsed = Number(usageData.tokensUsed ?? 0);
        const estimatedTokens = Math.max(
          1,
          Math.ceil(input.trim().length / 3.5)
        );
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
      }
    } catch (quotaErr) {
      console.warn("Avertissement vérification quota audio:", quotaErr);
    }

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
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    // Si le serveur a renvoyé du JSON
    const contentType = maiRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await maiRes.json();
      if (!maiRes.ok) {
        const payload = normalizeUpstreamError(json, maiRes.status);
        return NextResponse.json(payload, { status: payload.status });
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
