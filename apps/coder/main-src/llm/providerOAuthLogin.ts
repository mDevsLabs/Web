import * as crypto from "node:crypto";
import * as http from "node:http";
import { shell } from "electron";
import { ANTIGRAVITY_USER_AGENT } from "../../src/providerIdentitySettings.js";
import {
  getSettings,
  type OAuthProviderKind,
  type ProviderOAuthAuthRecord,
  type ProviderOAuthUsageSummary,
  patchSettings,
} from "../settingsStore.js";
import {
  antigravityProjectRequiredMessage,
  isSyntheticAntigravityProjectId,
  normalizeAntigravityProjectId,
} from "./antigravityProject.js";
import { electronNetFetch } from "./electronNetFetch.js";
import { providerIdentityForOAuthProvider } from "./providerIdentity.js";

const DEFAULT_LOGIN_TIMEOUT_MS = 5 * 60_000;

const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const CODEX_AUTH_URL = "https://auth.openai.com/oauth/authorize";
const CODEX_TOKEN_URL = "https://auth.openai.com/oauth/token";
const CODEX_SCOPE = "openid email profile offline_access";

const CLAUDE_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const CLAUDE_AUTH_URL = "https://claude.ai/oauth/authorize";
const CLAUDE_TOKEN_URL = "https://api.anthropic.com/v1/oauth/token";
const CLAUDE_SCOPE =
  "user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload";

const ANTIGRAVITY_CLIENT_ID =
  "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com";
const ANTIGRAVITY_CLIENT_SECRET = "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";
const ANTIGRAVITY_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const ANTIGRAVITY_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ANTIGRAVITY_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v1/userinfo?alt=json";
const ANTIGRAVITY_API_ENDPOINT = "https://cloudcode-pa.googleapis.com";
const ANTIGRAVITY_API_VERSION = "v1internal";
const ANTIGRAVITY_API_CLIENT = "google-cloud-sdk vscode_cloudshelleditor/0.1";
const ANTIGRAVITY_CLIENT_METADATA =
  '{"ideType":"IDE_UNSPECIFIED","platform":"PLATFORM_UNSPECIFIED","pluginType":"GEMINI"}';
const ANTIGRAVITY_MODEL_BASE_URLS = [
  ANTIGRAVITY_API_ENDPOINT,
  "https://daily-cloudcode-pa.googleapis.com",
  "https://daily-cloudcode-pa.sandbox.googleapis.com",
];
const ANTIGRAVITY_SKIPPED_DYNAMIC_MODELS = new Set([
  "chat_20706",
  "chat_23310",
  "tab_flash_lite_preview",
  "tab_jump_flash_lite_preview",
  "gemini-2.5-flash-thinking",
  "gemini-2.5-pro",
]);
const CLAUDE_OAUTH_MODELS: ProviderOAuthDiscoveredModel[] = [
  {
    contextWindowTokens: 200_000,
    displayName: "Claude 4.5 Haiku",
    id: "claude-haiku-4-5-20251001",
    maxOutputTokens: 64_000,
  },
  {
    contextWindowTokens: 200_000,
    displayName: "Claude 4.5 Sonnet",
    id: "claude-sonnet-4-5-20250929",
    maxOutputTokens: 64_000,
  },
  {
    contextWindowTokens: 200_000,
    displayName: "Claude 4.6 Sonnet",
    id: "claude-sonnet-4-6",
    maxOutputTokens: 64_000,
  },
  {
    contextWindowTokens: 1_000_000,
    displayName: "Claude 4.6 Opus",
    id: "claude-opus-4-6",
    maxOutputTokens: 128_000,
  },
  {
    contextWindowTokens: 1_000_000,
    displayName: "Claude Opus 4.7",
    id: "claude-opus-4-7",
    maxOutputTokens: 128_000,
  },
  {
    contextWindowTokens: 200_000,
    displayName: "Claude 4.5 Opus",
    id: "claude-opus-4-5-20251101",
    maxOutputTokens: 64_000,
  },
  {
    contextWindowTokens: 200_000,
    displayName: "Claude 4.1 Opus",
    id: "claude-opus-4-1-20250805",
    maxOutputTokens: 32_000,
  },
  {
    contextWindowTokens: 200_000,
    displayName: "Claude 4 Opus",
    id: "claude-opus-4-20250514",
    maxOutputTokens: 32_000,
  },
  {
    contextWindowTokens: 200_000,
    displayName: "Claude 4 Sonnet",
    id: "claude-sonnet-4-20250514",
    maxOutputTokens: 64_000,
  },
  {
    contextWindowTokens: 128_000,
    displayName: "Claude 3.7 Sonnet",
    id: "claude-3-7-sonnet-20250219",
    maxOutputTokens: 8192,
  },
  {
    contextWindowTokens: 128_000,
    displayName: "Claude 3.5 Haiku",
    id: "claude-3-5-haiku-20241022",
    maxOutputTokens: 8192,
  },
];

