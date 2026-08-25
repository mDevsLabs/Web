import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export async function GET(_req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/audio/usage`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API audio/usage:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'usage audio" },
      { status: 500 }
    );
  }
}
