import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export async function GET(_req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/audio/history`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const items = data.data || data.history || [];
    return NextResponse.json({
      audios: items,
      data: items,
      success: true,
      total: items.length,
    });
  } catch (error) {
    console.error("Erreur API audio/history:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'historique audio" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
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
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur suppression audio:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'audio" },
      { status: 500 }
    );
  }
}
