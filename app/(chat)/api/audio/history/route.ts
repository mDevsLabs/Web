import { type NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken } from "@/lib/auth/session";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const result = await upstreamJson<Record<string, any>>({
    path: "/v1/audio/history",
    token,
  });
  // Un historique illisible ne doit pas faire planter l'onglet : on renvoie une
  // liste vide et `success: true`, l'interface affiche « aucun élément »,
  // ce qui est meilleur qu'une erreur non actionable. La version images de cette
  // route renvoyait `internal_error` sur le même échec — comportement divergent
  // entre deux pages jumelles, sans raison.
  if (!result.ok) {
    return NextResponse.json({
      audios: [],
      data: [],
      success: true,
      total: 0,
    });
  }

  const data = result.data ?? {};
  const items = data.data || data.history || data.audios || [];
  return NextResponse.json({
    audios: items,
    data: items,
    success: true,
    total: data.total || items.length,
  });
}

export async function DELETE(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  // `?all=1` : purge de tout l'historique (onglet Données). Le drapeau est
  // explicite — un appel sans `id` ne doit jamais se transformer en purge.
  const purgeAll = searchParams.get("all") === "1";

  if (!id && !purgeAll) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'audio est requis.",
    });
  }

  // `id` entre dans un chemin de requête amont : on n'en garde que la forme que
  // le backend sait traiter.
  if (id && !UUID_PATTERN.test(id)) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'audio est invalide.",
    });
  }

  const result = await upstreamJson({
    method: "DELETE",
    path: purgeAll ? "/v1/audio/history" : `/v1/audio/history/${id}`,
    query: purgeAll ? { all: "1" } : undefined,
    token,
  });
  if (!result.ok) {
    return NextResponse.json(result.payload, { status: result.payload.status });
  }

  return NextResponse.json(result.data);
}
