import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { formatImageSrc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";

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
  if (!id) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est requis.",
    });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/images/history/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "DELETE",
    });

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
  const body = await req.json().catch(() => ({}));
  const targetId = id || body.id;

  if (!targetId) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est requis.",
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
