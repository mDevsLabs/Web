import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VoidSelect, type VoidSelectOption } from "../../VoidSelect";
import {
  cloneTerminalProfile,
  DEFAULT_PROFILE_ID,
  defaultTerminalSettings,
  getSshIdentityFiles,
  isBuiltinTerminalProfileId,
  mergeTypeDefaultsIntoProfile,
  resolveTerminalProfile,
  TERMINAL_SSH_ALGORITHM_OPTIONS,
  terminalProfileToTypeDefaultsPatch,
  type TerminalLoginScript,
  type TerminalPortForward,
  type TerminalPortForwardType,
  type TerminalProfile,
  type TerminalSshAuthMode,
} from "../terminalSettings";
import {
  IconMoreVerticalSmall,
  IconPlaySmall,
  IconSearchSmall,
} from "./SettingsIcons";
import {
  ColorSchemeList,
  Field,
  FieldStack,
  SettingsSection,
  SubtabButton,
  ToggleField,
  ToggleSwitch,
} from "./SettingsFormElements";
import {
  applyProfileNameFallback,
  applySshConnectionMode,
  createEmptyProfileDraft,
  createProfileFromTemplate,
  describeProfileTarget,
  filterProfilesByQuery,
  getEditorTabsForProfile,
  getTerminalProfileVisual,
  groupProfilesByCustomGroup,
  inferSshConnectionMode,
  renderSshAuthGlyph,
  withTerminalProfileDisplayName,
} from "./profilesUtils";
import type {
  ProfileDefaultsKind,
  ProfileEditorMode,
  ProfileEditorTabId,
  ProfilesSettingsStageProps,
  TerminalSshConnectionMode,
} from "./types";


