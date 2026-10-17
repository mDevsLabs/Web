export type ProviderIdentityPreset =
  | "mai-default"
  | "async-default"
  | "antigravity"
  | "claude-code"
  | "codex"
  | "custom"
  | "inherit";

export type ProviderIdentitySettings = {
  preset?: ProviderIdentityPreset;
  userAgentProduct?: string;
  entrypoint?: string;
  appHeaderValue?: string;
  clientAppValue?: string;
  systemPromptPrefix?: string;
};

export type ResolvedProviderIdentitySettings = {
  preset: ProviderIdentityPreset;
  userAgentMode: "generic" | "antigravity" | "claude-code" | "codex";
  userAgentProduct: string;
  entrypoint: string;
  appHeaderValue: string;
  clientAppValue: string;
  sessionHeaderName: string;
  systemPromptPrefix: string;
  anthropicMetadataMode: "mai" | "claude-code";
  /** Optional value for the upstream `originator` header (used by Codex). */
  originatorHeaderValue?: string;
};

export const PROVIDER_IDENTITY_VERSION_PREVIEW = "<version>";
export const PROVIDER_IDENTITY_SESSION_PREVIEW = "<runtime-session-id>";
export const PROVIDER_IDENTITY_DEVICE_ID_PREVIEW = "<device-id>";

export const CLAUDE_CODE_EMULATED_VERSION = "2.1.63";
export const CODEX_EMULATED_VERSION = "0.118.0";
export const ANTIGRAVITY_EMULATED_VERSION = "1.21.9";
/**
 * CLIProxyAPI's Codex executor defaults to the Codex TUI fingerprint:
 * `codex-tui/0.118.0 (...)` plus `Originator: codex-tui`.
 */
export const CODEX_ORIGINATOR = "codex-tui";
export const ANTIGRAVITY_USER_AGENT = `antigravity/${ANTIGRAVITY_EMULATED_VERSION} darwin/arm64`;

const MAI_DEFAULT_IDENTITY: ResolvedProviderIdentitySettings = {
  anthropicMetadataMode: "mai",
  appHeaderValue: "desktop",
  clientAppValue: "mai-coder",
  entrypoint: "desktop",
  preset: "mai-default",
  sessionHeaderName: "X-Mai-Session-Id",
  systemPromptPrefix:
    "You are mAI Coder, the AI coding assistant running inside mAI Coder.",
  userAgentMode: "generic",
  userAgentProduct: "mai-coder",
};
// Alias pour compatibilité ascendante
export const ASYNC_DEFAULT_IDENTITY = MAI_DEFAULT_IDENTITY;

const CLAUDE_CODE_IDENTITY: ResolvedProviderIdentitySettings = {
  anthropicMetadataMode: "claude-code",
  appHeaderValue: "cli",
  clientAppValue: "",
  entrypoint: "cli",
  preset: "claude-code",
  sessionHeaderName: "X-Claude-Code-Session-Id",
  systemPromptPrefix:
    "You are Claude Code, Anthropic's official CLI for Claude.",
  userAgentMode: "claude-code",
  userAgentProduct: "claude-cli",
};

const CODEX_IDENTITY: ResolvedProviderIdentitySettings = {
  anthropicMetadataMode: "mai",
  // CLIProxyAPI's Codex executor doesn't send `x-app` / `x-client-app`. We keep these fields
  // because they're required by the shared shape, but leave them blank so
  // the identity-headers builder skips them.
  appHeaderValue: "",
  clientAppValue: "",
  entrypoint: "cli",
  originatorHeaderValue: CODEX_ORIGINATOR,
  preset: "codex",
  // CLIProxyAPI sets Session_id on Mac-like Codex-TUI requests at runtime;
  // this shared preset leaves the generic session header empty.
  sessionHeaderName: "",
  systemPromptPrefix:
    "You are a coding agent running in the Codex CLI, a terminal-based coding assistant. Codex CLI is an open source project led by OpenAI. You are expected to be precise, safe, and helpful.",
  userAgentMode: "codex",
  userAgentProduct: CODEX_ORIGINATOR,
};

const ANTIGRAVITY_IDENTITY: ResolvedProviderIdentitySettings = {
  anthropicMetadataMode: "mai",
  appHeaderValue: "",
  clientAppValue: "",
  entrypoint: "desktop",
  preset: "antigravity",
  sessionHeaderName: "",
  systemPromptPrefix:
    "You are Antigravity, a powerful agentic AI coding assistant designed by the Google Deepmind team working on Advanced Agentic Coding.",
  userAgentMode: "antigravity",
  userAgentProduct: "antigravity",
};

function cleanToken(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || fallback;
}

function isPreset(value: unknown): value is ProviderIdentityPreset {
  return (
    value === "mai-default" ||
    value === "async-default" ||
    value === "antigravity" ||
    value === "claude-code" ||
    value === "codex" ||
    value === "custom" ||
    value === "inherit"
  );
}

