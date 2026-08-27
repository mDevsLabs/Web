"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import {
  cn,
  copyImageToClipboard,
  downloadImage,
  formatImageSrc,
  sanitizeText,
} from "@/lib/utils";
import { MessageContent, MessageResponse } from "../ai-elements/message";
import { Shimmer } from "../ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../ai-elements/tool";
import { CodeExecution } from "./code-execution";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { CopyIcon, DownloadIcon, EyeIcon, SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";

function WaitingText() {
  const { waitingStatus } = useDataStream();
  const waitingText = waitingStatus?.message ?? "Waiting...";

  return (
    <div className="flex min-h-[calc(13px*1.65)] min-w-0 items-center text-[13px] leading-[1.65]">
      <Shimmer
        as="span"
        className="font-medium whitespace-normal break-words"
        duration={1}
      >
        {waitingText}
      </Shimmer>
    </div>
  );
}

function ToolApprovalActions({
  addToolApprovalResponse,
  approvalId,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  approvalId: string;
}) {
  const handleDeny = useCallback(() => {
    addToolApprovalResponse({
      approved: false,
      id: approvalId,
      reason: "User denied weather lookup",
    });
  }, [addToolApprovalResponse, approvalId]);

  const handleAllow = useCallback(() => {
    addToolApprovalResponse({
      approved: true,
      id: approvalId,
    });
  }, [addToolApprovalResponse, approvalId]);

  return (
    <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
      <button
        className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
        onClick={handleDeny}
        type="button"
      >
        Deny
      </button>
      <button
        className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        onClick={handleAllow}
        type="button"
      >
        Allow
      </button>
    </div>
  );
}

function ImageToolResult({
  output,
  toolCallId,
}: {
  output: any;
  toolCallId: string;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const imageSrc = formatImageSrc(output.image_url);

  return (
    <div
      className="group relative w-[min(100%,480px)] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      key={toolCallId}
    >
      <div
        className="relative cursor-pointer overflow-hidden bg-black/5"
        onClick={() => setIsPreviewOpen(true)}
      >
        <img
          alt={output.prompt || "Image générée"}
          className="h-auto w-full object-contain transition duration-300 group-hover:scale-[1.01]"
          src={imageSrc}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <EyeIcon size={14} /> Agrandir
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-3.5 py-2 text-xs">
        <div className="min-w-0 flex-1 truncate pr-2 text-muted-foreground">
          {output.prompt || "Image générée par mAI"}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
            onClick={async () => {
              const ok = await copyImageToClipboard(imageSrc);
              if (ok) {
                toast.success("Image copiée !");
              } else {
                toast.error("Échec de la copie.");
              }
            }}
            title="Copier l'image"
            type="button"
          >
            <CopyIcon size={14} />
          </button>
          <button
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
            onClick={() =>
              downloadImage(imageSrc, `mai-image-${Date.now()}.png`)
            }
            title="Télécharger l'image"
            type="button"
          >
            <DownloadIcon size={14} />
          </button>
        </div>
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              alt={output.prompt || "Image agrandie"}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl border border-white/10 object-contain shadow-2xl"
              src={imageSrc}
            />
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/30"
                onClick={() =>
                  downloadImage(imageSrc, `mai-image-${Date.now()}.png`)
                }
                type="button"
              >
                <DownloadIcon size={16} />
                <span>Télécharger</span>
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                onClick={() => setIsPreviewOpen(false)}
                type="button"
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages: _setMessages,
  regenerate: _regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
  onEdit,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  onEdit?: (message: ChatMessage) => void;
}) => {
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const hasAnyContent = message.parts?.some(
    (part) =>
      (part.type === "text" && part.text?.trim().length > 0) ||
      (part.type === "reasoning" &&
        "text" in part &&
        part.text?.trim().length > 0) ||
      part.type.startsWith("tool-")
  );
  const isThinking = isAssistant && isLoading && !hasAnyContent;

  const attachments = attachmentsFromMessage.length > 0 && (
    <div
      className="flex flex-row justify-end gap-2"
      data-testid={"message-attachments"}
    >
      {attachmentsFromMessage.map((attachment) => (
        <PreviewAttachment
          attachment={{
            contentType: attachment.mediaType,
            name: attachment.filename ?? "file",
            url: attachment.url,
          }}
          key={attachment.url}
        />
      ))}
    </div>
  );

  const mergedReasoning = message.parts?.reduce(
    (acc, part) => {
      if (part.type === "reasoning" && part.text?.trim().length > 0) {
        return {
          isStreaming: "state" in part ? part.state === "streaming" : false,
          rendered: false,
          text: acc.text ? `${acc.text}\n\n${part.text}` : part.text,
        };
      }
      return acc;
    },
    { isStreaming: false, rendered: false, text: "" }
  ) ?? { isStreaming: false, rendered: false, text: "" };

  const parts = message.parts?.map((part, index) => {
    const { type } = part;
    const key = `message-${message.id}-part-${index}`;

    if (type === "reasoning") {
      if (!mergedReasoning.rendered && mergedReasoning.text) {
        mergedReasoning.rendered = true;
        return (
          <MessageReasoning
            isLoading={isLoading || mergedReasoning.isStreaming}
            key={key}
            reasoning={mergedReasoning.text}
          />
        );
      }
      return null;
    }

    if (type === "text") {
      return (
        <MessageContent
          className={cn("text-[13px] leading-[1.65]", {
            "w-fit max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 shadow-[var(--shadow-card)]":
              message.role === "user",
          })}
          data-testid="message-content"
          key={key}
        >
          <MessageResponse>{sanitizeText(part.text)}</MessageResponse>
        </MessageContent>
      );
    }

    if (type === "tool-getWeather") {
      const { toolCallId, state } = part;
      const approvalId = (part as { approval?: { id: string } }).approval?.id;
      const isDenied =
        state === "output-denied" ||
        (state === "approval-responded" &&
          (part as { approval?: { approved?: boolean } }).approval?.approved ===
            false);
      const widthClass = "w-[min(100%,450px)]";

      if (state === "output-available") {
        return (
          <div className={widthClass} key={toolCallId}>
            <Weather weatherAtLocation={part.output} />
          </div>
        );
      }

      if (isDenied) {
        return (
          <div className={widthClass} key={toolCallId}>
            <Tool className="w-full" defaultOpen={true}>
              <ToolHeader state="output-denied" type="tool-getWeather" />
              <ToolContent>
                <div className="px-4 py-3 text-muted-foreground text-sm">
                  Weather lookup was denied.
                </div>
              </ToolContent>
            </Tool>
          </div>
        );
      }

      if (state === "approval-responded") {
        return (
          <div className={widthClass} key={toolCallId}>
            <Tool className="w-full" defaultOpen={true}>
              <ToolHeader state={state} type="tool-getWeather" />
              <ToolContent>
                <ToolInput input={part.input} />
              </ToolContent>
            </Tool>
          </div>
        );
      }

      return (
        <div className={widthClass} key={toolCallId}>
          <Tool className="w-full" defaultOpen={true}>
            <ToolHeader state={state} type="tool-getWeather" />
            <ToolContent>
              {(state === "input-available" ||
                state === "approval-requested") && (
                <ToolInput input={part.input} />
              )}
              {state === "approval-requested" && approvalId && (
                <ToolApprovalActions
                  addToolApprovalResponse={addToolApprovalResponse}
                  approvalId={approvalId}
                />
              )}
            </ToolContent>
          </Tool>
        </div>
      );
    }

    if (type === "tool-createDocument") {
      const { toolCallId } = part;

      if (part.output && "error" in part.output) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
            key={toolCallId}
          >
            Error creating document: {String(part.output.error)}
          </div>
        );
      }

      return (
        <DocumentPreview
          isReadonly={isReadonly}
          key={toolCallId}
          result={part.output}
        />
      );
    }

    if (type === "tool-updateDocument") {
      const { toolCallId } = part;

      if (part.output && "error" in part.output) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
            key={toolCallId}
          >
            Error updating document: {String(part.output.error)}
          </div>
        );
      }

      return (
        <div className="relative" key={toolCallId}>
          <DocumentPreview
            args={{ ...part.output, isUpdate: true }}
            isReadonly={isReadonly}
            result={part.output}
          />
        </div>
      );
    }

    if (type === "tool-editDocument") {
      const { toolCallId, state } = part as any;

      if (
        state === "output-available" &&
        part.output &&
        "error" in part.output
      ) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
            key={toolCallId}
          >
            Error editing document: {String(part.output.error)}
          </div>
        );
      }

      if (state === "output-available" && part.output) {
        return (
          <div className="relative" key={toolCallId}>
            <DocumentPreview
              args={{ ...part.output, isUpdate: true }}
              isReadonly={isReadonly}
              result={part.output}
            />
          </div>
        );
      }

      // Streaming / input states
      return (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-editDocument" />
          <ToolContent>
            {state === "input-available" && <ToolInput input={part.input} />}
            {state === "output-available" &&
              part.output &&
              !("error" in part.output) && (
                <ToolOutput
                  errorText={undefined}
                  output={
                    <DocumentToolResult
                      isReadonly={isReadonly}
                      result={part.output}
                      type="update"
                    />
                  }
                />
              )}
          </ToolContent>
        </Tool>
      );
    }

    if (type === "tool-requestSuggestions") {
      const { toolCallId, state } = part;

      return (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-requestSuggestions" />
          <ToolContent>
            {state === "input-available" && <ToolInput input={part.input} />}
            {state === "output-available" && (
              <ToolOutput
                errorText={undefined}
                output={
                  "error" in part.output ? (
                    <div className="rounded border p-2 text-red-500">
                      Error: {String(part.output.error)}
                    </div>
                  ) : (
                    <DocumentToolResult
                      isReadonly={isReadonly}
                      result={part.output}
                      type="request-suggestions"
                    />
                  )
                }
              />
            )}
          </ToolContent>
        </Tool>
      );
    }

    if (type === "tool-imageGenerate") {
      const { toolCallId, state } = part as any;
      if (state === "output-available" && part.output) {
        if ("error" in part.output) {
          return (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              key={toolCallId}
            >
              Erreur génération image: {String(part.output.error)}
            </div>
          );
        }
        if ((part.output as any).image_url) {
          return (
            <ImageToolResult
              key={toolCallId}
              output={part.output}
              toolCallId={toolCallId}
            />
          );
        }
      }
      return (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={true}
          key={(part as any).toolCallId}
        >
          <ToolHeader state={state} type="tool-imageGenerate" />
          <ToolContent>
            {state === "input-available" && (
              <ToolInput input={(part as any).input} />
            )}
          </ToolContent>
        </Tool>
      );
    }

    if (type === "tool-audioGenerate") {
      const { toolCallId, state } = part as any;
      if (state === "output-available" && part.output) {
        if ("error" in part.output) {
          return (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              key={toolCallId}
            >
              Erreur synthèse vocale: {String(part.output.error)}
            </div>
          );
        }
        const audioUrl = (part.output as any).audio_url;
        if (audioUrl) {
          return (
            <div
              className="w-[min(100%,480px)] rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm backdrop-blur-xs flex flex-col gap-3"
              key={toolCallId}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    🎙️
                  </span>
                  <span className="font-semibold text-[13px] text-foreground">
                    Synthèse vocale mAI
                  </span>
                </div>
                {(part.output as any).voice && (
                  <span className="text-[11px] font-medium bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
                    Voix :{" "}
                    {(part.output as any).voice
                      .replace("flux-", "")
                      .replace("-en", "")}
                  </span>
                )}
              </div>

              <audio
                className="w-full h-10 rounded-lg outline-hidden"
                controls
                src={audioUrl}
              >
                Votre navigateur ne supporte pas l'élément audio.
              </audio>

              {(part.output as any).text && (
                <div className="text-[12px] leading-relaxed text-muted-foreground/90 italic bg-muted/30 p-2.5 rounded-xl border border-border/20">
                  "{(part.output as any).text}"
                </div>
              )}
            </div>
          );
        }
      }
      return (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={true}
          key={(part as any).toolCallId}
        >
          <ToolHeader state={state} type="tool-audioGenerate" />
          <ToolContent>
            {state === "input-available" && (
              <ToolInput input={(part as any).input} />
            )}
          </ToolContent>
        </Tool>
      );
    }

    if (type === "tool-codeExecution") {
      const { toolCallId, state } = part as any;
      if (
        state === "output-available" &&
        part.output &&
        !("error" in part.output) &&
        (part.output as any).code
      ) {
        return (
          <div className="w-full" key={toolCallId}>
            <CodeExecution
              code={(part.output as any).code}
              language={(part.output as any).language}
            />
          </div>
        );
      }
      if (
        state === "output-available" &&
        part.output &&
        "error" in part.output
      ) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            key={toolCallId}
          >
            Erreur code: {String((part.output as any).error)}
          </div>
        );
      }
      return (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={true}
          key={(part as any).toolCallId}
        >
          <ToolHeader state={state} type="tool-codeExecution" />
          <ToolContent>
            {state === "input-available" && (
              <ToolInput input={(part as any).input} />
            )}
          </ToolContent>
        </Tool>
      );
    }

    return null;
  });

  const actions = !isReadonly && (
    <MessageActions
      chatId={chatId}
      isLoading={isLoading}
      key={`action-${message.id}`}
      message={message}
      onEdit={onEdit ? () => onEdit(message) : undefined}
      vote={vote}
    />
  );

  const content = isThinking ? (
    <WaitingText />
  ) : (
    <>
      {attachments}
      {parts}
      {actions}
    </>
  );

  return (
    <div
      className={cn(
        "group/message w-full",
        !isAssistant && "animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
      )}
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          isUser ? "flex flex-col items-end gap-2" : "flex items-start gap-3"
        )}
      >
        {isAssistant && (
          <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={13} />
            </div>
          </div>
        )}
        {isAssistant ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">{content}</div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => (
  <div
    className="group/message w-full"
    data-role="assistant"
    data-testid="message-assistant-loading"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
        <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
          <SparklesIcon size={13} />
        </div>
      </div>

      <WaitingText />
    </div>
  </div>
);
