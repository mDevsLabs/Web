import { ipAddress } from "@vercel/functions";
import { checkBotId } from "botid/server";
import { isPaidTier } from "@/lib/auth/plan";
import type { MaiUser } from "@/lib/auth/session";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getPersistedTier } from "@/lib/db/users";
import { checkIpRateLimit } from "@/lib/ratelimit";

export type ChatAuth = {
  sessionToken: string;
  maiUser: MaiUser;
  userId: string;
  isFreeUser: boolean;
};

// Résolution du tier : la valeur persistée dans users.tier (ligne dont
// users.id correspond à l'identifiant canonique de l'utilisateur authentifié)
// fait autorité et écrase tout tier obsolète porté par le JWT ou un cache.
// En cas d'échec de lecture (base indisponible), l'échec est ferme : le tier
// du jeton n'est PAS utilisé à la place (il pourrait être périmé).
export async function resolveAuthoritativeTier(params: {
  userId: string | null | undefined;
}): Promise<
  | { ok: true; tier: string }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" }
> {
  const result = await getPersistedTier({ userId: params.userId });
  if (result.ok) {
    return result;
  }
  return result;
}

export async function authenticateChatRequest(): Promise<{
  auth?: ChatAuth;
  error?: "forbidden" | "unauthorized";
  tierFailure?: "missing" | "invalid" | "unavailable";
}> {
  const [botIdResult, sessionToken, maiUser] = await Promise.all([
    // Diagnostic : une panne du module botid (réseau, runtime) ne doit plus se
    // confondre avec un vrai refus bot — l'échec est tracé, puis traité comme
    // « non classé » pour ne pas fabriquer un access_denied fantôme. Un vrai
    // bot reste bloqué par isBot.
    checkBotId().catch((botIdError: unknown) => {
      console.warn(
        "[chat-auth] botid_check_failed code=unavailable",
        botIdError instanceof Error ? botIdError.message : ""
      );
      return null;
    }),
    getMaiSessionToken(),
    getMaiUser(),
  ]);

  if (botIdResult?.isBot) {
    console.warn("[chat-auth] rejected guard=botid code=access_denied");
    return { error: "forbidden" };
  }

  if (!sessionToken || !maiUser) {
    return { error: "unauthorized" };
  }

  const userId = maiUser.id || maiUser.email;
  const tierResult = await resolveAuthoritativeTier({ userId });
  if (!tierResult.ok) {
    // Utilisateur introuvable dans users ou tier inconnu/invalide/base
    // injoignable : refus ferme remonté à l'appelant (plan_required explicite,
    // jamais de privilèges implicites).
    return { error: "unauthorized", tierFailure: tierResult.reason };
  }

  const maiUserWithAuthoritativeTier: MaiUser = {
    ...maiUser,
    tier: tierResult.tier,
  };

  return {
    auth: {
      isFreeUser: !isPaidTier(tierResult.tier),
      maiUser: maiUserWithAuthoritativeTier,
      sessionToken,
      userId,
    },
  };
}

export function weeklyQuotaExceeded(maiUser: MaiUser): boolean {
  return maiUser.tokensUsed >= maiUser.limit;
}

export async function enforceChatRateLimit(
  request: Request,
  userId: string
): Promise<void> {
  await checkIpRateLimit(ipAddress(request), userId);
}
