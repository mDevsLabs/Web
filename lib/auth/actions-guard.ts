import "server-only";

import { checkBotId } from "botid/server";
import { headers } from "next/headers";

import type { ApiErrorCode } from "@/lib/api/error-codes";
import { getClientIp as resolveClientIp } from "@/lib/net/client-ip";
import { checkAuthRateLimit } from "@/lib/ratelimit";

export async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  return resolveClientIp(headerStore);
}

export type AuthGuardFailure = {
  code: ApiErrorCode;
  retryAfterSeconds?: number;
};

export async function guardAuthAction(params: {
  action:
    | "login"
    | "verify_login"
    | "register"
    | "verify_register"
    | "resend_code";
  identifier?: string;
}): Promise<AuthGuardFailure | null> {
  // 1. Vérification BotID — bloquant uniquement si le bot est détecté.
  // Une erreur d'infra (hors Vercel, dev local) laisse passer mais est loggée.
  try {
    const verification = await checkBotId();
    if (verification.isBot) {
      return { code: "bot_detected" };
    }
  } catch (error) {
    console.warn(
      "[auth-guard] Vérification BotID indisponible, requête autorisée:",
      error instanceof Error ? error.message : error
    );
  }

  // 2. Rate limiting uniforme (Redis, repli mémoire)
  const ip = await getClientIp();
  const rateLimit = await checkAuthRateLimit({
    action: params.action,
    identifier: params.identifier,
    ip,
  });
  if (!rateLimit.allowed) {
    return {
      code: "rate_limited",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  return null;
}
