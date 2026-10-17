import { memo } from "react";
import "../styles/editor-layout.css";
import { BrandLogo } from "../BrandLogo";
import type { TFunction } from "../i18n";
import {
  IconBarChart,
  IconCloudOutline,
  IconExplorer,
  IconServerOutline,
  IconSparkles,
  IconUser,
} from "../icons";

function workspacePathDisplayName(full: string): string {
  const norm = full.replace(/\\/g, "/");
  const parts = norm.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? full;
}

function workspacePathParent(full: string): string {
  const norm = full.replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  if (i <= 0) {
    return "";
  }
  return norm.slice(0, i);
}

export type AppWorkspaceWelcomeProps = {
  t: TFunction;
  homeRecents: string[];
  onOpenWorkspacePicker: () => void;
  onOpenWorkspacePath: (path: string) => void;
  maiAccount?: import("../ipcTypes").MaiAccountState;
  onOpenMaiAccount?: () => void;
};

/** 未打开工作区时的欢迎页（Agent / Editor 共用），独立 memo 避免主壳其它状态更新时整页 reconcile */
export const AppWorkspaceWelcome = memo(function AppWorkspaceWelcome({
  t,
  homeRecents,
  onOpenWorkspacePicker,
  onOpenWorkspacePath,
  maiAccount,
  onOpenMaiAccount,
}: AppWorkspaceWelcomeProps) {
  const isLoggedIn = Boolean(maiAccount?.jwtToken);
  const user = maiAccount?.user;
  const usage = maiAccount?.usage;
  const tokensUsed = usage?.tokensUsed ?? 0;
  const limit = usage?.limit ?? 5_000_000;
  const usagePercent = Math.min(
    100,
    Math.round((tokensUsed / (limit || 1)) * 100)
  );
  const formattedTokens = new Intl.NumberFormat("fr-FR").format(tokensUsed);
  const formattedLimit = new Intl.NumberFormat("fr-FR").format(limit);

  const resetDateStr = usage?.resetAt
    ? new Date(usage.resetAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
      })
    : undefined;

  return (
    <div
      className="ref-body ref-body--editor-home"
      style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
    >
      <main
        aria-label={t("app.editorWelcomeAria")}
        className="ref-editor-welcome"
      >
        <div className="ref-editor-welcome-inner">
          {/* Account & Usage Foreground Card */}
          {onOpenMaiAccount ? (
            <section
              className="ref-welcome-account-banner"
              onClick={onOpenMaiAccount}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenMaiAccount();
                }
              }}
              role="button"
              style={{
                alignItems: "center",
                background: isLoggedIn
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)"
                  : "rgba(255, 255, 255, 0.03)",
                border: isLoggedIn
                  ? "1px solid rgba(99, 102, 241, 0.3)"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                cursor: "pointer",
                display: "flex",
                gap: 16,
                justifyContent: "space-between",
                padding: "14px 20px",
                transition: "all 0.2s ease",
              }}
              tabIndex={0}
            >
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  flex: 1,
                  gap: 14,
                  minWidth: 0,
                }}
              >
                {isLoggedIn ? (
                  user?.avatarUrl ? (
                    <img
                      alt={user.username || "Avatar"}
                      src={user.avatarUrl}
                      style={{
                        borderRadius: "50%",
                        flexShrink: 0,
                        height: 40,
                        objectFit: "cover",
                        width: 40,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        alignItems: "center",
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        borderRadius: "50%",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
                        color: "#fff",
                        display: "flex",
                        flexShrink: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        height: 40,
                        justifyContent: "center",
                        width: 40,
                      }}
                    >
                      {(user?.username || "M").charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      alignItems: "center",
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "50%",
                      color: "var(--fg-muted, #a1a1aa)",
                      display: "flex",
                      flexShrink: 0,
                      height: 40,
                      justifyContent: "center",
                      width: 40,
                    }}
                  >
                    <IconUser />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      alignItems: "center",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--void-fg-0, #fff)",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {isLoggedIn
                        ? user?.username || "Utilisateur mAI"
                        : "Compte mAI Coder"}
                    </span>
                    {isLoggedIn && user?.tier ? (
                      <span
                        style={{
                          background:
                            user.tier === "Pro" || user.tier === "Max"
                              ? "#3b82f6"
                              : "rgba(255,255,255,0.12)",
                          borderRadius: 999,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          padding: "2px 8px",
                          textTransform: "uppercase",
                        }}
                      >
                        {user.tier}
                      </span>
                    ) : null}
                    {isLoggedIn ? null : (
                      <span
                        style={{
                          color: "var(--fg-muted, #a1a1aa)",
                          fontSize: 12,
                        }}
                      >
                        (Non connecté)
                      </span>
                    )}
                  </div>

                  {isLoggedIn && usage ? (
                    <div style={{ marginTop: 6, maxWidth: 440 }}>
                      <div
                        style={{
                          alignItems: "center",
                          display: "flex",
                          fontSize: 12,
                          gap: 8,
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "var(--fg-muted, #a1a1aa)" }}>
                          {formattedTokens} / {formattedLimit} tokens
                        </span>
                        <span
                          style={{
                            color:
                              usagePercent > 85
                                ? "#ef4444"
                                : usagePercent > 70
                                  ? "#f59e0b"
                                  : "#60a5fa",
                            fontWeight: 600,
                          }}
                        >
                          {usagePercent}% utilisé
                        </span>
                      </div>
                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          borderRadius: 3,
                          height: 5,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            background:
                              usagePercent > 90
                                ? "#ef4444"
                                : usagePercent > 70
                                  ? "#f59e0b"
                                  : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                            borderRadius: 3,
                            height: "100%",
                            transition: "width 0.3s ease",
                            width: `${usagePercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "var(--fg-muted, #a1a1aa)",
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {isLoggedIn
                        ? "Consultez votre consommation et gérez votre forfait"
                        : "Connectez-vous pour débloquer les modèles et suivre votre consommation"}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  flexShrink: 0,
                  gap: 8,
                }}
              >
                {resetDateStr && isLoggedIn ? (
                  <span
                    style={{
                      color: "var(--fg-muted, #a1a1aa)",
                      display: "none",
                      fontSize: 11,
                    }}
                  >
                    Reset: {resetDateStr}
                  </span>
                ) : null}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMaiAccount();
                  }}
                  style={{
                    alignItems: "center",
                    background: isLoggedIn
                      ? "rgba(255, 255, 255, 0.08)"
                      : "linear-gradient(135deg, #3b82f6, #2563eb)",
                    border: isLoggedIn
                      ? "1px solid rgba(255, 255, 255, 0.12)"
                      : "none",
                    borderRadius: 8,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    fontSize: 12,
                    fontWeight: 600,
                    gap: 6,
                    padding: "7px 14px",
                  }}
                  type="button"
                >
                  {isLoggedIn ? (
                    <span
                      style={{
                        alignItems: "center",
                        display: "inline-flex",
                        gap: 6,
                      }}
                    >
                      Détails de l&apos;usage <IconBarChart />
                    </span>
                  ) : (
                    <span
                      style={{
                        alignItems: "center",
                        display: "inline-flex",
                        gap: 6,
                      }}
                    >
                      Se connecter <IconSparkles />
                    </span>
                  )}
                </button>
              </div>
            </section>
          ) : null}

          <section className="ref-editor-launchpad">
            <div className="ref-editor-welcome-brand">
              <BrandLogo className="ref-editor-welcome-logo" size={44} />
              <div className="ref-editor-welcome-brand-text">
                <span className="ref-editor-welcome-wordmark">mAI Coder</span>
                <span className="ref-editor-welcome-tagline">
                  {t("app.editorWelcomeTagline")}
                </span>
              </div>
            </div>
            <div
              aria-label={t("app.editorWelcomeActionsAria")}
              className="ref-editor-welcome-actions"
              role="group"
            >
              <button
                className="ref-welcome-action-card ref-welcome-action-card--primary"
                onClick={onOpenWorkspacePicker}
                type="button"
              >
                <span aria-hidden className="ref-welcome-action-icon">
                  <IconExplorer />
                </span>
                <span className="ref-welcome-action-copy">
                  <span className="ref-welcome-action-label">
                    {t("app.welcomeOpenProject")}
                  </span>
                  <span className="ref-welcome-action-subtitle">
                    {t("app.welcomeOpenProjectHint")}
                  </span>
                </span>
              </button>
              <button
                className="ref-welcome-action-card ref-welcome-action-card--soon"
                disabled
                title={t("app.comingSoon")}
                type="button"
              >
                <span aria-hidden className="ref-welcome-action-icon">
                  <IconCloudOutline />
                </span>
                <span className="ref-welcome-action-copy">
                  <span className="ref-welcome-action-label">
                    {t("app.welcomeCloneRepo")}
                  </span>
                  <span className="ref-welcome-action-subtitle">
                    {t("app.welcomeCloneRepoHint")}
                  </span>
                </span>
              </button>
              <button
                className="ref-welcome-action-card ref-welcome-action-card--soon"
                disabled
                title={t("app.comingSoon")}
                type="button"
              >
                <span aria-hidden className="ref-welcome-action-icon">
                  <IconServerOutline />
                </span>
                <span className="ref-welcome-action-copy">
                  <span className="ref-welcome-action-label">
                    {t("app.welcomeConnectSsh")}
                  </span>
                  <span className="ref-welcome-action-subtitle">
                    {t("app.welcomeConnectSshHint")}
                  </span>
                </span>
              </button>
            </div>
          </section>
          <section
            aria-labelledby="ref-welcome-recents-title"
            className="ref-editor-welcome-recents ref-editor-welcome-panel"
          >
            <div className="ref-editor-welcome-recents-head">
              <h2
                className="ref-editor-welcome-recents-title"
                id="ref-welcome-recents-title"
              >
                {t("app.recentProjects")}
              </h2>
              <button
                className="ref-welcome-view-all"
                onClick={onOpenWorkspacePicker}
                type="button"
              >
                {t("app.viewAllRecents", { count: String(homeRecents.length) })}
              </button>
            </div>
            {homeRecents.length === 0 ? (
              <p className="ref-editor-welcome-recents-empty muted">
                {t("app.noRecentsYet")}
              </p>
            ) : (
              <div className="ref-editor-welcome-recents-list" role="list">
                {homeRecents.slice(0, 6).map((p) => (
                  <button
                    className="ref-welcome-recent-card"
                    key={p}
                    onClick={() => void onOpenWorkspacePath(p)}
                    role="listitem"
                    title={p}
                    type="button"
                  >
                    <span aria-hidden className="ref-welcome-recent-card-icon">
                      <IconExplorer />
                    </span>
                    <span className="ref-welcome-recent-card-copy">
                      <span className="ref-welcome-recent-card-name">
                        {workspacePathDisplayName(p)}
                      </span>
                      <span className="ref-welcome-recent-card-path muted">
                        {workspacePathParent(p) || "—"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
});
