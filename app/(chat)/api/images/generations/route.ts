import { type NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken } from "@/lib/auth/session";

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

  // Pré-contrôle de quota : purement informatif. Le backend applique de toute
  // façon la limite journalière, donc une panne de cette lecture ne doit pas
  // bloquer une génération légitime. Ce qui importerait, c'est l'inverse :
  // laisser croire à un contrôle qu'on n'a pas su faire. On journalise donc
  // explicitement que la décision appartient à l'amont.
  const usage = await upstreamJson<{
    dailyLimit?: number;
    remaining?: number;
    usedToday?: number;
  }>({ path: "/v1/images/usage", token });
  if (usage.ok) {
    const dailyLimit = Number(usage.data.dailyLimit ?? 0);
    const usedToday = Number(usage.data.usedToday ?? 0);
    const remaining = Number(usage.data.remaining ?? dailyLimit - usedToday);
    if (dailyLimit > 0 && (usedToday >= dailyLimit || remaining <= 0)) {
      return errorResponse("quota_exceeded", {
        details: { limit: dailyLimit, used: usedToday },
        message: `Votre quota journalier de génération d'images est épuisé (${usedToday}/${dailyLimit} images). Réinitialisation à minuit UTC.`,
      });
    }
  } else {
    console.warn(
      "Pré-contrôle de quota image indisponible, la décision revient à l'amont :",
      usage.payload.message
    );
  }

  const body = await req.json().catch(() => ({}));
  const result = await upstreamJson({
    // Une génération d'image peut être longue : le délai par défaut du client
    // amont est trop court et interromprait la requête en cours de route.
    body,
    method: "POST",
    path: "/v1/images/generations",
    timeoutMs: 60_000,
    token,
  });
  if (!result.ok) {
    return NextResponse.json(result.payload, { status: result.payload.status });
  }
  return NextResponse.json(result.data);
}
