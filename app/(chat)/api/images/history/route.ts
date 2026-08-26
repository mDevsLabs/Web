import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { formatImageSrc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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
      return NextResponse.json(data, { status: res.status });
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
    console.error("Erreur API images/history:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'historique" },
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
    const res = await fetch(`${MAI_API_URL}/v1/images/history/${id}`, {
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
    console.error("Erreur suppression image:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'image" },
      { status: 500 }
    );
  }
}
