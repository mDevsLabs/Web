import { ipAddress } from "@vercel/functions";
import { checkBotId } from "botid/server";
import { isPaidTier } from "@/lib/auth/plan";
import type { MaiUser } from "@/lib/auth/session";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { checkIpRateLimit } from "@/lib/ratelimit";

export type ChatAuth = {
  sessionToken: string;
  maiUser: MaiUser;
  userId: string;
  isFreeUser: boolean;
};

export async function authenticateChatRequest(): Promise<{
  auth?: ChatAuth;
  error?: "forbidden" | "unauthorized";
}> {
  const [botIdResult, sessionToken, maiUser] = await Promise.all([
    checkBotId().catch(() => null),
    getMaiSessionToken(),
    getMaiUser(),
  ]);

  if (botIdResult?.isBot) {
    return { error: "forbidden" };
  }

  if (!sessionToken || !maiUser) {
    return { error: "unauthorized" };
  }

  return {
    auth: {
      isFreeUser: !isPaidTier(maiUser.tier),
      maiUser,
      sessionToken,
      userId: maiUser.id || maiUser.email,
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
