import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { fetchUsageBundle } from "@/lib/account/usage";
import {
  errorResponse,
  extractUpstreamMessage,
  logError,
  normalizeUpstreamError,
} from "@/lib/api/error-response";
import {
  getMaiSessionToken,
  getMaiUser,
  invalidateMaiUserCache,
} from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import {
  fetchRemoteImage,
  parseRemoteImageUrl,
  REMOTE_IMAGE_MAX_BYTES,
  sniffImageMime,
} from "@/lib/net/fetch-image";

const settingsCache = new Map<string, { data: any; expiresAt: number }>();
const SETTINGS_CACHE_TTL_MS = 180_000; // 3 minutes de cache

// Hachage canonique d'une source confirmée : la carte renvoie ce hachage, la
// route le recalcule — une confirmation ne vaut que pour CETTE image exacte.
function hashImageSource(rawUrl: string): string {
  let canonical = rawUrl.trim();
  try {
    canonical = new URL(rawUrl.trim()).toString();
  } catch {
    // La validation d'URL a déjà échoué avant le hachage dans ce cas.
  }
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

// Allow-list du stockage d'upload (Vercel Blob, namespaces /uploads/ — cf.
// app/(chat)/api/files/upload/route.ts) : une pièce jointe proposée par le
// modèle doit nécessairement provenir de ce pipeline déjà authentifié.
function isAttachmentUploadUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      !(
        host === "public.blob.vercel-storage.com" ||
        host.endsWith(".public.blob.vercel-storage.com")
      )
    ) {
      return false;
    }
    return parsed.pathname.startsWith("/uploads/");
  } catch {
    return false;
  }
}

async function readAttachmentImage(rawUrl: string): Promise<
  | { ok: true; bytes: Uint8Array; contentType: string }
  | {
      ok: false;
      status:
        | "invalid_request"
        | "unsupported_media_type"
        | "payload_too_large";
      message: string;
    }
> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      message: "URL de pièce jointe invalide.",
      ok: false,
      status: "invalid_request",
    };
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: { Accept: "image/jpeg,image/png,image/webp,image/gif" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        message: "La pièce jointe n'est plus accessible.",
        ok: false,
        status: "invalid_request",
      };
    }
    const declaredLength = Number(res.headers.get("content-length") || 0);
    if (declaredLength > REMOTE_IMAGE_MAX_BYTES) {
      return {
        message: "Image trop volumineuse (max 10 Mo).",
        ok: false,
        status: "payload_too_large",
      };
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > REMOTE_IMAGE_MAX_BYTES) {
      return {
        message: "Image trop volumineuse (max 10 Mo).",
        ok: false,
        status: "payload_too_large",
      };
    }
    // Arbitre : magic bytes réels (SVG et contenus actifs refusés ici aussi).
    const sniffed = sniffImageMime(bytes);
    if (!sniffed) {
      return {
        message:
          "Le fichier joint n'est pas une image autorisée (JPEG, PNG, WebP ou GIF).",
        ok: false,
        status: "unsupported_media_type",
      };
    }
    return { bytes, contentType: sniffed, ok: true };
  } catch (err) {
    logError("Erreur lecture pièce jointe avatar", err);
    return {
      message: "Impossible de relire la pièce jointe.",
      ok: false,
      status: "invalid_request",
    };
  }
}

// Relais vers l'endpoint mAI /upload-avatar avec le token de session côté
// serveur (aucun secret ne transite par le client).
async function uploadAvatarToMai(params: {
  bytes: Uint8Array;
  contentType: string;
  filename: string;
  token: string;
}): Promise<
  | { ok: true; payload: Record<string, unknown> }
  | { error: unknown; ok: false; status: number }
> {
  const blob = new Blob([new Uint8Array(params.bytes)], {
    type: params.contentType,
  });
  const formData = new FormData();
  formData.append("avatar", blob, params.filename);

  try {
    const res = await fetch(`${MAI_API_URL}/upload-avatar`, {
      body: formData,
      headers: { Authorization: `Bearer ${params.token}` },
      method: "POST",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: data, ok: false, status: res.status };
    }
    if (
      !data ||
      typeof data !== "object" ||
      (data as Record<string, unknown>).success !== true
    ) {
      // Amont OK mais réponse inattendue : échec explicite, on n'affirme
      // jamais que l'avatar a changé.
      return { error: data, ok: false, status: res.status };
    }
    return { ok: true, payload: data as Record<string, unknown> };
  } catch (err) {
    return { error: err, ok: false, status: 502 };
  }
}

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
    const fallbackUser = (await getMaiUser(token)) ?? undefined;
    const result = await fetchUsageBundle({
      fallbackUser,
      sessionToken: token,
    });

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

