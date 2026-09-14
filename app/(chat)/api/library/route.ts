import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { getTierStorageBytes } from "@/lib/plans/tier-limits";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const [user, storageRes, filesRes] = await Promise.all([
      getMaiUser(token),
      fetch(`${MAI_API_URL}/cloud/storage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${MAI_API_URL}/cloud/files`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const storageData = storageRes.ok ? await storageRes.json() : null;
    const filesData = filesRes.ok ? await filesRes.json() : { files: [] };

    const userTier = (user?.tier || storageData?.tier || "Free").trim();
    const exactLimit = Number(
      storageData?.bytes_limit || getTierStorageBytes(userTier)
    );

    const bytesUsed = Number(storageData?.bytes_used || 0);
    const percentUsed =
      exactLimit > 0
        ? Math.min(100, Math.round((bytesUsed / exactLimit) * 10_000) / 100)
        : 0;

    const finalStorage = {
      bytes_limit: exactLimit,
      bytes_used: bytesUsed,
      files_count: Number(
        storageData?.files_count || (filesData?.files?.length ?? 0)
      ),
      over_limit: bytesUsed >= exactLimit,
      percent_used: percentUsed,
      tier: userTier,
    };

    return NextResponse.json({
      files: filesData.files || [],
      storage: finalStorage,
    });
  } catch (error) {
    logError("Erreur API Library GET", error);
    return errorResponse("internal_error", { message: "Erreur serveur." });
  }
}

export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return errorResponse("invalid_request", {
        message: "Aucun fichier fourni.",
      });
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const res = await fetch(`${MAI_API_URL}/cloud/upload`, {
      body: uploadFormData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok) {
      const payload = normalizeUpstreamError(data, res.status);
      return NextResponse.json(payload, { status: payload.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    logError("Erreur API Library POST", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de l'upload.",
    });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");

  if (!fileId) {
    return errorResponse("invalid_request", {
      message: "L'identifiant du fichier est requis.",
    });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/cloud/files/${fileId}`, {
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
    logError("Erreur API Library DELETE", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la suppression.",
    });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return errorResponse("invalid_request", {
        message: "L'identifiant et le nom du fichier sont requis.",
      });
    }

    const res = await fetch(`${MAI_API_URL}/cloud/files/${id}`, {
      body: JSON.stringify({ name }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ id, name, success: true });
  } catch (error) {
    // Repli volontaire : le renommage est optimiste côté client, un échec de
    // synchronisation n'empêche pas l'opération locale.
    console.warn("Erreur API Library PATCH:", error);
    return NextResponse.json({ success: true });
  }
}
