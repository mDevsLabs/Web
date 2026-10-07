import { memo, useEffect, useMemo, useRef } from "react";
import { assistantMessageUsesAgentToolProtocol } from "./agentChatSegments";
import type {
  AgentLifecycleStatus,
  AgentSessionSnapshotAgent,
} from "./agentSessionTypes";
import { parseAgentAssistantPayload } from "./agentStructuredMessage";
import { ChatMarkdown } from "./ChatMarkdown";
import type { AgentSessionState } from "./hooks/useAgentSession";
import type { TFunction } from "./i18n";
import { IconCloseSmall } from "./icons";
import type { TurnTokenUsage } from "./ipcTypes";

type Props = {
  t: TFunction;
  session: AgentSessionState | null;
  threadId: string | null;
  onClose: () => void;
  workspaceRoot?: string | null;
  onOpenAgentFile?: (
    relPath: string,
    revealLine?: number,
    revealEndLine?: number,
    options?: { diff?: string | null; allowReviewActions?: boolean }
  ) => void;
  revertedPaths?: ReadonlySet<string>;
  revertedChangeKeys?: ReadonlySet<string>;
};

function statusLabel(t: TFunction, status: AgentLifecycleStatus): string {
  switch (status) {
    case "running":
      return t("agent.session.status.running");
    case "waiting_input":
      return t("agent.session.status.waiting");
    case "completed":
      return t("agent.session.status.completed");
    case "failed":
      return t("agent.session.status.failed");
    case "closed":
      return t("agent.session.status.closed");
    default:
      return status;
  }
}

function latestAgent(
  session: AgentSessionState | null
): AgentSessionSnapshotAgent | null {
  const selected = session?.selectedAgentId
    ? session.agentsById[session.selectedAgentId]
    : null;
  if (selected) {
    return selected;
  }
  return (
    Object.values(session?.agentsById ?? {}).sort(
      (a, b) => b.updatedAt - a.updatedAt
    )[0] ?? null
  );
}

function hasHistoricalPreflightContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }
  const payload = parseAgentAssistantPayload(trimmed);
  if (payload) {
    return payload.parts.some((part) => part.type === "tool");
  }
  return (
    trimmed.includes('<tool_call tool="') ||
    trimmed.includes('<tool_result tool="') ||
    trimmed.includes("<plan>") ||
    trimmed.includes("<todo>")
  );
}

function renderModeForAssistantContent(content: string): "all" | "outcome" {
  return assistantMessageUsesAgentToolProtocol(content) ? "outcome" : "all";
}

function renderAgentReply(
  key: string,
  content: string,
  options: {
    workspaceRoot?: string | null;
    onOpenAgentFile?: Props["onOpenAgentFile"];
    revertedPaths?: ReadonlySet<string>;
    revertedChangeKeys?: ReadonlySet<string>;
    isWorking?: boolean;
    liveThinking?: string;
    lastUsage?: TurnTokenUsage | null;
    typewriter?: boolean;
    renderMode?: "all" | "preflight" | "outcome";
    preserveLivePreflight?: boolean;
  }
) {
  const liveThoughtMeta =
    options.isWorking || options.liveThinking
      ? {
          elapsedSeconds: 0,
          phase: (content.trim() ? "streaming" : "thinking") as
            | "thinking"
            | "streaming"
            | "done",
          streamingThinking: options.liveThinking ?? "",
          tokenUsage: options.lastUsage ?? null,
        }
      : null;
  return (
    <div
      className={`ref-msg-slot ref-msg-slot--assistant ref-agent-session-reply-msg${
        options.renderMode === "preflight"
          ? " ref-agent-session-preflight-msg"
          : ""
      }`}
      key={key}
    >
      <div className="ref-msg-assistant-body">
        <ChatMarkdown
          agentUi
          allowAgentFileActions
          content={content}
          liveThoughtMeta={liveThoughtMeta}
          onOpenAgentFile={options.onOpenAgentFile}
          preserveLivePreflight={options.preserveLivePreflight ?? false}
          renderMode={options.renderMode ?? "all"}
          revertedChangeKeys={options.revertedChangeKeys}
          revertedPaths={options.revertedPaths}
          showAgentWorking={options.isWorking ?? false}
          typewriter={options.typewriter ?? false}
          workspaceRoot={options.workspaceRoot ?? null}
        />
      </div>
    </div>
  );
}

