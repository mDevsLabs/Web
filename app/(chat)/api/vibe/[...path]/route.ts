import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { decideVibeRelayPath } from "@/lib/vibe/server/relay-policy";

/**
 * Relais BFF de l'API Vibe (`/api/vibe/**`).
 *
 * POURQUOI CE RELAIS EXISTE
 *
 * Vibe appelait l'API mAI directement depuis le navigateur, en posant
 * `Authorization: Bearer <vibe_jwt_token>` — un jeton stocké dans
 * `localStorage`, posé par `VibeSessionBridge`, qui n'existe QUE sous `/vibe`
 * (`app/(chat)/vibe/layout.tsx`).
 *
 * Conséquence : l'onglet « Applications » des paramètres de l'hôte
 * (`/settings?tab=applications`, `components/settings/applications-tab.tsx`)
 * utilise le même client Vibe mais vit HORS de `/vibe`. Aucun jeton à
 * présenter, requête partie sans `Authorization`, et le backend répondait
 * « Service Unavailable. API Key missing. » (401, `api-middleware.ts:301`).
 * Le même défaut touchait toute écriture Vibe faite hors de `/vibe`.
 *
 * CE QUE LE RELAIS CHANGE
 *
 * Le client ne détient plus de secret : la route lit le cookie httpOnly
 * `mai_session_token` et pose `Authorization: Bearer <jeton>` vers l'amont.
 * Une seule identité pour toute l'application, et les écritures fonctionnent
 * partout — dans `/vibe` comme dans `/settings`.
 *
 * CE QUE LE RELAIS NE FAIT PAS
 *
 * Il n'ouvre aucune porte nouvelle : la liste blanche des chemins relays est
 * fermée (`lib/vibe/server/relay-policy.ts`), l'authentification Vibe en est
 * exclue, et la route reste sous la protection du cookie de session de
 * `proxy.ts` comme toute route `/api/**`.
 */

/** Méthodes relayées. Le reste est refusé en amont, jamais en aval. */
const ALLOWED_METHODS = new Set(["DELETE", "GET", "PATCH", "POST", "PUT"]);

/**
 * Plafond du corps relayé.
 *
 * Le backend plafonne déjà les téléversements (50 Mo en Free, 1 Go en
 * Plus/Pro/Max — `MEDIA_UPLOAD_LIMITS_BYTES` dans `config.ts`). Ce plafond
 * ici n'est pas une politique de forfait : c'est la borne de mémoire d'une
 * fonction serveurless, qui lit le corps en entier avant de le relayer. Elle
 * est au-dessus du plafond métier le plus élevé, donc elle ne change rien au
 * comportement attendu — elle empêche seulement qu'un corps énorme consomme
 * la mémoire de l'instance.
 */
const MAX_BODY_BYTES = 64 * 1024 * 1024;

/** Délai d'attente de l'amont, pour les requêtes ordinaires. */
const UPSTREAM_TIMEOUT_MS = 30_000;

/**
 * Les en-têtes relayés.
 *
 * `Accept` est transmis tel quel : le flux SSE demande
 * `text/event-stream`, et le relais doit le laisser passer pour que l'amont
 * réponde par un flux — un `Accept: application/json` forcerait une réponse
 * JSON, donc pas de temps réel.
 *
 * `Content-Type` n'est PAS transmis ici : il dépend du corps, et le cas
 * multipart doit être traité à part (le runtime recalcule la frontière).
 */
