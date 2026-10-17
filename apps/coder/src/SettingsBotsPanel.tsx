import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { AgentSkill } from "./agentSettingsTypes";
import {
  type BotIntegrationConfig,
  type BotPlatform,
  createEmptyBotIntegration,
} from "./botSettingsTypes";
import { type TFunction, useI18n } from "./i18n";
import type { UserModelEntry } from "./modelCatalog";
import { VoidSelect } from "./VoidSelect";

type Props = {
  value: BotIntegrationConfig[];
  onChange: (next: BotIntegrationConfig[]) => void;
  modelEntries: UserModelEntry[];
  shell: NonNullable<Window["maiShell"]> | null;
};

type EditorMode = "create" | "edit";
type BotConnectionUiState =
  | { status: "loading" }
  | { status: "done"; ok: boolean; message: string };

const PLATFORM_META: Record<BotPlatform, { accent: string }> = {
  discord: { accent: "#5865f2" },
  feishu: { accent: "#00c2b8" },
  slack: { accent: "#e01e5a" },
  telegram: { accent: "#2aabee" },
};

const platformImageByPlatform: Record<BotPlatform, string> = {
  discord: new URL("../resources/icons/discord_icon.png", import.meta.url).href,
  feishu: new URL("../resources/icons/feishu_icon.png", import.meta.url).href,
  slack: new URL("../resources/icons/slack_icon.png", import.meta.url).href,
  telegram: new URL("../resources/icons/telegram_icon.png", import.meta.url)
    .href,
};

