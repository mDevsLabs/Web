import {
  type RestorableTerminalSnapshot,
  type RestorableTerminalTab,
  type TerminalSplitOrientation,
  TERMINAL_TAB_SNAPSHOT_KEY,
  TERMINAL_TOOLBAR_PIN_STORAGE_KEY,
} from "./types";

export function loadTerminalTabSnapshot(): RestorableTerminalSnapshot {
  const empty: RestorableTerminalSnapshot = { tabs: [] };
  if (typeof window === "undefined") {
    return empty;
  }
  try {
    const raw = window.localStorage.getItem(TERMINAL_TAB_SNAPSHOT_KEY);
    if (!raw) {
      return empty;
    }
    const parsed = JSON.parse(raw);
    const rawTabs = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.tabs)
        ? parsed.tabs
        : [];
    const tabs = rawTabs.filter(
      (item: unknown): item is RestorableTerminalTab =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as RestorableTerminalTab).profileId === "string"
    );
    const activeIndex =
      typeof parsed?.activeIndex === "number" &&
      parsed.activeIndex >= 0 &&
      parsed.activeIndex < tabs.length
        ? Math.floor(parsed.activeIndex)
        : undefined;
    const rawSplit = parsed?.split;
    const split =
      rawSplit &&
      rawSplit.enabled === true &&
      (rawSplit.orientation === "horizontal" ||
        rawSplit.orientation === "vertical") &&
      typeof rawSplit.secondaryIndex === "number" &&
      rawSplit.secondaryIndex >= 0 &&
      rawSplit.secondaryIndex < tabs.length
        ? {
            enabled: true,
            orientation: rawSplit.orientation as TerminalSplitOrientation,
            ratio:
              typeof rawSplit.ratio === "number"
                ? Math.max(0.2, Math.min(0.8, rawSplit.ratio))
                : 0.5,
            secondaryIndex: Math.floor(rawSplit.secondaryIndex),
          }
        : undefined;
    return { activeIndex, split, tabs };
  } catch {
    return empty;
  }
}

export function saveTerminalTabSnapshot(
  snapshot: RestorableTerminalSnapshot
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (snapshot.tabs.length === 0) {
      window.localStorage.removeItem(TERMINAL_TAB_SNAPSHOT_KEY);
      return;
    }
    window.localStorage.setItem(
      TERMINAL_TAB_SNAPSHOT_KEY,
      JSON.stringify(snapshot)
    );
  } catch {
    /* ignore */
  }
}

export function loadTerminalToolbarPinned(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return (
      window.localStorage.getItem(TERMINAL_TOOLBAR_PIN_STORAGE_KEY) !== "false"
    );
  } catch {
    return true;
  }
}

export function saveTerminalToolbarPinned(pinned: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      TERMINAL_TOOLBAR_PIN_STORAGE_KEY,
      pinned ? "true" : "false"
    );
  } catch {
    /* ignore */
  }
}
