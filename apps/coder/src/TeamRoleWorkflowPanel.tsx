import { memo, useEffect, useRef } from "react";
import { ChatMarkdown } from "./ChatMarkdown";
import type { TeamSessionState } from "./hooks/useTeamSession";
import type { TFunction } from "./i18n";
import type { TurnTokenUsage } from "./ipcTypes";
import type { LiveAgentBlocksState } from "./liveAgentBlocks";
import { TeamRoleAvatar } from "./TeamRoleAvatar";
import {
  buildTeamWorkflowItems,
  getTeamWorkflowItemById,
} from "./teamWorkflowItems";
import type { ChatMessage } from "./threadTypes";

type Props = {
  t: TFunction;
  session: TeamSessionState | null;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  layout: "agent-sidebar" | "editor-center";
  isVisible?: boolean;
  workspaceRoot?: string | null;
  onOpenAgentFile?: (
    relPath: string,
    revealLine?: number,
    revealEndLine?: number,
    options?: { diff?: string | null; allowReviewActions?: boolean }
  ) => void;
  revertedPaths?: ReadonlySet<string>;
  revertedChangeKeys?: ReadonlySet<string>;
  allowAgentFileActions?: boolean;
};

function renderAssistantMessage(
  key: string,
  content: string,
  options?: {
    isWorking?: boolean;
    liveBlocks?: LiveAgentBlocksState | null;
    liveThoughtMeta?: {
      phase: "thinking" | "streaming" | "done";
      elapsedSeconds: number;
      streamingThinking: string;
      tokenUsage?: TurnTokenUsage | null;
    } | null;
    workspaceRoot?: string | null;
    onOpenAgentFile?: Props["onOpenAgentFile"];
    revertedPaths?: ReadonlySet<string>;
    revertedChangeKeys?: ReadonlySet<string>;
    allowAgentFileActions?: boolean;
    typewriter?: boolean;
  }
) {
  return (
    <div
      className="ref-msg-slot ref-msg-slot--assistant ref-team-role-msg"
      key={key}
    >
      <div className="ref-msg-assistant-body">
        <ChatMarkdown
          agentUi
          allowAgentFileActions={options?.allowAgentFileActions ?? false}
          content={content}
          liveAgentBlocksState={options?.liveBlocks ?? null}
          liveThoughtMeta={options?.liveThoughtMeta ?? null}
          onOpenAgentFile={options?.onOpenAgentFile}
          revertedChangeKeys={options?.revertedChangeKeys}
          revertedPaths={options?.revertedPaths}
          showAgentWorking={options?.isWorking ?? false}
          typewriter={options?.typewriter ?? false}
          workspaceRoot={options?.workspaceRoot ?? null}
        />
      </div>
    </div>
  );
}

