import { type NextRequest, NextResponse } from "next/server";
import { executeWebSearch } from "@/lib/site/web-search";

/**
 * Cette route est volontairement publique (`requiresAuth: false` dans le catalogue
 * des routes), mais elle était le seul point `/v1/*` dépourvu de toute limitation :
 * chaque appel déclenche jusqu'à quatre requêtes sortantes (Google News RSS, Bing
 * RSS, Wikipédia, DuckDuckGo). Elle est donc bridée à 30 requêtes par minute et par
 * IP, et le nombre de résultats demandé est borné.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const DEFAULT_RESULT_COUNT = 5;
const MAX_RESULT_COUNT = 10;

const clientHits: Map<string, { count: number; resetAt: number }> = new Map();

function checkRateLimit(
  identifier: string
): { allowed: true } | { allowed: false; resetInSec: number } {
  const now = Date.now();
  const hit = clientHits.get(identifier);

  if (!hit || now > hit.resetAt) {
    if (clientHits.size > 10_000) {
      for (const [key, value] of clientHits) {
        if (now > value.resetAt) clientHits.delete(key);
      }
    }
    clientHits.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (hit.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      resetInSec: Math.ceil((hit.resetAt - now) / 1000),
    };
  }

  hit.count += 1;
  return { allowed: true };
}

function clampCount(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_RESULT_COUNT;
  return Math.min(MAX_RESULT_COUNT, Math.max(1, Math.floor(parsed)));
}

function getClientIdentifier(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

function rateLimitResponse(resetInSec: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "rate_limit_exceeded",
        message: `Limite de ${MAX_REQUESTS_PER_WINDOW} recherches par minute atteinte. Réessayez dans ${resetInSec} secondes.`,
      },
    },
    { headers: { "Retry-After": String(resetInSec) }, status: 429 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const limit = checkRateLimit(getClientIdentifier(req));
    if (!limit.allowed) return rateLimitResponse(limit.resetInSec);

    const body = await req.json().catch(() => ({}));
    const query = body.query || body.q;
    const count = clampCount(body.count);

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Le paramètre 'query' est obligatoire." },
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
    const limit = checkRateLimit(getClientIdentifier(req));
    if (!limit.allowed) return rateLimitResponse(limit.resetInSec);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query");
    const count = clampCount(searchParams.get("count"));

    if (!query) {
      return NextResponse.json(
        { error: "Paramètre 'q' ou 'query' manquant." },
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
