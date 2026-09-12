import { type NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import {
  getTierChatWeeklyLimit,
  getTierSpeechWeeklyLimit,
  getTierStorageBytes,
} from "@/lib/plans/tier-limits";

const settingsCache = new Map<string, { data: any; expiresAt: number }>();
const SETTINGS_CACHE_TTL_MS = 180_000; // 3 minutes de cache

// GET /api/settings : récupère le profil utilisateur et la consommation IA/images/cloud
export async function GET(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  const cached = settingsCache.get(token);
  if (cached && Date.now() < cached.expiresAt && !force) {
    return NextResponse.json(cached.data);
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
    const result = {
      aiUsage: {
        limit: Number(usageData?.limit || getTierChatWeeklyLimit(userTier)),
        resetAt: usageData?.resetAt,
        tier: userTier,
        tokensUsed: Number(usageData?.tokensUsed || 0),
      },
      cloudUsage: cloudData
        ? {
            bytesLimit: Number(
              cloudData.bytes_limit || getTierStorageBytes(userTier)
            ),
            bytesUsed: Number(cloudData.bytes_used || 0),
            filesCount: Number(cloudData.files_count || 0),
            overLimit: Boolean(cloudData.over_limit),
            percentUsed: Number(cloudData.percent_used || 0),
            tier: cloudData.tier || userTier,
          }
        : null,
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
            limit: Number(
              speechData.limit ||
                speechData.weeklyLimit ||
                usageData?.speechLimit ||
                getTierSpeechWeeklyLimit(speechData.plan || userTier)
            ),
            requestsCount: Number(speechData.requestsCount || 0),
            resetAt: speechData.resetAt || usageData?.resetAt,
            tier: speechData.plan || userTier,
            tokensUsed: Number(
              speechData.tokensUsed ?? usageData?.speechTokensUsed ?? 0
            ),
          }
        : usageData?.speechTokensUsed === undefined
          ? null
          : {
              limit: Number(
                usageData?.speechLimit || getTierSpeechWeeklyLimit(userTier)
              ),
              requestsCount: 0,
              resetAt: usageData?.resetAt,
              tier: userTier,
              tokensUsed: Number(usageData?.speechTokensUsed || 0),
            },
      user: usageData,
    };

    settingsCache.set(token, {
      data: result,
      expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
    });

    return NextResponse.json(result);
  } catch (error) {
    logError("Erreur Settings GET", error);
    return errorResponse("internal_error", { message: "Erreur serveur." });
  }
}

// POST /api/settings : mise à jour du profil ou upload d'avatar
export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  // Invalider le cache lors d'une mutation
  settingsCache.delete(token);

  const contentType = req.headers.get("content-type") || "";

  // Cas 1 : Téléversement d'avatar (Multipart)
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const avatarFile = formData.get("avatar");
      if (!avatarFile || !(avatarFile instanceof File)) {
        return errorResponse("invalid_request", {
          message: "Fichier d'avatar manquant.",
        });
      }

      const uploadFormData = new FormData();
      uploadFormData.append("avatar", avatarFile);

      const res = await fetch(`${MAI_API_URL}/upload-avatar`, {
        body: uploadFormData,
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        const payload = normalizeUpstreamError(data, res.status);
        return NextResponse.json(payload, { status: payload.status });
      }
      return NextResponse.json(data);
    } catch (err) {
      logError("Erreur upload avatar", err);
      return errorResponse("internal_error", {
        message: "Erreur lors de l'upload de l'avatar.",
      });
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
      if (!res.ok) {
        const payload = normalizeUpstreamError(data, res.status);
        return NextResponse.json(payload, { status: payload.status });
      }
      return NextResponse.json(data);
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
    if (!res.ok) {
      const payload = normalizeUpstreamError(data, res.status);
      return NextResponse.json(payload, { status: payload.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    logError("Erreur update profil", err);
    return errorResponse("internal_error", {
      message: "Erreur serveur lors de la mise à jour du profil.",
    });
  }
}
