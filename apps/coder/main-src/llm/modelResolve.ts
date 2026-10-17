import type { ProviderIdentitySettings } from "../../src/providerIdentitySettings.js";
import {
  DEFAULT_MAI_PROVIDER,
  type ModelRequestParadigm,
  type ProviderOAuthAuthRecord,
  type ShellSettings,
  type UserLlmProvider,
  type UserModelEntry,
} from "../settingsStore.js";
import {
  isClaudeOAuthAccessToken,
  providerIdentityForOAuthAuth,
} from "./providerIdentity.js";
import {
  normalizeThinkingLevel,
  normalizeUserModelTemperature,
  type ThinkingLevel,
} from "./thinkingLevel.js";

export type ResolvedChatModel = {
  requestModelId: string;
  paradigm: ModelRequestParadigm;
};

/** 应用内默认上限；单条模型可覆盖；若网关限制更低请自行调小 */
export const DEFAULT_MAX_OUTPUT_TOKENS = 16_384;
const MIN_MAX_OUT = 1;
const MAX_MAX_OUT = 128_000;

export type ResolvedModelRequest =
  | {
      ok: true;
      entryId: string;
      requestModelId: string;
      paradigm: ModelRequestParadigm;
      maxOutputTokens: number;
      /** 未配置时在 `modelContext` 中解析 */
      contextWindowTokens?: number;
      temperatureMode: "auto" | "custom";
      temperature?: number;
      apiKey: string;
      baseURL?: string;
      /** 仅 OpenAI 兼容：来自提供商的 HTTP 代理 */
      proxyUrl?: string;
      /** 当前提供商的 id，便于上层定位提供商级别配置（如标识覆盖）。 */
      providerId: string;
      /** 当前提供商对全局「模型提供商标识」的覆盖（undefined / `'inherit'` 表示跟随全局）。 */
      providerIdentity?: ProviderIdentitySettings;
      /** 当前提供商的 OAuth 凭据（Codex / Claude Code / Antigravity）。 */
      oauthAuth?: ProviderOAuthAuthRecord;
    }
  | { ok: false; message: string };

function entryById(
  entries: UserModelEntry[],
  id: string
): UserModelEntry | undefined {
  return entries.find((e) => e.id === id);
}

function providerById(
  providers: UserLlmProvider[],
  id: string
): UserLlmProvider | undefined {
  return providers.find((p) => p.id === id);
}

function logModelResolveOAuthDebug(params: {
  entryId: string;
  provider: UserLlmProvider;
  requestModelId: string;
  apiKey: string;
  oauthAuth?: ProviderOAuthAuthRecord;
}): void {
  const tokenKind = isClaudeOAuthAccessToken(
    params.oauthAuth?.accessToken ?? params.apiKey
  )
    ? "claude-oauth"
    : params.oauthAuth?.provider
      ? `${params.oauthAuth.provider}-oauth`
      : "none";
  if (tokenKind === "none") {
    return;
  }
  const summary = {
    authMode: tokenKind === "claude-oauth" ? "bearer" : "provider-oauth",
    entryId: params.entryId,
    hasOAuthAuth: Boolean(params.oauthAuth),
    hasRefreshToken: Boolean(params.oauthAuth?.refreshToken?.trim()),
    oauthProvider: params.oauthAuth?.provider ?? "",
    paradigm: params.provider.paradigm,
    providerId: params.provider.id,
    providerIdentityPreset:
      (
        providerIdentityForOAuthAuth(params.oauthAuth) ??
        params.provider.providerIdentity
      )?.preset ?? "",
    providerName: params.provider.displayName?.trim() || "",
    requestModelId: params.requestModelId,
    tokenKind,
  };
  console.log(`[ModelResolveOAuthDebug] ${JSON.stringify(summary)}`);
}

function isUsable(e: UserModelEntry): boolean {
  return e.requestName.trim().length > 0;
}

export function clampMaxOutputTokens(n: number | undefined): number {
  const v = n ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const floored = Math.floor(v);
  if (!Number.isFinite(floored)) {
    return DEFAULT_MAX_OUTPUT_TOKENS;
  }
  return Math.min(MAX_MAX_OUT, Math.max(MIN_MAX_OUT, floored));
}

