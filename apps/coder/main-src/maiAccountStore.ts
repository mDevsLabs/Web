import { BrowserWindow, safeStorage } from "electron";
import { MAI_API_BASE, MAI_API_V1_BASE } from "./maiApiBase.js";
import { decodeMaiJwtPayload } from "./maiSessionToken.js";
import {
  DEFAULT_MAI_MODELS,
  getSettings,
  type MaiAccountProfile,
  type MaiAccountState,
  type MaiAccountUsage,
  patchSettings,
  type ShellSettings,
  type UserModelEntry,
} from "./settingsStore.js";

export { MAI_API_BASE } from "./maiApiBase.js";

async function maiFetch(
  url: string,
  init: RequestInit = {},
  ms = 15_000
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// Tokens au repos: chiffre via safeStorage quand disponible (sinon clair + warn).
// Évite jwtToken/apiKey en clair dans settings.json sur OS avec keyring.
function protectToken(token: string): string {
  try {
    if (safeStorage?.isEncryptionAvailable?.()) {
      return `enc:${safeStorage.encryptString(token).toString("base64")}`;
    }
  } catch {
    /* ignore */
  }
  return token;
}
export function unprotectToken(stored?: string | null): string {
  const s = (stored ?? "").trim();
  if (!s) return "";
  if (!s.startsWith("enc:")) return s;
  try {
    return safeStorage.decryptString(Buffer.from(s.slice(4), "base64"));
  } catch {
    return "";
  }
}

export type MaiLoginResponse =
  | { ok: true; status: "verification_required"; email: string }
  | { ok: false; message: string };

export type MaiVerifyResponse =
  | { ok: true; token: string; tier: string; account: MaiAccountState }
  | { ok: false; message: string };

export type MaiRegisterResponse =
  | { ok: true; status: "verification_required"; email: string }
  | { ok: false; message: string };

export type MaiUsageResponse =
  | {
      ok: true;
      email?: string;
      username?: string;
      avatarUrl?: string;
      tier?: string;
      phone?: string;
      tokensUsed: number;
      limit: number;
      resetAt?: string;
      weekStart?: string;
    }
  | { ok: false; message: string; status?: number };

function broadcastMaiAccountUpdate(state: MaiAccountState): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("mai:accountUpdated", state);
    }
  }
}

/**
 * 1. Initialise la connexion mAI (envoi du code OTP à l'email)
 */