export const TeamRoleWorkflowPanel = memo(function TeamRoleWorkflowPanel({
  t,
  session,
  selectedTaskId,
  onSelectTask,
  layout,
  isVisible = true,
  workspaceRoot = null,
  onOpenAgentFile,
  revertedPaths,
  revertedChangeKeys,
  allowAgentFileActions = false,
}: Props) {
  if (!session) {
    return (
      <div className="ref-team-role-stream ref-team-role-stream--empty">
        <div className="ref-agent-plan-status-main">
          <div className="ref-agent-plan-status-title">
            {t("composer.mode.team")}
          </div>
          <p className="ref-agent-plan-status-body">
            {t("settings.team.empty")}
          </p>
        </div>
      </div>
    );
  }

  const workflowItems = buildTeamWorkflowItems(session);
  const item =
    getTeamWorkflowItemById(
      session,
      selectedTaskId ?? session.selectedTaskId
    ) ??
    workflowItems[0] ??
    null;
  if (!item) {
    return (
      <div className="ref-team-role-stream ref-team-role-stream--empty">
        <div className="ref-agent-plan-status-main">
          <div className="ref-agent-plan-status-title">
            {t("composer.mode.team")}
          </div>
          <p className="ref-agent-plan-status-body">
            {t("app.selectFileToView")}
          </p>
        </div>
      </div>
    );
  }

  const workflow = item.workflow;
  const isWorking = workflow?.awaitingReply ?? item.status === "in_progress";
  const savedMessages: ChatMessage[] = workflow?.messages.length
    ? workflow.messages
    : item.result
      ? [{ content: item.result, role: "assistant" }]
      : [];
  const liveThoughtMeta =
    workflow?.awaitingReply || workflow?.streamingThinking
      ? {
          elapsedSeconds: 0,
          phase: (workflow?.streaming?.trim() ? "streaming" : "thinking") as
            | "thinking"
            | "streaming"
            | "done",
          streamingThinking: workflow?.streamingThinking ?? "",
          tokenUsage: workflow?.lastTurnUsage ?? null,
        }
      : null;
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastOpenStateRef = useRef(false);
  const lastItemIdRef = useRef<string | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || !isVisible) {
      lastOpenStateRef.current = isVisible;
      return;
    }

    const openedNow = !lastOpenStateRef.current && isVisible;
    const changedItem = lastItemIdRef.current !== item.id;
    const shouldForceBottom = openedNow || changedItem;

    if (shouldForceBottom || shouldStickToBottomRef.current) {
      shouldStickToBottomRef.current = true;
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
      }
      autoScrollFrameRef.current = requestAnimationFrame(() => {
        viewport.scrollTop = viewport.scrollHeight;
        autoScrollFrameRef.current = null;
      });
    }

    lastOpenStateRef.current = isVisible;
    lastItemIdRef.current = item.id;

    return () => {
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
    };
  }, [
    isVisible,
    item.id,
    savedMessages.length,
    item.result,
    isWorking,
    workflow?.streaming,
    workflow?.streamingThinking,
    workflow?.lastUpdatedAt,
  ]);

  const onTranscriptScroll = () => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom <= 24;
  };

  const transcript = (
    <div
      className={`ref-team-role-stream ${layout === "agent-sidebar" ? "ref-team-role-stream--agent-sidebar" : "ref-team-role-stream--editor-center"}`}
    >
      {savedMessages.map((message, index) =>
        renderAssistantMessage(
          `team-role-msg-${item.id}-${index}`,
          message.content,
          {
            allowAgentFileActions,
            onOpenAgentFile,
            revertedChangeKeys,
            revertedPaths,
            workspaceRoot,
          }
        )
      )}
      {isWorking
        ? renderAssistantMessage(
            `team-role-live-${item.id}`,
            workflow?.streaming ?? "",
            {
              allowAgentFileActions: false,
              isWorking: true,
              liveBlocks: workflow?.liveBlocks ?? null,
              liveThoughtMeta,
              onOpenAgentFile,
              revertedChangeKeys,
              revertedPaths,
              typewriter: true,
              workspaceRoot,
            }
          )
        : null}
      {!savedMessages.length && !isWorking ? (
        <div className="ref-team-role-empty-state">
          {t("team.timeline.pendingTrace", { name: item.expertName })}
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      className={`ref-team-role-shell ${layout === "agent-sidebar" ? "ref-team-role-shell--agent-sidebar" : "ref-team-role-shell--editor-center"}`}
    >
      <header className="ref-team-role-shell-head">
        <div className="ref-team-role-shell-main">
          <div className="ref-team-role-shell-expert">
            <TeamRoleAvatar
              assignmentKey={item.expertAssignmentKey ?? item.expertId}
              roleType={item.roleType}
            />
            <div className="ref-team-role-shell-title-stack">
              <div className="ref-team-role-shell-title-row">
                <span className="ref-team-role-shell-role">
                  {t(`team.timeline.role.${item.roleKind}`)}
                </span>
                <strong className="ref-team-role-shell-name">
                  {item.expertName}
                </strong>
              </div>
              <p className="ref-team-role-shell-task">{item.description}</p>
            </div>
          </div>
          <div className="ref-team-role-shell-meta">
            <span
              className={`ref-team-expert-status ref-team-expert-status--${item.status}`}
            >
              {item.status === "in_progress" ? (
                <span className="ref-team-pulse" />
              ) : null}
              {t(`team.timeline.status.${item.status}`)}
            </span>
          </div>
        </div>

        {layout === "editor-center" && workflowItems.length > 1 ? (
          <div className="ref-team-role-panel-switcher">
            {workflowItems.map((entry) => (
              <button
                className={`ref-team-role-switch ${entry.id === item.id ? "is-active" : ""}`}
                key={entry.id}
                onClick={() => onSelectTask(entry.id)}
                type="button"
              >
                {entry.expertName}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div
        className="ref-team-role-shell-body"
        onScroll={onTranscriptScroll}
        ref={scrollViewportRef}
      >
        {transcript}
      </div>
    </section>
  );
});