function resolveProviderCredentials(
  provider: UserLlmProvider,
  settings: ShellSettings
):
  | {
      ok: true;
      apiKey: string;
      baseURL?: string;
      proxyUrl?: string;
      oauthAuth?: ProviderOAuthAuthRecord;
    }
  | { ok: false; message: string } {
  let oauthAuth = provider.oauthAuth?.accessToken?.trim()
    ? provider.oauthAuth
    : undefined;
  const isMaiProvider =
    provider.id === "mai" || provider.baseURL?.includes("mai.val.run");

  if (isMaiProvider) {
    const maiAccount = settings.maiAccount;
    const key =
      provider.apiKey?.trim() ||
      maiAccount?.apiKey?.trim() ||
      maiAccount?.jwtToken?.trim() ||
      "";
    if (!key && !maiAccount?.jwtToken) {
      return {
        message:
          "Veuillez vous connecter à votre compte mAI pour utiliser ce modèle (Paramètres → Compte mAI).",
        ok: false,
      };
    }
    const base = (provider.baseURL?.trim() || "https://mai.val.run/v1").replace(
      /\/+$/,
      ""
    );
    const proxyUrl = provider.proxyUrl?.trim() || undefined;
    return {
      apiKey: key,
      baseURL: base,
      ok: true,
      proxyUrl,
      ...(oauthAuth ? { oauthAuth } : {}),
    };
  }

  if (provider.paradigm === "openai-compatible") {
    const key = oauthAuth?.accessToken.trim() || provider.apiKey?.trim() || "";
    if (!key) {
      return {
        message:
          "Clé API non configurée pour ce fournisseur. Veuillez renseigner votre clé dans Paramètres → Modèles.",
        ok: false,
      };
    }
    const base = provider.baseURL?.trim()
      ? provider.baseURL.trim().replace(/\/+$/, "")
      : undefined;
    const proxyUrl = provider.proxyUrl?.trim() || undefined;
    return {
      apiKey: key,
      baseURL: base,
      ok: true,
      proxyUrl,
      ...(oauthAuth ? { oauthAuth } : {}),
    };
  }

  if (provider.paradigm === "anthropic") {
    const key = oauthAuth?.accessToken.trim() || provider.apiKey?.trim() || "";
    if (!oauthAuth && isClaudeOAuthAccessToken(key)) {
      oauthAuth = {
        accessToken: key,
        lastRefreshAt: 0,
        provider: "claude",
        refreshToken: "",
      };
    }
    if (!key) {
      return {
        message:
          "Clé API Anthropic non configurée. Veuillez renseigner votre clé dans Paramètres → Modèles.",
        ok: false,
      };
    }
    const base = provider.baseURL?.trim()
      ? provider.baseURL.trim().replace(/\/+$/, "")
      : undefined;
    return {
      apiKey: key,
      baseURL: base,
      ok: true,
      ...(oauthAuth ? { oauthAuth } : {}),
    };
  }

  const key = oauthAuth?.accessToken.trim() || provider.apiKey?.trim() || "";
  if (!key) {
    return {
      message:
        "Clé API Google Gemini non configurée. Veuillez renseigner votre clé dans Paramètres → Modèles.",
      ok: false,
    };
  }
  return {
    apiKey: key,
    baseURL: undefined,
    ok: true,
    ...(oauthAuth ? { oauthAuth } : {}),
  };
}

/**
 * 解析当前选择对应的模型 id、范式、输出上限与有效密钥（含按提供商的连接信息）。
 * @param selectionId 用户模型条目的 id（须非空）
 */
