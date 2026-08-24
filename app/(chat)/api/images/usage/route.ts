import { NextResponse } from "next/server";
import { MAI_API_URL } from "@/lib/constants";
import { getMaiSessionToken } from "@/lib/auth/session";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const res = await fetch(`${MAI_API_URL}/v1/images/usage`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API images/usage:", error);
    return NextResponse.json({ error: "Erreur de récupération de l'usage" }, { status: 500 });
  }
}
