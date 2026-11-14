import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import {
  getMaiSessionToken,
  removeMaiSessionToken,
  setMaiSessionToken,
} from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import {
  resolveSiteBackendPath,
  stripSessionToken,
} from "@/lib/site/backend-relay";

/**
 * Relais BFF du backend mAI pour le Site (`/api/site/backend/**`).
 *
 * POURQUOI CE RELAIS EXISTE (issue #10)
 *
 * Le Site appelait le backend directement depuis le navigateur avec un JWT
 * copié dans `localStorage` et dans des cookies lisibles (`mai_token`,
 * `mai_user`) : la protection HttpOnly était perdue, et un script exécuté dans
 * l'origine pouvait lire et exfiltrer le jeton.
 *
 * CE QUE LE RELAIS CHANGE
 *
 * - le jeton de session reste dans le cookie httpOnly `mai_session_token` ;
 * - l'en-tête `Authorization` est fabriqué ici, jamais accepté du client ;
 * - les réponses d'authentification posent le cookie et ne renvoient jamais le
 *   jeton au renderer (`stripSessionToken`) ;
 * - la liste blanche des chemins est fermée (`lib/site/backend-relay.ts`).
 */

/** Délai d'attente de l'amont. */
const UPSTREAM_TIMEOUT_MS = 30_000;

/**
 * Plafond du corps relayé, borne de mémoire d'une fonction serveurless : les
 * téléversements massifs passent par les routes dédiées, pas par ce relais.
 */
const MAX_BODY_BYTES = 16 * 1024 * 1024;

/**
 * Contrôle d'origine pour les écritures : en complément du cookie
 * `SameSite=Lax`, une requête cross-site porte rarement `Origin` absent, et un
 * `Origin` étranger est refusé.
 */
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

async function relay(
  request: NextRequest,
  segments: readonly string[],
  method: "GET" | "POST"
): Promise<Response> {
  const decision = resolveSiteBackendPath(segments);
  if (!decision) {
    // Un chemin hors liste blanche est un `not_found` : la route n'existe pas,
    // et le dire en 404 ne divulgue pas la liste.
    return errorResponse("not_found", {
      message: "Cette route du Site n'est pas accessible.",
    });
  }

  if (method === "POST" && !isSameOrigin(request)) {
    return errorResponse("invalid_request", {
      message: "Origine de la requête refusée.",
    });
  }

  // Déconnexion : la session est le cookie httpOnly, il n'y a rien à relayer.
  if (decision.path === "/logout") {
    await removeMaiSessionToken();
    return NextResponse.json({ success: true });
  }

  const token = await getMaiSessionToken();
  if (decision.auth === "session" && !token) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour continuer.",
    });
  }

  const headers = new Headers({ Accept: "application/json" });
  if (decision.auth === "session" && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | null = null;
  if (method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const declared = Number(request.headers.get("content-length") ?? "0");
      if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
        return errorResponse("payload_too_large", {
          message: "Le contenu envoyé est trop volumineux.",
        });
      }
      // `FormData` impose de NE PAS fixer `Content-Type` : le runtime ajoute
      // la frontière multipart avec ses propres paramètres.
      body = await request.formData();
    } else {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > MAX_BODY_BYTES) {
        return errorResponse("payload_too_large", {
          message: "Le contenu envoyé est trop volumineux.",
        });
      }
      if (buffer.byteLength > 0) {
        body = buffer;
        headers.set("Content-Type", contentType || "application/json");
      }
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${MAI_API_URL}${decision.path}`, {
      body,
      cache: "no-store",
      headers,
      method,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    logError(`Relais Site ${method} ${decision.path}`, error);
    return errorResponse("upstream_error", {
      message: "Le service mAI est momentanément injoignable.",
    });
  }

  const text = await upstream.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (payload === null) {
    // Réponse non JSON : relayée telle quelle (aucun jeton ne s'y trouve).
    return new Response(text, {
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "text/plain; charset=utf-8",
      },
      status: upstream.status,
    });
  }

  // Une réponse d'authentification qui porte un jeton POSE le cookie httpOnly
  // côté serveur, et le jeton est retiré du corps avant de repartir.
  const rawToken = (payload as { token?: unknown }).token;
  if (typeof rawToken === "string" && rawToken.length > 0) {
    await setMaiSessionToken(rawToken);
  }

  return NextResponse.json(stripSessionToken(payload), {
    status: upstream.status,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  const { path } = await context.params;
  return relay(request, path ?? [], "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  const { path } = await context.params;
  return relay(request, path ?? [], "POST");
}
