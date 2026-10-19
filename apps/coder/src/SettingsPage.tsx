import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { AgentCustomization, TeamSettings } from "./agentSettingsTypes";
import type { AppAppearanceSettings } from "./appearanceSettings";
import type { BotIntegrationConfig } from "./botSettingsTypes";
import type { AppColorMode, ThemeTransitionOrigin } from "./colorMode";
import type { EditorSettings } from "./EditorSettingsPanel";
import { type AppLocale, useI18n } from "./i18n";
import type { McpServerConfig, McpServerStatus } from "./mcpTypes";
import type { UserLlmProvider, UserModelEntry } from "./modelCatalog";
import {
  buildProviderIdentityPreview,
  type ProviderIdentitySettings,
  resolveProviderIdentitySettings,
} from "./providerIdentitySettings";
import { IconBack, navIcon } from "./settings/SettingsIcons";
import { SettingsGeneralPanel } from "./settings/SettingsGeneralPanel";
import { SettingsModelsPanel } from "./settings/SettingsModelsPanel";


const SettingsAgentPanel = lazy(() =>
  import("./SettingsAgentPanel").then((m) => ({
    default: m.SettingsAgentPanel,
  }))
);
const SettingsAgentBehaviorPanel = lazy(() =>
  import("./SettingsAgentBehaviorPanel").then((m) => ({
    default: m.SettingsAgentBehaviorPanel,
  }))
);
const EditorSettingsPanel = lazy(() =>
  import("./EditorSettingsPanel").then((m) => ({
    default: m.EditorSettingsPanel,
  }))
);
const SettingsIndexingPanel = lazy(() =>
  import("./SettingsIndexingPanel").then((m) => ({
    default: m.SettingsIndexingPanel,
  }))
);
const SettingsMcpPanel = lazy(() =>
  import("./SettingsMcpPanel").then((m) => ({ default: m.SettingsMcpPanel }))
);
const SettingsAppearancePanel = lazy(() =>
  import("./SettingsAppearancePanel").then((m) => ({
    default: m.SettingsAppearancePanel,
  }))
);
const SettingsUsageStatsPanel = lazy(() =>
  import("./SettingsUsageStatsPanel").then((m) => ({
    default: m.SettingsUsageStatsPanel,
  }))
);
const SettingsAutoUpdatePanel = lazy(() =>
  import("./SettingsAutoUpdatePanel").then((m) => ({
    default: m.SettingsAutoUpdatePanel,
  }))
);
const SettingsTeamPanel = lazy(() =>
  import("./SettingsTeamPanel").then((m) => ({ default: m.SettingsTeamPanel }))
);
const SettingsBotsPanel = lazy(() =>
  import("./SettingsBotsPanel").then((m) => ({ default: m.SettingsBotsPanel }))
);
const SettingsBrowserPanel = lazy(() =>
  import("./SettingsBrowserPanel").then((m) => ({
    default: m.SettingsBrowserPanel,
  }))
);
const SettingsPluginsPanel = lazy(() =>
  import("./SettingsPluginsPanel").then((m) => ({
    default: m.SettingsPluginsPanel,
  }))
);

export type SettingsNavId =
  | "general"
  | "appearance"
  | "editor"
  | "plan"
  | "team"
  | "bots"
  | "agents"
  | "models"
  | "plugins"
  | "rules"
  | "tools"
  | "indexing"
  | "autoUpdate"
  | "browser";

/** 与 `app:requestOpenSettings` 白名单及侧栏顺序对齐，供运行时校验导航 id */
export const ALL_SETTINGS_NAV_IDS: SettingsNavId[] = [
  "general",
  "appearance",
  "editor",
  "models",
  "plugins",
  "agents",
  "bots",
  "rules",
  "indexing",
  "autoUpdate",
  "browser",
  "tools",
  "plan",
  "team",
];

type NavItem = { id: SettingsNavId; label: string };

