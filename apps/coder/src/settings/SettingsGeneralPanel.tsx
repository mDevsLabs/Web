import type { TFunction } from "../i18n";
import type {
  ProviderIdentityPreset,
  ProviderIdentitySettings,
} from "../providerIdentitySettings";
import { VoidSelect } from "../VoidSelect";

export interface SettingsGeneralPanelProps {
  t: TFunction;
  maiAccount?: {
    jwtToken?: string;
    user?: {
      avatarUrl?: string;
      email?: string;
      tier?: string;
      username?: string;
    };
    usage?: {
      limit: number;
      tokensUsed: number;
    };
  } | null;
  onOpenMaiAccount?: () => void;
  patchProviderIdentity: (patch: Partial<ProviderIdentitySettings>) => void;
  resolvedProviderIdentity: ProviderIdentitySettings;
  providerIdentityPreview: {
    anthropicUserId: string;
    headers: [string, string][];
    userAgent: string;
  };
}

export function SettingsGeneralPanel({
  t,
  maiAccount,
  onOpenMaiAccount,
  patchProviderIdentity,
  resolvedProviderIdentity,
  providerIdentityPreview,
}: SettingsGeneralPanelProps) {
  return (
    <div className="ref-settings-panel">
      <p className="ref-settings-lead">
        {t("settings.general.lead1")}
        <strong>{t("settings.general.leadBold1")}</strong>
        {t("settings.general.lead2")}
        <strong>{t("settings.general.leadBold2")}</strong>
        {t("settings.general.lead3")}
      </p>
      <div className="ref-settings-field ref-settings-field--language">
        <span>{t("settings.language")}</span>
        <p className="ref-settings-proxy-hint">{t("settings.languageHint")}</p>
        <div
          aria-label={t("settings.language")}
          className="ref-settings-language-fixed"
        >
          {t("settings.languageFr")}
        </div>
      </div>

      {/* Section Compte mAI & Usage */}
      <section className="ref-settings-section">
        <h2 className="ref-settings-subhead">{t("mai.accountTitle")}</h2>
        <div className="ref-settings-agent-card">
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 12,
              }}
            >
              {maiAccount?.user?.avatarUrl ? (
                <img
                  alt="Avatar"
                  src={maiAccount.user.avatarUrl}
                  style={{
                    borderRadius: "50%",
                    height: 44,
                    objectFit: "cover",
                    width: 44,
                  }}
                />
              ) : (
                <div
                  style={{
                    alignItems: "center",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    borderRadius: "50%",
                    color: "#fff",
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 700,
                    height: 44,
                    justifyContent: "center",
                    width: 44,
                  }}
                >
                  {maiAccount?.user?.username
                    ? maiAccount.user.username.charAt(0).toUpperCase()
                    : "m"}
                </div>
              )}
              <div>
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {maiAccount?.user?.username ||
                      (maiAccount?.jwtToken
                        ? "Utilisateur mAI"
                        : t("mai.notConnected"))}
                  </span>
                  {maiAccount?.user?.tier ? (
                    <span
                      style={{
                        background: "rgba(59, 130, 246, 0.2)",
                        borderRadius: 4,
                        color: "#60a5fa",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        textTransform: "uppercase",
                      }}
                    >
                      {maiAccount.user.tier}
                    </span>
                  ) : null}
                </div>
                <div
                  style={{
                    color: "var(--fg-muted, #a1a1aa)",
                    fontSize: 12,
                  }}
                >
                  {maiAccount?.user?.email ||
                    "Authentification via https://mai.val.run"}
                </div>
              </div>
            </div>

            {onOpenMaiAccount ? (
              <button
                onClick={onOpenMaiAccount}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "6px 12px",
                }}
                type="button"
              >
                {maiAccount?.jwtToken ? "Gérer le compte" : t("mai.login")}
              </button>
            ) : null}
          </div>

          {maiAccount?.usage ? (
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                marginTop: 16,
                paddingTop: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span>{t("mai.usage")}</span>
                <span style={{ fontWeight: 600 }}>
                  {new Intl.NumberFormat("fr-FR").format(
                    maiAccount.usage.tokensUsed
                  )}{" "}
                  /{" "}
                  {new Intl.NumberFormat("fr-FR").format(
                    maiAccount.usage.limit
                  )}{" "}
                  tokens
                </span>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 3,
                  height: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#3b82f6",
                    borderRadius: 3,
                    height: "100%",
                    width: `${Math.min(100, Math.round((maiAccount.usage.tokensUsed / (maiAccount.usage.limit || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="ref-settings-section">
        <h2 className="ref-settings-subhead">
          {t("settings.general.identityTitle")}
        </h2>
        <div className="ref-settings-agent-card">
          <div className="ref-settings-agent-card-title">
            {t("settings.general.identityTitle")}
          </div>
          <p className="ref-settings-agent-card-desc" style={{ marginTop: 8 }}>
            {t("settings.general.identityLead")}
          </p>

          <div className="ref-settings-field" style={{ marginTop: 18 }}>
            <span>{t("settings.general.identityPreset")}</span>
            <VoidSelect
              ariaLabel={t("settings.general.identityPreset")}
              onChange={(next) =>
                patchProviderIdentity({
                  preset: next as ProviderIdentityPreset,
                })
              }
              options={[
                {
                  label: t("settings.general.identityPreset.mai"),
                  value: "async-default",
                },
                {
                  label: t("settings.general.identityPreset.claudeCode"),
                  value: "claude-code",
                },
                {
                  label: t("settings.general.identityPreset.codex"),
                  value: "codex",
                },
                {
                  label: t("settings.general.identityPreset.antigravity"),
                  value: "antigravity",
                },
                {
                  label: t("settings.general.identityPreset.custom"),
                  value: "custom",
                },
              ]}
              value={resolvedProviderIdentity.preset ?? "custom"}
            />
            <p className="ref-settings-field-hint">
              {t("settings.general.identityPresetHint")}
            </p>
          </div>

          {resolvedProviderIdentity.preset === "custom" ? (
            <>
              <div className="ref-settings-field">
                <span>{t("settings.general.identityUserAgentProduct")}</span>
                <input
                  onChange={(event) =>
                    patchProviderIdentity({
                      userAgentProduct: event.target.value,
                    })
                  }
                  spellCheck={false}
                  type="text"
                  value={resolvedProviderIdentity.userAgentProduct}
                />
                <p className="ref-settings-field-hint">
                  {t("settings.general.identityUserAgentProductHint")}
                </p>
              </div>

              <div className="ref-settings-field">
                <span>{t("settings.general.identityEntrypoint")}</span>
                <input
                  onChange={(event) =>
                    patchProviderIdentity({
                      entrypoint: event.target.value,
                    })
                  }
                  spellCheck={false}
                  type="text"
                  value={resolvedProviderIdentity.entrypoint}
                />
                <p className="ref-settings-field-hint">
                  {t("settings.general.identityEntrypointHint")}
                </p>
              </div>

              <div className="ref-settings-field">
                <span>{t("settings.general.identityAppHeader")}</span>
                <input
                  onChange={(event) =>
                    patchProviderIdentity({
                      appHeaderValue: event.target.value,
                    })
                  }
                  spellCheck={false}
                  type="text"
                  value={resolvedProviderIdentity.appHeaderValue}
                />
              </div>

              <div className="ref-settings-field">
                <span>{t("settings.general.identityClientApp")}</span>
                <input
                  onChange={(event) =>
                    patchProviderIdentity({
                      clientAppValue: event.target.value,
                    })
                  }
                  spellCheck={false}
                  type="text"
                  value={resolvedProviderIdentity.clientAppValue}
                />
                <p className="ref-settings-field-hint">
                  {t("settings.general.identityClientAppHint")}
                </p>
              </div>

              <div className="ref-settings-field">
                <span>{t("settings.general.identitySystemPromptText")}</span>
                <textarea
                  onChange={(event) =>
                    patchProviderIdentity({
                      systemPromptPrefix: event.target.value,
                    })
                  }
                  spellCheck={false}
                  value={resolvedProviderIdentity.systemPromptPrefix}
                />
                <p className="ref-settings-field-hint">
                  {t("settings.general.identitySystemPromptTextHint")}
                </p>
              </div>
            </>
          ) : (
            <p className="ref-settings-field-hint" style={{ marginTop: 4 }}>
              {resolvedProviderIdentity.preset === "claude-code"
                ? t("settings.general.identityPresetClaudeCodeHint")
                : resolvedProviderIdentity.preset === "codex"
                  ? t("settings.general.identityPresetCodexHint")
                  : resolvedProviderIdentity.preset === "antigravity"
                    ? t("settings.general.identityPresetAntigravityHint")
                    : t("settings.general.identityPresetAsyncHint")}
            </p>
          )}
        </div>

        <div className="ref-settings-agent-card" style={{ marginTop: -8 }}>
          <div className="ref-settings-agent-card-title">
            {t("settings.general.identityPreview")}
          </div>
          <p className="ref-settings-agent-card-desc" style={{ marginTop: 8 }}>
            {t("settings.general.identityPreviewHint")}
          </p>
          <div className="ref-settings-field-hint" style={{ marginTop: 14 }}>
            <div>
              <strong>User-Agent:</strong>{" "}
              <code className="ref-settings-code">
                {providerIdentityPreview.userAgent}
              </code>
            </div>
            {providerIdentityPreview.headers
              .filter(([name]) => name !== "User-Agent")
              .map(([name, value]) => (
                <div key={name}>
                  <strong>{name}:</strong>{" "}
                  <code className="ref-settings-code">{value}</code>
                </div>
              ))}
            <div>
              <strong>Anthropic metadata.user_id:</strong>{" "}
              <code className="ref-settings-code">
                {providerIdentityPreview.anthropicUserId}
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
