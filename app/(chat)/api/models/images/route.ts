import { NextResponse } from "next/server";
import { normalizeModelDisplayName } from "@/lib/ai/models";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/models/images`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      const payload = normalizeUpstreamError(errBody, res.status);
      return NextResponse.json(payload, { status: payload.status });
    }

    const data = await res.json();
    if (Array.isArray(data?.data)) {
      data.data = data.data.map((m: any) => ({
        ...m,
        name: normalizeModelDisplayName(m.id, m.name || m.id),
      }));
    }
    return NextResponse.json(data);
  } catch (error) {
    logError("Erreur API models/images", error);
    return errorResponse("internal_error", {
      message: "Erreur de connexion au serveur.",
    });
  }
}
