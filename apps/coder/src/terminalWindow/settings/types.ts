import type { TFunction } from "../../i18n";

import type {
  TerminalAppSettings,
  TerminalProfile,
} from "../terminalSettings";

export type SettingsNav =
  | "profilesConnections"
  | "appearance"
  | "terminal"
  | "hotkeys";

export type ProfilesSubtab = "profiles" | "advanced";

export type ProfileEditorMode = "create" | "edit" | "defaults";

export type ProfileDefaultsKind = "local" | "ssh";

export type ProfileEditorTabId =
  | "general"
  | "ports"
  | "advanced"
  | "ciphers"
  | "colors"
  | "loginScripts"
  | "input";

export type TerminalSshConnectionMode = "direct" | "proxyCommand" | "jumpHost";

export type TerminalSettingsPanelOpenProfileRequest = {
  profileId: string;
  tab: ProfileEditorTabId;
  nonce: number;
};

export type TerminalSettingsPanelProps = {
  t: TFunction;
  settings: TerminalAppSettings;
  builtinProfiles: TerminalProfile[];
  onChange(next: TerminalAppSettings): void;
  onLaunchProfile(profileId: string): void;
  openProfileRequest?: TerminalSettingsPanelOpenProfileRequest | null;
};

export type ProfilesSettingsStageProps = {
  t: TFunction;
  settings: TerminalAppSettings;
  activeProfile: TerminalProfile;
  profilesSubtab: ProfilesSubtab;
  onChangeSubtab(next: ProfilesSubtab): void;
  filter: string;
  onFilterChange(next: string): void;
  collapsedGroups: Record<string, boolean>;
  onToggleGroup(groupId: string): void;
  onSelectProfile(id: string): void;
  onPatchSettings(partial: Partial<TerminalAppSettings>): void;
  onLaunchProfile(profileId: string): void;
  builtinProfiles: TerminalProfile[];
  openProfileRequest?: TerminalSettingsPanelOpenProfileRequest | null;
};
