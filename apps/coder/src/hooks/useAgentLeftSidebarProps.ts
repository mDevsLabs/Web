import {
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useCallback,
  useMemo,
} from "react";
import type {
  AgentLeftSidebarProps,
  AgentSidebarWorkspace,
} from "../AgentLeftSidebar";
import type { TFunction } from "../i18n";
import type { SettingsNavId } from "../SettingsPage";
import type { ThreadInfo } from "../threadTypes";

export type UseAgentLeftSidebarPropsParams = {
  t: TFunction;
  agentSidebarWorkspaces: AgentSidebarWorkspace[];
  renderThreadItem: (
    thread: ThreadInfo,
    threadListWorkspace: string
  ) => ReactNode;
  editingWorkspacePath: string | null;
  editingWorkspaceNameDraft: string;
  setEditingWorkspaceNameDraft: Dispatch<SetStateAction<string>>;
  workspaceNameDraftRef: MutableRefObject<string>;
  workspaceNameInputRef: RefObject<HTMLInputElement | null>;
  commitWorkspaceAliasEdit: () => void;
  cancelWorkspaceAliasEdit: () => void;
  handleWorkspacePrimaryAction: (path: string) => void;
  workspaceMenuPath: string | null;
  closeWorkspaceMenu: () => void;
  openWorkspaceMenu: (path: string, anchor: HTMLButtonElement) => void;
  onNewThread: () => void | Promise<void>;
  onNewThreadForWorkspace: (path: string) => void | Promise<void>;
  setWorkspacePickerOpen: Dispatch<SetStateAction<boolean>>;
  openQuickOpen: (seed?: string) => void;
  openSettingsPage: (nav: SettingsNavId) => void;
  openUniversalTerminal: () => void;
  showSkillsNav?: boolean;
  showAutomationNav?: boolean;
  maiAccount?: import("../ipcTypes").MaiAccountState;
  openMaiAccount?: () => void;
};

export function useAgentLeftSidebarProps(
  p: UseAgentLeftSidebarPropsParams
): AgentLeftSidebarProps {
  const onWorkspaceNameDraftChange = useCallback(
    (value: string) => {
      p.setEditingWorkspaceNameDraft(value);
      p.workspaceNameDraftRef.current = value;
    },
    [p.setEditingWorkspaceNameDraft, p.workspaceNameDraftRef]
  );

  const openWorkspacePicker = useCallback(() => {
    p.setWorkspacePickerOpen(true);
  }, [p.setWorkspacePickerOpen]);

  const openPluginSettings = useCallback(() => {
    p.openSettingsPage("plugins");
  }, [p.openSettingsPage]);

  const openGeneralSettings = useCallback(() => {
    p.openSettingsPage("general");
  }, [p.openSettingsPage]);

  const openSkillsSettings = useCallback(() => {
    p.openSettingsPage("rules");
  }, [p.openSettingsPage]);

  const openUniversalTerminal = useCallback(() => {
    p.openUniversalTerminal();
  }, [p.openUniversalTerminal]);

  const onNewThread = useCallback(() => {
    void p.onNewThread();
  }, [p.onNewThread]);

  const onNewThreadForWorkspace = useCallback(
    (path: string) => {
      void p.onNewThreadForWorkspace(path);
    },
    [p.onNewThreadForWorkspace]
  );

  const openQuickOpen = useCallback(() => {
    p.openQuickOpen();
  }, [p.openQuickOpen]);

  return useMemo(
    () => ({
      agentSidebarWorkspaces: p.agentSidebarWorkspaces,
      cancelWorkspaceAliasEdit: p.cancelWorkspaceAliasEdit,
      closeWorkspaceMenu: p.closeWorkspaceMenu,
      commitWorkspaceAliasEdit: p.commitWorkspaceAliasEdit,
      editingWorkspaceNameDraft: p.editingWorkspaceNameDraft,
      editingWorkspacePath: p.editingWorkspacePath,
      handleWorkspacePrimaryAction: p.handleWorkspacePrimaryAction,
      maiAccount: p.maiAccount,
      onNewThread,
      onNewThreadForWorkspace,
      onOpenMaiAccount: p.openMaiAccount,
      onWorkspaceNameDraftChange,
      openGeneralSettings,
      openPluginSettings,
      openQuickOpen,
      openSkillsSettings:
        p.showSkillsNav === false ? undefined : openSkillsSettings,
      openUniversalTerminal:
        p.showAutomationNav === false ? undefined : openUniversalTerminal,
      openWorkspaceMenu: p.openWorkspaceMenu,
      openWorkspacePicker,
      renderThreadItem: p.renderThreadItem,
      t: p.t,
      workspaceMenuPath: p.workspaceMenuPath,
      workspaceNameInputRef: p.workspaceNameInputRef,
    }),
    [
      p.t,
      p.agentSidebarWorkspaces,
      p.renderThreadItem,
      p.editingWorkspacePath,
      p.editingWorkspaceNameDraft,
      p.workspaceNameInputRef,
      onWorkspaceNameDraftChange,
      p.commitWorkspaceAliasEdit,
      p.cancelWorkspaceAliasEdit,
      p.handleWorkspacePrimaryAction,
      p.workspaceMenuPath,
      p.closeWorkspaceMenu,
      p.openWorkspaceMenu,
      onNewThread,
      onNewThreadForWorkspace,
      openWorkspacePicker,
      openQuickOpen,
      openPluginSettings,
      openGeneralSettings,
      openSkillsSettings,
      openUniversalTerminal,
      p.showSkillsNav,
      p.showAutomationNav,
      p.maiAccount,
      p.openMaiAccount,
    ]
  );
}
