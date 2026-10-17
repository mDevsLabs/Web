import { type NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getTierSpeechLimit } from "@/lib/constants";

// Un quota illisible ne doit pas laisser le champ vide : on retombe sur un relevé
// à zéro, étiqueté selon le forfait réellement connu de l'utilisateur. La
// valeur affichée est donc cohérente avec son forfait, jamais un `Free` codé en
// dur, qui ferait croire à un abaissement de forfait.
export async function GET(_req: NextRequest) {
  const [token, user] = await Promise.all([getMaiSessionToken(), getMaiUser()]);
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const tier = user?.tier ?? "Free";
  const result = await upstreamJson({ path: "/v1/audio/usage", token });
  if (result.ok) {
    return NextResponse.json(result.data);
  }

  return NextResponse.json({
    plan: tier,
    requestsCount: 0,
    resetAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    tokensUsed: 0,
    weeklyLimit: getTierSpeechLimit(tier),
  });
}