// POST /api/settings : mise à jour du profil, upload d'avatar ou changement
// d'avatar par le tool natif (action set_avatar, validée et confirmée).
export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  // Invalider le cache lors d'une mutation
  settingsCache.delete(token);

  const contentType = req.headers.get("content-type") || "";

  // Cas 0 : changement d'avatar par le tool natif (JSON, action set_avatar).
  if (contentType.includes("application/json")) {
    const body: unknown = await req.json().catch(() => null);
    if (
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).action === "set_avatar"
    ) {
      const action = body as {
        action: string;
        imageUrl?: unknown;
        sourceHash?: unknown;
      };

      if (typeof action.imageUrl !== "string" || !action.imageUrl.trim()) {
        return errorResponse("invalid_request", {
          message: "Source d'image manquante.",
        });
      }
      if (typeof action.sourceHash !== "string" || !action.sourceHash) {
        return errorResponse("invalid_request", {
          message: "Confirmation invalide : source non identifiable.",
        });
      }
      // La confirmation ne vaut que pour la source exacte affichée dans la
      // carte : tout changement de source exige une nouvelle confirmation.
      if (hashImageSource(action.imageUrl) !== action.sourceHash) {
        return errorResponse("invalid_request", {
          message:
            "La source a changé depuis la confirmation : nouvelle confirmation requise.",
        });
      }

      let bytes: Uint8Array;
      let sniffedType: string;
      if (isAttachmentUploadUrl(action.imageUrl)) {
        const attachment = await readAttachmentImage(action.imageUrl);
        if (!attachment.ok) {
          return errorResponse(attachment.status, {
            message: attachment.message,
          });
        }
        bytes = attachment.bytes;
        sniffedType = attachment.contentType;
      } else {
        const parsed = parseRemoteImageUrl(action.imageUrl);
        if (!parsed.ok) {
          return errorResponse("invalid_request", {
            message: parsed.error.message,
          });
        }
        const remote = await fetchRemoteImage(parsed.url);
        if (!remote.ok) {
          return errorResponse("unsupported_media_type", {
            message: remote.error.message,
          });
        }
        bytes = remote.bytes;
        sniffedType = remote.contentType;
      }

      if (bytes.length > REMOTE_IMAGE_MAX_BYTES) {
        return errorResponse("payload_too_large", {
          message: "Image trop volumineuse (max 10 Mo).",
        });
      }

      const ext = sniffedType.split("/")[1] || "jpg";
      const upload = await uploadAvatarToMai({
        bytes,
        contentType: sniffedType,
        filename: `avatar.${ext}`,
        token,
      });
      if (!upload.ok) {
        const payload = normalizeUpstreamError(
          upload.error,
          upload.status,
          extractUpstreamMessage(upload.error)
            ? { message: extractUpstreamMessage(upload.error) }
            : {}
        );
        return NextResponse.json(payload, { status: payload.status });
      }

      // Succès : la session peut porter un avatarUrl stale — on jette la copie
      // en mémoire pour que la prochaine requête relise l'amont. (Le cache du
      // tier persisté est indexé par userId et n'est pas affecté par l'avatar.)
      invalidateMaiUserCache(token);

      return NextResponse.json(upload.payload);
    }
  }

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
      // Invalider aussi le cache utilisateur (avatarUrl stale jusqu'à 2 min).
      invalidateMaiUserCache(token);

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
      // Préserver le message précis du backend (mot de passe incorrect,
      // username/téléphone pris…) sinon normalizeUpstreamError le génériqueise.
      const upstreamMessage = extractUpstreamMessage(data);
      const payload = normalizeUpstreamError(
        data,
        res.status,
        upstreamMessage ? { message: upstreamMessage } : {}
      );
      return NextResponse.json(payload, { status: payload.status });
    }
    invalidateMaiUserCache(token);
    return NextResponse.json(data);
  } catch (err) {
    logError("Erreur update profil", err);
    return errorResponse("internal_error", {
      message: "Erreur serveur lors de la mise à jour du profil.",
    });
  }
}
