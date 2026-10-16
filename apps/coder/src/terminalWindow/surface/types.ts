import type { TFunction } from "../../i18n";
import type {
  TerminalAppSettings,
  TerminalProfile,
} from "../terminalSettings";

export type SessionInfo = {
  id: string;
  title: string;
  cwd: string;
  shell: string;
  cols: number;
  rows: number;
  alive: boolean;
  bufferBytes: number;
  createdAt: number;
};

export type BufferSlice = {
  id: string;
  content: string;
  seq: number;
  alive: boolean;
  exitCode: number | null;
  bufferBytes: number;
  authPrompt: TerminalSessionAuthPrompt | null;
};

export type TerminalSessionAuthPrompt = {
  prompt: string;
  kind: "password" | "passphrase";
  seq: number;
};

export type ActiveTerminalAuthPrompt = TerminalSessionAuthPrompt & {
  sessionId: string;
  sessionTitle: string;
  profileId: string | null;
  profileName: string;
};

export type ShellBridge = NonNullable<Window["maiShell"]>;

export type XTermThemeColors = {
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  brightBlack: string;
};

export type TerminalRuntimeControls = {
  copySelection(): Promise<boolean>;
  pasteFromClipboard(): Promise<boolean>;
  selectAll(): void;
  clear(): void;
  focus(): void;
  hasSelection(): boolean;
};

export type TerminalContextMenuState = {
  sessionId: string;
  x: number;
  y: number;
};

export type TabHeaderContextMenuState = {
  sessionId: string;
  x: number;
  y: number;
};

export type TabViewProps = {
  sessionId: string;
  active: boolean;
  shell: ShellBridge;
  onExit(code: number | null): void;
  theme: XTermThemeColors;
  appSettings: TerminalAppSettings;
  profile: TerminalProfile | null;
  t: TFunction;
  onRequestContextMenu(payload: TerminalContextMenuState): void;
  onAuthPrompt(sessionId: string, prompt: TerminalSessionAuthPrompt): void;
  registerRuntime(
    sessionId: string,
    runtime: TerminalRuntimeControls | null
  ): void;
  sessionCwd: string;
  onReconnect?: () => void;
  onDisconnect?: () => void;
};

export type TerminalSplitOrientation = "horizontal" | "vertical";

export type TerminalSplitLayout = {
  enabled: boolean;
  orientation: TerminalSplitOrientation;
  secondaryId: string | null;
  ratio: number;
};

export type RestorableTerminalTab = {
  profileId: string;
};

export type RestorableTerminalSnapshot = {
  tabs: RestorableTerminalTab[];
  activeIndex?: number;
  split?: {
    enabled: boolean;
    orientation: TerminalSplitOrientation;
    secondaryIndex: number;
    ratio: number;
  };
};

export const TERMINAL_TAB_SNAPSHOT_KEY = "void-shell:terminal:window-tabs";
export const TERMINAL_TOOLBAR_PIN_STORAGE_KEY =
  "void-shell:terminal:toolbar-pinned";