const CODEX_BASE_MODELS: ProviderOAuthDiscoveredModel[] = [
  {
    contextWindowTokens: 400_000,
    displayName: "GPT 5.2",
    id: "gpt-5.2",
    maxOutputTokens: 128_000,
  },
  {
    contextWindowTokens: 400_000,
    displayName: "GPT 5.3 Codex",
    id: "gpt-5.3-codex",
    maxOutputTokens: 128_000,
  },
  {
    contextWindowTokens: 1_050_000,
    displayName: "GPT 5.4",
    id: "gpt-5.4",
    maxOutputTokens: 128_000,
  },
  {
    contextWindowTokens: 400_000,
    displayName: "GPT 5.4 Mini",
    id: "gpt-5.4-mini",
    maxOutputTokens: 128_000,
  },
];

const CODEX_PLUS_MODELS: ProviderOAuthDiscoveredModel[] = [
  CODEX_BASE_MODELS[0]!,
  CODEX_BASE_MODELS[1]!,
  {
    contextWindowTokens: 128_000,
    displayName: "GPT 5.3 Codex Spark",
    id: "gpt-5.3-codex-spark",
    maxOutputTokens: 128_000,
  },
  CODEX_BASE_MODELS[2]!,
  CODEX_BASE_MODELS[3]!,
  {
    contextWindowTokens: 272_000,
    displayName: "GPT 5.5",
    id: "gpt-5.5",
    maxOutputTokens: 128_000,
  },
];

const CODEX_OAUTH_MODELS_BY_PLAN: Record<
  string,
  ProviderOAuthDiscoveredModel[]
> = {
  free: CODEX_BASE_MODELS,
  plus: CODEX_PLUS_MODELS,
  pro: CODEX_PLUS_MODELS,
  team: [...CODEX_BASE_MODELS, CODEX_PLUS_MODELS[5]!],
};
const ANTIGRAVITY_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/cclog",
  "https://www.googleapis.com/auth/experimentsandconfigs",
];

type PkceCodes = {
  codeVerifier: string;
  codeChallenge: string;
};

type LoginConfig = {
  provider: OAuthProviderKind;
  label: string;
  port: number;
  callbackPath: string;
  successPath?: string;
  windowTitle: string;
  usesPkce: boolean;
  buildAuthorizeUrl: (params: {
    redirectUri: string;
    state: string;
    pkce?: PkceCodes;
  }) => string;
  exchangeCode: (params: {
    code: string;
    redirectUri: string;
    state: string;
    pkce?: PkceCodes;
  }) => Promise<ProviderOAuthAuthRecord>;
};

type ActiveLoginCancel = (message?: string) => boolean;

let activeLoginCancel: ActiveLoginCancel | undefined;

function base64Url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

function generatePkce(): PkceCodes {
  const codeVerifier = base64Url(crypto.randomBytes(96));
  const codeChallenge = base64Url(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
  return { codeChallenge, codeVerifier };
}

function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

function formBody(fields: Record<string, string>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    body.set(key, value);
  }
  return body.toString();
}

function parseTokenEndpointError(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return "unknown error";
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const description = parsed.error_description;
    if (typeof description === "string" && description.trim()) {
      return description.trim();
    }
    const error = parsed.error;
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    }
  } catch {
    /* fall through */
  }
  return trimmed;
}