export const AgentSessionPanel = memo(function AgentSessionPanel({
  t,
  session,
  threadId,
  onClose,
  workspaceRoot = null,
  onOpenAgentFile,
  revertedPaths,
  revertedChangeKeys,
}: Props) {
  const selectedAgent = latestAgent(session);
  const assistantMessages = useMemo(() => {
    if (!selectedAgent) {
      return [];
    }
    let lastUserIndex = -1;
    for (let i = selectedAgent.messages.length - 1; i >= 0; i--) {
      if (selectedAgent.messages[i]?.role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    return selectedAgent.messages
      .slice(Math.max(0, lastUserIndex + 1))
      .filter((message) => message.role === "assistant");
  }, [selectedAgent]);
  const liveThinking = selectedAgent?.liveThinking?.trim() ?? "";
  const liveOutput = selectedAgent?.liveOutput?.trim() ?? "";
  const liveAssistantContent =
    selectedAgent?.liveAssistantContent?.trim() ?? "";
  const lastAssistantFullContent =
    selectedAgent?.lastAssistantFullContent?.trim() ?? "";
  const isWorking =
    selectedAgent?.status === "running" ||
    selectedAgent?.status === "waiting_input";
  const latestAssistantProtocolContent = useMemo(() => {
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const content = assistantMessages[i]?.content ?? "";
      if (hasHistoricalPreflightContent(content)) {
        return content.trim();
      }
    }
    return "";
  }, [assistantMessages]);
  const historicalPreflightContent = hasHistoricalPreflightContent(
    lastAssistantFullContent
  )
    ? lastAssistantFullContent
    : latestAssistantProtocolContent;
  const livePreflightContent = liveAssistantContent || liveOutput;
  const preflightContent = isWorking
    ? livePreflightContent
    : historicalPreflightContent;
  const shouldRenderPreflight =
    Boolean(liveThinking) ||
    (isWorking && Boolean(preflightContent)) ||
    hasHistoricalPreflightContent(preflightContent);
  const fallbackOutcomeContent =
    !isWorking && assistantMessages.length === 0 && lastAssistantFullContent
      ? lastAssistantFullContent
      : "";
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastAgentIdRef = useRef<string | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || !selectedAgent) {
      return;
    }
    const changedAgent = lastAgentIdRef.current !== selectedAgent.id;
    if (changedAgent || shouldStickToBottomRef.current) {
      shouldStickToBottomRef.current = true;
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
      }
      autoScrollFrameRef.current = requestAnimationFrame(() => {
        viewport.scrollTop = viewport.scrollHeight;
        autoScrollFrameRef.current = null;
      });
    }
    lastAgentIdRef.current = selectedAgent.id;
    return () => {
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
    };
  }, [
    assistantMessages.length,
    isWorking,
    liveAssistantContent,
    liveOutput,
    liveThinking,
    selectedAgent,
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

  return (
    <div className="ref-agent-session-shell ref-agent-session-shell--single">
      <button
        aria-label={t("common.close")}
        className="ref-team-sidebar-close"
        onClick={onClose}
        title={t("common.close")}
        type="button"
      >
        <IconCloseSmall />
      </button>
      {!threadId || !session || !selectedAgent ? (
        <div className="ref-team-sidebar-empty">
          <div className="ref-agent-plan-status-main">
            <div className="ref-agent-plan-status-title">
              {t("agent.session.emptyTitle")}
            </div>
            <p className="ref-agent-plan-status-body">
              {t("agent.session.emptyBody")}
            </p>
          </div>
        </div>
      ) : (
        <section className="ref-agent-session-single-detail">
          <header className="ref-agent-session-single-head">
            <div className="ref-agent-session-single-title-stack">
              <span className="ref-agent-session-kicker">
                {t("agent.session.kicker")}
              </span>
              <strong className="ref-agent-session-single-title">
                {selectedAgent.title}
              </strong>
              <span
                className={`ref-agent-session-status ref-agent-session-status--${selectedAgent.status}`}
              >
                {statusLabel(t, selectedAgent.status)}
              </span>
            </div>
          </header>
          <div
            className="ref-agent-session-single-body"
            onScroll={onTranscriptScroll}
            ref={scrollViewportRef}
          >
            <div className="ref-agent-session-reply-stream">
              {shouldRenderPreflight
                ? renderAgentReply(
                    `agent-preflight-${selectedAgent.id}`,
                    preflightContent,
                    {
                      isWorking,
                      lastUsage: null,
                      liveThinking,
                      onOpenAgentFile,
                      preserveLivePreflight: isWorking,
                      renderMode: "preflight",
                      revertedChangeKeys,
                      revertedPaths,
                      typewriter: isWorking,
                      workspaceRoot,
                    }
                  )
                : null}
              {assistantMessages.map((message, index) =>
                renderAgentReply(
                  `agent-reply-${selectedAgent.id}-${index}`,
                  message.content,
                  {
                    onOpenAgentFile,
                    renderMode: renderModeForAssistantContent(message.content),
                    revertedChangeKeys,
                    revertedPaths,
                    workspaceRoot,
                  }
                )
              )}
              {fallbackOutcomeContent
                ? renderAgentReply(
                    `agent-outcome-${selectedAgent.id}`,
                    fallbackOutcomeContent,
                    {
                      onOpenAgentFile,
                      renderMode: renderModeForAssistantContent(
                        fallbackOutcomeContent
                      ),
                      revertedChangeKeys,
                      revertedPaths,
                      workspaceRoot,
                    }
                  )
                : null}
              {assistantMessages.length === 0 &&
              !fallbackOutcomeContent &&
              !shouldRenderPreflight &&
              !isWorking &&
              !liveThinking &&
              !liveOutput ? (
                <div className="ref-team-role-empty-state">
                  {t("agent.session.emptyReply")}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </div>
  );
});
