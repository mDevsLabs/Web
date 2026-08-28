import type { UseChatHelpers } from "@ai-sdk/react";
import {
  ArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isLoading?: boolean;
  selectedModelId: string;
  onEditMessage?: (message: ChatMessage) => void;
};

function PureMessages({
  addToolApprovalResponse,
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  isArtifactVisible,
  isLoading,
  selectedModelId: _selectedModelId,
  onEditMessage,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
    reset,
  } = useMessages({
    status,
  });

  useDataStream();

  // Recherche dans la conversation
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);

  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const res: { messageId: string; index: number }[] = [];
    let globalIdx = 0;
    for (const m of messages) {
      let countInMsg = 0;
      for (const part of m.parts as any[]) {
        if (part.type === "text" && typeof part.text === "string") {
          const txt = part.text.toLowerCase();
          let pos = txt.indexOf(q);
          while (pos !== -1) {
            res.push({ messageId: m.id, index: globalIdx });
            countInMsg++;
            globalIdx++;
            pos = txt.indexOf(q, pos + q.length);
          }
        }
        // tool parts may have text too, but we focus on text
      }
      // also if countInMsg >0, we will have entries per occurrence, not per message; for scrolling we need per occurrence but we map occurrence to message
    }
    return res;
  }, [messages, searchQuery]);

  const totalMatches = matches.length;
  const currentMatchData = matches[currentMatch] ?? null;

  useEffect(() => {
    if (totalMatches > 0) {
      // auto scroll to current
      const target = currentMatchData;
      if (target) {
        const el = document.getElementById(`msg-${target.messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // brief highlight ring
          el.classList.add("ring-2", "ring-yellow-400", "rounded-xl");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-yellow-400", "rounded-xl");
          }, 1200);
        }
      }
    }
  }, [currentMatch, currentMatchData, totalMatches]);

  useEffect(() => {
    setCurrentMatch(0);
  }, [searchQuery]);

  useEffect(() => {
    const handler = () => setSearchOpen((prev) => !prev);
    window.addEventListener("open-conversation-search", handler as any);
    return () => window.removeEventListener("open-conversation-search", handler as any);
  }, []);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      reset();
      setSearchQuery("");
      setSearchOpen(false);
      setCurrentMatch(0);
    }
  }, [chatId, reset]);

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  const handleNext = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatch((i) => (i + 1) % totalMatches);
  }, [totalMatches]);

  const handlePrev = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatch((i) => (i - 1 + totalMatches) % totalMatches);
  }, [totalMatches]);

  return (
    <div className="relative flex-1 bg-background">
      {/* Barre de recherche */}
      {searchOpen && (
        <div className="sticky top-0 z-20 flex items-center gap-2 bg-card/95 backdrop-blur-md border-b border-border/40 px-3 py-2 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              autoFocus
              className="w-full h-8 rounded-xl border border-border/60 bg-muted/30 pl-8 pr-3 text-[16px] md:text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Rechercher dans la conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) handlePrev();
                  else handleNext();
                }
                if (e.key === "Escape") setSearchOpen(false);
              }}
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {searchQuery.trim() ? (
              totalMatches > 0 ? (
                <span className="text-muted-foreground px-1">
                  {currentMatch + 1} / {totalMatches}
                </span>
              ) : (
                <span className="text-muted-foreground px-1">
                  Aucune correspondance
                </span>
              )
            ) : (
              <span className="text-muted-foreground px-1">
                {messages.length} messages
              </span>
            )}
            <button
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
              onClick={handlePrev}
              disabled={totalMatches === 0}
              type="button"
              title="Précédent (Shift+Enter)"
            >
              <ChevronUpIcon className="size-4" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
              onClick={handleNext}
              disabled={totalMatches === 0}
              type="button"
              title="Suivant (Enter)"
            >
              <ChevronDownIcon className="size-4" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              type="button"
              title="Fermer (Esc)"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      )}
      {messages.length === 0 && !isLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Greeting />
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 touch-pan-y overflow-y-auto",
          messages.length > 0 ? "bg-background" : "bg-transparent"
        )}
        ref={messagesContainerRef}
        style={isArtifactVisible ? { scrollbarWidth: "none" } : undefined}
      >
        <div className="mx-auto flex min-h-full min-w-0 max-w-4xl flex-col gap-5 px-2 py-6 md:gap-7 md:px-4">
          {messages.map((message, index) => {
            // determine if this message is the current match target
            const isCurrentMatchMsg =
              !!searchQuery.trim() &&
              currentMatchData?.messageId === message.id;
            return (
              <div
                key={message.id}
                id={`msg-${message.id}`}
                className={isCurrentMatchMsg ? "scroll-mt-20" : ""}
              >
                <PreviewMessage
                  addToolApprovalResponse={addToolApprovalResponse}
                  chatId={chatId}
                  isLoading={
                    status === "streaming" && messages.length - 1 === index
                  }
                  isReadonly={isReadonly}
                  message={message}
                  onEdit={onEditMessage}
                  regenerate={regenerate}
                  requiresScrollPadding={
                    hasSentMessage && index === messages.length - 1
                  }
                  searchQuery={searchQuery}
                  isCurrentMatch={isCurrentMatchMsg}
                  setMessages={setMessages}
                  vote={
                    votes
                      ? votes.find((vote) => vote.messageId === message.id)
                      : undefined
                  }
                />
              </div>
            );
          })}

          {status === "submitted" && messages.at(-1)?.role !== "assistant" && (
            <ThinkingMessage />
          )}

          <div
            className="min-h-[24px] min-w-[24px] shrink-0"
            ref={messagesEndRef}
          />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        className={`absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full border border-border/50 bg-card/90 px-3.5 shadow-[var(--shadow-float)] backdrop-blur-lg transition-all duration-200 h-7 text-[10px] ${
          isAtBottom
            ? "pointer-events-none scale-90 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        }`}
        onClick={handleScrollToBottom}
        type="button"
      >
        <ArrowDownIcon className="size-3 text-muted-foreground" />
      </button>
    </div>
  );
}

export const Messages = PureMessages;