async function postFormJson<T>(
  url: string,
  fields: Record<string, string>,
  headers?: Record<string, string>
): Promise<T> {
  const response = await electronNetFetch(url, {
    body: formBody(fields),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      ...(headers ?? {}),
    },
    method: "POST",
  });
  if (!response.ok) {
    const detail = parseTokenEndpointError(
      await response.text().catch(() => "")
    );
    throw new Error(`token endpoint returned ${response.status}: ${detail}`);
  }
  return (await response.json()) as T;
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await electronNetFetch(url, {
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    const detail = parseTokenEndpointError(
      await response.text().catch(() => "")
    );
    throw new Error(`token endpoint returned ${response.status}: ${detail}`);
  }
  return (await response.json()) as T;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  const payload = parts[1];
  if (!payload) {
    return {};
  }
  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function codexAccountIdFromIdToken(idToken: string): string | undefined {
  const claims = decodeJwtPayload(idToken);
  const authClaims = claims["https://api.openai.com/auth"];
  if (!authClaims || typeof authClaims !== "object") {
    return;
  }
  const accountId = (authClaims as Record<string, unknown>).chatgpt_account_id;
  return typeof accountId === "string" && accountId.trim()
    ? accountId.trim()
    : undefined;
}

function codexPlanTypeFromIdToken(idToken: string): string | undefined {
  const claims = decodeJwtPayload(idToken);
  const authClaims = claims["https://api.openai.com/auth"];
  if (!authClaims || typeof authClaims !== "object") {
    return;
  }
  const planType = (authClaims as Record<string, unknown>).chatgpt_plan_type;
  return typeof planType === "string" && planType.trim()
    ? planType.trim()
    : undefined;
}

function normalizeCodexPlanType(planType: string | undefined): string {
  switch ((planType ?? "").trim().toLowerCase()) {
    case "free":
      return "free";
    case "team":
    case "business":
    case "go":
      return "team";
    case "plus":
      return "plus";
    case "pro":
      return "pro";
    default:
      return "pro";
  }
}

function codexOAuthModelsForPlan(
  planType: string | undefined
): ProviderOAuthDiscoveredModel[] {
  const normalized = normalizeCodexPlanType(planType);
  return (
    CODEX_OAUTH_MODELS_BY_PLAN[normalized] ?? CODEX_OAUTH_MODELS_BY_PLAN.pro
  ).map((model) => ({ ...model }));
}

function emailFromIdToken(idToken: string): string | undefined {
  const claims = decodeJwtPayload(idToken);
  const email = claims.email;
  return typeof email === "string" && email.trim() ? email.trim() : undefined;
}

function expiresAtFromSeconds(expiresIn: unknown): number | undefined {
  if (
    typeof expiresIn !== "number" ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0
  ) {
    return;
  }
  return Date.now() + Math.floor(expiresIn * 1000);
}

function oauthCallbackErrorMessage(
  providerLabel: string,
  errorCode: string,
  errorDescription: string | null
): string {
  if (
    errorCode === "access_denied" &&
    errorDescription?.toLowerCase().includes("missing_codex_entitlement")
  ) {
    return "Codex is not enabled for your workspace. Contact your workspace administrator to request access to Codex.";
  }
  if (errorDescription?.trim()) {
    return `${providerLabel} sign-in failed: ${errorDescription.trim()}`;
  }
  return `${providerLabel} sign-in failed: ${errorCode}`;
}

function parseClaudeCodeAndState(code: string): {
  code: string;
  state?: string;
} {
  const parts = code.split("#");
  return {
    code: parts[0]?.trim() ?? "",
    state: parts[1]?.trim() || undefined,
  };
}

async function fetchAntigravityEmail(
  accessToken: string
): Promise<string | undefined> {
  const response = await electronNetFetch(ANTIGRAVITY_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const detail = parseTokenEndpointError(
      await response.text().catch(() => "")
    );
    throw new Error(
      `antigravity userinfo returned ${response.status}: ${detail}`
    );
  }
  const body = (await response.json()) as { email?: unknown };
  return typeof body.email === "string" && body.email.trim()
    ? body.email.trim()
    : undefined;
}

async function onboardAntigravityUser(
  accessToken: string,
  tierId: string
): Promise<string | undefined> {
  const requestBody = {
    metadata: {
      ideType: "ANTIGRAVITY",
      platform: "PLATFORM_UNSPECIFIED",
      pluginType: "GEMINI",
    },
    tierId,
  };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await electronNetFetch(
      `${ANTIGRAVITY_API_ENDPOINT}/${ANTIGRAVITY_API_VERSION}:onboardUser`,
      {
        body: JSON.stringify(requestBody),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Metadata": ANTIGRAVITY_CLIENT_METADATA,
          "Content-Type": "application/json",
          "User-Agent": "google-api-nodejs-client/9.15.1",
          "X-Goog-Api-Client": ANTIGRAVITY_API_CLIENT,
        },
        method: "POST",
      }
    );
    const raw = await response.text();
    if (!response.ok) {
      throw new Error(
        `antigravity onboardUser returned ${response.status}: ${raw.trim()}`
      );
    }
    const body = JSON.parse(raw) as Record<string, unknown>;
    if (
      body.done === true &&
      body.response &&
      typeof body.response === "object"
    ) {
      const project = (body.response as Record<string, unknown>)
        .cloudaicompanionProject;
      if (typeof project === "string" && project.trim()) {
        return project.trim();
      }
      if (project && typeof project === "object") {
        const id = (project as Record<string, unknown>).id;
        if (typeof id === "string" && id.trim()) {
          return id.trim();
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function fetchAntigravityProjectId(
  accessToken: string
): Promise<string | undefined> {
  const response = await electronNetFetch(
    `${ANTIGRAVITY_API_ENDPOINT}/${ANTIGRAVITY_API_VERSION}:loadCodeAssist`,
    {
      body: JSON.stringify({
        metadata: {
          ideType: "ANTIGRAVITY",
          platform: "PLATFORM_UNSPECIFIED",
          pluginType: "GEMINI",
        },
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Metadata": ANTIGRAVITY_CLIENT_METADATA,
        "Content-Type": "application/json",
        "User-Agent": "google-api-nodejs-client/9.15.1",
        "X-Goog-Api-Client": ANTIGRAVITY_API_CLIENT,
      },
      method: "POST",
    }
  );
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(
      `antigravity loadCodeAssist returned ${response.status}: ${raw.trim()}`
    );
  }
  const body = JSON.parse(raw) as Record<string, unknown>;
  const project = body.cloudaicompanionProject;
  if (typeof project === "string" && project.trim()) {
    return project.trim();
  }
  if (project && typeof project === "object") {
    const id = (project as Record<string, unknown>).id;
    if (typeof id === "string" && id.trim()) {
      return id.trim();
    }
  }
  let tierId = "legacy-tier";
  if (Array.isArray(body.allowedTiers)) {
    for (const rawTier of body.allowedTiers) {
      if (!rawTier || typeof rawTier !== "object") {
        continue;
      }
      const tier = rawTier as Record<string, unknown>;
      if (
        tier.isDefault === true &&
        typeof tier.id === "string" &&
        tier.id.trim()
      ) {
        tierId = tier.id.trim();
        break;
      }
    }
  }
  return await onboardAntigravityUser(accessToken, tierId);
}

async function fetchAntigravityUsageSummary(
  accessToken: string
): Promise<ProviderOAuthUsageSummary | undefined> {
  const token = accessToken.trim();
  if (!token) {
    return;
  }
  const response = await electronNetFetch(
    `${ANTIGRAVITY_API_ENDPOINT}/${ANTIGRAVITY_API_VERSION}:loadCodeAssist`,
    {
      body: JSON.stringify({
        metadata: {
          ideType: "ANTIGRAVITY",
          platform: "PLATFORM_UNSPECIFIED",
          pluginType: "GEMINI",
        },
      }),
      headers: antigravityApiHeaders(token),
      method: "POST",
    }
  );
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(
      `antigravity loadCodeAssist returned ${response.status}: ${raw.trim()}`
    );
  }
  const body = JSON.parse(raw) as Record<string, unknown>;
  const paidTier = objectRecord(body.paidTier);
  const paidTierId =
    typeof paidTier?.id === "string" ? paidTier.id.trim() : undefined;
  const credits = paidTier?.availableCredits;
  if (!Array.isArray(credits)) {
    return {
      available: false,
      known: true,
      provider: "antigravity",
      updatedAt: Date.now(),
      ...(paidTierId ? { paidTierId } : {}),
    };
  }
  for (const rawCredit of credits) {
    const credit = objectRecord(rawCredit);
    if (
      !credit ||
      String(credit.creditType ?? "")
        .trim()
        .toUpperCase() !== "GOOGLE_ONE_AI"
    ) {
      continue;
    }
    const creditAmount = floatFromUnknown(credit.creditAmount);
    const minCreditAmount = floatFromUnknown(
      credit.minimumCreditAmountForUsage
    );
    const known = creditAmount != null && minCreditAmount != null;
    return {
      creditType: "GOOGLE_ONE_AI",
      known,
      provider: "antigravity",
      updatedAt: Date.now(),
      ...(creditAmount == null ? {} : { creditAmount }),
      ...(minCreditAmount == null ? {} : { minCreditAmount }),
      ...(known ? { available: creditAmount >= minCreditAmount } : {}),
      ...(paidTierId ? { paidTierId } : {}),
    };
  }
  return {
    available: false,
    known: true,
    provider: "antigravity",
    updatedAt: Date.now(),
    ...(paidTierId ? { paidTierId } : {}),
  };
}

export async function fetchProviderOAuthUsageSummary(
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthUsageSummary | undefined> {
  if (auth.provider !== "antigravity") {
    return;
  }
  return await fetchAntigravityUsageSummary(auth.accessToken);
}

export async function discoverProviderOAuthModels(
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthDiscoveredModel[]> {
  if (auth.provider === "codex") {
    return codexOAuthModelsForPlan(
      auth.planType ??
        (auth.idToken ? codexPlanTypeFromIdToken(auth.idToken) : undefined)
    );
  }
  if (auth.provider === "claude") {
    return CLAUDE_OAUTH_MODELS.map((model) => ({ ...model }));
  }
  if (auth.provider !== "antigravity") {
    return [];
  }
  const token = auth.accessToken.trim();
  if (!token) {
    return [];
  }
  const projectId = normalizeAntigravityProjectId(auth.projectId);
  const payload = projectId ? { project: projectId } : {};
  let lastError = "";
  for (const baseURL of ANTIGRAVITY_MODEL_BASE_URLS) {
    try {
      const response = await electronNetFetch(
        `${baseURL}/${ANTIGRAVITY_API_VERSION}:fetchAvailableModels`,
        {
          body: JSON.stringify(payload),
          headers: antigravityApiHeaders(token, ANTIGRAVITY_USER_AGENT),
          method: "POST",
        }
      );
      const raw = await response.text();
      if (!response.ok) {
        lastError = raw.trim() || response.statusText;
        continue;
      }
      const body = JSON.parse(raw) as Record<string, unknown>;
      const models = objectRecord(body.models);
      if (!models) {
        lastError = "response missing models";
        continue;
      }
      const discovered: ProviderOAuthDiscoveredModel[] = [];
      for (const [modelIdRaw, modelDataRaw] of Object.entries(models)) {
        const id = modelIdRaw.trim();
        if (!id || ANTIGRAVITY_SKIPPED_DYNAMIC_MODELS.has(id)) {
          continue;
        }
        const modelData = objectRecord(modelDataRaw) ?? {};
        const displayName =
          typeof modelData.displayName === "string" &&
          modelData.displayName.trim()
            ? modelData.displayName.trim()
            : id;
        const contextWindowTokens = positiveIntFromUnknown(modelData.maxTokens);
        const maxOutputTokens = positiveIntFromUnknown(
          modelData.maxOutputTokens
        );
        discovered.push({
          displayName,
          id,
          ...(contextWindowTokens == null ? {} : { contextWindowTokens }),
          ...(maxOutputTokens == null ? {} : { maxOutputTokens }),
        });
      }
      discovered.sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { sensitivity: "base" })
      );
      return discovered;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  if (lastError) {
    throw new Error(lastError);
  }
  return [];
}

type CodexTokenResponse = {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type?: string;
  expires_in?: number;
};

type ClaudeTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  account?: { email_address?: string };
};

type AntigravityTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
};

export type ProviderOAuthDiscoveredModel = {
  id: string;
  displayName?: string;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
};

function positiveIntFromUnknown(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
}

function floatFromUnknown(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function antigravityApiHeaders(
  accessToken: string,
  userAgent = "google-api-nodejs-client/9.15.1"
): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Client-Metadata": ANTIGRAVITY_CLIENT_METADATA,
    "Content-Type": "application/json",
    "User-Agent": userAgent,
    "X-Goog-Api-Client": ANTIGRAVITY_API_CLIENT,
  };
}

const LOGIN_CONFIGS: Record<OAuthProviderKind, LoginConfig> = {
  antigravity: {
    buildAuthorizeUrl: ({ redirectUri, state }) => {
      const query = new URLSearchParams({
        access_type: "offline",
        client_id: ANTIGRAVITY_CLIENT_ID,
        prompt: "consent",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: ANTIGRAVITY_SCOPES.join(" "),
        state,
      });
      return `${ANTIGRAVITY_AUTH_URL}?${query.toString()}`;
    },
    callbackPath: "/oauth-callback",
    exchangeCode: async ({ code, redirectUri }) => {
      const body = await postFormJson<AntigravityTokenResponse>(
        ANTIGRAVITY_TOKEN_URL,
        {
          client_id: ANTIGRAVITY_CLIENT_ID,
          client_secret: ANTIGRAVITY_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }
      );
      const accessToken = body.access_token.trim();
      if (!accessToken) {
        throw new Error(
          "Antigravity token exchange returned an empty access token."
        );
      }
      const email = await fetchAntigravityEmail(accessToken);
      const [projectId, usage] = await Promise.all([
        fetchAntigravityProjectId(accessToken),
        fetchAntigravityUsageSummary(accessToken).catch(() => undefined),
      ]);
      const normalizedProjectId = normalizeAntigravityProjectId(projectId);
      if (!normalizedProjectId) {
        throw new Error(antigravityProjectRequiredMessage());
      }
      return {
        accessToken,
        expiresAt: expiresAtFromSeconds(body.expires_in),
        lastRefreshAt: Date.now(),
        provider: "antigravity",
        refreshToken: body.refresh_token ?? "",
        tokenType: body.token_type,
        ...(email ? { email } : {}),
        projectId: normalizedProjectId,
        ...(usage ? { usage } : {}),
      };
    },
    label: "Antigravity",
    port: 51_121,
    provider: "antigravity",
    usesPkce: false,
    windowTitle: "Antigravity Login",
  },
  claude: {
    buildAuthorizeUrl: ({ redirectUri, state, pkce }) => {
      if (!pkce) {
        throw new Error("Claude Code login requires PKCE.");
      }
      const query = new URLSearchParams({
        client_id: CLAUDE_CLIENT_ID,
        code: "true",
        code_challenge: pkce.codeChallenge,
        code_challenge_method: "S256",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: CLAUDE_SCOPE,
        state,
      });
      return `${CLAUDE_AUTH_URL}?${query.toString()}`;
    },
    callbackPath: "/callback",
    exchangeCode: async ({ code, state, pkce }) => {
      if (!pkce) {
        throw new Error("Claude Code token exchange requires PKCE.");
      }
      const parsed = parseClaudeCodeAndState(code);
      const body = await postJson<ClaudeTokenResponse>(CLAUDE_TOKEN_URL, {
        client_id: CLAUDE_CLIENT_ID,
        code: parsed.code,
        code_verifier: pkce.codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:54545/callback",
        state: parsed.state || state,
      });
      const email = body.account?.email_address?.trim();
      return {
        accessToken: body.access_token,
        expiresAt: expiresAtFromSeconds(body.expires_in),
        lastRefreshAt: Date.now(),
        provider: "claude",
        refreshToken: body.refresh_token,
        tokenType: body.token_type,
        ...(email ? { email } : {}),
      };
    },
    label: "Claude Code",
    port: 54_545,
    provider: "claude",
    successPath: "/success",
    usesPkce: true,
    windowTitle: "Claude Code Login",
  },
  codex: {
    buildAuthorizeUrl: ({ redirectUri, state, pkce }) => {
      if (!pkce) {
        throw new Error("Codex login requires PKCE.");
      }
      const query = new URLSearchParams({
        client_id: CODEX_CLIENT_ID,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: "S256",
        codex_cli_simplified_flow: "true",
        id_token_add_organizations: "true",
        prompt: "login",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: CODEX_SCOPE,
        state,
      });
      return `${CODEX_AUTH_URL}?${query.toString()}`;
    },
    callbackPath: "/auth/callback",
    exchangeCode: async ({ code, redirectUri, pkce }) => {
      if (!pkce) {
        throw new Error("Codex token exchange requires PKCE.");
      }
      const body = await postFormJson<CodexTokenResponse>(CODEX_TOKEN_URL, {
        client_id: CODEX_CLIENT_ID,
        code,
        code_verifier: pkce.codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });
      const accountId = codexAccountIdFromIdToken(body.id_token);
      const planType = codexPlanTypeFromIdToken(body.id_token);
      const email = emailFromIdToken(body.id_token);
      return {
        accessToken: body.access_token,
        expiresAt: expiresAtFromSeconds(body.expires_in),
        idToken: body.id_token,
        lastRefreshAt: Date.now(),
        provider: "codex",
        refreshToken: body.refresh_token,
        tokenType: body.token_type,
        ...(accountId ? { accountId } : {}),
        ...(planType ? { planType } : {}),
        ...(email ? { email } : {}),
      };
    },
    label: "Codex",
    port: 1455,
    provider: "codex",
    successPath: "/success",
    usesPkce: true,
    windowTitle: "Codex Login",
  },
};

function htmlPage(title: string, body: string): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return [
    "<!doctype html>",
    '<html><head><meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escape(title)}</title>`,
    "<style>",
    'body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d12;color:#f8fafc}',
    "main{max-width:520px;padding:32px}h1{font-size:22px;margin:0 0 10px}p{color:#cbd5e1;margin:0}",
    "</style></head><body><main>",
    `<h1>${escape(title)}</h1>`,
    `<p>${escape(body)}</p>`,
    "</main></body></html>",
  ].join("");
}

function sendHtml(
  res: http.ServerResponse,
  status: number,
  title: string,
  body: string
): void {
  const html = htmlPage(title, body);
  res.writeHead(status, {
    Connection: "close",
    "Content-Length": Buffer.byteLength(html),
    "Content-Type": "text/html; charset=utf-8",
  });
  res.end(html);
}

function sendRedirect(res: http.ServerResponse, location: string): void {
  res.writeHead(302, {
    Connection: "close",
    "Content-Length": "0",
    Location: location,
  });
  res.end();
}

function oauthCloseWindowMessage(config: LoginConfig): string {
  if (config.provider === "codex") {
    return "You have successfully authenticated with Codex. You can now close this window and return to your terminal to continue.";
  }
  if (config.provider === "claude") {
    return "You have successfully authenticated with Claude. You can now close this window and return to your terminal to continue.";
  }
  return "You can close this window.";
}

function oauthStateMismatchMessage(): string {
  return "State mismatch. Please retry the login.";
}

function oauthSuccessTitle(config: LoginConfig): string {
  if (config.provider === "codex") {
    return "Authentication Successful - Codex";
  }
  if (config.provider === "claude") {
    return "Authentication Successful - Claude";
  }
  return "Login successful";
}

function sendOAuthSuccess(res: http.ServerResponse, config: LoginConfig): void {
  if (config.successPath) {
    sendRedirect(res, config.successPath);
    return;
  }
  sendHtml(
    res,
    200,
    oauthSuccessTitle(config),
    oauthCloseWindowMessage(config)
  );
}

function closeServer(server: http.Server): void {
  try {
    server.close();
  } catch {
    /* ignore */
  }
}

function scheduleCloseServer(server: http.Server, delayMs: number): void {
  if (delayMs > 0) {
    const timer = setTimeout(() => closeServer(server), delayMs);
    timer.unref?.();
    return;
  }
  setImmediate(() => closeServer(server));
}

export function cancelActiveProviderOAuthLogin(
  message = "Login cancelled."
): boolean {
  const cancel = activeLoginCancel;
  if (!cancel) {
    return false;
  }
  return cancel(message);
}

function sendCancelRequest(port: number): Promise<void> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        headers: { Connection: "close" },
        host: "127.0.0.1",
        method: "GET",
        path: "/cancel",
        port,
        timeout: 2000,
      },
      (res) => {
        res.resume();
        res.on("end", resolve);
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve();
    });
    req.on("error", () => resolve());
    req.end();
  });
}

