import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { formatImageSrc } from "@/lib/utils";

// `page` et `limit` partaient tels quels dans la requête amont, sans être
// contraints à l'entier : une valeur non numérique était transmise telle quelle.
function readPositiveInt(
  raw: string | null,
  fallback: number,
  max: number
): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const { searchParams } = req.nextUrl;
  const page = readPositiveInt(searchParams.get("page"), 1, 10_000);
  const limit = readPositiveInt(searchParams.get("limit"), 20, 100);

  try {
    const res = await fetch(
      `${MAI_API_URL}/v1/images/history?page=${page}&limit=${limit}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const payload = normalizeUpstreamError(data, res.status);
      return NextResponse.json(payload, { status: payload.status });
    }

    const rawItems = data.data || data.images || [];
    const items = rawItems.map((item: any) => ({
      ...item,
      image_url: formatImageSrc(item.image_url),
    }));

    return NextResponse.json({
      data: items,
      images: items,
      success: true,
      total: data.total || items.length,
    });
  } catch (error) {
    logError("Erreur API images/history", error);
    return errorResponse("internal_error", {
      message: "Erreur lors du chargement de l'historique.",
    });
  }
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
      message: "L'identifiant de l'image est requis.",
    });
  }

  // Même raison que sur PATCH : `id` entre dans un chemin de requête amont.
  if (id && !UUID_PATTERN.test(id)) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est invalide.",
    });
  }

  try {
    const res = await fetch(
      `${MAI_API_URL}/v1/images/history${purgeAll ? "?all=1" : `/${id}`}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const payload = normalizeUpstreamError(data, res.status);
      return NextResponse.json(payload, { status: payload.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    logError("Erreur suppression image", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la suppression de l'image.",
    });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const targetId = id || body.id;

  if (!targetId) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est requis.",
    });
  }

  // `targetId` était interpolé dans le chemin de la requête amont sans être
  // validé : un `../` ou un `?` suffisait à changer la requête émise. On n'en
  // garde que la forme que le backend sait traiter — un uuid.
  if (typeof targetId !== "string" || !UUID_PATTERN.test(targetId)) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est invalide.",
    });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/images/history/${targetId}`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    const data = await res.json();
    if (!res.ok) {
      const payload = normalizeUpstreamError(data, res.status);
      return NextResponse.json(payload, { status: payload.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    logError("Erreur mise à jour image", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la mise à jour de l'image.",
    });
  }
}
