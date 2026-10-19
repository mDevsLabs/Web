export type HotkeyDefaultPlatform = "win32" | "darwin" | "linux" | "unknown";

export const TERMINAL_HOTKEY_IDS = [
  "copy",
  "paste",
  "select-all",
  "home",
  "end",
  "previous-word",
  "next-word",
  "delete-previous-word",
  "delete-line",
  "delete-next-word",
  "clear",
  "zoom-in",
  "zoom-out",
  "reset-zoom",
  "ctrl-c",
  "copy-current-path",
  "search",
  "pane-focus-all",
  "focus-all-tabs",
  "scroll-to-top",
  "scroll-page-up",
  "scroll-up",
  "scroll-down",
  "scroll-page-down",
  "scroll-to-bottom",
  "reconnect-tab",
  "disconnect-tab",
] as const;

export type TerminalHotkeyId = (typeof TERMINAL_HOTKEY_IDS)[number];

const MAC: Record<TerminalHotkeyId, string[]> = {
  clear: ["⌘-K"],
  copy: ["⌘-C"],
  "copy-current-path": [],
  "ctrl-c": ["Ctrl-C"],
  "delete-line": ["⌘-Backspace"],
  "delete-next-word": ["⌥-Delete"],
  "delete-previous-word": ["⌥-Backspace"],
  "disconnect-tab": [],
  end: ["⌘-Right", "End"],
  "focus-all-tabs": ["⌘-⌥-Shift-I"],
  home: ["⌘-Left", "Home"],
  "next-word": ["⌥-Right"],
  "pane-focus-all": ["⌘-Shift-I"],
  paste: ["⌘-V"],
  "previous-word": ["⌥-Left"],
  "reconnect-tab": [],
  "reset-zoom": ["⌘-0"],
  "scroll-down": ["Ctrl-Shift-Down"],
  "scroll-page-down": ["⌥-PageDown"],
  "scroll-page-up": ["⌥-PageUp"],
  "scroll-to-bottom": ["Shift-PageDown"],
  "scroll-to-top": ["Shift-PageUp"],
  "scroll-up": ["Ctrl-Shift-Up"],
  search: ["⌘-F"],
  "select-all": ["⌘-A"],
  "zoom-in": ["⌘-=", "⌘-Shift-="],
  "zoom-out": ["⌘--", "⌘-Shift--"],
};

const WIN: Record<TerminalHotkeyId, string[]> = {
  clear: [],
  copy: ["Ctrl-Shift-C"],
  "copy-current-path": [],
  "ctrl-c": ["Ctrl-C"],
  "delete-line": ["Ctrl-Shift-Backspace"],
  "delete-next-word": ["Ctrl-Delete"],
  "delete-previous-word": ["Ctrl-Backspace"],
  "disconnect-tab": [],
  end: ["End"],
  "focus-all-tabs": ["Ctrl-Alt-Shift-I"],
  home: ["Home"],
  "next-word": ["Ctrl-Right"],
  "pane-focus-all": ["Ctrl-Shift-I"],
  paste: ["Ctrl-Shift-V", "Shift-Insert"],
  "previous-word": ["Ctrl-Left"],
  "reconnect-tab": [],
  "reset-zoom": ["Ctrl-0"],
  "scroll-down": ["Ctrl-Shift-Down"],
  "scroll-page-down": ["Alt-PageDown"],
  "scroll-page-up": ["Alt-PageUp"],
  "scroll-to-bottom": ["Ctrl-PageDown"],
  "scroll-to-top": ["Ctrl-PageUp"],
  "scroll-up": ["Ctrl-Shift-Up"],
  search: ["Ctrl-Shift-F"],
  "select-all": ["Ctrl-Shift-A"],
  "zoom-in": ["Ctrl-=", "Ctrl-Shift-="],
  "zoom-out": ["Ctrl--", "Ctrl-Shift--"],
};

const LINUX: Record<TerminalHotkeyId, string[]> = {
  clear: [],
  copy: ["Ctrl-Shift-C"],
  "copy-current-path": [],
  "ctrl-c": ["Ctrl-C"],
  "delete-line": ["Ctrl-Shift-Backspace"],
  "delete-next-word": ["Ctrl-Delete"],
  "delete-previous-word": ["Ctrl-Backspace"],
  "disconnect-tab": [],
  end: ["End"],
  "focus-all-tabs": ["Ctrl-Alt-Shift-I"],
  home: ["Home"],
  "next-word": ["Ctrl-Right"],
  "pane-focus-all": ["Ctrl-Shift-I"],
  paste: ["Ctrl-Shift-V", "Shift-Insert"],
  "previous-word": ["Ctrl-Left"],
  "reconnect-tab": [],
  "reset-zoom": ["Ctrl-0"],
  "scroll-down": ["Ctrl-Shift-Down"],
  "scroll-page-down": ["Alt-PageDown"],
  "scroll-page-up": ["Alt-PageUp"],
  "scroll-to-bottom": ["Ctrl-PageDown"],
  "scroll-to-top": ["Ctrl-PageUp"],
  "scroll-up": ["Ctrl-Shift-Up"],
  search: ["Ctrl-Shift-F"],
  "select-all": ["Ctrl-Shift-A"],
  "zoom-in": ["Ctrl-=", "Ctrl-Shift-="],
  "zoom-out": ["Ctrl--", "Ctrl-Shift--"],
};

export function defaultPlatformHotkeysTable(
  platform: HotkeyDefaultPlatform
): Record<TerminalHotkeyId, string[]> {
  if (platform === "darwin") {
    return { ...MAC };
  }
  if (platform === "win32") {
    return { ...WIN };
  }
  return { ...LINUX };
}
