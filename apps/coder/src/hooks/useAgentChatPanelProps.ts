import { useCallback, useMemo, useRef } from "react";
import type { AgentChatPanelProps } from "../AgentChatPanel";

type OpenAgentConversationFile =
  AgentChatPanelProps["onOpenAgentConversationFile"];

export type UseAgentChatPanelPropsParams = Omit<
  AgentChatPanelProps,
  | "layout"
  | "onOpenWorkspaceFile"
  | "onRunCommand"
  | "onOpenAgentConversationFile"
> & {
  shell: Window["maiShell"] | undefined;
  onExplorerOpenFile: (rel: string) => void | Promise<void>;
  onAgentConversationOpenFile: AgentChatPanelProps["onOpenAgentConversationFile"];
};

export function useAgentChatPanelProps({
  shell,
  onExplorerOpenFile,
  onAgentConversationOpenFile,
  ...rest
}: UseAgentChatPanelPropsParams): Omit<AgentChatPanelProps, "layout"> {
  const onExplorerOpenFileRef = useRef(onExplorerOpenFile);
  onExplorerOpenFileRef.current = onExplorerOpenFile;
  const onAgentConversationOpenFileRef = useRef(onAgentConversationOpenFile);
  onAgentConversationOpenFileRef.current = onAgentConversationOpenFile;
  const shellRef = useRef(shell);
  shellRef.current = shell;

  const onOpenWorkspaceFile = useCallback((rel: string) => {
    void onExplorerOpenFileRef.current(rel);
  }, []);

  const onRunCommand = useCallback((cmd: string) => {
    shellRef.current?.invoke("terminal:execLine", cmd).catch(console.error);
  }, []);

  const stableOnOpenAgentConversationFile = useCallback(
    async (...args: Parameters<OpenAgentConversationFile>) => {
      await onAgentConversationOpenFileRef.current(...args);
    },
    []
  );

  // Group 1: Message/Thread state (changes on thread switch or new messages)
  // streaming / streamingThinking / streamingToolPreview / liveAssistantBlocks 均已迁至
  // streamingStore，AgentChatPanel 内部订阅并合成 displayMessages，不再从 props 走，
  // 避免每个 token / tool 事件触发 App 级重渲染。
  const messageGroup = useMemo(
    () => ({
      agentPlanSummaryCard: rest.agentPlanSummaryCard,
      agentSession: rest.agentSession,
      awaitingReply: rest.awaitingReply,
      currentId: rest.currentId,
      fileChangesDismissed: rest.fileChangesDismissed,
      hasConversation: rest.hasConversation,
      lastTurnUsage: rest.lastTurnUsage,
      messagesThreadId: rest.messagesThreadId,
      onSelectAgentSession: rest.onSelectAgentSession,
      persistedMessages: rest.persistedMessages,
      scheduleMessagesScrollToBottom: rest.scheduleMessagesScrollToBottom,
      scrollMessagesToBottom: rest.scrollMessagesToBottom,
      showScrollToBottomButton: rest.showScrollToBottomButton,
    }),
    [
      rest.persistedMessages,
      rest.messagesThreadId,
      rest.currentId,
      rest.hasConversation,
      rest.awaitingReply,
      rest.lastTurnUsage,
      rest.fileChangesDismissed,
      rest.agentPlanSummaryCard,
      rest.agentSession,
      rest.onSelectAgentSession,
      rest.showScrollToBottomButton,
      rest.scrollMessagesToBottom,
      rest.scheduleMessagesScrollToBottom,
    ]
  );

  // Group 2: Composer state (changes on user input)
  const composerGroup = useMemo(
    () => ({
      canSendComposer: rest.canSendComposer,
      canSendInlineResend: rest.canSendInlineResend,
      composerMode: rest.composerMode,
      composerSegments: rest.composerSegments,
      inlineResendRootRef: rest.inlineResendRootRef,
      inlineResendSegments: rest.inlineResendSegments,
      onChatPanelDropFiles: rest.onChatPanelDropFiles,
      onStartInlineResend: rest.onStartInlineResend,
      resendFromUserIndex: rest.resendFromUserIndex,
      setComposerSegments: rest.setComposerSegments,
      setInlineResendSegments: rest.setInlineResendSegments,
      sharedComposerProps: rest.sharedComposerProps,
    }),
    [
      rest.composerMode,
      rest.composerSegments,
      rest.setComposerSegments,
      rest.canSendComposer,
      rest.canSendInlineResend,
      rest.sharedComposerProps,
      rest.resendFromUserIndex,
      rest.inlineResendSegments,
      rest.setInlineResendSegments,
      rest.onStartInlineResend,
      rest.inlineResendRootRef,
      rest.onChatPanelDropFiles,
    ]
  );

  // Group 3: Agent action/review state (changes on agent actions)
  const actionGroup = useMemo(
    () => ({
      agentPlanEffectivePlan: rest.agentPlanEffectivePlan,
      agentReviewBusy: rest.agentReviewBusy,
      defaultModel: rest.defaultModel,
      editorPlanReviewDismissed: rest.editorPlanReviewDismissed,
      executeRuleWizardSend: rest.executeRuleWizardSend,
      executeSkillCreatorSend: rest.executeSkillCreatorSend,
      executeSubagentWizardSend: rest.executeSubagentWizardSend,
      mistakeLimitRequest: rest.mistakeLimitRequest,
      modelPickerItems: rest.modelPickerItems,
      onApplyAgentPatchesAll: rest.onApplyAgentPatchesAll,
      onApplyAgentPatchOne: rest.onApplyAgentPatchOne,
      onDiscardAgentReview: rest.onDiscardAgentReview,
      onDismissRevertNotice: rest.onDismissRevertNotice,
      onKeepAllEdits: rest.onKeepAllEdits,
      onKeepFileEdit: rest.onKeepFileEdit,
      onPlanBuild: rest.onPlanBuild,
      onPlanQuestionSkip: rest.onPlanQuestionSkip,
      onPlanQuestionSubmit: rest.onPlanQuestionSubmit,
      onPlanReviewClose: rest.onPlanReviewClose,
      onPlanTodoToggle: rest.onPlanTodoToggle,
      onRevertAllEdits: rest.onRevertAllEdits,
      onRevertFileEdit: rest.onRevertFileEdit,
      onUserInputSubmit: rest.onUserInputSubmit,
      pendingAgentPatches: rest.pendingAgentPatches,
      planFilePath: rest.planFilePath,
      planFileRelPath: rest.planFileRelPath,
      planQuestion: rest.planQuestion,
      planReviewIsBuilt: rest.planReviewIsBuilt,
      respondMistakeLimit: rest.respondMistakeLimit,
      respondToolApproval: rest.respondToolApproval,
      revertableSnapshotPaths: rest.revertableSnapshotPaths,
      revertNotice: rest.revertNotice,
      setWizardPending: rest.setWizardPending,
      snapshotPaths: rest.snapshotPaths,
      toolApprovalRequest: rest.toolApprovalRequest,
      userInputRequest: rest.userInputRequest,
      wizardPending: rest.wizardPending,
    }),
    [
      rest.pendingAgentPatches,
      rest.agentReviewBusy,
      rest.onApplyAgentPatchOne,
      rest.onApplyAgentPatchesAll,
      rest.onDiscardAgentReview,
      rest.planQuestion,
      rest.onPlanQuestionSubmit,
      rest.onPlanQuestionSkip,
      rest.userInputRequest,
      rest.onUserInputSubmit,
      rest.wizardPending,
      rest.setWizardPending,
      rest.executeSkillCreatorSend,
      rest.executeRuleWizardSend,
      rest.executeSubagentWizardSend,
      rest.mistakeLimitRequest,
      rest.respondMistakeLimit,
      rest.agentPlanEffectivePlan,
      rest.editorPlanReviewDismissed,
      rest.planFileRelPath,
      rest.planFilePath,
      rest.defaultModel,
      rest.modelPickerItems,
      rest.planReviewIsBuilt,
      rest.onPlanBuild,
      rest.onPlanReviewClose,
      rest.onPlanTodoToggle,
      rest.toolApprovalRequest,
      rest.respondToolApproval,
      rest.snapshotPaths,
      rest.revertableSnapshotPaths,
      rest.revertNotice,
      rest.onDismissRevertNotice,
      rest.onKeepAllEdits,
      rest.onRevertAllEdits,
      rest.onKeepFileEdit,
      rest.onRevertFileEdit,
    ]
  );

  // Group 4: Stable/rarely-changing props (refs, t, workspace info)
  const stableGroup = useMemo(
    () => ({
      dismissedFiles: rest.dismissedFiles,
      firstTokenAtRef: rest.firstTokenAtRef,
      knownSlashCommands: rest.knownSlashCommands,
      messagesTrackRef: rest.messagesTrackRef,
      messagesViewportRef: rest.messagesViewportRef,
      onMessagesScroll: rest.onMessagesScroll,
      revertedChangeKeys: rest.revertedChangeKeys,
      revertedFiles: rest.revertedFiles,
      streamStartedAtRef: rest.streamStartedAtRef,
      t: rest.t,
      thoughtSecondsByThread: rest.thoughtSecondsByThread,
      workspace: rest.workspace,
      workspaceBasename: rest.workspaceBasename,
    }),
    [
      rest.t,
      rest.workspace,
      rest.workspaceBasename,
      rest.knownSlashCommands,
      rest.dismissedFiles,
      rest.revertedFiles,
      rest.revertedChangeKeys,
      rest.messagesViewportRef,
      rest.messagesTrackRef,
      rest.onMessagesScroll,
      rest.streamStartedAtRef,
      rest.firstTokenAtRef,
      rest.thoughtSecondsByThread,
    ]
  );

  // Final combined memo — only recomputes when a group-level reference changes
  const prevGroupsRef = useRef<{
    m: typeof messageGroup;
    c: typeof composerGroup;
    a: typeof actionGroup;
    s: typeof stableGroup;
  } | null>(null);
  const result = useMemo(() => {
    if (import.meta.env.DEV) {
      const p = prevGroupsRef.current;
      if (p) {
        const reasons: string[] = [];
        if (p.m !== messageGroup) reasons.push("message");
        if (p.c !== composerGroup) reasons.push("composer");
        if (p.a !== actionGroup) reasons.push("action");
        if (p.s !== stableGroup) reasons.push("stable");
        console.log(
          `[perf] useAgentChatPanelProps memo recomputed: messages=${messageGroup.persistedMessages.length}, thread=${messageGroup.messagesThreadId}` +
            (reasons.length ? ` (groups: ${reasons.join(", ")})` : "")
        );
      } else {
        console.log(
          `[perf] useAgentChatPanelProps memo recomputed: messages=${messageGroup.persistedMessages.length}, thread=${messageGroup.messagesThreadId}`
        );
      }
      prevGroupsRef.current = {
        a: actionGroup,
        c: composerGroup,
        m: messageGroup,
        s: stableGroup,
      };
    }
    return {
      ...messageGroup,
      ...composerGroup,
      ...actionGroup,
      ...stableGroup,
      onOpenAgentConversationFile: stableOnOpenAgentConversationFile,
      onOpenWorkspaceFile,
      onRunCommand,
      onSelectTeamExpert: rest.onSelectTeamExpert,
      onTeamPlanApprove: rest.onTeamPlanApprove,
      onTeamPlanReject: rest.onTeamPlanReject,
      teamSession: rest.teamSession,
    };
  }, [
    messageGroup,
    composerGroup,
    actionGroup,
    stableGroup,
    rest.teamSession,
    rest.onSelectTeamExpert,
    rest.onTeamPlanApprove,
    rest.onTeamPlanReject,
    onOpenWorkspaceFile,
    stableOnOpenAgentConversationFile,
    onRunCommand,
  ]);

  return result;
}
