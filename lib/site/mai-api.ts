/**
 * Client HTTP des appels d'authentification et de compte du Site.
 *
 * DEPUIS L'ISSUE #10 : ces appels passent par le relais BFF
 * (`/api/site/backend/**`, route `app/(chat)/api/site/backend/[...path]`), qui
 * lit le cookie httpOnly `mai_session_token` et pose lui-même l'en-tête
 * `Authorization`. Le jeton de session ne transite plus par le renderer :
 * aucune fonction de ce module ne prend ni ne renvoie de jeton.
 */

export const SITE_BACKEND_BASE = "/api/site/backend";

export type MaiAuthResponse = {
  success: boolean;
  status?: string; // "verification_required"
  email?: string;
  tier?: string;
  error?: string;
};

export type MaiUsage = {
  tier: string;
  email: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  newsletter?: boolean;
  notify_limits?: boolean;
  tokensUsed: number;
  limit: number;
  weekStart: string;
  resetAt: string;
};

export type MaiCloudStorageUsage = {
  bytes_limit: number;
  bytes_used: number;
  files_count: number;
  over_limit: boolean;
  percent_used: number;
  tier: string;
};

import { CLOUD_STORAGE_LIMITS } from "./tiers";

// Ré-export depuis la source unique lib/tiers.ts (évite divergence frontend/backend)
export {
  CLOUD_STORAGE_LIMITS,
  formatStorageBytes,
  getTierDailyImageLimit,
  getTierImageRequestCost,
  getTierQuotaLimit,
  getTierSpeechLimit,
  getTierStorageLimit,
  STORAGE_LIMITS_BYTES,
  TIER_DAILY_IMAGE_LIMITS,
  TIER_IMAGE_REQUEST_COST,
  TIER_LIMITS,
  TIER_REQUEST_LIMITS,
  TIER_SPEECH_LIMITS,
  TIER_TOKEN_LIMITS,
} from "./tiers";

export type MaiVerifyCodeResponse = {
  success: boolean;
  tier?: string;
  error?: string;
};

export class MaiApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MaiApiError";
    this.status = status;
  }
}

async function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function errorMessage(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: extraHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string> | undefined),
  };

  const res = await fetch(`${SITE_BACKEND_BASE}${path}`, {
    ...rest,
    credentials: "same-origin",
    headers,
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new MaiApiError(
      errorMessage(data, `Erreur HTTP ${res.status}`),
      res.status
    );
  }

  return data as T;
}

export async function register(params: {
  email: string;
  username: string;
  password: string;
}): Promise<MaiAuthResponse> {
  return request<MaiAuthResponse>("/register", {
    body: JSON.stringify(params),
    method: "POST",
  });
}

export async function verifyRegister(params: {
  email: string;
  username: string;
  password: string;
  code: string;
}): Promise<MaiAuthResponse> {
  return request<MaiAuthResponse>("/verify-register", {
    body: JSON.stringify(params),
    method: "POST",
  });
}

export async function login(params: {
  identifier?: string;
  email?: string;
  password: string;
}): Promise<MaiAuthResponse> {
  return request<MaiAuthResponse>("/login", {
    body: JSON.stringify(params),
    method: "POST",
  });
}

export async function verifyLogin(params: {
  email: string;
  code: string;
}): Promise<MaiAuthResponse> {
  return request<MaiAuthResponse>("/verify-login", {
    body: JSON.stringify(params),
    method: "POST",
  });
}

export async function resendVerificationCode(params: {
  email: string;
  action: "register" | "login";
}): Promise<{ success: boolean; error?: string }> {
  return request<{ success: boolean; error?: string }>("/resend-code", {
    body: JSON.stringify(params),
    method: "POST",
  });
}

/** Déconnexion : le relais efface le cookie httpOnly côté serveur. */
export async function logout(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/logout", { method: "POST" });
}

export async function getUsage(): Promise<MaiUsage> {
  return request<MaiUsage>("/usage", { method: "GET" });
}

export async function getCloudStorage(): Promise<MaiCloudStorageUsage> {
  const data = await request<MaiCloudStorageUsage>("/cloud/storage", {
    method: "GET",
  });

  // Limites canoniques depuis lib/tiers.ts (Free 10GiB, Plus 20GiB, Pro 40GiB, Max 60GiB)
  const tier = data.tier || "Free";
  const limit = CLOUD_STORAGE_LIMITS[tier] || CLOUD_STORAGE_LIMITS["Free"];
  const bytesUsed = Number(data.bytes_used || 0);
  const percentUsed =
    limit > 0
      ? Math.min(100, Math.round((bytesUsed / limit) * 10_000) / 100)
      : 0;

  return {
    ...data,
    bytes_limit: limit,
    bytes_used: bytesUsed,
    files_count: Number(data.files_count || 0),
    over_limit: bytesUsed >= limit,
    percent_used: percentUsed,
    tier,
  };
}

export async function verifyCode(code: string): Promise<MaiVerifyCodeResponse> {
  return request<MaiVerifyCodeResponse>("/verify-code", {
    body: JSON.stringify({ code }),
    method: "POST",
  });
}

export async function updateProfile(params: {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  currentPassword?: string;
  newsletter?: boolean;
  notify_limits?: boolean;
}): Promise<{
  success: boolean;
  username?: string;
  tier?: string;
  email?: string;
  phone?: string;
  newsletter?: boolean;
  notify_limits?: boolean;
  error?: string;
}> {
  return request("/update-profile", {
    body: JSON.stringify(params),
    method: "POST",
  });
}

export async function uploadAvatar(
  file: File
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${SITE_BACKEND_BASE}/upload-avatar`, {
    body: formData,
    credentials: "same-origin",
    method: "POST",
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new MaiApiError(
      errorMessage(data, `Erreur HTTP ${res.status}`),
      res.status
    );
  }
  return data as { success: boolean; avatarUrl?: string; error?: string };
}

export type MaiAudioUsage = {
  plan: string;
  requestsCount: number;
  resetAt: string;
  tokensUsed: number;
  userId: string;
  weekStart: string;
  weeklyLimit: number;
};

export async function getAudioUsage(): Promise<MaiAudioUsage> {
  return request<MaiAudioUsage>("/v1/audio/usage", { method: "GET" });
}
