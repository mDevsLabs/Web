import type { ReactNode } from "react";
import type { TFunction } from "../../i18n";
import {
  applyTerminalDisplayPreset,
  buildTerminalProfileLaunchPreview,
  buildTerminalProfileTarget,
  cloneTerminalProfile,
  defaultTerminalSettings,
  getSshIdentityFiles,
  isBuiltinTerminalProfileId,
  mergeTypeDefaultsIntoProfile,
  newProfileId,
  type TerminalAppSettings,
  type TerminalDisplayPresetId,
  type TerminalProfile,
  type TerminalProfileKind,
  type TerminalSshAuthMode,
} from "../terminalSettings";
import {
  IconProfileBash,
  IconProfileMonitor,
  IconProfilePowerShell,
  IconProfileTerminal,
  IconProfileWindows,
} from "./SettingsIcons";
import type {
  ProfileEditorTabId,
  TerminalSshConnectionMode,
} from "./types";

export function filterProfilesByQuery(
  profiles: TerminalProfile[],
  query: string,
  t: TFunction
): TerminalProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return profiles;
  }
  return profiles.filter((profile) =>
    [
      withTerminalProfileDisplayName(profile, t).name,
      describeProfileTarget(profile, t),
      buildTerminalProfileLaunchPreview(profile),
    ]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

export function groupProfilesByCustomGroup(
  profiles: TerminalProfile[],
  t: TFunction
): Array<{ id: string; label: string; items: TerminalProfile[] }> {
  const groups = new Map<string, TerminalProfile[]>();
  for (const profile of profiles) {
    const key = profile.group.trim();
    const bucketKey = key || "";
    const bucket = groups.get(bucketKey) ?? [];
    bucket.push(profile);
    groups.set(bucketKey, bucket);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (!a && b) {
        return -1;
      }
      if (a && !b) {
        return 1;
      }
      return a.localeCompare(b);
    })
    .map(([groupName, items]) => ({
      id: `custom:${groupName || "ungrouped"}`,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      label:
        groupName || t("app.universalTerminalSettings.profiles.group.custom"),
    }));
}

export function getEditorTabsForProfile(
  profile: TerminalProfile,
  t: TFunction
): Array<{ id: ProfileEditorTabId; label: string }> {
  if (profile.kind === "ssh") {
    return [
      {
        id: "general",
        label: t("app.universalTerminalSettings.profiles.tab.general"),
      },
      {
        id: "ports",
        label: t("app.universalTerminalSettings.profiles.tab.ports"),
      },
      {
        id: "advanced",
        label: t("app.universalTerminalSettings.profiles.tab.advanced"),
      },
      {
        id: "ciphers",
        label: t("app.universalTerminalSettings.profiles.tab.ciphers"),
      },
      {
        id: "colors",
        label: t("app.universalTerminalSettings.profiles.tab.colors"),
      },
      {
        id: "loginScripts",
        label: t("app.universalTerminalSettings.profiles.tab.loginScripts"),
      },
      {
        id: "input",
        label: t("app.universalTerminalSettings.profiles.tab.input"),
      },
    ];
  }
  return [
    {
      id: "general",
      label: t("app.universalTerminalSettings.profiles.tab.general"),
    },
    {
      id: "colors",
      label: t("app.universalTerminalSettings.profiles.tab.colors"),
    },
    {
      id: "input",
      label: t("app.universalTerminalSettings.profiles.tab.input"),
    },
  ];
}

export function inferSshConnectionMode(
  profile: TerminalProfile
): TerminalSshConnectionMode {
  if (profile.sshProxyCommand.trim()) {
    return "proxyCommand";
  }
  if (profile.sshJumpHost.trim()) {
    return "jumpHost";
  }
  return "direct";
}

export function applySshConnectionMode(
  profile: TerminalProfile,
  mode: TerminalSshConnectionMode
): TerminalProfile {
  if (profile.kind !== "ssh") {
    return profile;
  }
  if (mode === "direct") {
    return {
      ...profile,
      sshJumpHost: "",
      sshProxyCommand: "",
    };
  }
  if (mode === "proxyCommand") {
    return {
      ...profile,
      sshJumpHost: "",
    };
  }
  return {
    ...profile,
    sshProxyCommand: "",
  };
}

export function renderSshAuthGlyph(mode: TerminalSshAuthMode): string {
  return {
    agent: "G",
    auto: "?",
    keyboardInteractive: "T",
    password: "A",
    publicKey: "K",
  }[mode];
}

