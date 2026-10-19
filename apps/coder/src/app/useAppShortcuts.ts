import { useEffect } from "react";

export function isEditableDomTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  return (
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']"))
  );
}

export interface UseAppShortcutsParams {
  quickOpenOpen: boolean;
  openQuickOpen: (prefix?: string) => void;
  layoutMode: string;
  workspace: string | null;
  toggleSidebarVisibility: () => void;
  toggleTerminalVisibility: () => void;
  toggleDiffPanelVisibility: () => void;
  goToPreviousThread: () => Promise<void> | void;
  goToNextThread: () => Promise<void> | void;
  goThreadBack: () => Promise<void> | void;
  goThreadForward: () => Promise<void> | void;
  zoomInUi: () => void;
  zoomOutUi: () => void;
  resetUiZoom: () => void;
}

export function useAppShortcuts({
  quickOpenOpen,
  openQuickOpen,
  layoutMode,
  workspace,
  toggleSidebarVisibility,
  toggleTerminalVisibility,
  toggleDiffPanelVisibility,
  goToPreviousThread,
  goToNextThread,
  goThreadBack,
  goThreadForward,
  zoomInUi,
  zoomOutUi,
  resetUiZoom,
}: UseAppShortcutsParams) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (quickOpenOpen) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.key.toLowerCase() !== "p" || e.altKey) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        openQuickOpen(">");
      } else {
        openQuickOpen("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quickOpenOpen, openQuickOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) {
        return;
      }
      const key = e.key.toLowerCase();
      const typing = isEditableDomTarget(e.target);
      if (
        typing &&
        !["b", "j", "f", "[", "]", "-", "=", "+", "0"].includes(key)
      ) {
        return;
      }
      if (!e.shiftKey && !e.altKey && key === "b") {
        e.preventDefault();
        toggleSidebarVisibility();
        return;
      }
      if (!e.shiftKey && !e.altKey && key === "j") {
        if (layoutMode === "editor" && workspace) {
          e.preventDefault();
          toggleTerminalVisibility();
        }
        return;
      }
      if (!e.shiftKey && e.altKey && key === "b") {
        if (layoutMode === "agent") {
          e.preventDefault();
          toggleDiffPanelVisibility();
        }
        return;
      }
      if (!e.shiftKey && !e.altKey && key === "f") {
        e.preventDefault();
        openQuickOpen("");
        return;
      }
      if (e.shiftKey && !e.altKey && e.key === "[") {
        e.preventDefault();
        void goToPreviousThread();
        return;
      }
      if (e.shiftKey && !e.altKey && e.key === "]") {
        e.preventDefault();
        void goToNextThread();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "[") {
        e.preventDefault();
        void goThreadBack();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "]") {
        e.preventDefault();
        void goThreadForward();
        return;
      }
      if (!e.shiftKey && !e.altKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomInUi();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "-") {
        e.preventDefault();
        zoomOutUi();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "0") {
        e.preventDefault();
        resetUiZoom();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    layoutMode,
    workspace,
    openQuickOpen,
    toggleSidebarVisibility,
    toggleTerminalVisibility,
    toggleDiffPanelVisibility,
    goToPreviousThread,
    goToNextThread,
    goThreadBack,
    goThreadForward,
    zoomInUi,
    zoomOutUi,
    resetUiZoom,
  ]);
}