function linesFromText(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function textFromLines(lines: string[] | undefined): string {
  return (lines ?? []).join("\n");
}

function newBotSkill(): AgentSkill {
  return {
    content: "",
    description: "",
    enabled: true,
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `bot-skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    slug: "",
  };
}

function platformProxyValue(item: BotIntegrationConfig): string {
  switch (item.platform) {
    case "telegram":
      return item.telegram?.proxyUrl ?? "";
    case "slack":
      return item.slack?.proxyUrl ?? "";
    case "discord":
      return item.discord?.proxyUrl ?? "";
    case "feishu":
      return item.feishu?.proxyUrl ?? "";
    default:
      return "";
  }
}

function patchPlatformProxy(
  item: BotIntegrationConfig,
  proxyUrl: string
): BotIntegrationConfig {
  switch (item.platform) {
    case "telegram":
      return { ...item, telegram: { ...(item.telegram ?? {}), proxyUrl } };
    case "slack":
      return { ...item, slack: { ...(item.slack ?? {}), proxyUrl } };
    case "discord":
      return { ...item, discord: { ...(item.discord ?? {}), proxyUrl } };
    case "feishu":
      return { ...item, feishu: { ...(item.feishu ?? {}), proxyUrl } };
    default:
      return item;
  }
}

function platformLabel(platform: BotPlatform, t: TFunction): string {
  return t(`settings.bots.platform.${platform}.label`);
}

function platformDescription(platform: BotPlatform, t: TFunction): string {
  return t(`settings.bots.platform.${platform}.description`);
}

function platformAddHint(platform: BotPlatform, t: TFunction): string {
  return t(`settings.bots.platform.${platform}.addHint`);
}

function platformTip(platform: BotPlatform, t: TFunction): string {
  return t(`settings.bots.platform.${platform}.tip`);
}

function ensurePlatformShape(
  item: BotIntegrationConfig,
  platform: BotPlatform
): BotIntegrationConfig {
  const next: BotIntegrationConfig = {
    ...item,
    allowedReplyChatIds: item.allowedReplyChatIds ?? [],
    allowedReplyUserIds: item.allowedReplyUserIds ?? [],
    discord: item.discord ?? {
      allowedChannelIds: [],
      requireMentionInGuilds: true,
    },
    feishu: item.feishu
      ? {
          ...item.feishu,
          allowedChatIds: item.feishu.allowedChatIds ?? [],
          streamingCard: item.feishu.streamingCard ?? true,
        }
      : { allowedChatIds: [], streamingCard: true },
    platform,
    skills: (item.skills ?? []).map((skill) => ({ ...skill })),
    slack: item.slack ?? { allowedChannelIds: [] },
    telegram: item.telegram ?? {
      allowedChatIds: [],
      requireMentionInGroups: true,
    },
  };
  if (
    platform === "telegram" &&
    next.telegram?.requireMentionInGroups === undefined
  ) {
    next.telegram = { ...(next.telegram ?? {}), requireMentionInGroups: true };
  }
  if (
    platform === "discord" &&
    next.discord?.requireMentionInGuilds === undefined
  ) {
    next.discord = { ...(next.discord ?? {}), requireMentionInGuilds: true };
  }
  return next;
}

function cloneIntegration(item: BotIntegrationConfig): BotIntegrationConfig {
  return ensurePlatformShape(
    {
      ...item,
      allowedReplyChatIds: [...(item.allowedReplyChatIds ?? [])],
      allowedReplyUserIds: [...(item.allowedReplyUserIds ?? [])],
      discord: item.discord
        ? {
            ...item.discord,
            allowedChannelIds: [...(item.discord.allowedChannelIds ?? [])],
          }
        : undefined,
      feishu: item.feishu
        ? {
            ...item.feishu,
            allowedChatIds: [...(item.feishu.allowedChatIds ?? [])],
            streamingCard: item.feishu.streamingCard ?? true,
          }
        : undefined,
      skills: (item.skills ?? []).map((skill) => ({ ...skill })),
      slack: item.slack
        ? {
            ...item.slack,
            allowedChannelIds: [...(item.slack.allowedChannelIds ?? [])],
          }
        : undefined,
      telegram: item.telegram
        ? {
            ...item.telegram,
            allowedChatIds: [...(item.telegram.allowedChatIds ?? [])],
          }
        : undefined,
    },
    item.platform
  );
}

function createBotForPlatform(
  platform: BotPlatform,
  t: TFunction
): BotIntegrationConfig {
  return ensurePlatformShape(
    {
      ...createEmptyBotIntegration(),
      defaultMode: "agent",
      enabled: true,
      name: `${platformLabel(platform, t)} ${t("settings.nav.bots")}`,
      platform,
    },
    platform
  );
}

function countAllowedChats(item: BotIntegrationConfig): number {
  return item.allowedReplyChatIds?.length ?? 0;
}

function countAllowedUsers(item: BotIntegrationConfig): number {
  return item.allowedReplyUserIds?.length ?? 0;
}

function countEnabledSkills(item: BotIntegrationConfig): number {
  return (item.skills ?? []).filter(
    (skill) => skill.enabled !== false && skill.content?.trim()
  ).length;
}

function modelLabel(
  modelId: string | undefined,
  modelEntries: UserModelEntry[],
  t: TFunction
): string {
  if (!modelId) {
    return t("settings.bots.option.notSet");
  }
  const entry = modelEntries.find((item) => item.id === modelId);
  return entry?.displayName.trim() || entry?.requestName || modelId;
}

function botCardSummary(
  item: BotIntegrationConfig,
  t: TFunction
): { chats: string; users: string; prompt: string; skills: string } {
  const chatCount = countAllowedChats(item);
  const userCount = countAllowedUsers(item);
  const skillCount = countEnabledSkills(item);
  return {
    chats:
      chatCount > 0
        ? t("settings.bots.summary.groupsScoped", { count: chatCount })
        : t("settings.bots.summary.groupsAll"),
    prompt: item.systemPrompt?.trim()
      ? t("settings.bots.summary.promptCustom")
      : t("settings.bots.summary.promptDefault"),
    skills:
      skillCount > 0
        ? t("settings.bots.summary.skillsConfigured", { count: skillCount })
        : t("settings.bots.summary.skillsEmpty"),
    users:
      userCount > 0
        ? t("settings.bots.summary.usersScoped", { count: userCount })
        : t("settings.bots.summary.usersAll"),
  };
}

function platformIcon(platform: BotPlatform): ReactNode {
  return (
    <img
      alt=""
      aria-hidden
      className="ref-settings-bot-platform-image"
      draggable={false}
      src={platformImageByPlatform[platform]}
    />
  );
}

function formatDurationShort(ms: number, language: "en" | "zh-CN"): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (language === "en") {
    if (hours >= 1) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
  if (hours >= 1) return `${hours} 小时 ${minutes} 分`;
  return `${minutes} 分钟`;
}

type FeishuAuthSectionProps = {
  t: TFunction;
  draft: BotIntegrationConfig;
  onChangeDraft: (next: BotIntegrationConfig) => void;
  shell: NonNullable<Window["maiShell"]>;
};

function FeishuAuthSection({
  t,
  draft,
  onChangeDraft,
  shell,
}: FeishuAuthSectionProps) {
  const { locale } = useI18n();
  const language: "en" | "zh-CN" = locale === "en" ? "en" : "zh-CN";
  const [callbackUrls, setCallbackUrls] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>("");
  const [, forceTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = (await shell.invoke("feishu:getCallbackUrls")) as
          | { urls?: string[] }
          | undefined;
        if (!cancelled && Array.isArray(r?.urls)) {
          setCallbackUrls(r!.urls!);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shell]);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const expiresAt = draft.feishu?.userAccessTokenExpiresAt ?? 0;
  const hasToken = Boolean(draft.feishu?.userAccessToken);
  const now = Date.now();
  const expired = hasToken && expiresAt > 0 && expiresAt < now;
  const remaining = expiresAt > now ? expiresAt - now : 0;
  const authorizedName = draft.feishu?.userAuthorizedName?.trim() ?? "";
  const canAuthorize = Boolean(
    draft.feishu?.appId?.trim() && draft.feishu?.appSecret?.trim()
  );

  let statusText = t("settings.bots.feishuAuth.none");
  if (hasToken) {
    if (expired) {
      statusText = t("settings.bots.feishuAuth.expired");
    } else {
      const duration =
        remaining > 0 ? formatDurationShort(remaining, language) : "?";
      statusText = authorizedName
        ? t("settings.bots.feishuAuth.activeAs", {
            duration,
            name: authorizedName,
          })
        : t("settings.bots.feishuAuth.active", { duration });
    }
  }

  const handleAuthorize = async () => {
    setError("");
    setRunning(true);
    try {
      const result = (await shell.invoke("feishu:runOauth", {
        integrationId: draft.id,
      })) as {
        ok?: boolean;
        expiresAtMs?: number;
        openId?: string;
        name?: string;
        error?: string;
        message?: string;
      };
      if (result?.ok) {
        const fresh = (await shell.invoke("settings:get")) as
          | { bots?: { integrations?: BotIntegrationConfig[] } }
          | undefined;
        const updated = (fresh?.bots?.integrations ?? []).find(
          (i) => i.id === draft.id
        );
        if (updated) {
          onChangeDraft({ ...draft, feishu: { ...(updated.feishu ?? {}) } });
        }
      } else {
        setError(
          t("settings.bots.feishuAuth.error", {
            message: result?.message ?? result?.error ?? "unknown",
          })
        );
      }
    } catch (e) {
      setError(
        t("settings.bots.feishuAuth.error", {
          message: e instanceof Error ? e.message : String(e),
        })
      );
    } finally {
      setRunning(false);
    }
  };

  const handleCancel = async () => {
    try {
      await shell.invoke("feishu:cancelOauth", { integrationId: draft.id });
    } catch {
      /* ignore */
    }
    setRunning(false);
  };

  const handleDisconnect = async () => {
    try {
      await shell.invoke("feishu:disconnect", { integrationId: draft.id });
      onChangeDraft({
        ...draft,
        feishu: {
          ...(draft.feishu ?? {}),
          userAccessToken: "",
          userAccessTokenExpiresAt: 0,
          userAuthorizedName: "",
          userAuthorizedOpenId: "",
          userRefreshToken: "",
        },
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="ref-settings-field" style={{ gridColumn: "1 / -1" }}>
      <span>{t("settings.bots.field.feishuAuth")}</span>
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
            background:
              hasToken && !expired
                ? "rgba(34,197,94,0.15)"
                : "rgba(148,163,184,0.15)",
            borderRadius: 6,
            color:
              hasToken && !expired
                ? "#16a34a"
                : expired
                  ? "#dc2626"
                  : "#64748b",
            fontSize: 12,
            padding: "2px 8px",
          }}
        >
          {statusText}
        </span>
        {running ? (
          <>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              {t("settings.bots.feishuAuth.buttonRunning")}
            </span>
            <button
              className="ref-settings-bot-modal-btn is-ghost"
              onClick={handleCancel}
              type="button"
            >
              {t("settings.bots.feishuAuth.cancel")}
            </button>
          </>
        ) : (
          <button
            className="ref-settings-bot-modal-btn is-primary"
            disabled={!canAuthorize}
            onClick={handleAuthorize}
            type="button"
          >
            {t("settings.bots.feishuAuth.button")}
          </button>
        )}
        {hasToken && !running ? (
          <button
            className="ref-settings-bot-modal-btn is-ghost"
            onClick={handleDisconnect}
            type="button"
          >
            {t("settings.bots.feishuAuth.disconnect")}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="ref-settings-field-hint" style={{ color: "#dc2626" }}>
          {error}
        </p>
      ) : null}
      <p className="ref-settings-field-hint">
        {t("settings.bots.feishuAuth.hintIntro")}
        <br />
        {callbackUrls.map((url) => (
          <code key={url} style={{ display: "block", fontSize: 11 }}>
            {url}
          </code>
        ))}
      </p>
      <p className="ref-settings-field-hint">
        {t("settings.bots.feishuAuth.hintScopes")}
      </p>
    </div>
  );
}

type BotEditorModalProps = {
  t: TFunction;
  mode: EditorMode;
  draft: BotIntegrationConfig;
  modelEntries: UserModelEntry[];
  shell: NonNullable<Window["maiShell"]> | null;
  onChangeDraft: (next: BotIntegrationConfig) => void;
  onClose: () => void;
  onSave: () => void;
};

function BotEditorModal(props: BotEditorModalProps) {
  const {
    t,
    mode,
    draft,
    modelEntries,
    shell,
    onChangeDraft,
    onClose,
    onSave,
  } = props;
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [importingSkill, setImportingSkill] = useState(false);
  const modelOptions = useMemo(
    () =>
      [{ label: t("settings.bots.option.notSet"), value: "" }].concat(
        modelEntries.map((item) => ({
          label: item.displayName.trim() || item.requestName || item.id,
          value: item.id,
        }))
      ),
    [modelEntries, t]
  );
  const meta = PLATFORM_META[draft.platform];

  useEffect(() => {
    const timer = window.setTimeout(() => firstInputRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const patchDraft = (patch: Partial<BotIntegrationConfig>) =>
    onChangeDraft({ ...draft, ...patch });
  const patchSkill = (id: string, patch: Partial<AgentSkill>) =>
    patchDraft({
      skills: (draft.skills ?? []).map((skill) =>
        skill.id === id ? { ...skill, ...patch } : skill
      ),
    });
  const addSkill = () =>
    patchDraft({ skills: [...(draft.skills ?? []), newBotSkill()] });
  const removeSkill = (id: string) =>
    patchDraft({
      skills: (draft.skills ?? []).filter((skill) => skill.id !== id),
    });
  const importSkillFolder = async () => {
    if (!shell || importingSkill) {
      return;
    }
    setImportingSkill(true);
    try {
      const result = (await shell.invoke("settings:importBotSkillFolder")) as
        | {
            ok?: boolean;
            canceled?: boolean;
            error?: string;
            skill?: Pick<
              AgentSkill,
              "name" | "description" | "slug" | "content"
            >;
          }
        | undefined;
      if (result?.ok && result.skill) {
        patchDraft({
          skills: [
            ...(draft.skills ?? []),
            {
              ...newBotSkill(),
              ...result.skill,
              enabled: true,
            },
          ],
        });
        return;
      }
      if (result?.canceled) {
        return;
      }
      if (result?.error === "missing-skill-md") {
        window.alert(t("settings.bots.importSkill.missingSkillMd"));
        return;
      }
      if (result?.error === "invalid-skill") {
        window.alert(t("settings.bots.importSkill.invalidSkill"));
        return;
      }
      window.alert(
        result?.error
          ? String(result.error)
          : t("settings.bots.importSkill.failed")
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : t("settings.bots.importSkill.failed")
      );
    } finally {
      setImportingSkill(false);
    }
  };

  const modal = (
    <div
      className="ref-settings-bot-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-label={
          mode === "create"
            ? t("settings.bots.modal.create")
            : t("settings.bots.modal.edit")
        }
        aria-modal="true"
        className="ref-settings-bot-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={{ "--bot-accent": meta.accent } as CSSProperties}
      >
        <div className="ref-settings-bot-modal-head">
          <div className="ref-settings-bot-modal-head-main">
            <div className="ref-settings-bot-modal-mark">
              {platformIcon(draft.platform)}
            </div>
            <div>
              <div className="ref-settings-bot-modal-kicker">
                {mode === "create"
                  ? t("settings.bots.modal.create")
                  : t("settings.bots.modal.edit")}
              </div>
              <h3 className="ref-settings-bot-modal-title">
                {draft.name.trim() ||
                  `${platformLabel(draft.platform, t)} ${t("settings.nav.bots")}`}
              </h3>
              <p className="ref-settings-bot-modal-subtitle">
                {platformDescription(draft.platform, t)}
              </p>
            </div>
          </div>
          <button
            className="ref-settings-bot-modal-close"
            onClick={onClose}
            type="button"
          >
            {t("settings.bots.modal.close")}
          </button>
        </div>

        <div className="ref-settings-bot-modal-body">
          <section className="ref-settings-bot-section">
            <div className="ref-settings-bots-section-head">
              <div>
                <div className="ref-settings-bots-section-kicker">
                  {t("settings.bots.section.basics.kicker")}
                </div>
                <h5 className="ref-settings-bots-section-title">
                  {t("settings.bots.section.basics.title")}
                </h5>
              </div>
              <p className="ref-settings-bots-section-copy">
                {t("settings.bots.section.basics.copy")}
              </p>
            </div>
            <div className="ref-settings-bot-grid ref-settings-bot-grid--runtime">
              <label className="ref-settings-field">
                <span>{t("settings.bots.field.name")}</span>
                <input
                  onChange={(event) => patchDraft({ name: event.target.value })}
                  placeholder={t("settings.bots.placeholder.name")}
                  ref={firstInputRef}
                  type="text"
                  value={draft.name}
                />
              </label>
              <label className="ref-settings-field">
                <span>{t("settings.bots.field.platform")}</span>
                <VoidSelect
                  ariaLabel={t("settings.bots.field.platform")}
                  onChange={(next) =>
                    onChangeDraft(
                      ensurePlatformShape(draft, next as BotPlatform)
                    )
                  }
                  options={(Object.keys(PLATFORM_META) as BotPlatform[]).map(
                    (platform) => ({
                      label: platformLabel(platform, t),
                      value: platform,
                    })
                  )}
                  value={draft.platform}
                />
              </label>
              <label className="ref-settings-field">
                <span>{t("settings.bots.field.defaultModel")}</span>
                <VoidSelect
                  ariaLabel={t("settings.bots.field.defaultModel")}
                  onChange={(next) =>
                    patchDraft({ defaultModelId: String(next ?? "") })
                  }
                  options={modelOptions}
                  value={draft.defaultModelId ?? ""}
                />
              </label>
            </div>
          </section>

          <section className="ref-settings-bot-section">
            <div className="ref-settings-bots-section-head">
              <div>
                <div className="ref-settings-bots-section-kicker">
                  {t("settings.bots.section.reply.kicker")}
                </div>
                <h5 className="ref-settings-bots-section-title">
                  {t("settings.bots.section.reply.title")}
                </h5>
              </div>
              <p className="ref-settings-bots-section-copy">
                {t("settings.bots.section.reply.copy")}
              </p>
            </div>
            <div className="ref-settings-bot-grid">
              <label className="ref-settings-field">
                <span>{t("settings.bots.field.allowedChats")}</span>
                <textarea
                  onChange={(event) =>
                    patchDraft({
                      allowedReplyChatIds: linesFromText(event.target.value),
                    })
                  }
                  placeholder={
                    draft.platform === "discord" || draft.platform === "slack"
                      ? t("settings.bots.placeholder.allowedChatChannel")
                      : t("settings.bots.placeholder.allowedChatGroup")
                  }
                  value={textFromLines(draft.allowedReplyChatIds)}
                />
                <p className="ref-settings-field-hint">
                  {draft.platform === "discord" || draft.platform === "slack"
                    ? t("settings.bots.hint.allowedChatChannel")
                    : t("settings.bots.hint.allowedChatGroup")}
                </p>
              </label>
              <label className="ref-settings-field">
                <span>{t("settings.bots.field.allowedUsers")}</span>
                <textarea
                  onChange={(event) =>
                    patchDraft({
                      allowedReplyUserIds: linesFromText(event.target.value),
                    })
                  }
                  placeholder={t("settings.bots.placeholder.allowedUsers")}
                  value={textFromLines(draft.allowedReplyUserIds)}
                />
                <p className="ref-settings-field-hint">
                  {t("settings.bots.hint.allowedUsers")}
                </p>
              </label>
            </div>
          </section>

          <section className="ref-settings-bot-section">
            <div className="ref-settings-bots-section-head">
              <div>
                <div className="ref-settings-bots-section-kicker">
                  {platformLabel(draft.platform, t)}
                </div>
                <h5 className="ref-settings-bots-section-title">
                  {t("settings.bots.section.connection.title")}
                </h5>
              </div>
              <p className="ref-settings-bots-section-copy">
                {platformTip(draft.platform, t)}
              </p>
            </div>

            {draft.platform === "telegram" ? (
              <div className="ref-settings-bot-platform-stack">
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.botToken")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        telegram: {
                          ...(draft.telegram ?? {}),
                          botToken: event.target.value,
                        },
                      })
                    }
                    placeholder="123456:ABC..."
                    type="password"
                    value={draft.telegram?.botToken ?? ""}
                  />
                </label>
                <div className="ref-settings-bot-preference-card">
                  <div className="ref-settings-bot-preference-copy">
                    <strong>{t("settings.bots.telegram.policy.title")}</strong>
                    <p>{t("settings.bots.telegram.policy.desc")}</p>
                  </div>
                  <div className="ref-settings-bot-segment">
                    <button
                      className={`ref-settings-bot-segment-btn ${draft.telegram?.requireMentionInGroups === false ? "" : "is-active"}`}
                      onClick={() =>
                        onChangeDraft({
                          ...draft,
                          telegram: {
                            ...(draft.telegram ?? {}),
                            requireMentionInGroups: true,
                          },
                        })
                      }
                      type="button"
                    >
                      <span>
                        {t("settings.bots.telegram.policy.mentionOnly")}
                      </span>
                      <small>
                        {t("settings.bots.telegram.policy.mentionOnlyHint")}
                      </small>
                    </button>
                    <button
                      className={`ref-settings-bot-segment-btn ${draft.telegram?.requireMentionInGroups === false ? "is-active" : ""}`}
                      onClick={() =>
                        onChangeDraft({
                          ...draft,
                          telegram: {
                            ...(draft.telegram ?? {}),
                            requireMentionInGroups: false,
                          },
                        })
                      }
                      type="button"
                    >
                      <span>{t("settings.bots.telegram.policy.direct")}</span>
                      <small>
                        {t("settings.bots.telegram.policy.directHint")}
                      </small>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {draft.platform === "slack" ? (
              <div className="ref-settings-bot-grid">
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.botToken")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        slack: {
                          ...(draft.slack ?? {}),
                          botToken: event.target.value,
                        },
                      })
                    }
                    placeholder="xoxb-..."
                    type="password"
                    value={draft.slack?.botToken ?? ""}
                  />
                </label>
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.appToken")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        slack: {
                          ...(draft.slack ?? {}),
                          appToken: event.target.value,
                        },
                      })
                    }
                    placeholder="xapp-..."
                    type="password"
                    value={draft.slack?.appToken ?? ""}
                  />
                </label>
              </div>
            ) : null}

            {draft.platform === "discord" ? (
              <div className="ref-settings-bot-grid">
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.botToken")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        discord: {
                          ...(draft.discord ?? {}),
                          botToken: event.target.value,
                        },
                      })
                    }
                    placeholder="Bot token"
                    type="password"
                    value={draft.discord?.botToken ?? ""}
                  />
                </label>
                <label className="ref-settings-bot-inline-check">
                  <input
                    checked={draft.discord?.requireMentionInGuilds !== false}
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        discord: {
                          ...(draft.discord ?? {}),
                          requireMentionInGuilds: event.target.checked,
                        },
                      })
                    }
                    type="checkbox"
                  />
                  <span>{t("settings.bots.discord.requireMention")}</span>
                </label>
              </div>
            ) : null}

            {draft.platform === "feishu" ? (
              <div className="ref-settings-bot-grid">
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.appId")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        feishu: {
                          ...(draft.feishu ?? {}),
                          appId: event.target.value,
                        },
                      })
                    }
                    type="text"
                    value={draft.feishu?.appId ?? ""}
                  />
                </label>
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.appSecret")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        feishu: {
                          ...(draft.feishu ?? {}),
                          appSecret: event.target.value,
                        },
                      })
                    }
                    type="password"
                    value={draft.feishu?.appSecret ?? ""}
                  />
                </label>
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.encryptKey")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        feishu: {
                          ...(draft.feishu ?? {}),
                          encryptKey: event.target.value,
                        },
                      })
                    }
                    type="password"
                    value={draft.feishu?.encryptKey ?? ""}
                  />
                </label>
                <label className="ref-settings-field">
                  <span>{t("settings.bots.field.verificationToken")}</span>
                  <input
                    onChange={(event) =>
                      onChangeDraft({
                        ...draft,
                        feishu: {
                          ...(draft.feishu ?? {}),
                          verificationToken: event.target.value,
                        },
                      })
                    }
                    type="password"
                    value={draft.feishu?.verificationToken ?? ""}
                  />
                </label>
                {shell ? (
                  <FeishuAuthSection
                    draft={draft}
                    onChangeDraft={onChangeDraft}
                    shell={shell}
                    t={t}
                  />
                ) : null}
              </div>
            ) : null}

            <label className="ref-settings-field">
              <span>{t("settings.bots.field.proxy")}</span>
              <input
                autoComplete="off"
                onChange={(event) =>
                  onChangeDraft(patchPlatformProxy(draft, event.target.value))
                }
                placeholder={t("settings.bots.placeholder.proxy")}
                type="text"
                value={platformProxyValue(draft)}
              />
              <p className="ref-settings-field-hint">
                {t("settings.bots.hint.proxy")}
              </p>
            </label>
          </section>

          <section className="ref-settings-bot-section">
            <div className="ref-settings-bots-section-head">
              <div>
                <div className="ref-settings-bots-section-kicker">
                  {t("settings.bots.section.persona.kicker")}
                </div>
                <h5 className="ref-settings-bots-section-title">
                  {t("settings.bots.section.persona.title")}
                </h5>
              </div>
              <p className="ref-settings-bots-section-copy">
                {t("settings.bots.section.persona.copy")}
              </p>
            </div>
            <label className="ref-settings-field">
              <span>{t("settings.bots.field.systemPrompt")}</span>
              <textarea
                onChange={(event) =>
                  patchDraft({ systemPrompt: event.target.value })
                }
                placeholder={t("settings.bots.placeholder.systemPrompt")}
                value={draft.systemPrompt ?? ""}
              />
            </label>
          </section>

          <section className="ref-settings-bot-section">
            <div className="ref-settings-bots-section-head">
              <div>
                <div className="ref-settings-bots-section-kicker">
                  {t("settings.bots.section.skills.kicker")}
                </div>
                <h5 className="ref-settings-bots-section-title">
                  {t("settings.bots.section.skills.title")}
                </h5>
              </div>
              <div>
                <p className="ref-settings-bots-section-copy">
                  {t("settings.bots.section.skills.copy")}
                </p>
                <div className="ref-settings-bot-card-actions">
                  <button
                    className={`ref-settings-bot-chip-btn ${importingSkill ? "is-active" : ""}`}
                    disabled={!shell || importingSkill}
                    onClick={() => void importSkillFolder()}
                    type="button"
                  >
                    {importingSkill
                      ? t("settings.bots.action.importSkillLoading")
                      : t("settings.bots.action.importSkillFolder")}
                  </button>
                </div>
              </div>
            </div>
            <div className="ref-settings-bot-platform-stack">
              {(draft.skills ?? []).map((skill, index) => (
                <div
                  className="ref-settings-bot-preference-card"
                  key={skill.id}
                >
                  <div className="ref-settings-bot-grid ref-settings-bot-grid--runtime">
                    <label className="ref-settings-field">
                      <span>{t("settings.bots.field.skillName")}</span>
                      <input
                        onChange={(event) =>
                          patchSkill(skill.id, { name: event.target.value })
                        }
                        placeholder={t("settings.bots.placeholder.skillName", {
                          index: index + 1,
                        })}
                        type="text"
                        value={skill.name}
                      />
                    </label>
                    <label className="ref-settings-field">
                      <span>{t("settings.bots.field.skillSlug")}</span>
                      <input
                        onChange={(event) =>
                          patchSkill(skill.id, {
                            slug: event.target.value
                              .replace(/^\.\//, "")
                              .trimStart(),
                          })
                        }
                        placeholder={t("settings.bots.placeholder.skillSlug")}
                        type="text"
                        value={skill.slug}
                      />
                      <p className="ref-settings-field-hint">
                        {t("settings.bots.hint.skillSlug")}
                      </p>
                    </label>
                  </div>
                  <label className="ref-settings-field">
                    <span>{t("settings.bots.field.skillDescription")}</span>
                    <input
                      onChange={(event) =>
                        patchSkill(skill.id, {
                          description: event.target.value,
                        })
                      }
                      placeholder={t(
                        "settings.bots.placeholder.skillDescription"
                      )}
                      type="text"
                      value={skill.description}
                    />
                  </label>
                  <label className="ref-settings-field">
                    <span>{t("settings.bots.field.skillContent")}</span>
                    <textarea
                      onChange={(event) =>
                        patchSkill(skill.id, { content: event.target.value })
                      }
                      placeholder={t("settings.bots.placeholder.skillContent")}
                      rows={6}
                      value={skill.content}
                    />
                  </label>
                  <div className="ref-settings-bot-card-actions">
                    <button
                      className={`ref-settings-bot-chip-btn ${skill.enabled === false ? "" : "is-active"}`}
                      onClick={() =>
                        patchSkill(skill.id, {
                          enabled: skill.enabled === false,
                        })
                      }
                      type="button"
                    >
                      {skill.enabled === false
                        ? t("settings.bots.action.skillDisabled")
                        : t("settings.bots.action.skillEnabled")}
                    </button>
                    <button
                      className="ref-settings-bot-chip-btn is-danger"
                      onClick={() => removeSkill(skill.id)}
                      type="button"
                    >
                      {t("settings.bots.action.removeSkill")}
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="ref-settings-bot-chip-btn"
                onClick={addSkill}
                type="button"
              >
                {t("settings.bots.action.addSkill")}
              </button>
              {(draft.skills ?? []).length === 0 ? (
                <p className="ref-settings-field-hint">
                  {t("settings.bots.empty.skills")}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="ref-settings-bot-modal-foot">
          <button
            className="ref-settings-bot-modal-btn is-ghost"
            onClick={onClose}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="ref-settings-bot-modal-btn is-primary"
            onClick={onSave}
            type="button"
          >
            {mode === "create"
              ? t("settings.bots.modal.createCta")
              : t("settings.bots.modal.saveCta")}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(modal, document.body);
}

export function SettingsBotsPanel({
  value,
  onChange,
  modelEntries,
  shell,
}: Props) {
  const { t } = useI18n();
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [draft, setDraft] = useState<BotIntegrationConfig | null>(null);
  const [connectionStateById, setConnectionStateById] = useState<
    Record<string, BotConnectionUiState>
  >({});

  const activeCount = value.filter((item) => item.enabled !== false).length;
  const restrictedCount = value.filter(
    (item) => countAllowedChats(item) > 0
  ).length;
  const whitelistedUsers = value.reduce(
    (sum, item) => sum + countAllowedUsers(item),
    0
  );

  const openCreate = (platform: BotPlatform) => {
    setEditorMode("create");
    setDraft(createBotForPlatform(platform, t));
  };

  const openEdit = (item: BotIntegrationConfig) => {
    setEditorMode("edit");
    setDraft(cloneIntegration(item));
  };

  const closeEditor = () => {
    setEditorMode(null);
    setDraft(null);
  };

  const saveEditor = () => {
    if (!draft || !editorMode) {
      return;
    }
    const next = cloneIntegration(draft);
    if (editorMode === "create") {
      onChange([...value, next]);
    } else {
      onChange(value.map((item) => (item.id === next.id ? next : item)));
    }
    closeEditor();
  };

  const toggleEnabled = (id: string) => {
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, enabled: item.enabled === false } : item
      )
    );
  };

  const removeOne = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
    if (draft?.id === id) {
      closeEditor();
    }
    setConnectionStateById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const runConnectionTest = async (item: BotIntegrationConfig) => {
    if (!shell) {
      setConnectionStateById((prev) => ({
        ...prev,
        [item.id]: {
          message: t("settings.bots.test.unavailable"),
          ok: false,
          status: "done",
        },
      }));
      return;
    }
    setConnectionStateById((prev) => ({
      ...prev,
      [item.id]: { status: "loading" },
    }));
    try {
      const result = (await shell.invoke(
        "settings:testBotConnection",
        item
      )) as { ok?: boolean; message?: string };
      setConnectionStateById((prev) => ({
        ...prev,
        [item.id]: {
          message:
            typeof result.message === "string" && result.message.trim()
              ? result.message.trim()
              : result.ok
                ? t("settings.bots.test.success")
                : t("settings.bots.test.failure"),
          ok: result.ok === true,
          status: "done",
        },
      }));
    } catch (error) {
      setConnectionStateById((prev) => ({
        ...prev,
        [item.id]: {
          message:
            error instanceof Error
              ? error.message
              : String(error ?? t("settings.bots.test.failure")),
          ok: false,
          status: "done",
        },
      }));
    }
  };

  return (
    <>
      <div className="ref-settings-panel ref-settings-panel--bots">
        <div className="ref-settings-bots-shell">
          <section className="ref-settings-bots-hero">
            <div>
              <div className="ref-settings-bots-kicker">
                {t("settings.bots.hero.kicker")}
              </div>
              <h3 className="ref-settings-bots-title">
                {t("settings.bots.hero.title")}
              </h3>
              <p className="ref-settings-bots-subtitle">
                {t("settings.bots.hero.subtitle")}
              </p>
            </div>
            <div className="ref-settings-bots-stats">
              <div className="ref-settings-bots-stat">
                <span className="ref-settings-bots-stat-label">
                  {t("settings.bots.stats.configured")}
                </span>
                <strong>{value.length}</strong>
              </div>
              <div className="ref-settings-bots-stat">
                <span className="ref-settings-bots-stat-label">
                  {t("settings.bots.stats.enabled")}
                </span>
                <strong>{activeCount}</strong>
              </div>
              <div className="ref-settings-bots-stat">
                <span className="ref-settings-bots-stat-label">
                  {t("settings.bots.stats.groups")}
                </span>
                <strong>{restrictedCount}</strong>
              </div>
              <div className="ref-settings-bots-stat">
                <span className="ref-settings-bots-stat-label">
                  {t("settings.bots.stats.users")}
                </span>
                <strong>{whitelistedUsers}</strong>
              </div>
            </div>
          </section>

          <section className="ref-settings-bots-add-section">
            <div className="ref-settings-bots-section-head">
              <div>
                <div className="ref-settings-bots-section-kicker">
                  {t("settings.bots.quickStart.kicker")}
                </div>
                <h4 className="ref-settings-bots-section-title">
                  {t("settings.bots.quickStart.title")}
                </h4>
              </div>
              <p className="ref-settings-bots-section-copy">
                {t("settings.bots.quickStart.copy")}
              </p>
            </div>
            <div className="ref-settings-bots-platform-grid">
              {(Object.keys(PLATFORM_META) as BotPlatform[]).map((platform) => {
                const meta = PLATFORM_META[platform];
                return (
                  <button
                    className="ref-settings-bots-platform-card"
                    key={platform}
                    onClick={() => openCreate(platform)}
                    style={{ "--bot-accent": meta.accent } as CSSProperties}
                    type="button"
                  >
                    <div className="ref-settings-bots-platform-icon">
                      {platformIcon(platform)}
                    </div>
                    <div className="ref-settings-bots-platform-head">
                      <strong>{platformLabel(platform, t)}</strong>
                      <span>{platformAddHint(platform, t)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {value.length === 0 ? (
            <section className="ref-settings-bots-empty">
              <div
                className="ref-settings-bots-empty-ico"
                style={
                  {
                    "--bot-accent": PLATFORM_META.telegram.accent,
                  } as CSSProperties
                }
              >
                {platformIcon("telegram")}
              </div>
              <div>
                <h4>{t("settings.bots.empty.title")}</h4>
                <p>{t("settings.bots.empty.body")}</p>
              </div>
            </section>
          ) : null}

          <div className="ref-settings-bots-list">
            {value.map((item, index) => {
              const current = ensurePlatformShape(item, item.platform);
              const meta = PLATFORM_META[current.platform];
              const summary = botCardSummary(current, t);
              const modelText = modelLabel(
                current.defaultModelId,
                modelEntries,
                t
              );
              const enabled = current.enabled !== false;
              const connectionState = connectionStateById[current.id];
              return (
                <article
                  className={`ref-settings-bot-card ${enabled ? "is-enabled" : "is-disabled"}`}
                  key={current.id}
                  style={{ "--bot-accent": meta.accent } as CSSProperties}
                >
                  <div className="ref-settings-bot-card-head">
                    <div className="ref-settings-bot-card-main">
                      <div className="ref-settings-bot-card-mark">
                        {platformIcon(current.platform)}
                      </div>
                      <div className="ref-settings-bot-card-copy">
                        <div className="ref-settings-bot-card-kicker">
                          {t("settings.bots.card.number", { count: index + 1 })}{" "}
                          · {platformLabel(current.platform, t)}
                        </div>
                        <h4 className="ref-settings-bot-card-title">
                          {current.name.trim() ||
                            `${platformLabel(current.platform, t)} ${t("settings.nav.bots")}`}
                        </h4>
                        <p className="ref-settings-bot-card-subtitle">
                          {platformDescription(current.platform, t)}
                        </p>
                      </div>
                    </div>
                    <div className="ref-settings-bot-card-controls">
                      <button
                        aria-checked={enabled}
                        className={`ref-settings-bot-switch ${enabled ? "is-on" : "is-off"}`}
                        onClick={() => toggleEnabled(current.id)}
                        role="switch"
                        type="button"
                      >
                        <span
                          aria-hidden
                          className="ref-settings-bot-switch-track"
                        >
                          <span className="ref-settings-bot-switch-thumb" />
                        </span>
                        <span className="ref-settings-bot-switch-copy">
                          <strong>
                            {enabled
                              ? t("settings.bots.switch.on")
                              : t("settings.bots.switch.off")}
                          </strong>
                          <small>{t("settings.bots.switch.hint")}</small>
                        </span>
                      </button>
                      <div className="ref-settings-bot-card-actions">
                        <button
                          className={`ref-settings-bot-chip-btn ${connectionState?.status === "loading" ? "is-active" : ""}`}
                          disabled={
                            connectionState?.status === "loading" || !shell
                          }
                          onClick={() => void runConnectionTest(current)}
                          type="button"
                        >
                          {connectionState?.status === "loading"
                            ? t("settings.bots.action.testing")
                            : t("settings.bots.action.test")}
                        </button>
                        <button
                          className="ref-settings-bot-chip-btn"
                          onClick={() => openEdit(current)}
                          type="button"
                        >
                          {t("settings.bots.action.edit")}
                        </button>
                        <button
                          className="ref-settings-bot-chip-btn is-danger"
                          onClick={() => removeOne(current.id)}
                          type="button"
                        >
                          {t("settings.bots.action.remove")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="ref-settings-bot-badges">
                    <span className="ref-settings-bot-badge">{modelText}</span>
                    <span className="ref-settings-bot-badge">
                      {summary.chats}
                    </span>
                    <span className="ref-settings-bot-badge">
                      {summary.users}
                    </span>
                    <span className="ref-settings-bot-badge">
                      {summary.skills}
                    </span>
                  </div>

                  {connectionState ? (
                    <div
                      className={`ref-settings-bot-connection ${
                        connectionState.status === "loading"
                          ? "is-loading"
                          : connectionState.ok
                            ? "is-success"
                            : "is-error"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="ref-settings-bot-connection-dot"
                      />
                      <div className="ref-settings-bot-connection-copy">
                        <strong>
                          {connectionState.status === "loading"
                            ? t("settings.bots.test.running")
                            : connectionState.ok
                              ? t("settings.bots.test.success")
                              : t("settings.bots.test.failure")}
                        </strong>
                        <span>
                          {connectionState.status === "loading"
                            ? t("settings.bots.test.runningHint")
                            : connectionState.message}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="ref-settings-bot-overview">
                    <div className="ref-settings-bot-overview-item">
                      <span>{t("settings.bots.overview.groups")}</span>
                      <strong>{summary.chats}</strong>
                    </div>
                    <div className="ref-settings-bot-overview-item">
                      <span>{t("settings.bots.overview.users")}</span>
                      <strong>{summary.users}</strong>
                    </div>
                    <div className="ref-settings-bot-overview-item">
                      <span>{t("settings.bots.overview.prompt")}</span>
                      <strong>{summary.prompt}</strong>
                    </div>
                    <div className="ref-settings-bot-overview-item">
                      <span>{t("settings.bots.overview.skills")}</span>
                      <strong>{summary.skills}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {draft && editorMode ? (
        <BotEditorModal
          draft={draft}
          mode={editorMode}
          modelEntries={modelEntries}
          onChangeDraft={setDraft}
          onClose={closeEditor}
          onSave={saveEditor}
          shell={shell}
          t={t}
        />
      ) : null}
    </>
  );
}
