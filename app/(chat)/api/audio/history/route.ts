import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export async function GET(_req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/audio/history`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const items = data.data || data.history || data.audios || [];
      return NextResponse.json({
        audios: items,
        data: items,
        success: true,
        total: data.total || items.length,
      });
    }
  } catch (error) {
    console.error("Erreur API audio/history:", error);
  }

  return NextResponse.json({
    audios: [],
    data: [],
    success: true,
    total: 0,
  });
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
      message: "L'identifiant de l'audio est requis.",
    });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/audio/history/${id}`, {
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
    logError("Erreur suppression audio", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la suppression de l'audio.",
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
      message: "L'identifiant de l'audio est requis.",
    });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/audio/history/${targetId}`, {
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
    logError("Erreur mise à jour audio", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la mise à jour de l'audio.",
    });
  }
}
