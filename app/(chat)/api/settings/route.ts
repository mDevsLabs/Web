import { type NextRequest, NextResponse } from "next/server";
import { MAI_API_URL } from "@/lib/constants";
import { getMaiSessionToken } from "@/lib/auth/session";

// GET /api/settings : récupère le profil utilisateur, consommation IA et consommation API
export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const [usageRes, keysRes, imagesRes, cloudRes] = await Promise.all([
      fetch(`${MAI_API_URL}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${MAI_API_URL}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${MAI_API_URL}/v1/images/usage`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${MAI_API_URL}/cloud/storage`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const usageData = usageRes.ok ? await usageRes.json() : null;
    const keysData = keysRes.ok ? await keysRes.json() : { keys: [] };
    const imagesData = imagesRes.ok ? await imagesRes.json() : null;
    const cloudData = cloudRes.ok ? await cloudRes.json() : null;

    // Calculer le total des requêtes API consommées ce mois-ci
    const keys = keysData.keys || [];
    const totalApiRequests = keys.reduce(
      (sum: number, k: any) => sum + (Number(k.request_count) || 0),
      0
    );

    const tierLimitsApi: Record<string, number> = {
      Free: 500,
      Plus: 1000,
      Pro: 2000,
      Max: 5000,
    };

    const userTier = usageData?.tier || "Free";
    const apiLimit = tierLimitsApi[userTier] || 500;

    return NextResponse.json({
      user: usageData,
      aiUsage: {
        tokensUsed: Number(usageData?.tokensUsed || 0),
        limit: Number(usageData?.limit || 500000),
        resetAt: usageData?.resetAt,
        tier: userTier,
      },
      imagesUsage: imagesData
        ? {
            dailyLimit: Number(imagesData.dailyLimit || 3),
            plan: imagesData.plan || userTier,
            resetAt: imagesData.resetAt,
            usedToday: Number(imagesData.usedToday || 0),
          }
        : null,
      cloudUsage: cloudData
        ? {
            bytesLimit: Number(cloudData.bytes_limit || 524288000),
            bytesUsed: Number(cloudData.bytes_used || 0),
            filesCount: Number(cloudData.files_count || 0),
            overLimit: Boolean(cloudData.over_limit),
            percentUsed: Number(cloudData.percent_used || 0),
            tier: cloudData.tier || userTier,
          }
        : null,
      apiUsage: {
        keysCount: keys.length,
        limit: apiLimit,
        requestCount: totalApiRequests,
      },
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
        return NextResponse.json({ error: "Fichier d'avatar manquant" }, { status: 400 });
      }

      const uploadFormData = new FormData();
      uploadFormData.append("avatar", avatarFile);

      const res = await fetch(`${MAI_API_URL}/upload-avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      console.error("Erreur upload avatar:", err);
      return NextResponse.json({ error: "Erreur lors de l'upload de l'avatar" }, { status: 500 });
    }
  }

  // Cas 2 : Modification des informations du profil (JSON)
  try {
    const body = await req.json();

    // Vérification du code OTP de changement d'e-mail
    if (body.action === "verify_new_email") {
      const res = await fetch(`${MAI_API_URL}/verify-new-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: body.email, code: body.code }),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Mise à jour classique du profil
    const res = await fetch(`${MAI_API_URL}/update-profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Erreur update profil:", err);
    return NextResponse.json({ error: "Erreur serveur lors de la mise à jour" }, { status: 500 });
  }
}