async function listenServer(
  server: http.Server,
  port: number
): Promise<number> {
  const bind = () =>
    new Promise<number>((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.off("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        server.off("error", onError);
        const address = server.address();
        if (address && typeof address === "object") {
          resolve(address.port);
          return;
        }
        reject(new Error("Unable to determine login callback port."));
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, "127.0.0.1");
    });

  let cancelAttempted = false;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await bind();
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE" || cancelAttempted) {
        throw error;
      }
      cancelAttempted = true;
      await sendCancelRequest(port);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Port 127.0.0.1:${port} is already in use.`);
}

export async function runProviderOAuthLogin(options: {
  provider: OAuthProviderKind;
  timeoutMs?: number;
}): Promise<ProviderOAuthAuthRecord> {
  const config = LOGIN_CONFIGS[options.provider];
  const timeoutMs = Math.max(
    30_000,
    options.timeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS
  );
  const pkce = config.usesPkce ? generatePkce() : undefined;
  const state = generateState();
  let actualPort = config.port;
  let settled = false;
  let loginTimeout: ReturnType<typeof setTimeout> | undefined;
  let server!: http.Server;

  let finish!: (value: ProviderOAuthAuthRecord) => void;
  let fail!: (error: Error) => void;
  const completed = new Promise<ProviderOAuthAuthRecord>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });

  const settleOk = (value: ProviderOAuthAuthRecord) => {
    if (settled) {
      return;
    }
    settled = true;
    if (activeLoginCancel === cancelCurrentLogin) {
      activeLoginCancel = undefined;
    }
    if (loginTimeout) {
      clearTimeout(loginTimeout);
      loginTimeout = undefined;
    }
    scheduleCloseServer(server, config.successPath ? 2000 : 0);
    finish(value);
  };
  const settleErr = (error: Error) => {
    if (settled) {
      return;
    }
    settled = true;
    if (activeLoginCancel === cancelCurrentLogin) {
      activeLoginCancel = undefined;
    }
    if (loginTimeout) {
      clearTimeout(loginTimeout);
      loginTimeout = undefined;
    }
    scheduleCloseServer(server, config.successPath ? 2000 : 0);
    fail(error);
  };

  const cancelCurrentLogin: ActiveLoginCancel = (
    message = `${config.label} login cancelled.`
  ) => {
    if (settled) {
      return false;
    }
    settleErr(new Error(message));
    return true;
  };

  server = http.createServer((req, res) => {
    void (async () => {
      const parsed = new URL(req.url ?? "/", `http://localhost:${actualPort}`);
      if (config.successPath && parsed.pathname === config.successPath) {
        sendHtml(
          res,
          200,
          oauthSuccessTitle(config),
          oauthCloseWindowMessage(config)
        );
        return;
      }
      if (parsed.pathname === "/cancel") {
        sendHtml(
          res,
          200,
          `${config.label} login cancelled`,
          "You can close this window."
        );
        settleErr(new Error(`${config.label} login cancelled.`));
        return;
      }
      if (parsed.pathname !== config.callbackPath) {
        sendHtml(
          res,
          404,
          "Not found",
          `This local callback URL is only used for ${config.label} login.`
        );
        return;
      }
      if (parsed.searchParams.get("state") !== state) {
        sendHtml(
          res,
          400,
          `${config.label} login failed`,
          oauthStateMismatchMessage()
        );
        settleErr(new Error("OAuth state mismatch."));
        return;
      }
      const oauthError = parsed.searchParams.get("error");
      if (oauthError) {
        const description = parsed.searchParams.get("error_description");
        const message = oauthCallbackErrorMessage(
          config.label,
          oauthError,
          description
        );
        sendHtml(res, 400, `${config.label} login failed`, message);
        settleErr(new Error(message));
        return;
      }
      const code = parsed.searchParams.get("code")?.trim();
      if (!code) {
        sendHtml(
          res,
          400,
          `${config.label} login failed`,
          "Missing authorization code."
        );
        settleErr(new Error("Missing authorization code."));
        return;
      }
      sendOAuthSuccess(res, config);
      try {
        const redirectUri = `http://localhost:${actualPort}${config.callbackPath}`;
        const auth = await config.exchangeCode({
          code,
          pkce,
          redirectUri,
          state,
        });
        settleOk(auth);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        settleErr(new Error(message));
      }
    })();
  });

  activeLoginCancel?.("Another provider login was started.");
  activeLoginCancel = cancelCurrentLogin;

  try {
    actualPort = await listenServer(server, config.port);
  } catch (error) {
    if (activeLoginCancel === cancelCurrentLogin) {
      activeLoginCancel = undefined;
    }
    closeServer(server);
    throw error;
  }

  loginTimeout = setTimeout(() => {
    settleErr(new Error(`${config.label} login timed out. Please retry.`));
  }, timeoutMs);
  loginTimeout.unref?.();

  const redirectUri = `http://localhost:${actualPort}${config.callbackPath}`;
  const authUrl = config.buildAuthorizeUrl({ pkce, redirectUri, state });

  try {
    await shell.openExternal(authUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    settleErr(
      new Error(`Unable to open browser for ${config.label} login: ${message}`)
    );
  }
  return completed;
}

