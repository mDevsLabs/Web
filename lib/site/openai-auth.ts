import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "./api-key-manager";
import { checkRateLimit } from "./bearer-auth";
import type { OpenAIErrorResponse } from "./openai-types";

export interface AuthenticatedOpenAIContext {
  apiKeyId: string;
  apiKeyToken: string;
  keyRef: string;
  ownerId?: string;
  plan: string;
  valid: true;
}

export interface InvalidOpenAIContext {
  response: NextResponse<OpenAIErrorResponse>;
  valid: false;
}

export async function authenticateOpenAIRequest(
  req: NextRequest
): Promise<AuthenticatedOpenAIContext | InvalidOpenAIContext> {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      response: NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: "invalid_api_key",
            message:
              "You must provide a Bearer API key in the Authorization header.",
            param: null,
            type: "invalid_request_error",
          },
        },
        { status: 401 }
      ),
      valid: false,
    };
  }

  const token = authHeader.substring(7).trim();

  // Valider la clé via la couche de gestion de clés API
  const validation = await validateApiKey(token);

  if (!validation.valid || !validation.keyInfo) {
    const errorMsg =
      validation.error ||
      "Incorrect API key provided. You can find or create your API key at /account/keys.";
    const isQuotaError =
      errorMsg.toLowerCase().includes("limit") ||
      errorMsg.toLowerCase().includes("quota");
    const isDeactivated = errorMsg.toLowerCase().includes("désactiv");
    const statusCode = isQuotaError ? 429 : isDeactivated ? 403 : 401;
    const errorCode = isQuotaError
      ? "quota_exceeded"
      : isDeactivated
        ? "account_deactivated"
        : "invalid_api_key";

    return {
      response: NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: errorCode,
            message: errorMsg,
            param: null,
            type: isQuotaError ? "requests" : "invalid_request_error",
          },
        },
        { status: statusCode }
      ),
      valid: false,
    };
  }

  // Rate Limiting (60 requêtes/min par IP/clé)
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const rateLimitKey = `openai_${validation.keyInfo.id}_${clientIp}`;
  const rateCheck = checkRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    return {
      response: NextResponse.json<OpenAIErrorResponse>(
        {
          error: {
            code: "rate_limit_exceeded",
            message:
              "Rate limit reached for requests. Please slow down your requests.",
            param: null,
            type: "requests",
          },
        },
        {
          headers: {
            "Retry-After": rateCheck.resetInSec.toString(),
          },
          status: 429,
        }
      ),
      valid: false,
    };
  }

  return {
    apiKeyId: validation.keyInfo.id,
    apiKeyToken: token,
    keyRef: validation.keyInfo.keyRef,
    ownerId: validation.keyInfo.ownerId,
    plan: validation.keyInfo.plan || "Free",
    valid: true,
  };
}