function inferPreset(
  raw?: ProviderIdentitySettings | null
): ProviderIdentityPreset {
  if (isPreset(raw?.preset)) {
    if (raw?.preset === "async-default") {
      return "mai-default";
    }
    return raw.preset;
  }
  const legacyValues = {
    appHeaderValue: cleanToken(
      raw?.appHeaderValue,
      MAI_DEFAULT_IDENTITY.appHeaderValue
    ),
    clientAppValue: cleanToken(
      raw?.clientAppValue,
      MAI_DEFAULT_IDENTITY.clientAppValue
    ),
    entrypoint: cleanToken(raw?.entrypoint, MAI_DEFAULT_IDENTITY.entrypoint),
    systemPromptPrefix: cleanToken(
      raw?.systemPromptPrefix,
      MAI_DEFAULT_IDENTITY.systemPromptPrefix
    ),
    userAgentProduct: cleanToken(
      raw?.userAgentProduct,
      MAI_DEFAULT_IDENTITY.userAgentProduct
    ),
  };
  const matchesAsyncDefault =
    legacyValues.userAgentProduct === MAI_DEFAULT_IDENTITY.userAgentProduct &&
    legacyValues.entrypoint === MAI_DEFAULT_IDENTITY.entrypoint &&
    legacyValues.appHeaderValue === MAI_DEFAULT_IDENTITY.appHeaderValue &&
    legacyValues.clientAppValue === MAI_DEFAULT_IDENTITY.clientAppValue &&
    legacyValues.systemPromptPrefix === MAI_DEFAULT_IDENTITY.systemPromptPrefix;
  if (matchesAsyncDefault) {
    return "mai-default";
  }
  const matchesClaudeCode =
    legacyValues.userAgentProduct === CLAUDE_CODE_IDENTITY.userAgentProduct &&
    legacyValues.entrypoint === CLAUDE_CODE_IDENTITY.entrypoint &&
    legacyValues.appHeaderValue === CLAUDE_CODE_IDENTITY.appHeaderValue &&
    legacyValues.clientAppValue === CLAUDE_CODE_IDENTITY.clientAppValue &&
    legacyValues.systemPromptPrefix === CLAUDE_CODE_IDENTITY.systemPromptPrefix;
  if (matchesClaudeCode) {
    return "claude-code";
  }
  const matchesAntigravity =
    legacyValues.userAgentProduct === ANTIGRAVITY_IDENTITY.userAgentProduct &&
    legacyValues.entrypoint === ANTIGRAVITY_IDENTITY.entrypoint &&
    legacyValues.appHeaderValue === ANTIGRAVITY_IDENTITY.appHeaderValue &&
    legacyValues.clientAppValue === ANTIGRAVITY_IDENTITY.clientAppValue &&
    legacyValues.systemPromptPrefix === ANTIGRAVITY_IDENTITY.systemPromptPrefix;
  if (matchesAntigravity) {
    return "antigravity";
  }
  const matchesCodex =
    legacyValues.userAgentProduct === CODEX_IDENTITY.userAgentProduct &&
    legacyValues.entrypoint === CODEX_IDENTITY.entrypoint &&
    legacyValues.appHeaderValue === CODEX_IDENTITY.appHeaderValue &&
    legacyValues.clientAppValue === CODEX_IDENTITY.clientAppValue &&
    legacyValues.systemPromptPrefix === CODEX_IDENTITY.systemPromptPrefix;
  if (matchesCodex) {
    return "codex";
  }
  return "custom";
}

export function defaultProviderIdentitySettings(): ProviderIdentitySettings {
  return {
    appHeaderValue: CLAUDE_CODE_IDENTITY.appHeaderValue,
    clientAppValue: CLAUDE_CODE_IDENTITY.clientAppValue,
    entrypoint: CLAUDE_CODE_IDENTITY.entrypoint,
    preset: "claude-code",
    systemPromptPrefix: CLAUDE_CODE_IDENTITY.systemPromptPrefix,
    userAgentProduct: CLAUDE_CODE_IDENTITY.userAgentProduct,
  };
}

export function resolveProviderIdentitySettings(
  raw?: ProviderIdentitySettings | null
): ResolvedProviderIdentitySettings {
  const preset = inferPreset(raw);
  if (preset === "claude-code") {
    return { ...CLAUDE_CODE_IDENTITY };
  }
  if (preset === "antigravity") {
    return { ...ANTIGRAVITY_IDENTITY };
  }
  if (preset === "codex") {
    return { ...CODEX_IDENTITY };
  }
  if (preset === "custom") {
    return {
      anthropicMetadataMode: "mai",
      appHeaderValue: cleanToken(
        raw?.appHeaderValue,
        MAI_DEFAULT_IDENTITY.appHeaderValue
      ),
      clientAppValue: cleanToken(
        raw?.clientAppValue,
        MAI_DEFAULT_IDENTITY.clientAppValue
      ),
      entrypoint: cleanToken(raw?.entrypoint, MAI_DEFAULT_IDENTITY.entrypoint),
      preset,
      sessionHeaderName: MAI_DEFAULT_IDENTITY.sessionHeaderName,
      systemPromptPrefix: cleanToken(
        raw?.systemPromptPrefix,
        MAI_DEFAULT_IDENTITY.systemPromptPrefix
      ),
      userAgentMode: "generic",
      userAgentProduct: cleanToken(
        raw?.userAgentProduct,
        MAI_DEFAULT_IDENTITY.userAgentProduct
      ),
    };
  }
  if (preset === "async-default") {
    return {
      ...MAI_DEFAULT_IDENTITY,
      preset: "mai-default" as ProviderIdentityPreset,
    };
  }
  return { ...MAI_DEFAULT_IDENTITY };
}

