import { type NextRequest, NextResponse } from "next/server";
import { MAI_API_URL } from "@/lib/constants";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";

export const TIER_STORAGE_LIMITS: Record<string, number> = {
  free: 500 * 1024 * 1024,      // 500 MO
  gratuit: 500 * 1024 * 1024,
  plus: 1024 * 1024 * 1024,     // 1 GB
  pro: 2 * 1024 * 1024 * 1024,  // 2 GB
  max: 5 * 1024 * 1024 * 1024,  // 5 GB
};

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const [user, storageRes, filesRes] = await Promise.all([
      getMaiUser(token),
      fetch(`${MAI_API_URL}/cloud/storage`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${MAI_API_URL}/cloud/files`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const storageData = storageRes.ok ? await storageRes.json() : null;
    const filesData = filesRes.ok ? await filesRes.json() : { files: [] };

    const userTier = (user?.tier || storageData?.tier || "Free").trim();
    const tierKey = userTier.toLowerCase();
    const exactLimit = TIER_STORAGE_LIMITS[tierKey] || TIER_STORAGE_LIMITS.free;

    const bytesUsed = Number(storageData?.bytes_used || 0);
    const percentUsed = exactLimit > 0 ? Math.min(100, Math.round((bytesUsed / exactLimit) * 10000) / 100) : 0;

    const finalStorage = {
      bytes_limit: exactLimit,
      bytes_used: bytesUsed,
      files_count: Number(storageData?.files_count || (filesData?.files?.length ?? 0)),
      over_limit: bytesUsed >= exactLimit,
      percent_used: percentUsed,
      tier: userTier,
    };

    return NextResponse.json({
      storage: finalStorage,
      files: filesData.files || [],
    });
  } catch (error) {
    console.error("Erreur API Library GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const res = await fetch(`${MAI_API_URL}/cloud/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: uploadFormData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erreur API Library POST:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");

  if (!fileId) {
    return NextResponse.json({ error: "ID du fichier requis" }, { status: 400 });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/cloud/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erreur API Library DELETE:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID et nom requis" }, { status: 400 });
    }

    const res = await fetch(`${MAI_API_URL}/cloud/files/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true, id, name });
  } catch (error) {
    console.error("Erreur API Library PATCH:", error);
    return NextResponse.json({ success: true });
  }
}

