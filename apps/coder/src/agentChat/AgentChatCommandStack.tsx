import type { ComponentProps, Dispatch, ReactNode, SetStateAction } from "react";
import { memo } from "react";
import {
  AgentBottomTodoPanel,
  type AgentTodoItem,
  type BottomTodoLayoutMode,
} from "../AgentBottomTodoPanel";
import { AgentFileChangesPanel } from "../AgentFileChanges";
import { ChatComposer } from "../ChatComposer";
import type { ComposerSegment } from "../composerSegments";
import type { TFunction } from "../i18n";
import { IconArrowDown } from "../icons";
import {
  ToolApprovalInlineCard,
  type ToolApprovalPayload,
} from "../ToolApprovalCard";
import type { SharedComposerProps } from "./types";

export type AgentChatCommandStackProps = {
  toolApprovalRequest: ToolApprovalPayload | null;
  respondToolApproval: (allow: boolean) => void;
  hasConversation: boolean;
  composerMode: ComponentProps<typeof ChatComposer>["composerMode"];
  agentFileChanges: Parameters<typeof AgentFileChangesPanel>[0]["files"];
  fileChangesDismissed: boolean;
  awaitingReply: boolean;
  onDismissRevertNotice: () => void;
  onKeepAllEdits: () => void;
  onKeepFileEdit: (rel: string) => void;
  onRevertAllEdits: () => void;
  onRevertFileEdit: (rel: string) => void;
  onOpenAgentConversationFile: (
    rel: string,
    line?: number,
    end?: number,
    options?: { diff?: string | null; allowReviewActions?: boolean }
  ) => void;
  revertableSnapshotPaths: ReadonlySet<string>;
  revertNotice: string | null;
  showScrollToBottomButton: boolean;
  scrollMessagesToBottom: (
    behavior?: ScrollBehavior,
    options?: { protectActivePreflight?: boolean }
  ) => void;
  isEditorRail: boolean;
  agentPlanSummaryCard: ReactNode;
  renderedBottomTodos: AgentTodoItem[];
  bottomTodoCollapsed: boolean;
  bottomTodoLeaving: boolean;
  bottomTodoLockedMode: BottomTodoLayoutMode | null;
  toggleBottomTodoCollapsed: () => void;
  sharedComposerProps: SharedComposerProps;
  canSendComposer: boolean;
  composerSegments: ComposerSegment[];
  setComposerSegments: Dispatch<SetStateAction<ComposerSegment[]>>;
  t: TFunction;
};

export const AgentChatCommandStack = memo(function AgentChatCommandStack({
  toolApprovalRequest,
  respondToolApproval,
  hasConversation,
  composerMode,
  agentFileChanges,
  fileChangesDismissed,
  awaitingReply,
  onDismissRevertNotice,
  onKeepAllEdits,
  onKeepFileEdit,
  onRevertAllEdits,
  onRevertFileEdit,
  onOpenAgentConversationFile,
  revertableSnapshotPaths,
  revertNotice,
  showScrollToBottomButton,
  scrollMessagesToBottom,
  isEditorRail,
  agentPlanSummaryCard,
  renderedBottomTodos,
  bottomTodoCollapsed,
  bottomTodoLeaving,
  bottomTodoLockedMode,
  toggleBottomTodoCollapsed,
  sharedComposerProps,
  canSendComposer,
  composerSegments,
  setComposerSegments,
  t,
}: AgentChatCommandStackProps) {
  return (
    <div className="ref-command-stack">
      {toolApprovalRequest ? (
        <ToolApprovalInlineCard
          allowLabel={t("agent.toolApproval.allow")}
          denyLabel={t("agent.toolApproval.deny")}
          onAllow={() => void respondToolApproval(true)}
          onDeny={() => void respondToolApproval(false)}
          payload={toolApprovalRequest}
          title={
            toolApprovalRequest.toolName === "Bash"
              ? t("agent.toolApproval.titleShell")
              : t("agent.toolApproval.titleWrite")
          }
        />
      ) : null}
      {hasConversation &&
      (composerMode === "agent" || composerMode === "team") &&
      agentFileChanges.length > 0 &&
      !fileChangesDismissed ? (
        <div className={`ref-fcp-slot ${awaitingReply ? "is-reserved" : ""}`}>
          <AgentFileChangesPanel
            files={agentFileChanges}
            onDismissRevertNotice={onDismissRevertNotice}
            onKeepAll={onKeepAllEdits}
            onKeepFile={(rel) => void onKeepFileEdit(rel)}
            onOpenFile={(rel, line, end, options) =>
              onOpenAgentConversationFile(rel, line, end, {
                ...options,
                allowReviewActions: true,
              })
            }
            onRevertAll={() => void onRevertAllEdits()}
            onRevertFile={(rel) => void onRevertFileEdit(rel)}
            revertableSnapshotPaths={revertableSnapshotPaths}
            revertNotice={revertNotice}
          />
        </div>
      ) : null}
      {hasConversation ? (
        <div
          aria-hidden={!showScrollToBottomButton}
          className={`ref-scroll-jump-anchor ${showScrollToBottomButton ? "is-visible" : ""}`}
        >
          <button
            aria-label={t("app.jumpToLatest")}
            className="ref-scroll-jump-btn"
            onClick={() =>
              scrollMessagesToBottom("smooth", {
                protectActivePreflight: false,
              })
            }
            tabIndex={showScrollToBottomButton ? 0 : -1}
            title={t("app.jumpToLatest")}
            type="button"
          >
            <IconArrowDown className="ref-scroll-jump-btn-icon" />
          </button>
        </div>
      ) : null}
      {isEditorRail ? null : agentPlanSummaryCard}
      {hasConversation && renderedBottomTodos.length > 0 ? (
        <AgentBottomTodoPanel
          isCollapsed={bottomTodoCollapsed}
          isLeaving={bottomTodoLeaving}
          layoutMode={bottomTodoLockedMode ?? "overlay"}
          onToggle={toggleBottomTodoCollapsed}
          t={t}
          todos={renderedBottomTodos}
        />
      ) : null}
      {hasConversation || !isEditorRail ? (
        <ChatComposer
          {...sharedComposerProps}
          canSend={canSendComposer}
          segments={composerSegments}
          setSegments={setComposerSegments}
          showGitBranchRow={!isEditorRail}
          slot="bottom"
        />
      ) : null}
    </div>
  );
});