/**
 * Resolve the effective identity for a per-provider override falling back to global.
 *
 * - If `override` is undefined or its `preset` is `'inherit'`, return the global resolution.
 * - Otherwise, resolve the override directly.
 */
export function resolveProviderIdentityWithOverride(
  global: ProviderIdentitySettings | null | undefined,
  override: ProviderIdentitySettings | null | undefined
): ResolvedProviderIdentitySettings {
  if (
    !override ||
    override.preset === "inherit" ||
    override.preset === undefined
  ) {
    return resolveProviderIdentitySettings(global);
  }
  return resolveProviderIdentitySettings(override);
}

export function providerIdentityPresetOptions(): Array<{
  id: ProviderIdentityPreset;
  userAgentMode: "generic" | "antigravity" | "claude-code" | "codex";
  label: string;
}> {
  return [
    { id: "mai-default", label: "mAI Coder", userAgentMode: "generic" },
    { id: "claude-code", label: "Claude Code", userAgentMode: "claude-code" },
    { id: "codex", label: "Codex CLI", userAgentMode: "codex" },
    { id: "antigravity", label: "Antigravity", userAgentMode: "antigravity" },
    { id: "custom", label: "Custom", userAgentMode: "generic" },
  ];
}

export function formatResolvedProviderIdentityUserAgent(
  settings: ResolvedProviderIdentitySettings,
  version = PROVIDER_IDENTITY_VERSION_PREVIEW,
  _opts?: { claudeCodeUserType?: string }
): string {
  if (settings.userAgentMode === "claude-code") {
    // CLIProxyAPI default Claude Code fingerprint.
    return `claude-cli/${CLAUDE_CODE_EMULATED_VERSION} (external, cli)`;
  }
  if (settings.userAgentMode === "codex") {
    return `${CODEX_ORIGINATOR}/${version} (Mac OS 26.3.1; arm64) iTerm.app/3.6.9 (${CODEX_ORIGINATOR}; ${version})`;
  }
  if (settings.userAgentMode === "antigravity") {
    return ANTIGRAVITY_USER_AGENT;
  }
  const parts = [settings.entrypoint];
  if (settings.clientAppValue.trim()) {
    parts.push(`client-app/${settings.clientAppValue}`);
  }
  return `${settings.userAgentProduct}/${version} (${parts.join(", ")})`;
}

export function buildProviderIdentityPreview(
  raw?: ProviderIdentitySettings | null
): {
  preset: ProviderIdentityPreset;
  userAgent: string;
  headers: Array<[string, string]>;
  anthropicUserId: string;
  systemPromptPrefix: string;
} {
  const settings = resolveProviderIdentitySettings(raw);
  const headers: Array<[string, string]> = [
    ["User-Agent", formatResolvedProviderIdentityUserAgent(settings)],
  ];
  if (settings.appHeaderValue.trim()) {
    headers.push(["x-app", settings.appHeaderValue]);
  }
  if (settings.clientAppValue.trim()) {
    headers.push(["x-client-app", settings.clientAppValue]);
  }
  if (settings.originatorHeaderValue) {
    headers.push(["originator", settings.originatorHeaderValue]);
  }
  if (settings.sessionHeaderName.trim()) {
    headers.push([
      settings.sessionHeaderName,
      PROVIDER_IDENTITY_SESSION_PREVIEW,
    ]);
  }
  return {
    anthropicUserId:
      settings.anthropicMetadataMode === "claude-code"
        ? JSON.stringify({
            account_uuid: "",
            device_id: PROVIDER_IDENTITY_DEVICE_ID_PREVIEW,
            session_id: PROVIDER_IDENTITY_SESSION_PREVIEW,
          })
        : JSON.stringify({
            client_app: settings.clientAppValue,
            entrypoint: settings.entrypoint,
            session_id: PROVIDER_IDENTITY_SESSION_PREVIEW,
            version: PROVIDER_IDENTITY_VERSION_PREVIEW,
          }),
    headers,
    preset: settings.preset,
    systemPromptPrefix: settings.systemPromptPrefix,
    userAgent: formatResolvedProviderIdentityUserAgent(settings),
  };
}
