import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // Vérification préalable du quota disponible avant de lancer la requête
    try {
      const usageRes = await fetch(`${MAI_API_URL}/v1/images/usage`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        const dailyLimit = Number(usageData.dailyLimit ?? 0);
        const usedToday = Number(usageData.usedToday ?? 0);
        const remaining = Number(usageData.remaining ?? dailyLimit - usedToday);
        if (dailyLimit > 0 && (usedToday >= dailyLimit || remaining <= 0)) {
          return NextResponse.json(
            {
              error: `Votre quota journalier de génération d'images est épuisé (${usedToday}/${dailyLimit} images). Réinitialisation à minuit UTC.`,
              limit: dailyLimit,
              over_limit: true,
              used: usedToday,
            },
            { status: 429 }
          );
        }
      }
    } catch (quotaErr) {
      console.warn("Avertissement vérification quota image:", quotaErr);
    }

    const body = await req.json();

    const res = await fetch(`${MAI_API_URL}/v1/images/generations`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API images/generations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'image" },
      { status: 500 }
    );
  }
}