function navItemsForT(t: (key: string) => string): NavItem[] {
  return [
    { id: "general", label: t("settings.nav.general") },
    { id: "appearance", label: t("settings.nav.appearance") },
    { id: "editor", label: t("settings.nav.editor") },
    { id: "models", label: t("settings.nav.models") },
    { id: "plugins", label: t("settings.nav.plugins") },
    { id: "agents", label: t("settings.nav.agents") },
    { id: "bots", label: t("settings.nav.bots") },
    { id: "rules", label: t("settings.nav.rules") },
    { id: "indexing", label: t("settings.nav.indexing") },
    { id: "autoUpdate", label: t("settings.nav.autoUpdate") },
    { id: "browser", label: t("settings.nav.browser") },
    { id: "tools", label: t("settings.nav.tools") },
    { id: "plan", label: t("settings.nav.plan") },
    { id: "team", label: t("settings.nav.team") },
  ];
}

const SETTINGS_SIDEBAR_KEY = "mai-coder:settings-sidebar-w-v1";
const SETTINGS_SIDEBAR_DEFAULT = 260;
const SETTINGS_SIDEBAR_MIN = 200;
const SETTINGS_SIDEBAR_MAX = 480;

function readSettingsSidebarWidth(): number {
  try {
    if (typeof window === "undefined") {
      return SETTINGS_SIDEBAR_DEFAULT;
    }
    const raw = localStorage.getItem(SETTINGS_SIDEBAR_KEY);
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n)) {
        return clampSettingsSidebarWidth(n);
      }
    }
  } catch {
    /* ignore */
  }
  return SETTINGS_SIDEBAR_DEFAULT;
}

function clampSettingsSidebarWidth(w: number): number {
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const maxByViewport = Math.max(SETTINGS_SIDEBAR_MIN + 20, vw - 360);
  const cap = Math.min(SETTINGS_SIDEBAR_MAX, maxByViewport);
  return Math.min(Math.max(w, SETTINGS_SIDEBAR_MIN), cap);
}

function SettingsPanelSkeleton() {
  return (
    <div aria-hidden className="ref-settings-skeleton">
      <div className="ref-settings-skeleton-line ref-settings-skeleton-line--title" />
      <div className="ref-settings-skeleton-card">
        <div className="ref-settings-skeleton-line ref-settings-skeleton-line--short" />
        <div className="ref-settings-skeleton-line" />
        <div className="ref-settings-skeleton-line" />
        <div className="ref-settings-skeleton-line ref-settings-skeleton-line--short" />
      </div>
      <div className="ref-settings-skeleton-card">
        <div className="ref-settings-skeleton-line ref-settings-skeleton-line--medium" />
        <div className="ref-settings-skeleton-line" />
        <div className="ref-settings-skeleton-line ref-settings-skeleton-line--short" />
      </div>
    </div>
  );
}