export async function maiLogin(
  identifier: string,
  password: string
): Promise<MaiLoginResponse> {
  try {
    const res = await maiFetch(`${MAI_API_BASE}/login`, {
      body: JSON.stringify({
        identifier: identifier.trim().slice(0, 254),
        password: String(password).slice(0, 128),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { message: json.error || "Identifiants invalides.", ok: false };
    }
    return {
      email: json.email || identifier,
      ok: true,
      status: "verification_required",
    };
  } catch (err: unknown) {
    return {
      message:
        err instanceof Error
          ? err.message
          : "Erreur de connexion au serveur mAI.",
      ok: false,
    };
  }
}

/**
 * 2. Vérification du code OTP de connexion
 */
export async function maiVerifyLogin(
  email: string,
  code: string
): Promise<MaiVerifyResponse> {
  try {
    const res = await maiFetch(`${MAI_API_BASE}/verify-login`, {
      body: JSON.stringify({
        code: code.trim().slice(0, 16),
        email: email.trim().slice(0, 254),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.token) {
      return { message: json.error || "Code invalide ou expiré.", ok: false };
    }

    const token = String(json.token);
    const account = await syncMaiAccountWithToken(token);
    return { account, ok: true, tier: json.tier || "Free", token };
  } catch (err: unknown) {
    return {
      message:
        err instanceof Error ? err.message : "Erreur lors de la vérification.",
      ok: false,
    };
  }
}

/**
 * 3. Inscription initiale (envoi du code OTP)
 */
export async function maiRegister(
  email: string,
  username: string,
  password: string
): Promise<MaiRegisterResponse> {
  try {
    const res = await maiFetch(`${MAI_API_BASE}/register`, {
      body: JSON.stringify({
        email: email.trim().slice(0, 254),
        password: String(password).slice(0, 128),
        username: username.trim().slice(0, 32),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        message: json.error || "Erreur lors de l'inscription.",
        ok: false,
      };
    }
    return {
      email: json.email || email,
      ok: true,
      status: "verification_required",
    };
  } catch (err: unknown) {
    return {
      message:
        err instanceof Error
          ? err.message
          : "Erreur de connexion au serveur mAI.",
      ok: false,
    };
  }
}

/**
 * 4. Validation du code OTP d'inscription
 */
export async function maiVerifyRegister(
  email: string,
  username: string,
  password: string,
  code: string
): Promise<MaiVerifyResponse> {
  try {
    const res = await maiFetch(`${MAI_API_BASE}/verify-register`, {
      body: JSON.stringify({
        code: code.trim().slice(0, 16),
        email: email.trim().slice(0, 254),
        password: String(password).slice(0, 128),
        username: username.trim().slice(0, 32),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.token) {
      return { message: json.error || "Code invalide ou expiré.", ok: false };
    }

    const token = String(json.token);
    const account = await syncMaiAccountWithToken(token);
    return { account, ok: true, tier: json.tier || "Free", token };
  } catch (err: unknown) {
    return {
      message:
        err instanceof Error ? err.message : "Erreur lors de la vérification.",
      ok: false,
    };
  }
}

/**
 * 5. Renvoyer un code OTP
 */
export async function maiResendCode(
  email: string,
  action: "login" | "register"
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await maiFetch(`${MAI_API_BASE}/resend-code`, {
      body: JSON.stringify({ action, email: email.trim().slice(0, 254) }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        message: json.error || "Impossible de renvoyer le code.",
        ok: false,
      };
    }
    return { ok: true };
  } catch (err: unknown) {
    return {
      message: err instanceof Error ? err.message : "Erreur réseau.",
      ok: false,
    };
  }
}

/**
 * Un 200 ne prouve pas que /usage a répondu : un proxy ou une page d'erreur
 * peut renvoyer un corps vide ou HTML. Sans identité ni compteur, fabriquer un
 * compte « Free » à 0 token afficherait un compte qui n'existe pas.
 */
export function isUsagePayload(json: Record<string, unknown>): boolean {
  if (typeof json.error === "string" && json.error.trim()) {
    return false;
  }
  const identityKeys = ["email", "username", "name", "id", "sub"];
  const usageKeys = [
    "tokensUsed",
    "tokens_used",
    "used",
    "weeklyUsed",
    "weekly_used",
    "limit",
    "maxTokens",
    "max_tokens",
    "tokenLimit",
    "token_limit",
    "tier",
  ];
  return [...identityKeys, ...usageKeys].some((key) => {
    const value = json[key];
    return (
      (typeof value === "string" && value.trim().length > 0) ||
      (typeof value === "number" && Number.isFinite(value))
    );
  });
}

/**
 * 6. Récupérer le profil et l'usage courant depuis /usage
 */
export async function maiFetchUsage(
  jwtToken: string
): Promise<MaiUsageResponse> {
  try {
    const raw = unprotectToken(jwtToken) || jwtToken.trim();
    const res = await maiFetch(`${MAI_API_BASE}/usage`, {
      headers: {
        Authorization: `Bearer ${raw}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        message:
          typeof json.error === "string" && json.error.trim()
            ? json.error
            : res.status === 401
              ? "Session mAI expirée. Reconnectez-vous."
              : `Le serveur mAI a répondu ${res.status}.`,
        ok: false,
        status: res.status,
      };
    }
    if (
      !json ||
      typeof json !== "object" ||
      !isUsagePayload(json as Record<string, unknown>)
    ) {
      return {
        message:
          typeof (json as { error?: unknown })?.error === "string" &&
          String((json as { error?: string }).error).trim()
            ? String((json as { error?: string }).error)
            : "Réponse inattendue du serveur mAI. Reconnectez-vous.",
        ok: false,
        status: res.status,
      };
    }
    const rawTokensUsed =
      json.tokensUsed ??
      json.tokens_used ??
      json.used ??
      json.weeklyUsed ??
      json.weekly_used;
    const parsedTokensUsed =
      typeof rawTokensUsed === "number" ? rawTokensUsed : Number(rawTokensUsed);
    const tokensUsed =
      Number.isFinite(parsedTokensUsed) && parsedTokensUsed >= 0
        ? parsedTokensUsed
        : 0;

    const rawLimit =
      json.limit ??
      json.maxTokens ??
      json.max_tokens ??
      json.tokenLimit ??
      json.token_limit;
    const parsedLimit =
      typeof rawLimit === "number" ? rawLimit : Number(rawLimit);
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5_000_000;

    return {
      avatarUrl: json.avatarUrl || json.avatar_url,
      email: json.email,
      limit,
      ok: true,
      phone: json.phone,
      resetAt: json.resetAt || json.reset_at,
      tier: json.tier || "Free",
      tokensUsed,
      username: json.username,
      weekStart: json.weekStart || json.week_start,
    };
  } catch (err: unknown) {
    return {
      message: err instanceof Error ? err.message : "Erreur réseau.",
      ok: false,
    };
  }
}

/**
 * 8. Enregistrer les tokens consommés via POST /log-usage
 */
export async function maiLogUsage(
  jwtToken: string,
  tokensUsed: number,
  details?: { inputTokens?: number; outputTokens?: number }
): Promise<{ ok: boolean; weeklyUsed?: number; limit?: number }> {
  if (
    !Number.isFinite(tokensUsed) ||
    tokensUsed <= 0 ||
    tokensUsed > 10_000_000
  ) {
    return { ok: true };
  }
  try {
    const res = await maiFetch(`${MAI_API_BASE}/log-usage`, {
      body: JSON.stringify({
        tokensUsed: Math.floor(tokensUsed),
        ...(details?.inputTokens !== undefined
          ? { inputTokens: Math.floor(details.inputTokens) }
          : {}),
        ...(details?.outputTokens !== undefined
          ? { outputTokens: Math.floor(details.outputTokens) }
          : {}),
      }),
      headers: {
        Authorization: `Bearer ${unprotectToken(jwtToken) || jwtToken.trim()}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && (json.success || json.ok !== false)) {
      const rawWeekly =
        json.weeklyUsed ??
        json.weekly_used ??
        json.tokensUsed ??
        json.tokens_used ??
        json.used;
      const parsedWeekly =
        typeof rawWeekly === "number" ? rawWeekly : Number(rawWeekly);
      const weeklyUsed =
        Number.isFinite(parsedWeekly) && parsedWeekly >= 0
          ? parsedWeekly
          : undefined;

      const rawLimit =
        json.limit ??
        json.maxTokens ??
        json.max_tokens ??
        json.tokenLimit ??
        json.token_limit;
      const parsedLimit =
        typeof rawLimit === "number" ? rawLimit : Number(rawLimit);
      const limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0
          ? parsedLimit
          : undefined;

      // Mettre à jour l'état local dans settingsStore
      const current = getSettings().maiAccount;
      if (current) {
        const prevUsage = current.usage || { limit: 5_000_000, tokensUsed: 0 };
        const nextUsage: MaiAccountUsage = {
          ...prevUsage,
          limit: limit === undefined ? prevUsage.limit : limit,
          tokensUsed:
            weeklyUsed === undefined
              ? prevUsage.tokensUsed + tokensUsed
              : weeklyUsed,
        };
        const nextAccount: MaiAccountState = {
          ...current,
          lastSyncedAt: Date.now(),
          usage: nextUsage,
        };
        patchSettings({ maiAccount: nextAccount });
        broadcastMaiAccountUpdate(nextAccount);
      }
      return { limit, ok: true, weeklyUsed };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function recordMaiTokenUsage(
  tokensUsed: number,
  details?: { inputTokens?: number; outputTokens?: number }
): Promise<void> {
  if (tokensUsed <= 0) return;
  try {
    const s = getSettings();
    const jwt = s.maiAccount?.jwtToken?.trim() || s.maiAccount?.apiKey?.trim();
    if (jwt) {
      await maiLogUsage(jwt, tokensUsed, details);
    }
  } catch (err) {
    console.warn("[maiAccount] recordMaiTokenUsage failed:", err);
  }
}

export function updateMaiAccountUsage(usage: MaiAccountUsage): void {
  const current = getSettings().maiAccount;
  if (current) {
    const nextAccount: MaiAccountState = {
      ...current,
      lastSyncedAt: Date.now(),
      usage: {
        ...(current.usage || { limit: 5_000_000, tokensUsed: 0 }),
        ...usage,
      },
    };
    patchSettings({ maiAccount: nextAccount });
    broadcastMaiAccountUpdate(nextAccount);
  }
}

/**
 * 9. Vérifie si le quota mAI de l'utilisateur est disponible avant de lancer une requête d'IA.
 * Retourne { available: false, message: '...' } si le quota est épuisé.
 */
export async function checkMaiQuotaAvailable(
  settings: ShellSettings,
  forceFresh = false
): Promise<{ available: boolean; message?: string; usage?: MaiAccountUsage }> {
  const maiAccount = settings.maiAccount;
  const jwt = maiAccount?.jwtToken?.trim() || maiAccount?.apiKey?.trim();

  // Si aucun compte mAI n'est connecté ou pas de token, on ne bloque pas
  if (!jwt) {
    return { available: true };
  }

  // 1. Vérification rapide du cache local
  const localUsage = maiAccount?.usage;
  if (
    !forceFresh &&
    localUsage &&
    typeof localUsage.limit === "number" &&
    localUsage.limit > 0 &&
    typeof localUsage.tokensUsed === "number" &&
    localUsage.tokensUsed >= localUsage.limit
  ) {
    const resetStr = localUsage.resetAt
      ? new Date(localUsage.resetAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          weekday: "long",
        })
      : "prochainement";
    return {
      available: false,
      message: `Votre quota hebdomadaire mAI est épuisé (${localUsage.tokensUsed.toLocaleString("fr-FR")} / ${localUsage.limit.toLocaleString("fr-FR")} tokens). Réinitialisation : ${resetStr}.`,
      usage: localUsage,
    };
  }

  // 2. Vérification fraîche auprès de l'API /usage (timeout 10s).
  // En cas d'erreur réseau on retombe sur le cache local déjà vérifié ci-dessus
  // (fail-closed si local épuisé, sinon disponible — offline ne peut pas appeler le LLM de toute façon).
  try {
    const usageRes = await maiFetchUsage(jwt);
    if (usageRes.ok) {
      const nextUsage: MaiAccountUsage = {
        limit: usageRes.limit,
        resetAt: usageRes.resetAt,
        tokensUsed: usageRes.tokensUsed,
        weekStart: usageRes.weekStart,
      };
      updateMaiAccountUsage(nextUsage);

      if (usageRes.limit > 0 && usageRes.tokensUsed >= usageRes.limit) {
        const resetStr = usageRes.resetAt
          ? new Date(usageRes.resetAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              weekday: "long",
            })
          : "prochainement";
        return {
          available: false,
          message: `Votre quota hebdomadaire mAI est épuisé (${usageRes.tokensUsed.toLocaleString("fr-FR")} / ${usageRes.limit.toLocaleString("fr-FR")} tokens). Réinitialisation : ${resetStr}.`,
          usage: nextUsage,
        };
      }
      return { available: true, usage: nextUsage };
    }
  } catch (err) {
    console.warn("[maiAccount] checkMaiQuotaAvailable error:", err);
  }

  return { available: true, usage: localUsage };
}

/**
 * Synchronise entièrement le compte mAI à partir du token JWT
 */
/**
 * Remplace immédiatement le compte local par un état « en synchronisation ».
 *
 * Utilisé au handoff depuis mAI Desktop : le jeton est valide, mais le profil
 * n'est pas encore revenu. Afficher l'ancien compte (souvent un « Free »
 * factice) pendant ce délai est précisément le bug que l'on corrige.
 */
export function markMaiAccountSyncPending(jwtToken: string): MaiAccountState {
  const rawToken = (unprotectToken(jwtToken) || jwtToken).trim();
  const nextState: MaiAccountState = {
    apiKey: protectToken(rawToken),
    jwtToken: protectToken(rawToken),
    lastSyncedAt: Date.now(),
    syncError: null,
    syncPending: true,
  };
  patchSettings({ maiAccount: nextState });
  broadcastMaiAccountUpdate(nextState);
  return nextState;
}

function dedupeModelEntries(entries: UserModelEntry[]): UserModelEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
}

export async function syncMaiAccountWithToken(
  jwtToken: string
): Promise<MaiAccountState> {
  // Le jwtToken est directement utilisé comme clé API effective — plus de fetch BDD mprojects_api_keys
  const rawToken = (unprotectToken(jwtToken) || jwtToken).trim();
  const usageRes = await maiFetchUsage(rawToken);
  const effectiveApiKey = rawToken;
  const protectedJwt = protectToken(rawToken);
  const unauthorized = !usageRes.ok && usageRes.status === 401;
  const previous = getSettings().maiAccount;
  // `/usage` n'est pas tenu de renvoyer l'identité : elle vit aussi dans le
  // jeton. Sans ce repli, Coder afficherait « Compte mAI » sans email — un
  // compte qui ne correspond à aucun utilisateur réel.
  const claims = decodeMaiJwtPayload(rawToken);
  // Le backend signe `{ sub, tier }` : `sub` reste la seule identité
  // garantie quand /usage ne résout pas la ligne `users`.
  const claimSubject =
    typeof claims?.sub === "string" ? claims.sub.trim() : "";
  const claimEmail =
    typeof claims?.email === "string" ? claims.email.trim() : "";
  const claimUsername =
    typeof claims?.username === "string"
      ? claims.username.trim()
      : typeof claims?.name === "string"
        ? claims.name.trim()
        : "";
  // Une panne réseau ne doit pas effacer l'identité déjà connue : l'interface
  // afficherait alors un profil vide. Seul un 401, qui prouve que la session
  // est morte, l'efface.
  const userProfile: MaiAccountProfile | undefined = usageRes.ok
    ? {
        avatarUrl: usageRes.avatarUrl,
        email: usageRes.email || claimEmail,
        id: usageRes.email || claimEmail || claimSubject || "mai-user",
        phone: usageRes.phone,
        tier: usageRes.tier || "Free",
        username: usageRes.username || claimUsername,
      }
    : unauthorized
      ? undefined
      : previous?.user;

  const usage: MaiAccountUsage | undefined = usageRes.ok
    ? {
        limit: usageRes.limit,
        resetAt: usageRes.resetAt,
        tokensUsed: usageRes.tokensUsed,
        weekStart: usageRes.weekStart,
      }
    : unauthorized
      ? undefined
      : previous?.usage;

  // Un 200 sans email ni nom ne prouve pas qu'un compte existe : le backend
  // répond 200 avec le tier « Free » même quand la ligne `users` est absente.
  // Afficher ce profil sans réserve serait exactement le compte fantôme.
  const profileIncomplete =
    usageRes.ok &&
    !userProfile?.email &&
    !userProfile?.username &&
    !claimEmail &&
    !claimUsername;

  const nextState: MaiAccountState = {
    apiKey: unauthorized ? "" : protectToken(effectiveApiKey),
    jwtToken: unauthorized ? "" : protectedJwt,
    lastSyncedAt: Date.now(),
    syncError: usageRes.ok
      ? profileIncomplete
        ? "Profil mAI incomplet : le serveur n’a renvoyé ni email ni nom d’utilisateur."
        : null
      : usageRes.message || "Synchronisation mAI impossible.",
    syncPending: false,
    usage,
    user: userProfile,
  };

  // Mettre à jour le provider mAI dans settings.models.providers avec le jwtToken comme clé effective
  const curSettings = getSettings();
  const curProviders = curSettings.models?.providers ?? [];
  const hasMai = curProviders.some((p) => p.id === "mai");
  const nextProviders = hasMai
    ? curProviders.map((p) =>
        p.id === "mai"
          ? {
              ...p,
              apiKey: unauthorized ? "" : effectiveApiKey,
              baseURL: MAI_API_V1_BASE,
            }
          : p
      )
    : [
        {
          apiKey: unauthorized ? "" : effectiveApiKey,
          baseURL: MAI_API_V1_BASE,
          displayName: "mAI",
          id: "mai",
          paradigm: "openai-compatible" as const,
        },
        ...curProviders,
      ];

  let nextEntries = (curSettings.models?.entries ?? []).filter(
    (e) => !e.id.startsWith("mDevsLabs/")
  );
  let nextEnabled = (curSettings.models?.enabledIds ?? []).filter(
    (id) => !id.startsWith("mDevsLabs/")
  );
  let defaultModel = curSettings.defaultModel;
  if (defaultModel?.startsWith("mDevsLabs/")) {
    defaultModel = undefined;
  }

  // Récupération dynamique des modèles disponibles depuis le catalogue mAI.
  try {
    const modelsRes = await maiFetch(`${MAI_API_V1_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${effectiveApiKey}`,
      },
    });
    if (modelsRes.ok) {
      const json = (await modelsRes.json().catch(() => ({}))) as any;
      if (Array.isArray(json.data) && json.data.length > 0) {
        const otherEntries = nextEntries.filter((e) => e.providerId !== "mai");
        const maiEntries: UserModelEntry[] = json.data.map((m: any) => ({
          contextWindowTokens:
            m.maxContext ?? m.max_context_tokens ?? m.context_window ?? 32_768,
          displayName:
            typeof m.name === "string" && m.name.trim() ? m.name.trim() : m.id,
          id: m.id,
          maxOutputTokens: m.maxOutput ?? m.max_output_tokens ?? 8192,
          providerId: "mai",
          requestName: m.id,
          temperatureMode: "auto",
        }));

        nextEntries = dedupeModelEntries([...maiEntries, ...otherEntries]);
        const maiIds = maiEntries.map((m) => m.id);
        nextEnabled = Array.from(new Set([...maiIds, ...nextEnabled]));

        if (!defaultModel || !nextEntries.some((e) => e.id === defaultModel)) {
          defaultModel = maiEntries[0]?.id || "google/gemini-2.5-flash:free";
        }
      }
    }
  } catch {
    /* ignore network errors when fetching models */
  }

  if (!nextEntries.some((e) => e.providerId === "mai")) {
    nextEntries = dedupeModelEntries([...DEFAULT_MAI_MODELS, ...nextEntries]);
  }
  nextEntries = dedupeModelEntries(nextEntries);
  // Un id activé sans entrée correspondante ferait échouer la sélection de
  // modèle côté éditeur : la synchronisation le retire au lieu de le conserver.
  const entryIds = new Set(nextEntries.map((e) => e.id));
  const allMaiIds = nextEntries
    .filter((e) => e.providerId === "mai")
    .map((e) => e.id);
  nextEnabled = Array.from(new Set([...allMaiIds, ...nextEnabled])).filter(
    (id) => entryIds.has(id)
  );

  if (!defaultModel || !nextEntries.some((e) => e.id === defaultModel)) {
    defaultModel = nextEntries[0]?.id || "google/gemini-2.5-flash:free";
  }

  patchSettings({
    defaultModel: defaultModel || "google/gemini-2.5-flash:free",
    maiAccount: nextState,
    models: {
      ...(curSettings.models ?? {}),
      enabledIds: nextEnabled,
      entries: nextEntries,
      providers: nextProviders,
    },
  });

  broadcastMaiAccountUpdate(nextState);
  return nextState;
}

/**
 * Déconnexion du compte mAI
 */
export function maiLogout(): MaiAccountState {
  const curSettings = getSettings();
  const curProviders = curSettings.models?.providers ?? [];
  const nextProviders = curProviders.map((p) =>
    p.id === "mai" ? { ...p, apiKey: "" } : p
  );

  const nextState: MaiAccountState = {};
  patchSettings({
    maiAccount: nextState,
    models: {
      ...(curSettings.models ?? {}),
      providers: nextProviders,
    },
  });

  broadcastMaiAccountUpdate(nextState);
  return nextState;
}