export function providerOAuthLabel(provider: OAuthProviderKind): string {
  return LOGIN_CONFIGS[provider]?.label ?? provider;
}

async function refreshCodexOAuth(
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthAuthRecord> {
  const body = await postFormJson<CodexTokenResponse>(CODEX_TOKEN_URL, {
    client_id: CODEX_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: auth.refreshToken,
    scope: "openid profile email",
  });
  const idToken = body.id_token || auth.idToken;
  const accountId = idToken
    ? codexAccountIdFromIdToken(idToken)
    : auth.accountId;
  const planType = idToken ? codexPlanTypeFromIdToken(idToken) : auth.planType;
  const email = idToken ? emailFromIdToken(idToken) : auth.email;
  return {
    ...auth,
    accessToken: body.access_token,
    expiresAt: expiresAtFromSeconds(body.expires_in),
    idToken,
    lastRefreshAt: Date.now(),
    refreshToken: body.refresh_token || auth.refreshToken,
    tokenType: body.token_type ?? auth.tokenType,
    ...(accountId ? { accountId } : {}),
    ...(planType ? { planType } : {}),
    ...(email ? { email } : {}),
  };
}

async function refreshClaudeOAuth(
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthAuthRecord> {
  const body = await postJson<ClaudeTokenResponse>(CLAUDE_TOKEN_URL, {
    client_id: CLAUDE_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: auth.refreshToken,
  });
  const email = body.account?.email_address?.trim() || auth.email;
  return {
    ...auth,
    accessToken: body.access_token,
    expiresAt: expiresAtFromSeconds(body.expires_in),
    lastRefreshAt: Date.now(),
    refreshToken: body.refresh_token || auth.refreshToken,
    tokenType: body.token_type ?? auth.tokenType,
    ...(email ? { email } : {}),
  };
}

async function refreshAntigravityOAuth(
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthAuthRecord> {
  const body = await postFormJson<AntigravityTokenResponse>(
    ANTIGRAVITY_TOKEN_URL,
    {
      client_id: ANTIGRAVITY_CLIENT_ID,
      client_secret: ANTIGRAVITY_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    },
    { "User-Agent": "Go-http-client/2.0" }
  );
  const accessToken = body.access_token.trim();
  const existingProjectId =
    normalizeAntigravityProjectId(auth.projectId) || undefined;
  const [projectId, usage] = accessToken
    ? await Promise.all([
        fetchAntigravityProjectId(accessToken).catch((error) => {
          console.warn(
            `[AntigravityProjectDebug] ${JSON.stringify({
              existingProjectLooksSynthetic: isSyntheticAntigravityProjectId(
                auth.projectId
              ),
              hadExistingProjectId: Boolean(existingProjectId),
              message: error instanceof Error ? error.message : String(error),
              phase: "refresh-project-fetch-failed",
            })}`
          );
          return existingProjectId;
        }),
        fetchAntigravityUsageSummary(accessToken).catch(() => auth.usage),
      ])
    : ([existingProjectId, auth.usage] as const);
  const normalizedProjectId = normalizeAntigravityProjectId(projectId);
  return {
    ...auth,
    accessToken,
    expiresAt: expiresAtFromSeconds(body.expires_in),
    lastRefreshAt: Date.now(),
    projectId: normalizedProjectId || undefined,
    refreshToken: body.refresh_token || auth.refreshToken,
    tokenType: body.token_type ?? auth.tokenType,
    ...(usage ? { usage } : {}),
  };
}

export async function refreshProviderOAuthAuth(
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthAuthRecord> {
  if (auth.provider === "codex") {
    return await refreshCodexOAuth(auth);
  }
  if (auth.provider === "claude") {
    return await refreshClaudeOAuth(auth);
  }
  return await refreshAntigravityOAuth(auth);
}

function refreshLeadMs(provider: OAuthProviderKind): number {
  if (provider === "codex") {
    return 5 * 24 * 60 * 60 * 1000;
  }
  if (provider === "claude") {
    return 4 * 60 * 60 * 1000;
  }
  return 5 * 60 * 1000;
}

function persistProviderOAuthAuth(
  providerId: string | undefined,
  auth: ProviderOAuthAuthRecord
): void {
  if (!providerId) {
    return;
  }
  const settings = getSettings();
  const providers = (settings.models?.providers ?? []).map((provider) => {
    if (provider.id !== providerId) {
      return provider;
    }
    const providerIdentity = providerIdentityForOAuthProvider(auth.provider);
    return {
      ...provider,
      apiKey: auth.accessToken,
      oauthAuth: auth,
      ...(providerIdentity ? { providerIdentity } : {}),
      ...(auth.provider === "codex"
        ? {
            codexAuth: {
              accessToken: auth.accessToken,
              idToken: auth.idToken ?? "",
              lastRefreshAt: auth.lastRefreshAt,
              refreshToken: auth.refreshToken,
              ...(auth.accountId ? { accountId: auth.accountId } : {}),
              ...(auth.planType ? { planType: auth.planType } : {}),
            },
          }
        : {}),
    };
  });
  patchSettings({
    models: {
      enabledIds: settings.models?.enabledIds ?? [],
      entries: settings.models?.entries ?? [],
      providers,
      thinkingByModelId: settings.models?.thinkingByModelId ?? {},
    },
  });
}

async function ensureAntigravityProjectIdForRequest(
  providerId: string | undefined,
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthAuthRecord> {
  if (auth.provider !== "antigravity") {
    return auth;
  }
  const currentProjectId = auth.projectId?.trim();
  if (currentProjectId && !isSyntheticAntigravityProjectId(currentProjectId)) {
    return auth;
  }
  const projectId = await fetchAntigravityProjectId(auth.accessToken).catch(
    (error) => {
      console.warn(
        `[AntigravityProjectDebug] ${JSON.stringify({
          hadProjectId: Boolean(currentProjectId),
          message: error instanceof Error ? error.message : String(error),
          phase: "request-project-fetch-failed",
          projectLooksSynthetic:
            isSyntheticAntigravityProjectId(currentProjectId),
          providerId: providerId ?? "",
        })}`
      );
      return undefined;
    }
  );
  const normalizedProjectId = normalizeAntigravityProjectId(projectId ?? undefined);
  if (!normalizedProjectId) {
    const cleaned =
      currentProjectId && isSyntheticAntigravityProjectId(currentProjectId)
        ? { ...auth, projectId: undefined }
        : auth;
    if (cleaned !== auth) {
      persistProviderOAuthAuth(providerId, cleaned);
    }
    throw new Error(antigravityProjectRequiredMessage());
  }
  const enriched = {
    ...auth,
    projectId: normalizedProjectId,
  };
  persistProviderOAuthAuth(providerId, enriched);
  return enriched;
}

export async function ensureFreshOAuthAuthForRequest(
  providerId: string | undefined,
  auth: ProviderOAuthAuthRecord
): Promise<ProviderOAuthAuthRecord> {
  if (!auth.refreshToken.trim() || !auth.expiresAt) {
    return await ensureAntigravityProjectIdForRequest(providerId, auth);
  }
  if (auth.expiresAt - Date.now() > refreshLeadMs(auth.provider)) {
    return await ensureAntigravityProjectIdForRequest(providerId, auth);
  }
  const refreshed = await refreshProviderOAuthAuth(auth);
  persistProviderOAuthAuth(providerId, refreshed);
  return await ensureAntigravityProjectIdForRequest(providerId, refreshed);
}