export function ProfilesSettingsStage({
  t,
  settings,
  activeProfile,
  profilesSubtab,
  onChangeSubtab,
  filter,
  onFilterChange,
  collapsedGroups,
  onToggleGroup,
  onSelectProfile,
  onPatchSettings,
  onLaunchProfile,
  builtinProfiles,
  openProfileRequest,
}: ProfilesSettingsStageProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFilter, setCreateFilter] = useState("");
  const [editorDraft, setEditorDraft] = useState<TerminalProfile | null>(null);
  const [editorMode, setEditorMode] = useState<ProfileEditorMode>("edit");
  const [defaultsKind, setDefaultsKind] = useState<ProfileDefaultsKind | null>(
    null
  );
  type ProfilePasswordModalState =
    | { open: false }
    | { open: true; mode: "set" | "clear" };
  const [passwordModal, setPasswordModal] = useState<ProfilePasswordModalState>(
    { open: false }
  );
  const [passwordModalInput, setPasswordModalInput] = useState("");
  const profilePasswordInputRef = useRef<HTMLInputElement | null>(null);
  const [editorTab, setEditorTab] = useState<ProfileEditorTabId>("general");
  const [editorSshConnectionMode, setEditorSshConnectionMode] =
    useState<TerminalSshConnectionMode>("direct");
  const [editorHasSavedPassword, setEditorHasSavedPassword] = useState(false);
  const [rowMenuProfileId, setRowMenuProfileId] = useState<string | null>(null);
  const rowMenuRef = useRef<HTMLDivElement | null>(null);
  const handledOpenProfileRequestRef = useRef<number | null>(null);
  const displayBuiltinProfiles = useMemo(
    () =>
      builtinProfiles.map((profile) =>
        withTerminalProfileDisplayName(profile, t)
      ),
    [builtinProfiles, t]
  );
  const defaultProfileSelectOptions = useMemo((): VoidSelectOption[] => {
    const rows: VoidSelectOption[] = [];
    if (settings.profiles.length > 0) {
      rows.push({
        disabled: true,
        label: (
          <span className="ref-uterm-settings-default-optgroup">
            {t("app.universalTerminalSettings.profiles.group.custom")}
          </span>
        ),
        value: "__void_optgroup_custom__",
      });
      for (const profile of settings.profiles) {
        rows.push({
          label:
            withTerminalProfileDisplayName(profile, t).name ||
            t("app.universalTerminalSettings.profiles.untitled"),
          value: profile.id,
        });
      }
    }
    if (displayBuiltinProfiles.length > 0) {
      rows.push({
        disabled: true,
        label: (
          <span className="ref-uterm-settings-default-optgroup">
            {t("app.universalTerminalSettings.profiles.group.builtin")}
          </span>
        ),
        value: "__void_optgroup_builtin__",
      });
      for (const profile of displayBuiltinProfiles) {
        rows.push({ label: profile.name, value: profile.id });
      }
    }
    if (!rows.length) {
      return [
        {
          disabled: true,
          label: t("app.universalTerminalSettings.profiles.untitled"),
          value: settings.defaultProfileId || DEFAULT_PROFILE_ID,
        },
      ];
    }
    return rows;
  }, [displayBuiltinProfiles, settings.defaultProfileId, settings.profiles, t]);
  const filteredCustomProfiles = useMemo(
    () => filterProfilesByQuery(settings.profiles, filter, t),
    [filter, settings.profiles, t]
  );
  const customProfileGroups = useMemo(
    () => groupProfilesByCustomGroup(filteredCustomProfiles, t),
    [filteredCustomProfiles, t]
  );
  const filteredBuiltinProfiles = useMemo(
    () => filterProfilesByQuery(displayBuiltinProfiles, filter, t),
    [displayBuiltinProfiles, filter, t]
  );
  const createDialogGroups = useMemo(
    () =>
      [
        {
          id: "builtin" as const,
          items: filterProfilesByQuery(displayBuiltinProfiles, createFilter, t),
          label: t("app.universalTerminalSettings.profiles.group.builtin"),
        },
        {
          id: "custom" as const,
          items: filterProfilesByQuery(settings.profiles, createFilter, t),
          label: t("app.universalTerminalSettings.profiles.group.custom"),
        },
      ].filter((group) => group.items.length > 0),
    [createFilter, displayBuiltinProfiles, settings.profiles, t]
  );
  const editorOpen = Boolean(editorDraft);
  const editorVisual = editorDraft
    ? getTerminalProfileVisual(editorDraft)
    : null;
  const sshIncomplete =
    editorDraft?.kind === "ssh" &&
    (!editorDraft.sshHost.trim() || !editorDraft.sshUser.trim());
  const canDeleteDraft =
    editorMode !== "defaults" && editorDraft
      ? settings.profiles.length > 1 &&
        editorDraft.id !== DEFAULT_PROFILE_ID &&
        settings.profiles.some((profile) => profile.id === editorDraft.id)
      : false;

  const loadPasswordState = useCallback(async (profileId: string) => {
    const shell = window.maiShell;
    if (!shell || !profileId) {
      setEditorHasSavedPassword(false);
      return;
    }
    const result = (await shell.invoke(
      "term:profilePasswordState",
      profileId
    )) as { ok?: boolean; hasPassword?: boolean };
    setEditorHasSavedPassword(Boolean(result?.ok && result.hasPassword));
  }, []);

  const closeProfilePasswordModal = useCallback(() => {
    setPasswordModal({ open: false });
    setPasswordModalInput("");
  }, []);

  const openProfilePasswordSetModal = useCallback(() => {
    if (!editorDraft?.id) {
      return;
    }
    setPasswordModalInput("");
    setPasswordModal({ mode: "set", open: true });
  }, [editorDraft?.id]);

  const openProfilePasswordClearModal = useCallback(() => {
    if (!editorDraft?.id) {
      return;
    }
    setPasswordModal({ mode: "clear", open: true });
  }, [editorDraft?.id]);

  const confirmProfilePasswordModal = useCallback(async () => {
    if (!passwordModal.open || !editorDraft?.id) {
      return;
    }
    const shell = window.maiShell;
    if (!shell) {
      closeProfilePasswordModal();
      return;
    }
    if (passwordModal.mode === "clear") {
      const result = (await shell.invoke(
        "term:profilePasswordClear",
        editorDraft.id
      )) as { ok?: boolean };
      if (result?.ok) {
        setEditorHasSavedPassword(false);
      }
      closeProfilePasswordModal();
      return;
    }
    const value = passwordModalInput.trim();
    if (!value) {
      return;
    }
    const result = (await shell.invoke(
      "term:profilePasswordSet",
      editorDraft.id,
      value
    )) as { ok?: boolean };
    if (result?.ok) {
      setEditorHasSavedPassword(true);
    }
    closeProfilePasswordModal();
  }, [
    closeProfilePasswordModal,
    editorDraft?.id,
    passwordModal,
    passwordModalInput,
  ]);

  const openProfileEditor = useCallback(
    (id: string) => {
      const source = settings.profiles.find((profile) => profile.id === id);
      if (!source) {
        return;
      }
      onSelectProfile(id);
      setCreateDialogOpen(false);
      setRowMenuProfileId(null);
      setEditorMode("edit");
      setDefaultsKind(null);
      setEditorTab("general");
      setEditorSshConnectionMode(inferSshConnectionMode(source));
      setEditorHasSavedPassword(false);
      setEditorDraft({ ...source });
      void loadPasswordState(id);
    },
    [loadPasswordState, onSelectProfile, settings.profiles]
  );

  const closeProfileEditor = useCallback(() => {
    closeProfilePasswordModal();
    if (
      (editorMode === "create" || editorMode === "defaults") &&
      editorDraft &&
      !settings.profiles.some((profile) => profile.id === editorDraft.id)
    ) {
      void window.maiShell?.invoke("term:profilePasswordClear", editorDraft.id);
    }
    setEditorDraft(null);
    setDefaultsKind(null);
    setEditorHasSavedPassword(false);
  }, [closeProfilePasswordModal, editorDraft, editorMode, settings.profiles]);

  const openTemplateEditor = useCallback(
    (profileId?: string) => {
      const source = profileId
        ? resolveTerminalProfile(settings.profiles, profileId, builtinProfiles)
        : null;
      const typeDefaults =
        source?.kind === "ssh"
          ? settings.profileTypeDefaults.ssh
          : source
            ? settings.profileTypeDefaults.local
            : undefined;
      const draft = source
        ? createProfileFromTemplate(
            settings.profiles,
            withTerminalProfileDisplayName(source, t),
            t,
            typeDefaults
          )
        : createEmptyProfileDraft(settings.profiles, "local", t);
      setCreateDialogOpen(false);
      setCreateFilter("");
      setRowMenuProfileId(null);
      setEditorMode("create");
      setDefaultsKind(null);
      setEditorTab("general");
      setEditorSshConnectionMode(inferSshConnectionMode(draft));
      setEditorHasSavedPassword(false);
      setEditorDraft(draft);
      void loadPasswordState(draft.id);
    },
    [
      builtinProfiles,
      loadPasswordState,
      settings.profileTypeDefaults,
      settings.profiles,
      t,
    ]
  );

  const openDefaultsEditor = useCallback(
    (kind: ProfileDefaultsKind) => {
      const profileId =
        kind === "local" ? "builtin:system-default" : "builtin:ssh-template";
      const source = resolveTerminalProfile(
        settings.profiles,
        profileId,
        builtinProfiles
      );
      if (!source) {
        return;
      }
      const withDisplay = withTerminalProfileDisplayName(source, t);
      const base = cloneTerminalProfile(settings.profiles, withDisplay);
      const saved =
        kind === "ssh"
          ? settings.profileTypeDefaults.ssh
          : settings.profileTypeDefaults.local;
      const merged = mergeTypeDefaultsIntoProfile(base, saved);
      setCreateDialogOpen(false);
      setCreateFilter("");
      setRowMenuProfileId(null);
      setEditorMode("defaults");
      setDefaultsKind(kind);
      setEditorTab("general");
      setEditorSshConnectionMode(inferSshConnectionMode(merged));
      setEditorHasSavedPassword(false);
      setEditorDraft(merged);
      void loadPasswordState(merged.id);
    },
    [
      builtinProfiles,
      loadPasswordState,
      settings.profileTypeDefaults,
      settings.profiles,
      t,
    ]
  );

  useEffect(() => {
    if (!openProfileRequest) {
      return;
    }
    if (handledOpenProfileRequestRef.current === openProfileRequest.nonce) {
      return;
    }
    handledOpenProfileRequestRef.current = openProfileRequest.nonce;
    setCreateDialogOpen(false);
    setRowMenuProfileId(null);
    if (isBuiltinTerminalProfileId(openProfileRequest.profileId)) {
      openTemplateEditor(openProfileRequest.profileId);
    } else {
      openProfileEditor(openProfileRequest.profileId);
    }
    setEditorTab(openProfileRequest.tab);
  }, [openProfileEditor, openProfileRequest, openTemplateEditor]);

  const openCreateDialog = useCallback(() => {
    setRowMenuProfileId(null);
    setEditorDraft(null);
    setCreateFilter("");
    setCreateDialogOpen(true);
  }, []);

  const patchEditorDraft = useCallback((partial: Partial<TerminalProfile>) => {
    setEditorDraft((current) =>
      current ? { ...current, ...partial } : current
    );
  }, []);

  const addLoginScript = useCallback(() => {
    setEditorDraft((current) =>
      current
        ? {
            ...current,
            loginScripts: [
              ...current.loginScripts,
              {
                expect: "",
                isRegex: false,
                optional: false,
                send: "",
              } satisfies TerminalLoginScript,
            ],
          }
        : current
    );
  }, []);

  const patchLoginScript = useCallback(
    (index: number, partial: Partial<TerminalLoginScript>) => {
      setEditorDraft((current) =>
        current
          ? {
              ...current,
              loginScripts: current.loginScripts.map((script, scriptIndex) =>
                scriptIndex === index ? { ...script, ...partial } : script
              ),
            }
          : current
      );
    },
    []
  );

  const removeLoginScript = useCallback((index: number) => {
    setEditorDraft((current) =>
      current
        ? {
            ...current,
            loginScripts: current.loginScripts.filter(
              (_, scriptIndex) => scriptIndex !== index
            ),
          }
        : current
    );
  }, []);

  const addForwardedPort = useCallback(() => {
    setEditorDraft((current) =>
      current
        ? {
            ...current,
            sshForwardedPorts: [
              ...current.sshForwardedPorts,
              {
                description: "",
                host: "127.0.0.1",
                id: `forward-${Date.now()}`,
                port: 3000,
                targetAddress: "127.0.0.1",
                targetPort: 3000,
                type: "local",
              } satisfies TerminalPortForward,
            ],
          }
        : current
    );
  }, []);

  const patchForwardedPort = useCallback(
    (index: number, partial: Partial<TerminalPortForward>) => {
      setEditorDraft((current) =>
        current
          ? {
              ...current,
              sshForwardedPorts: current.sshForwardedPorts.map(
                (forward, forwardIndex) =>
                  forwardIndex === index ? { ...forward, ...partial } : forward
              ),
            }
          : current
      );
    },
    []
  );

  const removeForwardedPort = useCallback((index: number) => {
    setEditorDraft((current) =>
      current
        ? {
            ...current,
            sshForwardedPorts: current.sshForwardedPorts.filter(
              (_, forwardIndex) => forwardIndex !== index
            ),
          }
        : current
    );
  }, []);

  const toggleAlgorithm = useCallback(
    (kind: keyof typeof TERMINAL_SSH_ALGORITHM_OPTIONS, algorithm: string) => {
      setEditorDraft((current) => {
        if (!current) {
          return current;
        }
        const active = current.sshAlgorithms[kind];
        const next = active.includes(algorithm)
          ? active.filter((item) => item !== algorithm)
          : [...active, algorithm];
        return {
          ...current,
          sshAlgorithms: {
            ...current.sshAlgorithms,
            [kind]: next,
          },
        };
      });
    },
    []
  );

  const pickPath = useCallback(
    async (opts: {
      kind: "file" | "directory";
      title: string;
      multi?: boolean;
      filters?: Array<{ name: string; extensions: string[] }>;
    }): Promise<string[]> => {
      const shell = window.maiShell;
      if (!shell) {
        return [];
      }
      const result = (await shell.invoke("term:pickPath", opts)) as {
        ok?: boolean;
        path?: string;
        paths?: string[];
      };
      if (!result?.ok) {
        return [];
      }
      return Array.isArray(result.paths)
        ? result.paths.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0
          )
        : typeof result.path === "string" && result.path.trim()
          ? [result.path]
          : [];
    },
    []
  );

  const pickWorkingDirectory = useCallback(async () => {
    const [picked] = await pickPath({
      kind: "directory",
      title: t("app.universalTerminalSettings.profiles.pickWorkingDirectory"),
    });
    if (picked) {
      patchEditorDraft({ cwd: picked });
    }
  }, [patchEditorDraft, pickPath, t]);

  const pickShellExecutable = useCallback(async () => {
    const [picked] = await pickPath({
      kind: "file",
      title: t("app.universalTerminalSettings.profiles.pickExecutable"),
    });
    if (picked) {
      patchEditorDraft({ shell: picked });
    }
  }, [patchEditorDraft, pickPath, t]);

  const addPrivateKeys = useCallback(async () => {
    const picked = await pickPath({
      kind: "file",
      multi: true,
      title: t("app.universalTerminalSettings.profiles.pickPrivateKeys"),
    });
    if (!picked.length) {
      return;
    }
    setEditorDraft((current) =>
      current
        ? {
            ...current,
            sshIdentityFiles: Array.from(
              new Set([...getSshIdentityFiles(current), ...picked])
            ),
          }
        : current
    );
  }, [pickPath, t]);

  const removePrivateKey = useCallback((index: number) => {
    setEditorDraft((current) =>
      current
        ? {
            ...current,
            sshIdentityFiles: current.sshIdentityFiles.filter(
              (_, itemIndex) => itemIndex !== index
            ),
          }
        : current
    );
  }, []);

  const saveEditorProfile = useCallback(() => {
    if (!editorDraft) {
      return;
    }
    const nextProfile = applyProfileNameFallback(
      applySshConnectionMode(editorDraft, editorSshConnectionMode),
      t
    );
    if (editorMode === "defaults" && defaultsKind) {
      const patch = terminalProfileToTypeDefaultsPatch(nextProfile);
      onPatchSettings({
        profileTypeDefaults: {
          ...settings.profileTypeDefaults,
          [defaultsKind]: patch,
        },
      });
      setEditorDraft(null);
      setDefaultsKind(null);
      setEditorMode("edit");
      return;
    }
    const alreadyExists = settings.profiles.some(
      (profile) => profile.id === nextProfile.id
    );
    const nextProfiles = alreadyExists
      ? settings.profiles.map((profile) =>
          profile.id === nextProfile.id ? nextProfile : profile
        )
      : [...settings.profiles, nextProfile];
    onPatchSettings({
      defaultProfileId: settings.defaultProfileId,
      profiles: nextProfiles,
    });
    onSelectProfile(nextProfile.id);
    setEditorDraft(null);
    setDefaultsKind(null);
  }, [
    defaultsKind,
    editorDraft,
    editorMode,
    editorSshConnectionMode,
    onPatchSettings,
    onSelectProfile,
    settings.defaultProfileId,
    settings.profileTypeDefaults,
    settings.profiles,
    t,
  ]);

  const deleteEditorProfile = useCallback(() => {
    if (!editorDraft || !canDeleteDraft) {
      return;
    }
    const remaining = settings.profiles.filter(
      (profile) => profile.id !== editorDraft.id
    );
    if (!remaining.length) {
      return;
    }
    const nextDefaultProfileId =
      settings.defaultProfileId === editorDraft.id
        ? remaining[0].id
        : settings.defaultProfileId;
    onPatchSettings({
      defaultProfileId: nextDefaultProfileId,
      profiles: remaining,
    });
    void window.maiShell?.invoke("term:profilePasswordClear", editorDraft.id);
    onSelectProfile(remaining[0].id);
    setEditorDraft(null);
    setDefaultsKind(null);
    setEditorHasSavedPassword(false);
  }, [
    canDeleteDraft,
    editorDraft,
    onPatchSettings,
    onSelectProfile,
    settings.defaultProfileId,
    settings.profiles,
  ]);

  useEffect(() => {
    if (!rowMenuProfileId) {
      return;
    }
    const onMouseDown = (event: MouseEvent) => {
      if (rowMenuRef.current?.contains(event.target as Node)) {
        return;
      }
      setRowMenuProfileId(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [rowMenuProfileId]);

  useEffect(() => {
    if (!editorOpen && !createDialogOpen && !passwordModal.open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (passwordModal.open) {
        event.preventDefault();
        event.stopPropagation();
        closeProfilePasswordModal();
        return;
      }
      setCreateDialogOpen(false);
      setEditorDraft(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    closeProfilePasswordModal,
    createDialogOpen,
    editorOpen,
    passwordModal.open,
  ]);

  useEffect(() => {
    if (!passwordModal.open || passwordModal.mode !== "set") {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      profilePasswordInputRef.current?.focus();
      profilePasswordInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [passwordModal]);

  useEffect(() => {
    if (profilesSubtab !== "profiles") {
      setCreateDialogOpen(false);
    }
  }, [profilesSubtab]);

  useEffect(() => {
    setRowMenuProfileId(null);
  }, [filter, activeProfile.id]);

  useEffect(() => {
    if (!editorDraft) {
      return;
    }
    const availableTabs = new Set(
      getEditorTabsForProfile(editorDraft, t).map((tab) => tab.id)
    );
    if (!availableTabs.has(editorTab)) {
      setEditorTab("general");
    }
  }, [editorDraft, editorTab, t]);

  return (
    <div className="ref-uterm-settings-page">
      <div className="ref-uterm-settings-page-head">
        <div>
          <h2 className="ref-uterm-settings-page-title">
            {t("app.universalTerminalSettings.profilesPageTitle")}
          </h2>
          <p className="ref-uterm-settings-page-copy">
            {profilesSubtab === "profiles"
              ? t("app.universalTerminalSettings.profiles.lead")
              : t("app.universalTerminalSettings.profiles.advancedLead")}
          </p>
        </div>
      </div>

      <div
        aria-label={t("app.universalTerminalSettings.profilesPageTitle")}
        className="ref-uterm-settings-subtabs ref-uterm-settings-subtabs--profiles"
        role="tablist"
      >
        <SubtabButton
          active={profilesSubtab === "profiles"}
          label={t("app.universalTerminalSettings.profilesSubtab.profiles")}
          onClick={() => onChangeSubtab("profiles")}
        />
        <SubtabButton
          active={profilesSubtab === "advanced"}
          label={t("app.universalTerminalSettings.profilesSubtab.advanced")}
          onClick={() => onChangeSubtab("advanced")}
        />
      </div>

      {profilesSubtab === "profiles" ? (
        <>
          <div className="ref-uterm-settings-default-stack">
            <div className="ref-uterm-settings-default-label">
              {t("app.universalTerminalSettings.profiles.defaultProfileLabel")}
            </div>
            <div className="ref-uterm-settings-default-copy">
              {t("app.universalTerminalSettings.profiles.defaultProfileHint")}
            </div>
            <div className="ref-uterm-settings-default-picker">
              <VoidSelect
                ariaLabel={t(
                  "app.universalTerminalSettings.profiles.defaultProfileLabel"
                )}
                className="ref-uterm-settings-default-void-select"
                id="ref-uterm-settings-default-profile-select"
                onChange={(next) => onPatchSettings({ defaultProfileId: next })}
                options={defaultProfileSelectOptions}
                value={settings.defaultProfileId}
              />
            </div>
          </div>

          <div className="ref-uterm-settings-toolbar">
            <div className="ref-uterm-settings-toolbar-actions">
              <div className="ref-uterm-settings-search">
                <span aria-hidden className="ref-uterm-settings-search-ico">
                  <IconSearchSmall />
                </span>
                <input
                  className="ref-uterm-settings-input"
                  onChange={(event) => onFilterChange(event.target.value)}
                  placeholder={t(
                    "app.universalTerminalSettings.profiles.filter"
                  )}
                  type="search"
                  value={filter}
                />
              </div>
              <button
                className="ref-uterm-settings-primary-btn"
                onClick={openCreateDialog}
                type="button"
              >
                <span className="ref-uterm-settings-primary-btn-plus">+</span>
                <span>
                  {t("app.universalTerminalSettings.profiles.newButton")}
                </span>
              </button>
            </div>
          </div>

          <div className="ref-uterm-settings-profiles-workbench">
            <div className="ref-uterm-settings-profile-list-shell">
              {[
                ...customProfileGroups,
                {
                  id: "builtin",
                  items: filteredBuiltinProfiles,
                  label: t(
                    "app.universalTerminalSettings.profiles.group.builtin"
                  ),
                },
              ].map((group) => (
                <div
                  className={`ref-uterm-settings-profile-group ${collapsedGroups[group.id] ? "is-collapsed" : "is-expanded"}`}
                  key={group.id}
                >
                  <button
                    aria-expanded={!collapsedGroups[group.id]}
                    className="ref-uterm-settings-profile-group-head"
                    onClick={() => onToggleGroup(group.id)}
                    type="button"
                  >
                    <span
                      className={`ref-uterm-settings-profile-group-chevron ${collapsedGroups[group.id] ? "is-collapsed" : ""}`}
                    >
                      ▾
                    </span>
                    <span className="ref-uterm-settings-profile-group-label">
                      {group.label}
                    </span>
                    <span className="ref-uterm-settings-profile-group-count">
                      {group.items.length}
                    </span>
                  </button>
                  {collapsedGroups[group.id] ? null : group.items.length > 0 ? (
                    <div className="ref-uterm-settings-profile-group-body">
                      {group.items.map((profile) => {
                        const displayProfile = withTerminalProfileDisplayName(
                          profile,
                          t
                        );
                        const isBuiltin = isBuiltinTerminalProfileId(
                          profile.id
                        );
                        const isActive =
                          !isBuiltin && profile.id === activeProfile.id;
                        const visual = getTerminalProfileVisual(displayProfile);
                        const menuOpen = rowMenuProfileId === profile.id;
                        const canRemove =
                          !isBuiltin &&
                          settings.profiles.length > 1 &&
                          profile.id !== DEFAULT_PROFILE_ID;
                        return (
                          <div
                            className={`ref-uterm-settings-profile-list-item ${isActive ? "is-active" : ""} ${menuOpen ? "has-menu-open" : ""} ${isBuiltin ? "is-builtin" : ""}`}
                            key={profile.id}
                            onClick={() => {
                              if (!isBuiltin) {
                                openProfileEditor(profile.id);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (isBuiltin) {
                                return;
                              }
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openProfileEditor(profile.id);
                              }
                            }}
                            role={isBuiltin ? undefined : "button"}
                            tabIndex={isBuiltin ? undefined : 0}
                          >
                            <span
                              className={`ref-uterm-settings-profile-list-item-icon is-${visual.tone}`}
                            >
                              {visual.icon}
                            </span>
                            <div className="ref-uterm-settings-profile-list-item-main">
                              <span className="ref-uterm-settings-profile-list-item-title">
                                {displayProfile.name ||
                                  t(
                                    "app.universalTerminalSettings.profiles.untitled"
                                  )}
                              </span>
                              <span
                                className="ref-uterm-settings-profile-list-item-meta"
                                title={describeProfileTarget(displayProfile, t)}
                              >
                                {describeProfileTarget(displayProfile, t)}
                              </span>
                            </div>
                            <div className="ref-uterm-settings-profile-list-item-actions">
                              <button
                                aria-label={t(
                                  "app.universalTerminalSettings.profiles.open"
                                )}
                                className="ref-uterm-settings-profile-action-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onLaunchProfile(profile.id);
                                }}
                                title={t(
                                  "app.universalTerminalSettings.profiles.open"
                                )}
                                type="button"
                              >
                                <IconPlaySmall />
                              </button>
                              <div
                                className="ref-uterm-settings-profile-action-menu"
                                ref={menuOpen ? rowMenuRef : null}
                              >
                                <button
                                  aria-label={t(
                                    "app.universalTerminalSettings.profileActions"
                                  )}
                                  className={`ref-uterm-settings-profile-action-btn ${menuOpen ? "is-active" : ""}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setRowMenuProfileId((prev) =>
                                      prev === profile.id ? null : profile.id
                                    );
                                  }}
                                  title={t(
                                    "app.universalTerminalSettings.profileActions"
                                  )}
                                  type="button"
                                >
                                  <IconMoreVerticalSmall />
                                </button>
                                {menuOpen ? (
                                  <div
                                    className="ref-uterm-dropdown ref-uterm-settings-row-dropdown"
                                    role="menu"
                                  >
                                    <button
                                      className="ref-uterm-dropdown-item"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setRowMenuProfileId(null);
                                        onLaunchProfile(profile.id);
                                      }}
                                      role="menuitem"
                                      type="button"
                                    >
                                      {t(
                                        "app.universalTerminalSettings.profiles.open"
                                      )}
                                    </button>
                                    <button
                                      className="ref-uterm-dropdown-item"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setRowMenuProfileId(null);
                                        openTemplateEditor(profile.id);
                                      }}
                                      role="menuitem"
                                      type="button"
                                    >
                                      {t(
                                        "app.universalTerminalSettings.duplicateProfile"
                                      )}
                                    </button>
                                    {settings.defaultProfileId ===
                                    profile.id ? null : (
                                      <button
                                        className="ref-uterm-dropdown-item"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setRowMenuProfileId(null);
                                          onPatchSettings({
                                            defaultProfileId: profile.id,
                                          });
                                        }}
                                        role="menuitem"
                                        type="button"
                                      >
                                        {t(
                                          "app.universalTerminalSettings.profiles.setDefault"
                                        )}
                                      </button>
                                    )}
                                    {isBuiltin ? null : (
                                      <button
                                        className="ref-uterm-dropdown-item"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setRowMenuProfileId(null);
                                          openProfileEditor(profile.id);
                                        }}
                                        role="menuitem"
                                        type="button"
                                      >
                                        {t(
                                          "app.universalTerminalSettings.profiles.edit"
                                        )}
                                      </button>
                                    )}
                                    {isBuiltin ? null : (
                                      <button
                                        className="ref-uterm-dropdown-item ref-uterm-dropdown-item--danger"
                                        disabled={!canRemove}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setRowMenuProfileId(null);
                                          if (!canRemove) {
                                            return;
                                          }
                                          const remaining =
                                            settings.profiles.filter(
                                              (item) => item.id !== profile.id
                                            );
                                          const nextDefaultProfileId =
                                            settings.defaultProfileId ===
                                            profile.id
                                              ? (remaining[0]?.id ??
                                                DEFAULT_PROFILE_ID)
                                              : settings.defaultProfileId;
                                          onPatchSettings({
                                            defaultProfileId:
                                              nextDefaultProfileId,
                                            profiles: remaining,
                                          });
                                          void window.maiShell?.invoke(
                                            "term:profilePasswordClear",
                                            profile.id
                                          );
                                          if (isActive) {
                                            setEditorDraft(null);
                                            onSelectProfile(
                                              remaining[0]?.id ??
                                                DEFAULT_PROFILE_ID
                                            );
                                          }
                                        }}
                                        role="menuitem"
                                        type="button"
                                      >
                                        {t(
                                          "app.universalTerminalSettings.profiles.remove"
                                        )}
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="ref-uterm-settings-profile-list-item-side">
                              {settings.defaultProfileId === profile.id ? (
                                <span className="ref-uterm-settings-badge ref-uterm-settings-badge--accent">
                                  {t(
                                    "app.universalTerminalSettings.profiles.defaultBadge"
                                  )}
                                </span>
                              ) : null}
                              {displayProfile.kind === "ssh" ? (
                                <span className="ref-uterm-settings-badge ref-uterm-settings-badge--ssh">
                                  {t(
                                    "app.universalTerminalSettings.profiles.kindBadge.ssh"
                                  )}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ref-uterm-settings-empty-list">
                      {t("app.universalTerminalSettings.profiles.emptyGroup")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="ref-uterm-settings-advanced-page">
          <div className="ref-uterm-settings-advanced-page-inner">
            {settings.profiles.length > 0 ? (
              <>
                <div className="ref-uterm-settings-form-line">
                  <div className="ref-uterm-settings-form-line-header">
                    <div className="ref-uterm-settings-form-line-title">
                      {t(
                        "app.universalTerminalSettings.profiles.advancedRecentTitle"
                      )}
                    </div>
                    <div className="ref-uterm-settings-form-line-desc">
                      {t(
                        "app.universalTerminalSettings.profiles.advancedRecentDesc"
                      )}
                    </div>
                  </div>
                  <div className="ref-uterm-settings-form-line-control">
                    <input
                      className="ref-uterm-settings-input ref-uterm-settings-input--form-line"
                      max={50}
                      min={0}
                      onChange={(event) => {
                        const raw = Number(event.target.value);
                        const next = Number.isFinite(raw)
                          ? Math.min(50, Math.max(0, Math.floor(raw)))
                          : 0;
                        onPatchSettings({ profileSelectorRecentMax: next });
                      }}
                      step={1}
                      type="number"
                      value={settings.profileSelectorRecentMax}
                    />
                  </div>
                </div>
                <div className="ref-uterm-settings-form-line">
                  <div className="ref-uterm-settings-form-line-header">
                    <div className="ref-uterm-settings-form-line-title">
                      {t(
                        "app.universalTerminalSettings.profiles.advancedBuiltinTitle"
                      )}
                    </div>
                    <div className="ref-uterm-settings-form-line-desc">
                      {t(
                        "app.universalTerminalSettings.profiles.advancedBuiltinDesc"
                      )}
                    </div>
                  </div>
                  <div className="ref-uterm-settings-form-line-control ref-uterm-settings-form-line-control--toggle">
                    <ToggleSwitch
                      checked={settings.profileSelectorShowBuiltin}
                      onChange={(next) =>
                        onPatchSettings({ profileSelectorShowBuiltin: next })
                      }
                    />
                  </div>
                </div>
              </>
            ) : null}

            <div className="ref-uterm-settings-advanced-defaults-block">
              <div className="ref-uterm-settings-form-line-header ref-uterm-settings-form-line-header--block">
                <div className="ref-uterm-settings-form-line-title">
                  {t(
                    "app.universalTerminalSettings.profiles.advancedDefaultsTitle"
                  )}
                </div>
                <div className="ref-uterm-settings-form-line-desc">
                  {t(
                    "app.universalTerminalSettings.profiles.advancedDefaultsDesc"
                  )}
                </div>
              </div>
              <div
                className="ref-uterm-settings-advanced-defaults-list"
                role="list"
              >
                {(
                  [
                    {
                      id: "builtin:system-default" as const,
                      label: t(
                        "app.universalTerminalSettings.profiles.advancedDefaultRowLocal"
                      ),
                    },
                    {
                      id: "builtin:ssh-template" as const,
                      label: t(
                        "app.universalTerminalSettings.profiles.advancedDefaultRowSsh"
                      ),
                    },
                  ] as const
                ).map((row) => (
                  <button
                    className="ref-uterm-settings-advanced-defaults-row"
                    key={row.id}
                    onClick={() =>
                      openDefaultsEditor(
                        row.id === "builtin:ssh-template" ? "ssh" : "local"
                      )
                    }
                    role="listitem"
                    type="button"
                  >
                    <span className="ref-uterm-settings-advanced-defaults-row-label">
                      {row.label}
                    </span>
                    <span
                      aria-hidden
                      className="ref-uterm-settings-advanced-defaults-row-chevron"
                    >
                      ›
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ref-uterm-settings-form-line ref-uterm-settings-form-line--footer">
              <div className="ref-uterm-settings-form-line-header">
                <div className="ref-uterm-settings-form-line-title">
                  {t("app.universalTerminalSettings.resetAll")}
                </div>
                <div className="ref-uterm-settings-form-line-desc">
                  {t(
                    "app.universalTerminalSettings.profiles.advancedResetDesc"
                  )}
                </div>
              </div>
              <div className="ref-uterm-settings-form-line-control">
                <button
                  className="ref-uterm-settings-danger-btn ref-uterm-settings-danger-btn--form-line"
                  onClick={() => onPatchSettings(defaultTerminalSettings())}
                  type="button"
                >
                  {t("app.universalTerminalSettings.resetAll")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {createDialogOpen ? (
        <div className="ref-uterm-settings-modal-layer" role="presentation">
          <button
            aria-label={t("app.universalTerminalSettings.closeEditor")}
            className="ref-uterm-settings-modal-backdrop"
            onClick={() => setCreateDialogOpen(false)}
            type="button"
          />
          <div
            aria-label={t(
              "app.universalTerminalSettings.profiles.newDialogTitle"
            )}
            aria-modal="true"
            className="ref-uterm-settings-modal"
            role="dialog"
          >
            <div className="ref-uterm-settings-modal-shell">
              <div className="ref-uterm-settings-modal-head">
                <div>
                  <div className="ref-uterm-settings-modal-title">
                    {t("app.universalTerminalSettings.profiles.newDialogTitle")}
                  </div>
                  <p className="ref-uterm-settings-modal-copy">
                    {t("app.universalTerminalSettings.profiles.newDialogCopy")}
                  </p>
                </div>
                <button
                  className="ref-uterm-settings-secondary-btn"
                  onClick={() => setCreateDialogOpen(false)}
                  type="button"
                >
                  {t("app.universalTerminalSettings.profiles.newDialogCancel")}
                </button>
              </div>

              <div className="ref-uterm-settings-search ref-uterm-settings-modal-search">
                <span aria-hidden className="ref-uterm-settings-search-ico">
                  <IconSearchSmall />
                </span>
                <input
                  className="ref-uterm-settings-input"
                  onChange={(event) => setCreateFilter(event.target.value)}
                  placeholder={t(
                    "app.universalTerminalSettings.profiles.newDialogSearch"
                  )}
                  type="search"
                  value={createFilter}
                />
              </div>

              <div className="ref-uterm-settings-modal-list">
                {createDialogGroups.length > 0 ? (
                  createDialogGroups.map((group) => (
                    <div
                      className="ref-uterm-settings-modal-section"
                      key={group.id}
                    >
                      <div className="ref-uterm-settings-modal-section-title">
                        {group.label}
                      </div>
                      <div className="ref-uterm-settings-profile-group-body">
                        {group.items.map((profile) => {
                          const visual = getTerminalProfileVisual(profile);
                          return (
                            <button
                              className="ref-uterm-settings-profile-list-item ref-uterm-settings-profile-list-item--template"
                              key={profile.id}
                              onClick={() => openTemplateEditor(profile.id)}
                              type="button"
                            >
                              <span
                                className={`ref-uterm-settings-profile-list-item-icon is-${visual.tone}`}
                              >
                                {visual.icon}
                              </span>
                              <div className="ref-uterm-settings-profile-list-item-main">
                                <span className="ref-uterm-settings-profile-list-item-title">
                                  {profile.name ||
                                    t(
                                      "app.universalTerminalSettings.profiles.untitled"
                                    )}
                                </span>
                                <span
                                  className="ref-uterm-settings-profile-list-item-meta"
                                  title={describeProfileTarget(profile, t)}
                                >
                                  {describeProfileTarget(profile, t)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ref-uterm-settings-modal-empty">
                    {t("app.universalTerminalSettings.profiles.newDialogEmpty")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editorOpen && editorDraft && editorVisual ? (
        <div className="ref-uterm-settings-drawer-layer" role="presentation">
          <button
            aria-label={t("app.universalTerminalSettings.closeEditor")}
            className="ref-uterm-settings-drawer-backdrop"
            onClick={closeProfileEditor}
            type="button"
          />
          <div
            aria-label={
              editorMode === "defaults" && defaultsKind
                ? defaultsKind === "ssh"
                  ? t(
                      "app.universalTerminalSettings.profiles.defaultsEditorTitleSsh"
                    )
                  : t(
                      "app.universalTerminalSettings.profiles.defaultsEditorTitleLocal"
                    )
                : editorMode === "create"
                  ? t("app.universalTerminalSettings.profiles.editorTitleNew")
                  : editorDraft.name ||
                    t("app.universalTerminalSettings.profiles.untitled")
            }
            aria-modal="true"
            className="ref-uterm-settings-profile-modal"
            role="dialog"
          >
            <div className="ref-uterm-settings-profile-modal-shell">
              <div className="ref-uterm-settings-profile-editor-head">
                <div className="ref-uterm-settings-profile-editor-heading">
                  <div>
                    <div className="ref-uterm-settings-profile-editor-title">
                      {editorMode === "defaults" && defaultsKind
                        ? defaultsKind === "ssh"
                          ? t(
                              "app.universalTerminalSettings.profiles.defaultsEditorTitleSsh"
                            )
                          : t(
                              "app.universalTerminalSettings.profiles.defaultsEditorTitleLocal"
                            )
                        : editorMode === "create"
                          ? t(
                              "app.universalTerminalSettings.profiles.editorTitleNew"
                            )
                          : editorDraft.name ||
                            t(
                              "app.universalTerminalSettings.profiles.untitled"
                            )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ref-uterm-settings-profile-modal-body">
                <div className="ref-uterm-settings-profile-modal-sidebar">
                  <div className="ref-uterm-settings-profile-side-form">
                    <FieldStack
                      label={t("app.universalTerminalSettings.profiles.name")}
                    >
                      <input
                        autoFocus
                        className="ref-uterm-settings-input"
                        onChange={(event) =>
                          patchEditorDraft({ name: event.target.value })
                        }
                        type="text"
                        value={editorDraft.name}
                      />
                    </FieldStack>

                    <FieldStack
                      label={t(
                        "app.universalTerminalSettings.profiles.groupLabel"
                      )}
                    >
                      <input
                        className="ref-uterm-settings-input"
                        onChange={(event) =>
                          patchEditorDraft({ group: event.target.value })
                        }
                        placeholder={t(
                          "app.universalTerminalSettings.profiles.groupPlaceholder"
                        )}
                        type="text"
                        value={editorDraft.group}
                      />
                    </FieldStack>

                    <FieldStack
                      label={t(
                        "app.universalTerminalSettings.profiles.iconLabel"
                      )}
                    >
                      <div className="ref-uterm-settings-input-action">
                        <input
                          className="ref-uterm-settings-input"
                          onChange={(event) =>
                            patchEditorDraft({ icon: event.target.value })
                          }
                          placeholder={t(
                            "app.universalTerminalSettings.profiles.iconPlaceholder"
                          )}
                          type="text"
                          value={editorDraft.icon}
                        />
                        <div
                          aria-hidden
                          className="ref-uterm-settings-icon-preview"
                        >
                          {editorVisual.icon}
                        </div>
                      </div>
                    </FieldStack>

                    <FieldStack
                      label={t(
                        "app.universalTerminalSettings.profiles.colorLabel"
                      )}
                    >
                      <input
                        className="ref-uterm-settings-input"
                        onChange={(event) =>
                          patchEditorDraft({ color: event.target.value })
                        }
                        placeholder="#000000"
                        type="text"
                        value={editorDraft.color}
                      />
                    </FieldStack>

                    <ToggleField
                      checked={editorDraft.disableDynamicTitle}
                      hint={t(
                        "app.universalTerminalSettings.profiles.disableDynamicTitleHint"
                      )}
                      label={t(
                        "app.universalTerminalSettings.profiles.disableDynamicTitle"
                      )}
                      onChange={(next) =>
                        patchEditorDraft({ disableDynamicTitle: next })
                      }
                    />

                    <FieldStack
                      hint={t(
                        "app.universalTerminalSettings.profiles.sessionEndBehaviorHint"
                      )}
                      label={t(
                        "app.universalTerminalSettings.profiles.sessionEndBehavior"
                      )}
                    >
                      <select
                        className="ref-uterm-settings-select"
                        onChange={(event) =>
                          patchEditorDraft({
                            behaviorOnSessionEnd: event.target
                              .value as TerminalProfile["behaviorOnSessionEnd"],
                          })
                        }
                        value={editorDraft.behaviorOnSessionEnd}
                      >
                        <option value="auto">
                          {t(
                            "app.universalTerminalSettings.profiles.sessionEnd.auto"
                          )}
                        </option>
                        <option value="keep">
                          {t(
                            "app.universalTerminalSettings.profiles.sessionEnd.keep"
                          )}
                        </option>
                        <option value="reconnect">
                          {t(
                            "app.universalTerminalSettings.profiles.sessionEnd.reconnect"
                          )}
                        </option>
                        <option value="close">
                          {t(
                            "app.universalTerminalSettings.profiles.sessionEnd.close"
                          )}
                        </option>
                      </select>
                    </FieldStack>

                    {editorDraft.kind === "ssh" ? (
                      <ToggleField
                        checked={editorDraft.clearServiceMessagesOnConnect}
                        label={t(
                          "app.universalTerminalSettings.profiles.clearOnConnect"
                        )}
                        onChange={(next) =>
                          patchEditorDraft({
                            clearServiceMessagesOnConnect: next,
                          })
                        }
                      />
                    ) : null}
                  </div>

                  {sshIncomplete ? (
                    <div className="ref-uterm-settings-callout">
                      {t(
                        "app.universalTerminalSettings.profiles.sshIncomplete"
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="ref-uterm-settings-profile-modal-main">
                  <div
                    aria-label={t(
                      "app.universalTerminalSettings.profiles.editorTabsLabel"
                    )}
                    className="ref-uterm-settings-editor-tabs"
                    role="tablist"
                  >
                    {getEditorTabsForProfile(editorDraft, t).map((tab) => (
                      <button
                        aria-selected={editorTab === tab.id}
                        className={`ref-uterm-settings-editor-tab ${editorTab === tab.id ? "is-active" : ""}`}
                        key={tab.id}
                        onClick={() => setEditorTab(tab.id)}
                        role="tab"
                        type="button"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {editorDraft.kind === "ssh" ? (
                    <>
                      {editorTab === "general" ? (
                        <div className="ref-uterm-settings-modal-page">
                          <div className="ref-uterm-settings-ssh-grid">
                            <FieldStack
                              label={t(
                                "app.universalTerminalSettings.profiles.connectionMode"
                              )}
                            >
                              <select
                                className="ref-uterm-settings-select"
                                onChange={(event) =>
                                  setEditorSshConnectionMode(
                                    event.target
                                      .value as TerminalSshConnectionMode
                                  )
                                }
                                value={editorSshConnectionMode}
                              >
                                <option value="direct">
                                  {t(
                                    "app.universalTerminalSettings.profiles.connection.direct"
                                  )}
                                </option>
                                <option value="proxyCommand">
                                  {t(
                                    "app.universalTerminalSettings.profiles.connection.proxyCommand"
                                  )}
                                </option>
                                <option value="jumpHost">
                                  {t(
                                    "app.universalTerminalSettings.profiles.connection.jumpHost"
                                  )}
                                </option>
                              </select>
                            </FieldStack>

                            {editorSshConnectionMode === "proxyCommand" ? (
                              <FieldStack
                                label={t(
                                  "app.universalTerminalSettings.profiles.sshProxyCommand"
                                )}
                              >
                                <input
                                  className="ref-uterm-settings-input"
                                  onChange={(event) =>
                                    patchEditorDraft({
                                      sshProxyCommand: event.target.value,
                                    })
                                  }
                                  placeholder={t(
                                    "app.universalTerminalSettings.profiles.sshProxyCommandPlaceholder"
                                  )}
                                  type="text"
                                  value={editorDraft.sshProxyCommand}
                                />
                              </FieldStack>
                            ) : (
                              <FieldStack
                                label={t(
                                  "app.universalTerminalSettings.profiles.sshHost"
                                )}
                              >
                                <input
                                  className="ref-uterm-settings-input"
                                  onChange={(event) =>
                                    patchEditorDraft({
                                      sshHost: event.target.value,
                                    })
                                  }
                                  placeholder="192.168.1.201"
                                  type="text"
                                  value={editorDraft.sshHost}
                                />
                              </FieldStack>
                            )}

                            <FieldStack
                              label={t(
                                "app.universalTerminalSettings.profiles.sshPort"
                              )}
                            >
                              <input
                                className="ref-uterm-settings-input"
                                max={65_535}
                                min={1}
                                onChange={(event) =>
                                  patchEditorDraft({
                                    sshPort: Math.max(
                                      1,
                                      Math.min(
                                        65_535,
                                        Math.floor(
                                          Number(event.target.value) || 22
                                        )
                                      )
                                    ),
                                  })
                                }
                                type="number"
                                value={editorDraft.sshPort}
                              />
                            </FieldStack>
                          </div>

                          {editorSshConnectionMode === "jumpHost" ? (
                            <FieldStack
                              label={t(
                                "app.universalTerminalSettings.profiles.sshJumpHost"
                              )}
                            >
                              <input
                                className="ref-uterm-settings-input"
                                onChange={(event) =>
                                  patchEditorDraft({
                                    sshJumpHost: event.target.value,
                                  })
                                }
                                placeholder={t(
                                  "app.universalTerminalSettings.profiles.sshJumpHostPlaceholder"
                                )}
                                type="text"
                                value={editorDraft.sshJumpHost}
                              />
                            </FieldStack>
                          ) : null}

                          <FieldStack
                            label={t(
                              "app.universalTerminalSettings.profiles.sshUser"
                            )}
                          >
                            <input
                              className="ref-uterm-settings-input"
                              onChange={(event) =>
                                patchEditorDraft({
                                  sshUser: event.target.value,
                                })
                              }
                              placeholder="licl"
                              type="text"
                              value={editorDraft.sshUser}
                            />
                          </FieldStack>

                          <FieldStack
                            label={t(
                              "app.universalTerminalSettings.profiles.sshAuthMode"
                            )}
                          >
                            <div className="ref-uterm-settings-authbar">
                              {(
                                [
                                  "auto",
                                  "password",
                                  "publicKey",
                                  "agent",
                                  "keyboardInteractive",
                                ] as TerminalSshAuthMode[]
                              ).map((mode) => (
                                <button
                                  className={`ref-uterm-settings-authbar-item ${editorDraft.sshAuthMode === mode ? "is-active" : ""}`}
                                  key={mode}
                                  onClick={() =>
                                    patchEditorDraft({ sshAuthMode: mode })
                                  }
                                  type="button"
                                >
                                  <span
                                    aria-hidden
                                    className="ref-uterm-settings-authbar-icon"
                                  >
                                    {renderSshAuthGlyph(mode)}
                                  </span>
                                  <span>
                                    {t(
                                      `app.universalTerminalSettings.profiles.sshAuth.${mode}`
                                    )}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </FieldStack>

                          {editorDraft.sshAuthMode === "password" ? (
                            <div className="ref-uterm-settings-password-row">
                              <div>
                                <div className="ref-uterm-settings-profile-meta-label">
                                  {t(
                                    "app.universalTerminalSettings.profiles.passwordLabel"
                                  )}
                                </div>
                                <div className="ref-uterm-settings-hint">
                                  {t(
                                    "app.universalTerminalSettings.profiles.passwordHint"
                                  )}
                                </div>
                              </div>
                              <button
                                className={
                                  editorHasSavedPassword
                                    ? "ref-uterm-settings-danger-btn"
                                    : "ref-uterm-settings-success-btn"
                                }
                                onClick={() =>
                                  void (editorHasSavedPassword
                                    ? openProfilePasswordClearModal()
                                    : openProfilePasswordSetModal())
                                }
                                type="button"
                              >
                                {editorHasSavedPassword
                                  ? t(
                                      "app.universalTerminalSettings.profiles.forgetPassword"
                                    )
                                  : t(
                                      "app.universalTerminalSettings.profiles.setPassword"
                                    )}
                              </button>
                            </div>
                          ) : null}

                          <FieldStack
                            label={t(
                              "app.universalTerminalSettings.profiles.sshPrivateKeys"
                            )}
                          >
                            <div className="ref-uterm-settings-stack-control">
                              <div className="ref-uterm-settings-pathlist">
                                {getSshIdentityFiles(editorDraft).length > 0 ? (
                                  getSshIdentityFiles(editorDraft).map(
                                    (item, index) => (
                                      <div
                                        className="ref-uterm-settings-pathlist-item"
                                        key={`${item}:${index}`}
                                      >
                                        <span
                                          className="ref-uterm-settings-pathlist-text"
                                          title={item}
                                        >
                                          {item}
                                        </span>
                                        <button
                                          className="ref-uterm-settings-pathlist-remove"
                                          onClick={() =>
                                            removePrivateKey(index)
                                          }
                                          type="button"
                                        >
                                          {t(
                                            "app.universalTerminalSettings.profiles.removeKey"
                                          )}
                                        </button>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <div className="ref-uterm-settings-pathlist-empty">
                                    {t(
                                      "app.universalTerminalSettings.profiles.sshPrivateKeysEmpty"
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                className="ref-uterm-settings-secondary-btn"
                                onClick={() => void addPrivateKeys()}
                                type="button"
                              >
                                {t(
                                  "app.universalTerminalSettings.profiles.pickPrivateKeys"
                                )}
                              </button>
                            </div>
                          </FieldStack>
                        </div>
                      ) : null}

                      {editorTab === "advanced" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.editorAdvancedTitle"
                          )}
                        >
                          <div className="ref-uterm-settings-form">
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.sshExtraArgs"
                              )}
                            >
                              <input
                                className="ref-uterm-settings-input"
                                onChange={(event) =>
                                  patchEditorDraft({
                                    sshExtraArgs: event.target.value,
                                  })
                                }
                                placeholder={t(
                                  "app.universalTerminalSettings.profiles.sshExtraArgsPlaceholder"
                                )}
                                type="text"
                                value={editorDraft.sshExtraArgs}
                              />
                            </Field>
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.sshRemoteCommand"
                              )}
                            >
                              <input
                                className="ref-uterm-settings-input"
                                onChange={(event) =>
                                  patchEditorDraft({
                                    sshRemoteCommand: event.target.value,
                                  })
                                }
                                placeholder={t(
                                  "app.universalTerminalSettings.profiles.sshRemoteCommandPlaceholder"
                                )}
                                type="text"
                                value={editorDraft.sshRemoteCommand}
                              />
                            </Field>
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.cwd"
                              )}
                            >
                              <div className="ref-uterm-settings-input-action">
                                <input
                                  className="ref-uterm-settings-input"
                                  onChange={(event) =>
                                    patchEditorDraft({
                                      cwd: event.target.value,
                                    })
                                  }
                                  placeholder={t(
                                    "app.universalTerminalSettings.profiles.cwdPlaceholder"
                                  )}
                                  type="text"
                                  value={editorDraft.cwd}
                                />
                                <button
                                  className="ref-uterm-settings-secondary-btn ref-uterm-settings-secondary-btn--compact"
                                  onClick={() => void pickWorkingDirectory()}
                                  type="button"
                                >
                                  {t(
                                    "app.universalTerminalSettings.profiles.browse"
                                  )}
                                </button>
                              </div>
                            </Field>
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.sshKeepAliveInterval"
                              )}
                            >
                              <input
                                className="ref-uterm-settings-input ref-uterm-settings-input--narrow"
                                max={86_400}
                                min={0}
                                onChange={(event) =>
                                  patchEditorDraft({
                                    sshKeepAliveInterval: Math.max(
                                      0,
                                      Math.floor(
                                        Number(event.target.value) || 0
                                      )
                                    ),
                                  })
                                }
                                type="number"
                                value={editorDraft.sshKeepAliveInterval}
                              />
                            </Field>
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.sshKeepAliveCountMax"
                              )}
                            >
                              <input
                                className="ref-uterm-settings-input ref-uterm-settings-input--narrow"
                                max={20}
                                min={1}
                                onChange={(event) =>
                                  patchEditorDraft({
                                    sshKeepAliveCountMax: Math.max(
                                      1,
                                      Math.floor(
                                        Number(event.target.value) || 3
                                      )
                                    ),
                                  })
                                }
                                type="number"
                                value={editorDraft.sshKeepAliveCountMax}
                              />
                            </Field>
                          </div>
                        </SettingsSection>
                      ) : null}

                      {editorTab === "ports" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.tab.ports"
                          )}
                        >
                          <div className="ref-uterm-settings-stack-control">
                            {editorDraft.sshForwardedPorts.map(
                              (forward, index) => (
                                <div
                                  className="ref-uterm-settings-port-card"
                                  key={forward.id}
                                >
                                  <div className="ref-uterm-settings-port-grid">
                                    <FieldStack
                                      label={t(
                                        "app.universalTerminalSettings.profiles.forward.type"
                                      )}
                                    >
                                      <select
                                        className="ref-uterm-settings-select"
                                        onChange={(event) =>
                                          patchForwardedPort(index, {
                                            type: event.target
                                              .value as TerminalPortForwardType,
                                          })
                                        }
                                        value={forward.type}
                                      >
                                        <option value="local">
                                          {t(
                                            "app.universalTerminalSettings.profiles.forward.local"
                                          )}
                                        </option>
                                        <option value="remote">
                                          {t(
                                            "app.universalTerminalSettings.profiles.forward.remote"
                                          )}
                                        </option>
                                        <option value="dynamic">
                                          {t(
                                            "app.universalTerminalSettings.profiles.forward.dynamic"
                                          )}
                                        </option>
                                      </select>
                                    </FieldStack>
                                    <FieldStack
                                      label={t(
                                        "app.universalTerminalSettings.profiles.forward.host"
                                      )}
                                    >
                                      <input
                                        className="ref-uterm-settings-input"
                                        onChange={(event) =>
                                          patchForwardedPort(index, {
                                            host: event.target.value,
                                          })
                                        }
                                        type="text"
                                        value={forward.host}
                                      />
                                    </FieldStack>
                                    <FieldStack
                                      label={t(
                                        "app.universalTerminalSettings.profiles.forward.port"
                                      )}
                                    >
                                      <input
                                        className="ref-uterm-settings-input"
                                        max={65_535}
                                        min={0}
                                        onChange={(event) =>
                                          patchForwardedPort(index, {
                                            port: Math.max(
                                              0,
                                              Math.min(
                                                65_535,
                                                Math.floor(
                                                  Number(event.target.value) ||
                                                    0
                                                )
                                              )
                                            ),
                                          })
                                        }
                                        type="number"
                                        value={forward.port}
                                      />
                                    </FieldStack>
                                  </div>
                                  {forward.type === "dynamic" ? null : (
                                    <div className="ref-uterm-settings-port-grid ref-uterm-settings-port-grid--target">
                                      <FieldStack
                                        label={t(
                                          "app.universalTerminalSettings.profiles.forward.targetAddress"
                                        )}
                                      >
                                        <input
                                          className="ref-uterm-settings-input"
                                          onChange={(event) =>
                                            patchForwardedPort(index, {
                                              targetAddress: event.target.value,
                                            })
                                          }
                                          type="text"
                                          value={forward.targetAddress}
                                        />
                                      </FieldStack>
                                      <FieldStack
                                        label={t(
                                          "app.universalTerminalSettings.profiles.forward.targetPort"
                                        )}
                                      >
                                        <input
                                          className="ref-uterm-settings-input"
                                          max={65_535}
                                          min={0}
                                          onChange={(event) =>
                                            patchForwardedPort(index, {
                                              targetPort: Math.max(
                                                0,
                                                Math.min(
                                                  65_535,
                                                  Math.floor(
                                                    Number(
                                                      event.target.value
                                                    ) || 0
                                                  )
                                                )
                                              ),
                                            })
                                          }
                                          type="number"
                                          value={forward.targetPort}
                                        />
                                      </FieldStack>
                                    </div>
                                  )}
                                  <div className="ref-uterm-settings-port-actions">
                                    <button
                                      className="ref-uterm-settings-danger-btn"
                                      onClick={() => removeForwardedPort(index)}
                                      type="button"
                                    >
                                      {t(
                                        "app.universalTerminalSettings.profiles.forward.remove"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                            <button
                              className="ref-uterm-settings-secondary-btn"
                              onClick={addForwardedPort}
                              type="button"
                            >
                              {t(
                                "app.universalTerminalSettings.profiles.forward.add"
                              )}
                            </button>
                          </div>
                        </SettingsSection>
                      ) : null}
                      {editorTab === "ciphers" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.tab.ciphers"
                          )}
                        >
                          <div className="ref-uterm-settings-algorithm-sections">
                            {(
                              Object.entries(
                                TERMINAL_SSH_ALGORITHM_OPTIONS
                              ) as Array<
                                [
                                  keyof typeof TERMINAL_SSH_ALGORITHM_OPTIONS,
                                  string[],
                                ]
                              >
                            ).map(([kind, options]) => (
                              <div
                                className="ref-uterm-settings-algorithm-group"
                                key={kind}
                              >
                                <div className="ref-uterm-settings-profile-meta-label">
                                  {t(
                                    `app.universalTerminalSettings.profiles.algorithms.${kind}`
                                  )}
                                </div>
                                <div className="ref-uterm-settings-checkbox-grid">
                                  {options.map((algorithm) => (
                                    <label
                                      className="ref-uterm-settings-checkbox"
                                      key={algorithm}
                                    >
                                      <input
                                        checked={editorDraft.sshAlgorithms[
                                          kind
                                        ].includes(algorithm)}
                                        onChange={() =>
                                          toggleAlgorithm(kind, algorithm)
                                        }
                                        type="checkbox"
                                      />
                                      <span>{algorithm}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </SettingsSection>
                      ) : null}
                      {editorTab === "colors" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.tab.colors"
                          )}
                        >
                          <ColorSchemeList
                            onSelect={(colorSchemeId) =>
                              patchEditorDraft({
                                terminalColorSchemeId: colorSchemeId,
                              })
                            }
                            selectedId={editorDraft.terminalColorSchemeId}
                          />
                        </SettingsSection>
                      ) : null}
                      {editorTab === "loginScripts" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.tab.loginScripts"
                          )}
                        >
                          <div className="ref-uterm-settings-stack-control">
                            {editorDraft.loginScripts.map((script, index) => (
                              <div
                                className="ref-uterm-settings-script-row"
                                key={`${script.expect}:${index}`}
                              >
                                <input
                                  className="ref-uterm-settings-input"
                                  onChange={(event) =>
                                    patchLoginScript(index, {
                                      expect: event.target.value,
                                    })
                                  }
                                  placeholder={t(
                                    "app.universalTerminalSettings.profiles.login.expect"
                                  )}
                                  type="text"
                                  value={script.expect}
                                />
                                <input
                                  className="ref-uterm-settings-input"
                                  onChange={(event) =>
                                    patchLoginScript(index, {
                                      send: event.target.value,
                                    })
                                  }
                                  placeholder={t(
                                    "app.universalTerminalSettings.profiles.login.send"
                                  )}
                                  type="text"
                                  value={script.send}
                                />
                                <div className="ref-uterm-settings-script-options">
                                  <label className="ref-uterm-settings-checkbox">
                                    <input
                                      checked={script.isRegex}
                                      onChange={(event) =>
                                        patchLoginScript(index, {
                                          isRegex: event.target.checked,
                                        })
                                      }
                                      type="checkbox"
                                    />
                                    <span>
                                      {t(
                                        "app.universalTerminalSettings.profiles.login.regex"
                                      )}
                                    </span>
                                  </label>
                                  <label className="ref-uterm-settings-checkbox">
                                    <input
                                      checked={script.optional}
                                      onChange={(event) =>
                                        patchLoginScript(index, {
                                          optional: event.target.checked,
                                        })
                                      }
                                      type="checkbox"
                                    />
                                    <span>
                                      {t(
                                        "app.universalTerminalSettings.profiles.login.optional"
                                      )}
                                    </span>
                                  </label>
                                  <button
                                    className="ref-uterm-settings-danger-btn"
                                    onClick={() => removeLoginScript(index)}
                                    type="button"
                                  >
                                    {t(
                                      "app.universalTerminalSettings.profiles.login.remove"
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              className="ref-uterm-settings-secondary-btn"
                              onClick={addLoginScript}
                              type="button"
                            >
                              {t(
                                "app.universalTerminalSettings.profiles.login.add"
                              )}
                            </button>
                          </div>
                        </SettingsSection>
                      ) : null}
                      {editorTab === "input" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.tab.input"
                          )}
                        >
                          <div className="ref-uterm-settings-form">
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.inputBackspace"
                              )}
                            >
                              <select
                                className="ref-uterm-settings-select"
                                onChange={(event) =>
                                  patchEditorDraft({
                                    inputBackspace: event.target
                                      .value as TerminalProfile["inputBackspace"],
                                  })
                                }
                                value={editorDraft.inputBackspace}
                              >
                                <option value="backspace">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.backspace"
                                  )}
                                </option>
                                <option value="ctrl-h">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.ctrl-h"
                                  )}
                                </option>
                                <option value="ctrl-?">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.ctrl-?"
                                  )}
                                </option>
                                <option value="delete">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.delete"
                                  )}
                                </option>
                              </select>
                            </Field>
                          </div>
                        </SettingsSection>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {editorTab === "general" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.editorGeneralTitle"
                          )}
                        >
                          <div className="ref-uterm-settings-form">
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.shell"
                              )}
                            >
                              <div className="ref-uterm-settings-input-action">
                                <input
                                  className="ref-uterm-settings-input"
                                  onChange={(event) =>
                                    patchEditorDraft({
                                      shell: event.target.value,
                                    })
                                  }
                                  placeholder={t(
                                    "app.universalTerminalSettings.profiles.shellPlaceholder"
                                  )}
                                  type="text"
                                  value={editorDraft.shell}
                                />
                                <button
                                  className="ref-uterm-settings-secondary-btn ref-uterm-settings-secondary-btn--compact"
                                  onClick={() => void pickShellExecutable()}
                                  type="button"
                                >
                                  {t(
                                    "app.universalTerminalSettings.profiles.browse"
                                  )}
                                </button>
                              </div>
                            </Field>
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.args"
                              )}
                            >
                              <input
                                className="ref-uterm-settings-input"
                                onChange={(event) =>
                                  patchEditorDraft({ args: event.target.value })
                                }
                                placeholder={t(
                                  "app.universalTerminalSettings.profiles.argsPlaceholder"
                                )}
                                type="text"
                                value={editorDraft.args}
                              />
                            </Field>
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.cwd"
                              )}
                            >
                              <div className="ref-uterm-settings-input-action">
                                <input
                                  className="ref-uterm-settings-input"
                                  onChange={(event) =>
                                    patchEditorDraft({
                                      cwd: event.target.value,
                                    })
                                  }
                                  placeholder={t(
                                    "app.universalTerminalSettings.profiles.cwdPlaceholder"
                                  )}
                                  type="text"
                                  value={editorDraft.cwd}
                                />
                                <button
                                  className="ref-uterm-settings-secondary-btn ref-uterm-settings-secondary-btn--compact"
                                  onClick={() => void pickWorkingDirectory()}
                                  type="button"
                                >
                                  {t(
                                    "app.universalTerminalSettings.profiles.browse"
                                  )}
                                </button>
                              </div>
                            </Field>
                          </div>
                        </SettingsSection>
                      ) : null}

                      {editorTab === "colors" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.tab.colors"
                          )}
                        >
                          <ColorSchemeList
                            onSelect={(colorSchemeId) =>
                              patchEditorDraft({
                                terminalColorSchemeId: colorSchemeId,
                              })
                            }
                            selectedId={editorDraft.terminalColorSchemeId}
                          />
                        </SettingsSection>
                      ) : null}
                      {editorTab === "input" ? (
                        <SettingsSection
                          title={t(
                            "app.universalTerminalSettings.profiles.tab.input"
                          )}
                        >
                          <div className="ref-uterm-settings-form">
                            <Field
                              label={t(
                                "app.universalTerminalSettings.profiles.inputBackspace"
                              )}
                            >
                              <select
                                className="ref-uterm-settings-select"
                                onChange={(event) =>
                                  patchEditorDraft({
                                    inputBackspace: event.target
                                      .value as TerminalProfile["inputBackspace"],
                                  })
                                }
                                value={editorDraft.inputBackspace}
                              >
                                <option value="backspace">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.backspace"
                                  )}
                                </option>
                                <option value="ctrl-h">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.ctrl-h"
                                  )}
                                </option>
                                <option value="ctrl-?">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.ctrl-?"
                                  )}
                                </option>
                                <option value="delete">
                                  {t(
                                    "app.universalTerminalSettings.profiles.backspace.delete"
                                  )}
                                </option>
                              </select>
                            </Field>
                          </div>
                        </SettingsSection>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <div className="ref-uterm-settings-profile-modal-footer">
                <div className="ref-uterm-settings-profile-modal-footer-main">
                  {canDeleteDraft ? (
                    <button
                      className="ref-uterm-settings-danger-btn"
                      onClick={deleteEditorProfile}
                      type="button"
                    >
                      {t("app.universalTerminalSettings.profiles.remove")}
                    </button>
                  ) : (
                    <div className="ref-uterm-settings-profile-modal-footer-note">
                      {t(
                        "app.universalTerminalSettings.profiles.editorSaveHint"
                      )}
                    </div>
                  )}
                </div>
                <div className="ref-uterm-settings-profile-modal-footer-actions">
                  <button
                    className="ref-uterm-settings-secondary-btn"
                    onClick={closeProfileEditor}
                    type="button"
                  >
                    {t("app.universalTerminalSettings.profiles.editorCancel")}
                  </button>
                  <button
                    className="ref-uterm-settings-primary-btn"
                    onClick={saveEditorProfile}
                    type="button"
                  >
                    {t("app.universalTerminalSettings.profiles.editorSave")}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {passwordModal.open ? (
            <div
              className="ref-uterm-settings-nested-password-layer"
              role="presentation"
            >
              <button
                aria-label={t(
                  "app.universalTerminalSettings.profiles.passwordModalDismiss"
                )}
                className="ref-uterm-settings-modal-backdrop"
                onClick={closeProfilePasswordModal}
                type="button"
              />
              <div
                aria-labelledby="ref-uterm-profile-password-modal-title"
                aria-modal="true"
                className="ref-uterm-settings-nested-password-dialog"
                role="dialog"
              >
                <h3
                  className="ref-uterm-settings-nested-password-title"
                  id="ref-uterm-profile-password-modal-title"
                >
                  {passwordModal.mode === "set"
                    ? t("app.universalTerminalSettings.profiles.setPassword")
                    : t(
                        "app.universalTerminalSettings.profiles.forgetPassword"
                      )}
                </h3>
                {passwordModal.mode === "set" ? (
                  <>
                    <p className="ref-uterm-settings-nested-password-copy">
                      {t("app.universalTerminalSettings.profiles.passwordHint")}
                    </p>
                    <input
                      autoComplete="new-password"
                      className="ref-uterm-settings-input"
                      onChange={(event) =>
                        setPasswordModalInput(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void confirmProfilePasswordModal();
                        }
                      }}
                      ref={profilePasswordInputRef}
                      type="password"
                      value={passwordModalInput}
                    />
                  </>
                ) : (
                  <p className="ref-uterm-settings-nested-password-copy">
                    {t(
                      "app.universalTerminalSettings.profiles.passwordClearConfirm"
                    )}
                  </p>
                )}
                <div className="ref-uterm-settings-nested-password-actions">
                  <button
                    className="ref-uterm-settings-secondary-btn"
                    onClick={closeProfilePasswordModal}
                    type="button"
                  >
                    {t("app.universalTerminalSettings.profiles.editorCancel")}
                  </button>
                  <button
                    className={
                      passwordModal.mode === "clear"
                        ? "ref-uterm-settings-danger-btn"
                        : "ref-uterm-settings-primary-btn"
                    }
                    onClick={() => void confirmProfilePasswordModal()}
                    type="button"
                  >
                    {passwordModal.mode === "set"
                      ? t(
                          "app.universalTerminalSettings.profiles.passwordModalSave"
                        )
                      : t(
                          "app.universalTerminalSettings.profiles.passwordModalConfirmForget"
                        )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
