import { type NextRequest, NextResponse } from "next/server";
import { MAI_API_URL } from "@/lib/constants";
import { getMaiSessionToken } from "@/lib/auth/session";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const [storageRes, filesRes] = await Promise.all([
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

    return NextResponse.json({
      storage: storageData,
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