export function resolveModelRequest(
  settings: ShellSettings,
  selectionId: string
): ResolvedModelRequest {
  const entries = settings.models?.entries ?? [];
  const providers = settings.models?.providers ?? [];
  const enabledIds = settings.models?.enabledIds ?? [];
  const enabledSet = new Set(enabledIds);

  const sid = selectionId.trim().toLowerCase();
  if (!sid || sid === "auto") {
    return {
      message:
        "Aucun modèle sélectionné. Veuillez choisir un modèle dans la barre d'envoi ou dans Paramètres → Modèles.",
      ok: false,
    };
  }

  let entry = entryById(entries, selectionId);
  if (!entry) {
    const sNorm = selectionId.trim().toLowerCase();
    entry = entries.find(
      (x) =>
        x.id?.trim().toLowerCase() === sNorm ||
        x.requestName?.trim().toLowerCase() === sNorm
    );
  }
  // Si le modèle n'a pas été trouvé, basculer sur le modèle par défaut ou le premier modèle valide
  if (!entry && entries.length > 0) {
    const defEntry = settings.defaultModel
      ? entryById(entries, settings.defaultModel)
      : null;
    if (defEntry && isUsable(defEntry)) {
      entry = defEntry;
    } else {
      entry =
        entries.find(
          (x) => isUsable(x) && (enabledSet.has(x.id) || x.providerId === "mai")
        ) || entries.find(isUsable);
    }
  }

  if (!entry || !isUsable(entry)) {
    return {
      message:
        "Impossible de charger ce modèle : il n'existe pas ou son nom de requête est vide. Vérifiez dans Paramètres → Modèles.",
      ok: false,
    };
  }

  let prov = providerById(providers, entry.providerId);
  if (!prov && (entry.providerId === "mai" || !entry.providerId)) {
    prov =
      providers.find(
        (p) => p.id === "mai" || p.baseURL?.includes("mai.val.run")
      ) || DEFAULT_MAI_PROVIDER;
  }
  if (!prov) {
    return {
      message:
        "Impossible de charger ce modèle : aucun fournisseur associé. Veuillez réassigner un fournisseur dans Paramètres → Modèles.",
      ok: false,
    };
  }

  const creds = resolveProviderCredentials(prov, settings);
  if (!creds.ok) {
    return creds;
  }

  const ctx = entry.contextWindowTokens;
  const contextWindowTokens =
    ctx != null && Number.isFinite(ctx) && ctx > 0
      ? Math.floor(ctx)
      : undefined;
  const temperatureMode =
    entry.temperatureMode === "custom" ? "custom" : "auto";
  const temperature = normalizeUserModelTemperature(entry.temperature);
  logModelResolveOAuthDebug({
    apiKey: creds.apiKey,
    entryId: entry.id,
    oauthAuth: creds.oauthAuth,
    provider: prov,
    requestModelId: entry.requestName.trim(),
  });

  return {
    entryId: entry.id,
    maxOutputTokens: clampMaxOutputTokens(entry.maxOutputTokens),
    ok: true,
    paradigm: prov.paradigm,
    requestModelId: entry.requestName.trim(),
    ...(contextWindowTokens == null ? {} : { contextWindowTokens }),
    temperatureMode,
    ...(temperature == null ? {} : { temperature }),
    apiKey: creds.apiKey,
    baseURL: creds.baseURL,
    oauthAuth: creds.oauthAuth,
    providerId: prov.id,
    providerIdentity:
      providerIdentityForOAuthAuth(creds.oauthAuth) ?? prov.providerIdentity,
    proxyUrl: creds.proxyUrl,
  };
}

/**
 * @param selectionId 用户模型条目的 id（须非空）
 */
export function resolveChatModel(
  settings: ShellSettings,
  selectionId: string
): ResolvedChatModel | null {
  const r = resolveModelRequest(settings, selectionId);
  if (!r.ok) {
    return null;
  }
  return { paradigm: r.paradigm, requestModelId: r.requestModelId };
}

/** 按模型选择器当前条目 id 解析思考强度；未选择或旧版 auto 时默认为 medium。 */
export function resolveThinkingLevelForSelection(
  settings: ShellSettings,
  selectionId: string
): ThinkingLevel {
  const trimmed = String(selectionId ?? "").trim();
  if (!trimmed || trimmed.toLowerCase() === "auto") {
    return "medium";
  }
  const raw = settings.models?.thinkingByModelId?.[trimmed];
  return normalizeThinkingLevel(raw == null ? "medium" : String(raw));
}
