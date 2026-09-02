import { NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { normalizeModelDisplayName } from "@/lib/ai/models";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/models/images`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Erreur API Images" }));
      return NextResponse.json(err, { status: res.status });
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
    console.error("Erreur API models/images:", error);
    return NextResponse.json(
      { error: "Erreur de connexion au serveur" },
      { status: 500 }
    );
  }
}
