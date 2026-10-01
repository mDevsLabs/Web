import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required");
  }

  const limited = await enforceApiRateLimit({
    action: "image_generation",
    request: req,
  });
  if (limited) {
    return limited;
  }

  try {
    // Pré-contrôle de quota : purement informatif. Le backend applique de toute
    // façon la limite journalière, donc une panne de cette lecture ne doit pas
    // bloquer une génération légitime. Ce qui importerait, c'est l'inverse :
    // laisser croire à un contrôle qu'on n'a pas su faire. On journalise donc
    // explicitement que la décision appartient à l'amont.
    try {
      const usageRes = await fetch(`${MAI_API_URL}/v1/images/usage`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        const dailyLimit = Number(usageData.dailyLimit ?? 0);
        const usedToday = Number(usageData.usedToday ?? 0);
        const remaining = Number(usageData.remaining ?? dailyLimit - usedToday);
        if (dailyLimit > 0 && (usedToday >= dailyLimit || remaining <= 0)) {
          return errorResponse("quota_exceeded", {
            details: { limit: dailyLimit, used: usedToday },
            message: `Votre quota journalier de génération d'images est épuisé (${usedToday}/${dailyLimit} images). Réinitialisation à minuit UTC.`,
          });
        }
      }
    } catch (quotaErr) {
      console.warn(
        "Pré-contrôle de quota image indisponible, la décision revient à l'amont :",
        quotaErr instanceof Error ? quotaErr.message : quotaErr
      );
    }

    const body = await req.json();

    const res = await fetch(`${MAI_API_URL}/v1/images/generations`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok) {
      const payload = normalizeUpstreamError(data, res.status);
      return NextResponse.json(payload, { status: payload.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    logError("Erreur API images/generations", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la génération de l'image.",
    });
  }
}
