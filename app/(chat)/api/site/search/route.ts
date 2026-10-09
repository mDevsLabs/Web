import { type NextRequest, NextResponse } from "next/server";
import {
  SEARCH_TYPE_ORDER,
  type SearchType,
  searchSite,
} from "@/lib/site/search-index";

const MAX_LIMIT = 30;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const query = params.get("q") || "";
  const typeParam = params.get("type") || "all";
  const limitParam = Number(params.get("limit"));

  const type: SearchType | "all" = (SEARCH_TYPE_ORDER as string[]).includes(
    typeParam
  )
    ? (typeParam as SearchType)
    : "all";

  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(MAX_LIMIT, limitParam)
      : 12;

  try {
    const results = searchSite(query, { limit, type });
    return NextResponse.json({
      count: results.length,
      query,
      results,
      type,
    });
  } catch (err: any) {
    console.error("Erreur /api/search:", err);
    return NextResponse.json(
      {
        count: 0,
        error: "Erreur lors de la recherche.",
        query,
        results: [],
        type,
      },
      { status: 500 }
    );
  }
}