function relayHeaders(source: Headers): Headers {
  const headers = new Headers();
  const accept = source.get("accept");
  headers.set("Accept", accept ?? "application/json");
  return headers;
}

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  const method = request.method.toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    return errorResponse("invalid_request", {
      message: `Méthode non prise en charge : ${method}.`,
    });
  }

  const { path } = await context.params;
  // La décision se prend sur le chemin BRUT, pas sur `params.path` : Next
  // décode les segments avant de les livrer, donc `%2F` y serait déjà
  // redevenu `/` — la garde serait franchie avant d'être appliquée.
  // `params.path` n'est lu que pour le journal.
  const decision = decideVibeRelayPath(
    request.nextUrl.pathname,
    request.nextUrl.basePath
  );
  if (!decision.ok) {
    // Un chemin hors liste blanche est un `not_found`, pas un `invalid_request` :
    // la route n'existe pas, et le dire en 404 ne divulgue pas la liste.
    if (decision.reason === "unsafe_segment") {
      logError(
        "Relais Vibe — segment de chemin refusé",
        new Error(path?.join("/") ?? request.nextUrl.pathname)
      );
      return errorResponse("invalid_request", {
        message: "Chemin de requête invalide.",
      });
    }
    return errorResponse("not_found", {
      message: "Cette route Vibe n'est pas accessible.",
    });
  }

  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour utiliser Vibe.",
    });
  }

  const headers = relayHeaders(request.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const contentType = request.headers.get("content-type");
  const isMultipart = contentType?.includes("multipart/form-data") ?? false;

  let body: BodyInit | null = null;
  if (method !== "GET" && method !== "HEAD") {
    if (isMultipart) {
      // Le `Content-Length` annoncé est contrôlé AVANT la lecture : le
      // runtime de la requête ne borne pas le corps, et `formData()` lirait
      // un octet de trop si la déclaration mentait.
      const declared = Number(request.headers.get("content-length") ?? "0");
      if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
        return errorResponse("payload_too_large", {
          message: "Le contenu envoyé est trop volumineux.",
        });
      }
      const form = await request.formData();
      body = form;
      // `FormData` impose de NE PAS fixer `Content-Type` : le runtime ajoute
      // la frontière multipart avec ses propres paramètres.
      headers.delete("Content-Type");
    } else {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > MAX_BODY_BYTES) {
        return errorResponse("payload_too_large", {
          message: "Le contenu envoyé est trop volumineux.",
        });
      }
      if (buffer.byteLength > 0) {
        body = buffer;
        if (contentType) {
          headers.set("Content-Type", contentType);
        } else {
          headers.set("Content-Type", "application/json");
        }
      }
    }
  }

  const query = request.nextUrl.search;
  const target = `${MAI_API_URL}${decision.path}${query}`;

  // Le flux temps réel est long-lived : lui appliquer un délai d'attente le
  // tuerait au bout de 30 s, et la messagerie se figerait. On ne met donc pas
  // de signal d'annulation sur cette route — l'amont la ferme de lui-même
  // quand le client part, et le relais se termine avec la requête.
  const isStream = decision.path === "/v1/realtime/stream";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      body,
      cache: "no-store",
      headers,
      method,
      ...(isStream ? {} : { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
    });
  } catch (error) {
    logError(`Relais Vibe ${method} ${decision.path}`, error);
    return errorResponse("upstream_error", {
      message: "Le service Vibe est momentanément injoignable.",
    });
  }

  // Le SSE (`/v1/realtime/stream`) doit être relayé en flux continu : lire
  // tout le corps ici casserait la messagerie temps réel.
  if (upstream.body && isEventStream(upstream)) {
    return new Response(upstream.body, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type":
          upstream.headers.get("content-type") ?? "text/event-stream",
        "X-Accel-Buffering": "no",
      },
      status: upstream.status,
    });
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { message: text.slice(0, 500) };
    }
    const payload = normalizeUpstreamError(parsed, upstream.status);
    return NextResponse.json(payload, { status: payload.status });
  }

  return new Response(text, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type":
        upstream.headers.get("content-type") ??
        "application/json; charset=utf-8",
    },
    status: upstream.status,
  });
}

function isEventStream(response: Response): boolean {
  return (
    response.headers.get("content-type")?.includes("text/event-stream") ?? false
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return await handle(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return await handle(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return await handle(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return await handle(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return await handle(request, context);
}