export function createEmptyProfileDraft(
  existing: TerminalProfile[],
  kind: TerminalProfileKind,
  t: TFunction
): TerminalProfile {
  return {
    ...defaultTerminalSettings().profiles[0],
    group: "",
    id: newProfileId(existing),
    kind,
    name:
      kind === "ssh"
        ? t("app.universalTerminalSettings.profiles.newSshName")
        : t("app.universalTerminalSettings.profiles.untitled"),
  };
}

export function createProfileFromTemplate(
  existing: TerminalProfile[],
  profile: TerminalProfile,
  t: TFunction,
  typeDefaults?: Partial<TerminalProfile>
): TerminalProfile {
  const next = cloneTerminalProfile(existing, profile);
  next.name = suggestDerivedProfileName(profile, t);
  return mergeTypeDefaultsIntoProfile(next, typeDefaults);
}

export function applyProfileNameFallback(
  profile: TerminalProfile,
  t: TFunction
): TerminalProfile {
  const identityFiles = getSshIdentityFiles(profile);
  return {
    ...profile,
    group: profile.group.trim(),
    name:
      profile.name.trim() ||
      (profile.kind === "ssh"
        ? t("app.universalTerminalSettings.profiles.newSshName")
        : t("app.universalTerminalSettings.profiles.untitled")),
    sshIdentityFile: identityFiles[0] ?? "",
    sshIdentityFiles: identityFiles,
  };
}

export function suggestDerivedProfileName(
  profile: TerminalProfile,
  t: TFunction
): string {
  const fallbackName =
    profile.kind === "ssh"
      ? t("app.universalTerminalSettings.profiles.newSshName")
      : t("app.universalTerminalSettings.profiles.untitled");
  const baseName = profile.name.trim() || fallbackName;
  if (profile.builtinKey === "sshConnection") {
    return t("app.universalTerminalSettings.profiles.newSshName");
  }
  if (isBuiltinTerminalProfileId(profile.id)) {
    return baseName;
  }
  return `${baseName} Copy`;
}

export function matchesDisplayPreset(
  settings: TerminalAppSettings,
  presetId: TerminalDisplayPresetId
): boolean {
  const preset = applyTerminalDisplayPreset(settings, presetId);
  return (
    settings.fontSize === preset.fontSize &&
    settings.fontWeight === preset.fontWeight &&
    settings.fontWeightBold === preset.fontWeightBold &&
    settings.lineHeight === preset.lineHeight &&
    settings.minimumContrastRatio === preset.minimumContrastRatio &&
    settings.scrollback === preset.scrollback &&
    settings.opacity === preset.opacity
  );
}

export function describeProfileTarget(profile: TerminalProfile | undefined, t: TFunction): string {
  if (!profile) return t("app.universalTerminalSettings.systemDefaultShell");
  return (
    buildTerminalProfileTarget(profile) ||
    t("app.universalTerminalSettings.systemDefaultShell")
  );
}

export function withTerminalProfileDisplayName(
  profile: TerminalProfile,
  t: TFunction
): TerminalProfile {
  if (!profile.builtinKey) {
    return profile;
  }
  return {
    ...profile,
    name: t(`app.universalTerminalSettings.builtin.${profile.builtinKey}`),
  };
}

export function getTerminalProfileVisual(profile: TerminalProfile): {
  icon: ReactNode;
  tone: "terminal" | "windows" | "powershell" | "bash" | "ssh";
} {
  if (profile.kind === "ssh") {
    return {
      icon: <IconProfileMonitor />,
      tone: "ssh",
    };
  }
  const shellHint = `${profile.name} ${profile.shell}`.toLowerCase();
  if (shellHint.includes("powershell") || shellHint.includes("pwsh")) {
    return {
      icon: <IconProfilePowerShell />,
      tone: "powershell",
    };
  }
  if (
    shellHint.includes("bash") ||
    shellHint.includes("git") ||
    shellHint.includes("wsl")
  ) {
    return {
      icon: <IconProfileBash />,
      tone: "bash",
    };
  }
  if (shellHint.includes("cmd") || shellHint.includes("command prompt")) {
    return {
      icon: <IconProfileWindows />,
      tone: "windows",
    };
  }
  return {
    icon: <IconProfileTerminal />,
    tone: "terminal",
  };
}