type Props = {
  onClose: () => void;
  initialNav: SettingsNavId;
  defaultModel: string;
  modelProviders: UserLlmProvider[];
  modelEntries: UserModelEntry[];
  providerIdentity: ProviderIdentitySettings;
  onChangeModelProviders: (providers: UserLlmProvider[]) => void;
  onChangeModelEntries: (entries: UserModelEntry[]) => void;
  onChangeProviderIdentity: (next: ProviderIdentitySettings) => void;
  onPickDefaultModel: (id: string) => void;
  agentCustomization: AgentCustomization;
  onChangeAgentCustomization: (v: AgentCustomization) => void;
  teamSettings: TeamSettings;
  onChangeTeamSettings: (v: TeamSettings) => void;
  botIntegrations: BotIntegrationConfig[];
  onChangeBotIntegrations: (v: BotIntegrationConfig[]) => void;
  /** 打开 Skill Creator：新建对话并发送引导消息 */
  onOpenSkillCreator?: () => void | Promise<void>;
  /** 在编辑器中打开工作区内的 SKILL.md（设置里磁盘技能卡片） */
  onOpenWorkspaceSkillFile?: (relPath: string) => void | Promise<void>;
  /** 删除磁盘上的技能目录（SKILL.md 相对路径）；成功返回 true */
  onDeleteWorkspaceSkillDisk?: (skillMdRelPath: string) => Promise<boolean>;
  /** 重新扫描磁盘技能（工作区 + 全局） */
  onRefreshDiskSkills?: () => void;
  editorSettings: EditorSettings;
  onChangeEditorSettings: (v: EditorSettings) => void;
  /** 语言切换后立即持久化（与关闭设置页时的全量保存配合） */
  onPersistLanguage?: (locale: AppLocale) => void;
  /** MCP 服务器配置 */
  mcpServers: McpServerConfig[];
  onChangeMcpServers: (servers: McpServerConfig[]) => void;
  mcpStatuses: McpServerStatus[];
  onRefreshMcpStatuses: () => void;
  onStartMcpServer: (id: string) => void;
  onStopMcpServer: (id: string) => void;
  onRestartMcpServer: (id: string) => void;
  shell: NonNullable<Window["maiShell"]> | null;
  workspaceOpen: boolean;
  colorMode: AppColorMode;
  onChangeColorMode: (
    next: AppColorMode,
    origin?: ThemeTransitionOrigin
  ) => void | Promise<void>;
  /** 当前有效亮/暗，用于外观「恢复默认」与内置主题对齐 */
  effectiveColorScheme: "light" | "dark";
  appearanceSettings: AppAppearanceSettings;
  onChangeAppearanceSettings: (
    next: AppAppearanceSettings
  ) => void | Promise<void>;
  showTransientToast?: (ok: boolean, text: string, durationMs?: number) => void;
  maiAccount?: import("./ipcTypes").MaiAccountState;
  onOpenMaiAccount?: () => void;
};

export type SettingsPageProps = Props;

