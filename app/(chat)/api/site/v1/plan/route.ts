import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { invalidateSettingsCache } from "@/lib/account/settings-cache";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import {
  downgradeUserToFree,
  redeemUpgradeCodeForUser,
} from "@/lib/auth/server-auth";
import {
  getMaiSessionToken,
  invalidateMaiUserCache,
  resolveMaiSession,
  setMaiSessionToken,
} from "@/lib/auth/session";
import { getClientIp } from "@/lib/net/client-ip";
import { checkApiRateLimit } from "@/lib/ratelimit";

const planActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("redeem_code"),
    code: z.string().trim().min(1, "Saisissez un code.").max(64),
  }),
  z.object({
    action: z.literal("downgrade_free"),
  }),
]);

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host") ?? "";
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * POST /api/site/v1/plan :
 * - `redeem_code` : active un code d'upgrade (Plus, Pro, Max) via Neon.
 * - `downgrade_free` : repasse le compte au forfait Free sans code après confirmation.
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return errorResponse("invalid_request", {
      message: "Origine de la requête refusée.",
    });
  }

  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour modifier votre forfait.",
    });
  }

  const session = await resolveMaiSession(token);
  if (session.status !== "ok") {
    return errorResponse("auth_required", {
      message:
        session.status === "refused"
          ? "Session invalide ou expirée. Reconnectez-vous."
          : "Impossible de vérifier votre session pour le moment.",
      status: session.status === "refused" ? 401 : 503,
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("invalid_request", {
      message: "Corps de requête JSON invalide.",
    });
  }

  const parsed = planActionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }

  const user = session.user;
  const userId = user.id || user.email;
  const previousTier = user.tier || "Free";
  const body = parsed.data;

  const rateLimit = await checkApiRateLimit({
    action:
      body.action === "downgrade_free" ? "plan_downgrade" : "plan_upgrade_code",
    ip: getClientIp(request.headers),
    userId,
  });
  if (!rateLimit.allowed) {
    return errorResponse("rate_limited", {
      message: "Trop de tentatives. Veuillez réessayer plus tard.",
    });
  }

  try {
    const result =
      body.action === "downgrade_free"
        ? await downgradeUserToFree({
            email: user.email,
            userId,
          })
        : await redeemUpgradeCodeForUser({
            code: body.code,
            email: user.email,
            sessionToken: token,
            userId,
          });

    if (!result.success) {
      const code =
        result.code === "service_unavailable"
          ? "service_unavailable"
          : "invalid_request";
      return errorResponse(code, {
        message: result.error || "Impossible de modifier votre forfait.",
      });
    }

    invalidateMaiUserCache(token);
    invalidateSettingsCache(token);
    if (result.token) {
      await setMaiSessionToken(result.token);
    }

    const nextTier = result.tier || "Free";
    return NextResponse.json({
      message:
        body.action === "downgrade_free"
          ? "Votre compte est revenu au forfait Free."
          : `Merci d'avoir souscrit au forfait ${nextTier} !`,
      previousTier,
      success: true,
      tier: nextTier,
    });
  } catch (error) {
    logError("POST /api/site/v1/plan", error);
    return errorResponse("internal_error", {
      message: "Erreur serveur lors du changement de forfait.",
    });
  }
}
