import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import { resolveUserApiKeyByRef } from "./api-key-manager";
import { authenticateOpenAIRequest } from "./openai-auth";
import { authenticateSession } from "./session-auth";

export const API_KEY_REF_HEADER = "x-mai-key-ref";

export type CatalogRequestAuth =
  | { mode: "public" }
  | {
      mode: "bearer";
      token: string;
      keyRef: string;
      plan: string;
      ownerId?: string;
    }
  | {
      mode: "session";
      secretKey: string;
      keyRef: string;
      plan: string;
      ownerId: string;
    };

export type CatalogAuthResult =
  | { ok: true; auth: CatalogRequestAuth }
  | { ok: false; response: NextResponse };

function invalidKeyRefResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "invalid_key_ref",
        message:
          "La référence de clé est invalide ou n’appartient pas à votre compte.",
        type: "permission_error",
      },
    },
    { headers: { "Cache-Control": "no-store" }, status: 403 }
  );
}

/**
 * Authentifie un catalogue pour deux modes compatibles :
 * - Bearer externe : la clé est validée par la couche OpenAI habituelle ;
 * - session web : cookie/JWT de session + en-tête non secret `x-mai-key-ref`.
 *
 * Une session ne devient jamais une autorité à partir de `x-user-id`. La
 * référence est résolue par une requête vérifiée sur le propriétaire et
 * l'activité de la clé ; le secret reste dans le processus serveur.
 */
export async function authenticateCatalogRequest(
  req: NextRequest
): Promise<CatalogAuthResult> {
  const keyRef = req.headers.get(API_KEY_REF_HEADER)?.trim() || "";
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";

  if (keyRef) {
    const session = await authenticateSession(req);
    if (!session.ok) return { ok: false, response: session.response };

    const resolved = await resolveUserApiKeyByRef(
      session.identity.userId,
      keyRef
    );
    if (!resolved) return { ok: false, response: invalidKeyRefResponse() };

    return {
      auth: {
        keyRef: resolved.metadata.keyRef,
        mode: "session",
        ownerId: session.identity.userId,
        plan: resolved.plan,
        secretKey: resolved.secretKey,
      },
      ok: true,
    };
  }

  if (/^Bearer\s+/i.test(authorization)) {
    const bearer = await authenticateOpenAIRequest(req);
    if (!bearer.valid) return { ok: false, response: bearer.response };

    return {
      auth: {
        keyRef: bearer.keyRef,
        mode: "bearer",
        ownerId: bearer.ownerId,
        plan: bearer.plan,
        token: bearer.apiKeyToken,
      },
      ok: true,
    };
  }

  return { auth: { mode: "public" }, ok: true };
}
