import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { getTierSpeechLimit, MAI_API_URL } from "@/lib/constants";

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

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Erreur API audio/usage:", error);
  }

  return NextResponse.json({
    plan: "Free",
    requestsCount: 0,
    resetAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    tokensUsed: 0,
    weeklyLimit: getTierSpeechLimit("Free"),
  });
}
