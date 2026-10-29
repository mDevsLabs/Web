import { type NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/net/client-ip";
import { checkApiRateLimit } from "@/lib/ratelimit";
import { executeWebSearch } from "@/lib/site/web-search";
import {
  clampWebSearchCount,
  normalizeWebSearchQuery,
} from "@/web-search-limits";

/**
 * Cette route est volontairement publique (`requiresAuth: false` dans le
 * catalogue des routes), mais elle engage les clés You.com de la plateforme et
 * jusqu'à plusieurs requêtes sortantes de repli. Elle est donc bornée :
 *  • 120 recherches/heure par IP (compteur partagé Redis, repli mémoire) ;
 *  • 500 caractères de requête au plus ;
 *  • count ramené dans [1, 10] ;
 *  • corps de requête plafonné.
 * Le CORS n'est pas une protection : la décision est prise ici.
 */
const MAX_BODY_BYTES = 16_384;

function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "rate_limit_exceeded",
        message: `Limite de recherches atteinte. Réessayez dans ${retryAfterSec} secondes.`,
      },
    },
    { headers: { "Retry-After": String(retryAfterSec) }, status: 429 }
  );
}

async function enforceRateLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIp(req.headers);
  const result = await checkApiRateLimit({ action: "web_search", ip });
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds);
  }
  return null;
}

function bodyTooLarge(req: NextRequest): boolean {
  const length = Number(req.headers.get("content-length") || 0);
  return Number.isFinite(length) && length > MAX_BODY_BYTES;
}

export async function POST(req: NextRequest) {
  try {
    if (bodyTooLarge(req)) {
      return NextResponse.json(
        {
          error: {
            code: "payload_too_large",
            message: "Corps de requête trop volumineux.",
          },
        },
        { status: 413 }
      );
    }
    const limited = await enforceRateLimit(req);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const query = normalizeWebSearchQuery(body.query || body.q);
    const count = clampWebSearchCount(body.count);

    if (!query) {
      return NextResponse.json(
        {
          error:
            "Le paramètre 'query' est obligatoire et limité à 500 caractères.",
        },
        { status: 400 }
      );
    }

    const searchResult = await executeWebSearch(query, count);
    return NextResponse.json(searchResult, {
      status: searchResult.success ? 200 : 502,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur lors de la recherche Web." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req);
    if (limited) return limited;

    const { searchParams } = new URL(req.url);
    const query = normalizeWebSearchQuery(
      searchParams.get("q") || searchParams.get("query")
    );
    const count = clampWebSearchCount(searchParams.get("count"));

    if (!query) {
      return NextResponse.json(
        {
          error:
            "Paramètre 'q' ou 'query' manquant, ou supérieur à 500 caractères.",
        },
        { status: 400 }
      );
    }

    const searchResult = await executeWebSearch(query, count);
    return NextResponse.json(searchResult, {
      status: searchResult.success ? 200 : 502,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur lors de la recherche Web." },
      { status: 500 }
    );
  }
}