export function SettingsPage({
  onClose,
  initialNav,
  defaultModel,
  modelProviders,
  modelEntries,
  providerIdentity,
  onChangeModelProviders,
  onChangeModelEntries,
  onChangeProviderIdentity,
  onPickDefaultModel,
  agentCustomization,
  onChangeAgentCustomization,
  teamSettings,
  onChangeTeamSettings,
  botIntegrations,
  onChangeBotIntegrations,
  onOpenSkillCreator,
  onOpenWorkspaceSkillFile,
  onDeleteWorkspaceSkillDisk,
  onRefreshDiskSkills,
  editorSettings,
  onChangeEditorSettings,
  onPersistLanguage: _onPersistLanguage,
  mcpServers,
  onChangeMcpServers,
  mcpStatuses,
  onRefreshMcpStatuses,
  onStartMcpServer,
  onStopMcpServer,
  onRestartMcpServer,
  shell,
  workspaceOpen,
  colorMode,
  onChangeColorMode,
  effectiveColorScheme,
  appearanceSettings,
  onChangeAppearanceSettings,
  showTransientToast: _showTransientToast,
  maiAccount,
  onOpenMaiAccount,
}: Props) {
  const { t, locale, setLocale: _setLocale } = useI18n();
  const navItems = useMemo(() => navItemsForT(t), [t]);
  const [nav, setNav] = useState<SettingsNavId>(initialNav);
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    readSettingsSidebarWidth()
  );
  const [navPending, startNavTransition] = useTransition();
  const resolvedProviderIdentity = useMemo(
    () => resolveProviderIdentitySettings(providerIdentity),
    [providerIdentity]
  );
  const providerIdentityPreview = useMemo(
    () => buildProviderIdentityPreview(providerIdentity),
    [providerIdentity]
  );

  const beginResizeSidebar = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = sidebarWidth;
      const onMove = (ev: MouseEvent) => {
        const next = clampSettingsSidebarWidth(startW + (ev.clientX - startX));
        setSidebarWidth(next);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setSidebarWidth((w) => {
          const c = clampSettingsSidebarWidth(w);
          try {
            localStorage.setItem(SETTINGS_SIDEBAR_KEY, String(c));
          } catch {
            /* ignore */
          }
          return c;
        });
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [sidebarWidth]
  );

  const resetSidebarWidth = useCallback(() => {
    const w = clampSettingsSidebarWidth(SETTINGS_SIDEBAR_DEFAULT);
    setSidebarWidth(w);
    try {
      localStorage.setItem(SETTINGS_SIDEBAR_KEY, String(w));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    startNavTransition(() => {
      setNav(initialNav);
    });
  }, [initialNav, startNavTransition]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onResize = () => setSidebarWidth((w) => clampSettingsSidebarWidth(w));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // Q6 : à chaque visite de la page Compte (nav==='general'), rafraîchir l'usage mAI via API
    if (nav === "general" && shell) {
      void shell.invoke("mai:refreshUsage").catch(() => {});
    }
  }, [nav, shell]);

  const patchProviderIdentity = useCallback(
    (patch: Partial<ProviderIdentitySettings>) => {
      onChangeProviderIdentity({
        ...providerIdentity,
        ...patch,
      });
    },
    [providerIdentity, onChangeProviderIdentity]
  );

  return (
    <div
      aria-label={t("settings.dialogAria")}
      aria-modal="true"
      className="ref-settings-root"
      role="dialog"
    >
      <div className="ref-settings-layout">
        <aside className="ref-settings-sidebar" style={{ width: sidebarWidth }}>
          <div className="ref-settings-sidebar-tools">
            <button
              aria-label={t("common.back")}
              className="ref-settings-icon-btn ref-settings-back-btn"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              title={t("common.back")}
              type="button"
            >
              <IconBack />
              <span className="ref-settings-back-btn-label">
                {t("common.back")}
              </span>
            </button>
          </div>
          <nav aria-label={t("settings.navAria")} className="ref-settings-nav">
            {navItems.map((item) => (
              <button
                className={`ref-settings-nav-row ${nav === item.id ? "is-active" : ""}`}
                key={item.id}
                onClick={() => {
                  startNavTransition(() => {
                    setNav(item.id);
                  });
                }}
                type="button"
              >
                <span className="ref-settings-nav-ico">{navIcon(item.id)}</span>
                <span className="ref-settings-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div
          aria-label={t("settings.resizeSidebarAria")}
          aria-orientation="vertical"
          className="ref-settings-resize-handle"
          onDoubleClick={resetSidebarWidth}
          onMouseDown={beginResizeSidebar}
          role="separator"
          title={t("settings.resizeSidebarTitle")}
        />

        <div className="ref-settings-main">
          <div className="ref-settings-main-inner">
            <div className="ref-settings-nav-swap" key={nav}>
              <div className="ref-settings-main-head">
                <h1 className="ref-settings-title">
                  {nav === "general" ? t("settings.title.general") : null}
                  {nav === "appearance" ? t("settings.title.appearance") : null}
                  {nav === "agents" ? t("settings.title.agents") : null}
                  {nav === "models" ? t("settings.title.models") : null}
                  {nav === "rules" ? t("settings.title.rules") : null}
                  {nav === "editor" ? t("settings.title.editor") : null}
                  {nav === "tools" ? t("settings.title.tools") : null}
                  {nav === "indexing" ? t("settings.title.indexing") : null}
                  {nav === "autoUpdate" ? t("settings.title.autoUpdate") : null}
                  {nav === "browser" ? t("settings.title.browser") : null}
                  {nav === "plan" ? t("settings.title.usage") : null}
                  {nav === "team" ? t("settings.title.team") : null}
                  {nav === "bots" ? t("settings.title.bots") : null}
                  {nav === "plugins" ? t("settings.title.plugins") : null}
                </h1>
                {navPending ? (
                  <div
                    aria-live="polite"
                    className="ref-settings-nav-loading"
                    role="status"
                  >
                    <span
                      aria-hidden
                      className="ref-settings-nav-loading-spinner"
                    />
                    <span>{t("common.loading")}</span>
                  </div>
                ) : null}
              </div>

              {nav === "general" ? (
                <SettingsGeneralPanel
                  maiAccount={maiAccount}
                  onOpenMaiAccount={onOpenMaiAccount}
                  patchProviderIdentity={patchProviderIdentity}
                  providerIdentityPreview={providerIdentityPreview}
                  resolvedProviderIdentity={resolvedProviderIdentity}
                  t={t}
                />
              ) : null}

              {nav === "appearance" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsAppearancePanel
                    appearance={appearanceSettings}
                    effectiveColorScheme={effectiveColorScheme}
                    onChange={onChangeColorMode}
                    onChangeAppearance={onChangeAppearanceSettings}
                    value={colorMode}
                  />
                </Suspense>
              ) : null}

              {nav === "agents" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsAgentBehaviorPanel
                    onChange={onChangeAgentCustomization}
                    value={agentCustomization}
                  />
                </Suspense>
              ) : null}

              {nav === "bots" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsBotsPanel
                    modelEntries={modelEntries}
                    onChange={onChangeBotIntegrations}
                    shell={shell}
                    value={botIntegrations}
                  />
                </Suspense>
              ) : null}

              {nav === "models" ? (
                <SettingsModelsPanel
                  defaultModel={defaultModel}
                  locale={locale}
                  modelEntries={modelEntries}
                  modelProviders={modelProviders}
                  onChangeModelEntries={onChangeModelEntries}
                  onChangeModelProviders={onChangeModelProviders}
                  onPickDefaultModel={onPickDefaultModel}
                  providerIdentity={providerIdentity}
                  shell={shell}
                  t={t}
                />
              ) : null}

              {nav === "rules" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsAgentPanel
                    locale={locale}
                    onChange={onChangeAgentCustomization}
                    onDeleteWorkspaceSkillDisk={onDeleteWorkspaceSkillDisk}
                    onOpenSkillCreator={onOpenSkillCreator}
                    onOpenWorkspaceSkillFile={onOpenWorkspaceSkillFile}
                    onRefreshDiskSkills={onRefreshDiskSkills}
                    value={agentCustomization}
                    workspaceOpen={workspaceOpen}
                  />
                </Suspense>
              ) : null}

              {nav === "editor" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <EditorSettingsPanel
                    onChange={onChangeEditorSettings}
                    value={editorSettings}
                  />
                </Suspense>
              ) : null}

              {nav === "indexing" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsIndexingPanel
                    agentCustomization={agentCustomization}
                    onChangeAgentCustomization={onChangeAgentCustomization}
                    shell={shell}
                    workspaceOpen={workspaceOpen}
                  />
                </Suspense>
              ) : null}

              {nav === "autoUpdate" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsAutoUpdatePanel shell={shell} />
                </Suspense>
              ) : null}

              {nav === "browser" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsBrowserPanel shell={shell} />
                </Suspense>
              ) : null}

              {nav === "plan" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsUsageStatsPanel
                    modelEntries={modelEntries}
                    modelProviders={modelProviders}
                    shell={shell}
                  />
                </Suspense>
              ) : null}
              {nav === "team" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsTeamPanel
                    modelEntries={modelEntries}
                    modelProviders={modelProviders}
                    onChange={onChangeTeamSettings}
                    value={teamSettings}
                  />
                </Suspense>
              ) : null}

              {nav === "tools" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsMcpPanel
                    onChangeServers={onChangeMcpServers}
                    onRefreshStatuses={onRefreshMcpStatuses}
                    onRestartServer={onRestartMcpServer}
                    onStartServer={onStartMcpServer}
                    onStopServer={onStopMcpServer}
                    servers={mcpServers}
                    shell={shell}
                    statuses={mcpStatuses}
                  />
                </Suspense>
              ) : null}

              {nav === "plugins" ? (
                <Suspense fallback={<SettingsPanelSkeleton />}>
                  <SettingsPluginsPanel
                    shell={shell}
                    workspaceOpen={workspaceOpen}
                  />
                </Suspense>
              ) : null}

              {nav !== "general" &&
              nav !== "appearance" &&
              nav !== "agents" &&
              nav !== "bots" &&
              nav !== "models" &&
              nav !== "rules" &&
              nav !== "editor" &&
              nav !== "tools" &&
              nav !== "indexing" &&
              nav !== "autoUpdate" &&
              nav !== "browser" &&
              nav !== "plan" &&
              nav !== "team" &&
              nav !== "plugins" ? (
                <div className="ref-settings-panel">
                  <p className="ref-settings-lead">
                    {t("settings.comingCategory")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
