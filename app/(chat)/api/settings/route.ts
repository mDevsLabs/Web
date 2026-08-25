import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

// GET /api/settings : récupère le profil utilisateur et la consommation IA/images/cloud
export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const [usageRes, imagesRes, cloudRes, speechRes] = await Promise.all([
      fetch(`${MAI_API_URL}/usage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${MAI_API_URL}/v1/images/usage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${MAI_API_URL}/cloud/storage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${MAI_API_URL}/v1/speech/usage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const usageData = usageRes.ok ? await usageRes.json() : null;
    const imagesData = imagesRes.ok ? await imagesRes.json() : null;
    const cloudData = cloudRes.ok ? await cloudRes.json() : null;
    const speechData = speechRes.ok ? await speechRes.json() : null;

    const userTier = usageData?.tier || "Free";

    return NextResponse.json({
      aiUsage: {
        limit: Number(usageData?.limit || 2_000_000),
        resetAt: usageData?.resetAt,
        tier: userTier,
        tokensUsed: Number(usageData?.tokensUsed || 0),
      },
      cloudUsage: cloudData
        ? {
            bytesLimit: Number(cloudData.bytes_limit || 524_288_000),
            bytesUsed: Number(cloudData.bytes_used || 0),
            filesCount: Number(cloudData.files_count || 0),
            overLimit: Boolean(cloudData.over_limit),
            percentUsed: Number(cloudData.percent_used || 0),
            tier: cloudData.tier || userTier,
          }
        : null,
      // Passer les valeurs brutes : la normalisation/fallback par tier est
      // appliquée côté client (resolveImagesUsage), de manière identique sur
      // toutes les vues
      imagesUsage: imagesData
        ? {
            dailyLimit: imagesData.dailyLimit ?? null,
            plan: imagesData.plan || userTier,
            resetAt: imagesData.resetAt,
            usedToday: imagesData.usedToday ?? null,
          }
        : null,
      speechUsage: speechData
        ? {
            limit: Number(speechData.limit || speechData.weeklyLimit || 20_000_000),
            requestsCount: Number(speechData.requestsCount || 0),
            resetAt: speechData.resetAt,
            tier: speechData.plan || userTier,
            tokensUsed: Number(speechData.tokensUsed || 0),
          }
        : null,
      user: usageData,
    });
  } catch (error) {
    console.error("Erreur Settings GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/settings : mise à jour du profil ou upload d'avatar
export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // Cas 1 : Téléversement d'avatar (Multipart)
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const avatarFile = formData.get("avatar");
      if (!avatarFile || !(avatarFile instanceof File)) {
        return NextResponse.json(
          { error: "Fichier d'avatar manquant" },
          { status: 400 }
        );
      }

      const uploadFormData = new FormData();
      uploadFormData.append("avatar", avatarFile);

      const res = await fetch(`${MAI_API_URL}/upload-avatar`, {
        body: uploadFormData,
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      console.error("Erreur upload avatar:", err);
      return NextResponse.json(
        { error: "Erreur lors de l'upload de l'avatar" },
        { status: 500 }
      );
    }
  }

  // Cas 2 : Modification des informations du profil (JSON)
  try {
    const body = await req.json();

    // Vérification du code OTP de changement d'e-mail
    if (body.action === "verify_new_email") {
      const res = await fetch(`${MAI_API_URL}/verify-new-email`, {
        body: JSON.stringify({ code: body.code, email: body.email }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Mise à jour classique du profil
    const res = await fetch(`${MAI_API_URL}/update-profile`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Erreur update profil:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
