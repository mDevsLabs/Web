import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { IconProfilesConnections } from "../icons";
import { TerminalHotkeysSettingsStage } from "./TerminalHotkeysSettingsStage";
import {
  countTerminalProfileEnvEntries,
  DEFAULT_PROFILE_ID,
  normalizeTerminalSettings,
  resolveTerminalProfile,
  type TerminalAppSettings,
} from "./terminalSettings";
import {
  AppearanceSettingsStage,
  describeProfileTarget,
  IconAppearanceNav,
  IconHotkeysNav,
  IconTerminalNav,
  ProfilesSettingsStage,
  type ProfilesSubtab,
  type SettingsNav,
  type TerminalSettingsPanelProps as Props,
  TerminalBehaviorStage,
  withTerminalProfileDisplayName,
} from "./settings/index";


export type { TerminalSettingsPanelOpenProfileRequest } from "./settings/index";
export * from "./settings/index";

export const TerminalSettingsPanel = memo(function TerminalSettingsPanel({
  t,
  settings,
  builtinProfiles,
  onChange,
  onLaunchProfile,
  openProfileRequest,
}: Props) {
  const [nav, setNav] = useState<SettingsNav>("profilesConnections");
  const [profilesSubtab, setProfilesSubtab] =
    useState<ProfilesSubtab>("profiles");
  const [activeProfileId, setActiveProfileId] = useState<string>(
    settings.profiles[0]?.id ?? DEFAULT_PROFILE_ID
  );
  const [filter, setFilter] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({
    builtin: false,
  });
  const [navPending, startNavTransition] = useTransition();
  const stageRef = useRef<HTMLDivElement | null>(null);

  const patch = useCallback(
    (partial: Partial<TerminalAppSettings>) => {
      onChange(normalizeTerminalSettings({ ...settings, ...partial }));
    },
    [settings, onChange]
  );

  const activeProfile = useMemo(
    () =>
      settings.profiles.find((profile) => profile.id === activeProfileId) ??
      settings.profiles[0],
    [settings.profiles, activeProfileId]
  );

  const defaultProfile = useMemo(
    () =>
      resolveTerminalProfile(
        settings.profiles,
        settings.defaultProfileId,
        builtinProfiles
      ),
    [builtinProfiles, settings.defaultProfileId, settings.profiles]
  );

  const displayStats = useMemo(
    () => [
      {
        label: t("app.universalTerminalSettings.summary.defaultProfile"),
        value: defaultProfile
          ? withTerminalProfileDisplayName(defaultProfile, t).name
          : t("app.universalTerminalSettings.systemDefaultShell"),
      },
      {
        label: t("app.universalTerminalSettings.summary.profileCount"),
        value: String(settings.profiles.length),
      },
      {
        label: t("app.universalTerminalSettings.summary.activeTarget"),
        value: describeProfileTarget(activeProfile, t),
      },
      {
        label: t("app.universalTerminalSettings.summary.envCount"),
        value: String(countTerminalProfileEnvEntries(activeProfile)),
      },
    ],
    [activeProfile, defaultProfile, settings.profiles.length, t]
  );

  const navItems: Array<{
    id: SettingsNav;
    label: string;
    description: string;
  }> = [
    {
      description: t(
        "app.universalTerminalSettings.nav.profilesConnectionsDesc"
      ),
      id: "profilesConnections",
      label: t("app.universalTerminalSettings.nav.profilesConnections"),
    },
    {
      description: t("app.universalTerminalSettings.nav.appearanceDesc"),
      id: "appearance",
      label: t("app.universalTerminalSettings.nav.appearance"),
    },
    {
      description: t("app.universalTerminalSettings.nav.terminalDesc"),
      id: "terminal",
      label: t("app.universalTerminalSettings.nav.terminal"),
    },
    {
      description: t("app.universalTerminalSettings.nav.hotkeysDesc"),
      id: "hotkeys",
      label: t("app.universalTerminalSettings.nav.hotkeys"),
    },
  ];

  const navIcons: Record<SettingsNav, ReactNode> = {
    appearance: <IconAppearanceNav />,
    hotkeys: <IconHotkeysNav />,
    profilesConnections: <IconProfilesConnections />,
    terminal: <IconTerminalNav />,
  };

  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0 });
  }, [nav, profilesSubtab]);

  useEffect(() => {
    if (!openProfileRequest) {
      return;
    }
    startNavTransition(() => {
      setNav("profilesConnections");
    });
    setProfilesSubtab("profiles");
    setActiveProfileId(openProfileRequest.profileId);
  }, [openProfileRequest]);

  return (
    <div className="ref-uterm-settings-workspace">
      <aside className="ref-uterm-settings-sidebar">
        <div className="ref-uterm-settings-sidebar-head">
          <div className="ref-uterm-settings-sidebar-kicker">mAI Coder</div>
          <div className="ref-uterm-settings-sidebar-title">
            {t("app.universalTerminalSettings.sidebarTitle")}
          </div>
        </div>
        <nav
          aria-label={t("app.universalTerminalSettings.sidebarTitle")}
          className="ref-uterm-settings-sidebar-nav"
        >
          {navItems.map((item) => (
            <button
              className={`ref-uterm-settings-sidebar-link ${nav === item.id ? "is-active" : ""}`}
              key={item.id}
              onClick={() =>
                startNavTransition(() => {
                  setNav(item.id);
                })
              }
              type="button"
            >
              <span className="ref-uterm-settings-sidebar-link-ico">
                {navIcons[item.id]}
              </span>
              <span className="ref-uterm-settings-sidebar-link-copy">
                <span className="ref-uterm-settings-sidebar-link-label">
                  {item.label}
                </span>
                <span className="ref-uterm-settings-sidebar-link-desc">
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </nav>
        <div className="ref-uterm-settings-sidebar-footer">
          <div className="ref-uterm-settings-sidebar-footer-title">
            {displayStats[0]?.value ||
              t("app.universalTerminalSettings.systemDefaultShell")}
          </div>
          <div className="ref-uterm-settings-sidebar-footer-copy">
            {displayStats[1]?.label}: {displayStats[1]?.value}
          </div>
        </div>
      </aside>

      <div className="ref-uterm-settings-stage" ref={stageRef}>
        <div
          className={`ref-uterm-settings-page-swap ${navPending ? "is-pending" : ""}`}
          key={nav === "profilesConnections" ? `${nav}:${profilesSubtab}` : nav}
        >
          {nav === "profilesConnections" ? (
            <ProfilesSettingsStage
              activeProfile={activeProfile}
              builtinProfiles={builtinProfiles}
              collapsedGroups={collapsedGroups}
              filter={filter}
              onChangeSubtab={setProfilesSubtab}
              onFilterChange={setFilter}
              onLaunchProfile={onLaunchProfile}
              onPatchSettings={patch}
              onSelectProfile={setActiveProfileId}
              onToggleGroup={(groupId) =>
                setCollapsedGroups((prev) => ({
                  ...prev,
                  [groupId]: !prev[groupId],
                }))
              }
              openProfileRequest={openProfileRequest}
              profilesSubtab={profilesSubtab}
              settings={settings}
              t={t}
            />
          ) : null}

          {nav === "appearance" ? (
            <AppearanceSettingsStage
              onPatchSettings={patch}
              settings={settings}
              t={t}
            />
          ) : null}

          {nav === "terminal" ? (
            <TerminalBehaviorStage
              onPatchSettings={patch}
              settings={settings}
              t={t}
            />
          ) : null}

          {nav === "hotkeys" ? (
            <TerminalHotkeysSettingsStage
              onPatchSettings={patch}
              settings={settings}
              t={t}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
});
