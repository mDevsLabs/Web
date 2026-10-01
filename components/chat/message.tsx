"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import {
  BrainIcon,
  CheckCircle2Icon,
  CpuIcon,
  ExternalLinkIcon,
  GlobeIcon,
  MicIcon,
  QrCodeIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";
import {
  AgentUserInputCard,
  type AgentUserInputSubmit,
} from "@/components/agent/agent-user-input-card";
import { unwrapAgentToolOutput } from "@/lib/agent/types";
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
import { AccountProfileCard } from "./account-profile-card";
import { AccountUsageCard } from "./account-usage-card";
import { AskUserCard } from "./ask-user-card";
import { CalendarReminderCard } from "./calendar-reminder-card";
import { CodeExecution } from "./code-execution";
import { useDataStream } from "./data-stream-provider";
import { DiagramCard } from "./diagram-card";
import { DocumentToolResult } from "./document";
import { DocumentParserCard } from "./document-parser-card";
import { DocumentPreview } from "./document-preview";
import { CopyIcon, DownloadIcon, EyeIcon, SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageReasoning } from "./message-reasoning";
import { PodcastCard } from "./podcast-card";
import { PreviewAttachment } from "./preview-attachment";
import { ProfilePictureCard } from "./profile-picture-card";
import { QuizCard } from "./quiz-card";
import { isWeatherAtLocation, isWeatherErrorOutput, Weather } from "./weather";
import { WebCaptureCard } from "./web-capture-card";
import {
  type WebSearchResultItem,
  WebSearchResults,
} from "./web-search-results";

function WaitingText() {
  const { waitingStatus } = useDataStream();
  const waitingText = waitingStatus?.message ?? "En attente...";

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

function AgentImageToolResult({
  output,
  toolCallId,
}: {
  output: {
    error?: string;
    height?: number;
    image_url?: string;
    prompt?: string;
    width?: number;
  };
  toolCallId: string;
}) {
  // Sortie de l'outil Agent generate_image : même carte que l'image du Chat
  // (aperçu, copie, téléchargement), l'identifiant de part étant identique.
  return <ImageToolResult output={output as any} toolCallId={toolCallId} />;
}

function AgentAudioToolResult({
  output,
}: {
  output: {
    audio_url?: string;
    error?: string;
    model?: string;
    text?: string;
    voice?: string;
  };
}) {
  // Sortie de l'outil Agent generate_audio : même carte lecteur que la
  // synthèse vocale du Chat (voix, transcription, lecture directe).
  return (
    <div className="flex w-[min(100%,480px)] flex-col gap-3 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm backdrop-blur-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MicIcon className="size-4" />
          </span>
          <span className="font-semibold text-[13px] text-foreground">
            Synthèse vocale Agent
          </span>
        </div>
        {typeof output.voice === "string" ? (
          <span className="rounded-full border border-border/30 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Voix : {output.voice.replace("flux-", "").replace("-en", "")}
          </span>
        ) : null}
      </div>

      <audio
        className="h-10 w-full rounded-lg outline-hidden"
        controls
        src={output.audio_url}
      >
        Votre navigateur ne supporte pas l'élément audio.
      </audio>

      {output.text ? (
        <div className="rounded-xl border border-border/20 bg-muted/30 p-2.5 text-[12px] italic leading-relaxed text-muted-foreground/90">
          «{output.text}»
        </div>
      ) : null}
    </div>
  );
}

function ToolApprovalActions({
  addToolApprovalResponse,
  approvalId,
  chatId,
  toolCallId,
  isAgent,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  approvalId: string;
  chatId?: string;
  toolCallId?: string;
  isAgent?: boolean;
}) {
  const [preview, setPreview] = useState<{
    enabled: boolean;
    preview?: {
      tool: string;
      target: string;
      effect: string;
      details?: string[];
    };
  } | null>(null);
  useEffect(() => {
    if (!isAgent || !chatId || !toolCallId) return;
    let cancelled = false;
    fetch(
      `/api/agent/runs?view=approvalPreview&chatId=${encodeURIComponent(chatId)}&toolCallId=${encodeURIComponent(toolCallId)}`
    )
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("preview"))
      )
      .then((value) => {
        if (!cancelled) setPreview(value);
      })
      .catch(() => {
        if (!cancelled) setPreview({ enabled: true });
      });
    return () => {
      cancelled = true;
    };
  }, [isAgent, chatId, toolCallId]);
  const handleDeny = useCallback(() => {
    addToolApprovalResponse({
      approved: false,
      id: approvalId,
      reason: "L'action a été refusée par l'utilisateur.",
    });
  }, [addToolApprovalResponse, approvalId]);

  const handleAllow = useCallback(() => {
    addToolApprovalResponse({
      approved: true,
      id: approvalId,
    });
  }, [addToolApprovalResponse, approvalId]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3">
      {preview?.enabled && preview.preview ? (
        <div className="w-full rounded-md bg-muted p-2 text-xs">
          <p className="font-medium">{preview.preview.tool}</p>
          <p>Cible : {preview.preview.target}</p>
          <p>Effet prévu : {preview.preview.effect}</p>
          {preview.preview.details?.length ? (
            <p className="mt-1 break-words text-muted-foreground">
              Paramètres : {preview.preview.details.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
      {preview?.enabled && !preview.preview ? (
        <p className="w-full text-xs text-destructive">
          Aperçu indisponible : l'accord est suspendu.
        </p>
      ) : null}
      <button
        className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
        onClick={handleDeny}
        type="button"
      >
        Refuser
      </button>
      <button
        className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        disabled={
          isAgent && (!preview || (preview.enabled && !preview.preview))
        }
        onClick={handleAllow}
        type="button"
      >
        Autoriser
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

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({
  text,
  query,
  isCurrent,
}: {
  text: string;
  query?: string;
  isCurrent?: boolean;
}) {
  if (!query?.trim()) {
    return <>{sanitizeText(text)}</>;
  }
  const q = query.trim();
  if (q.length === 0) {
    return <>{sanitizeText(text)}</>;
  }
  const regex = new RegExp(`(${escapeRegExp(q)})`, "gi");
  const parts = text.split(regex);
  if (parts.length <= 1) {
    return <>{sanitizeText(text)}</>;
  }
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            className={
              isCurrent
                ? "bg-yellow-400 text-black rounded px-0.5"
                : "bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
            }
            key={i}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages: _setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
  onEdit,
  searchQuery,
  isCurrentMatch,
  submitUserInputAnswer,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  // Réponse à une question Agent : le serveur valide, persiste puis relance le
  // MÊME run. Absent côté Chat, où la clarification reste locale au message.
  submitUserInputAnswer?: AgentUserInputSubmit;
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  onEdit?: (message: ChatMessage) => void;
  searchQuery?: string;
  isCurrentMatch?: boolean;
}) => {
  // `parts` est `notNull` en base et toujours un tableau côté SDK, mais c'était la
  // SEULE lecture non gardée de ce fichier : une ligne malformée suffisait à
  // faire tomber le segment de route entier — donc la conversation, le
  // compositeur et l'historique avec. Toute lecture passe par cette liste.
  const messageParts = message.parts ?? [];

  const attachmentsFromMessage = messageParts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const hasAnyContent = messageParts.some(
    (part) =>
      (part.type === "text" && part.text?.trim().length > 0) ||
      (part.type === "reasoning" &&
        "text" in part &&
        part.text?.trim().length > 0) ||
      (typeof part.type === "string" && part.type.startsWith("tool-"))
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

  const mergedReasoning = messageParts.reduce(
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

  // Fin prématurée : le stream s'est arrêté juste après l'appel d'un outil,
  // sans résultat ni continuation (ex. le modèle annonce une recherche puis plus rien).
  const interruptedAfterToolCall = useMemo(() => {
    if (!isAssistant || isLoading) {
      return false;
    }
    const last = messageParts.at(-1);
    if (!last) {
      return false;
    }
    const lastType = last.type as string;
    if (!lastType.startsWith("tool-") && lastType !== "dynamic-tool") {
      return false;
    }
    const state = (last as { state?: string }).state;
    return (
      state === "input-available" ||
      state === "input-streaming" ||
      state === "approval-responded"
    );
  }, [isAssistant, isLoading, messageParts]);

  const parts = messageParts.map((part, index) => {
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
      const hasSearch = !!searchQuery?.trim();
      return (
        <MessageContent
          className={cn("text-[14px] sm:text-[13px] leading-[1.65]", {
            "w-fit max-w-[85%] sm:max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted dark:from-zinc-800 dark:to-zinc-800/80 px-3.5 py-2 sm:py-2 shadow-[var(--shadow-card)]":
              message.role === "user",
          })}
          data-testid="message-content"
          key={key}
        >
          {hasSearch ? (
            <div
              className={cn(isCurrentMatch && "ring-1 ring-yellow-400 rounded")}
            >
              <HighlightedText
                isCurrent={isCurrentMatch}
                query={searchQuery}
                text={part.text}
              />
            </div>
          ) : (
            <MessageResponse>{sanitizeText(part.text)}</MessageResponse>
          )}
        </MessageContent>
      );
    }

    if ((type as string) === "error") {
      const errorText =
        (part as { errorText?: string }).errorText ||
        "Une erreur est survenue lors de la génération de la réponse.";
      return (
        <div
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
          key={key}
        >
          <span className="min-w-0 break-words">{errorText}</span>
          {!isReadonly && (
            <button
              className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
              onClick={() => regenerate()}
              type="button"
            >
              Régénérer
            </button>
          )}
        </div>
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
        // Le plugin peut renvoyer une erreur structurée (ville introuvable,
        // service indisponible) : on l'affiche au lieu de dérouler une carte
        // météo sur des données incomplètes.
        if (isWeatherErrorOutput(part.output)) {
          return (
            <div className={widthClass} key={toolCallId}>
              <Tool className="w-full" defaultOpen={true}>
                <ToolHeader state="output-available" type="tool-getWeather" />
                <ToolContent>
                  <div className="px-4 py-3 text-muted-foreground text-sm">
                    {part.output.error}
                  </div>
                </ToolContent>
              </Tool>
            </div>
          );
        }
        if (isWeatherAtLocation(part.output)) {
          return (
            <div className={widthClass} key={toolCallId}>
              <Weather weatherAtLocation={part.output} />
            </div>
          );
        }
        return null;
      }

      if (isDenied) {
        return (
          <div className={widthClass} key={toolCallId}>
            <Tool className="w-full" defaultOpen={true}>
              <ToolHeader state="output-denied" type="tool-getWeather" />
              <ToolContent>
                <div className="px-4 py-3 text-muted-foreground text-sm">
                  La recherche météo a été refusée.
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
                  chatId={chatId}
                  isAgent={Boolean(submitUserInputAnswer)}
                  toolCallId={toolCallId}
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
            Erreur lors de la création du document : {String(part.output.error)}
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
            Erreur lors de la mise à jour du document :{" "}
            {String(part.output.error)}
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
            Erreur lors de la modification du document :{" "}
            {String(part.output.error)}
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
                      Erreur : {String(part.output.error)}
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

    if ((type as string) === "tool-generate_image") {
      const toolPart = part as any;
      const { toolCallId } = toolPart;
      const output = unwrapAgentToolOutput(toolPart.output) as any;
      if (
        toolPart.state === "output-available" &&
        output &&
        !output.error &&
        output.image_url
      ) {
        return (
          <AgentImageToolResult
            key={toolCallId ?? key}
            output={output}
            toolCallId={toolCallId ?? key}
          />
        );
      }
      if (toolPart.state === "output-available" && output?.error) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
            key={toolCallId ?? key}
          >
            Erreur génération image : {String(output.error)}
          </div>
        );
      }
      return null;
    }

    if ((type as string) === "tool-generate_audio") {
      const toolPart = part as any;
      const output = unwrapAgentToolOutput(toolPart.output) as any;
      if (
        toolPart.state === "output-available" &&
        output &&
        !output.error &&
        output.audio_url
      ) {
        return (
          <AgentAudioToolResult
            key={toolPart.toolCallId ?? key}
            output={output}
          />
        );
      }
      if (toolPart.state === "output-available" && output?.error) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
            key={toolPart.toolCallId ?? key}
          >
            Erreur synthèse vocale : {String(output.error)}
          </div>
        );
      }
      return null;
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
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MicIcon className="size-4" />
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

    if (type === "tool-webSearch") {
      const { toolCallId, state } = part;
      const output = unwrapAgentToolOutput(part.output);

      if (state === "output-available" && output) {
        if (
          typeof output === "object" &&
          output !== null &&
          "error" in output
        ) {
          return (
            <div
              className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
              key={toolCallId}
            >
              Recherche Web : {String((output as { error: unknown }).error)}
            </div>
          );
        }
        const result = output as {
          query?: string;
          results?: WebSearchResultItem[];
        };
        return (
          <WebSearchResults
            key={toolCallId}
            query={result.query}
            results={result.results || []}
          />
        );
      }

      return (
        <div className="w-[min(100%,450px)]" key={toolCallId}>
          <Tool className="w-full" defaultOpen={true}>
            <ToolHeader state={state} type="tool-webSearch" />
            <ToolContent>
              {(state === "input-available" || state === "input-streaming") && (
                <ToolInput input={part.input} />
              )}
            </ToolContent>
          </Tool>
        </div>
      );
    }

    if (type === "tool-memory") {
      const toolPart = part as any;
      const { state, toolCallId, input } = toolPart;
      const output = unwrapAgentToolOutput(toolPart.output) as any;
      const action = input?.action || output?.action || "add";
      const isAvailable = state === "output-available";
      const isError = state === "output-error" || (output && "error" in output);

      return (
        <div
          className="w-[min(100%,480px)] overflow-hidden rounded-2xl border border-sky-500/30 bg-card shadow-xs backdrop-blur-xs transition"
          key={toolCallId || key}
        >
          <div className="flex items-center justify-between gap-2 border-b border-sky-500/20 bg-sky-500/10 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
                <BrainIcon className="size-4" />
              </span>
              <span className="font-semibold text-[13px] text-foreground">
                {action === "add"
                  ? "💾 Mémorisation utilisateur"
                  : action === "delete"
                    ? "🗑️ Oubli de mémoire"
                    : "🧠 Consultation de la mémoire"}
              </span>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                isError
                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : isAvailable
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-sky-500/20 text-sky-600 dark:text-sky-400 animate-pulse"
              )}
            >
              {isError ? "Erreur" : isAvailable ? "Enregistré" : "En cours..."}
            </span>
          </div>
          <div className="p-3 text-[12.5px] space-y-1.5">
            {action === "add" && (
              <p className="text-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border/40">
                «{" "}
                {input?.content ||
                  output?.memory?.content ||
                  "Enregistrement d'une information..."}{" "}
                »
              </p>
            )}
            {action === "delete" && (
              <p className="text-muted-foreground">
                {isAvailable
                  ? "L'information a été retirée de votre mémoire avec succès."
                  : "Suppression de l'entrée en mémoire..."}
              </p>
            )}
            {(action === "list" || action === "search") && (
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  {output?.count === undefined
                    ? "Recherche dans la mémoire..."
                    : `${output.count} information(s) trouvée(s) :`}
                </span>
                {output?.memories && output.memories.length > 0 && (
                  <ul className="divide-y divide-border/30 rounded-lg border border-border/40 bg-muted/20 max-h-36 overflow-y-auto">
                    {output.memories.map((m: any, idx: number) => (
                      <li
                        className="p-2 text-[12px] text-foreground"
                        key={m.id || idx}
                      >
                        • {m.content}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {isError && (
              <div className="text-red-500 text-xs mt-1">
                {String(
                  output?.error ||
                    "Une erreur est survenue lors de l'opération de mémoire."
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (
      type.startsWith("tool-mcp_") ||
      (type === "dynamic-tool" && (part as any).toolName?.startsWith("mcp_"))
    ) {
      const toolPart = part as any;
      const { state, toolCallId, input } = toolPart;
      const output = unwrapAgentToolOutput(toolPart.output) as {
        error?: unknown;
      } | null;
      const rawName = (toolPart.toolName || type)
        .replace(/^tool-/, "")
        .replace(/^mcp_/, "");
      const nameParts = rawName.split("_");
      const serverName =
        nameParts.length > 1 ? nameParts[0].toUpperCase() : "MCP";
      const methodName =
        nameParts.length > 1 ? nameParts.slice(1).join("_") : rawName;
      const isAvailable = state === "output-available";
      const isError = state === "output-error" || (output && "error" in output);

      return (
        <div
          className="w-[min(100%,480px)] overflow-hidden rounded-2xl border border-purple-500/30 bg-card shadow-xs backdrop-blur-xs transition"
          key={toolCallId || key}
        >
          <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 bg-purple-500/10 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <CpuIcon className="size-4" />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[10.5px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {serverName}
                </span>
                <span className="font-semibold text-[13px] text-foreground">
                  {methodName}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                isError
                  ? "bg-red-500/15 text-red-600"
                  : isAvailable
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-purple-500/20 text-purple-600 animate-pulse"
              )}
            >
              {isError ? "Erreur" : isAvailable ? "Terminé" : "Exécution..."}
            </span>
          </div>
          <div className="p-3 text-xs space-y-2">
            {input && Object.keys(input).length > 0 && (
              <div>
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Paramètres
                </span>
                <div className="mt-1 rounded-lg bg-muted/40 p-2 overflow-x-auto max-h-28 text-[11.5px] font-mono border border-border/30">
                  {JSON.stringify(input, null, 2)}
                </div>
              </div>
            )}
            {isAvailable && output && (
              <div>
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Résultat
                </span>
                <div className="mt-1 rounded-lg bg-muted/40 p-2 overflow-x-auto max-h-40 text-[11.5px] font-mono border border-border/30">
                  {typeof output === "string"
                    ? output
                    : JSON.stringify(output, null, 2)}
                </div>
              </div>
            )}
            {isError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-600 text-xs">
                {String(
                  output?.error || "Erreur lors de l'exécution de l'outil MCP."
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (type === "tool-askUser") {
      const toolPart = part as any;
      return (
        <AskUserCard
          args={toolPart.input || toolPart.args}
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
          toolCallId={toolPart.toolCallId}
        />
      );
    }

    // Clarification Agent : identifiant d'outil snake_case du registre Agent.
    // La carte enregistre la réponse côté serveur (jamais localement) et
    // s'appuie sur la sortie persistée de l'outil : la question reste posée
    // après un refresh, jusqu'à ce qu'une réponse soit enregistrée.
    // Les identifiants d'outils Agent viennent du registre serveur : le type
    // union du Chat ne peut pas les énumérer (même convention que "error").
    if ((type as string) === "tool-ask_user") {
      const toolPart = part as any;
      return (
        <AgentUserInputCard
          input={toolPart.input ?? toolPart.args}
          key={toolPart.toolCallId ?? key}
          onSubmit={submitUserInputAnswer}
          output={toolPart.output}
          toolCallId={toolPart.toolCallId}
        />
      );
    }

    if (type === "tool-updateAccountProfile") {
      const toolPart = part as any;
      return (
        <AccountProfileCard
          args={toolPart.input || toolPart.args}
          isReadonly={isReadonly}
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
          toolCallId={toolPart.toolCallId}
        />
      );
    }

    if (type === "tool-updateProfilePicture") {
      const toolPart = part as any;
      return (
        <ProfilePictureCard
          args={toolPart.input || toolPart.args}
          isReadonly={isReadonly}
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
          toolCallId={toolPart.toolCallId}
        />
      );
    }

    if (type === "tool-getAccountUsage") {
      const toolPart = part as any;
      return (
        <AccountUsageCard
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
        />
      );
    }

    if (type === "tool-quizzly") {
      const toolPart = part as any;
      return (
        <QuizCard
          args={toolPart.input || toolPart.args}
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
        />
      );
    }

    if (type === "tool-generateDiagram") {
      const toolPart = part as any;
      return (
        <DiagramCard
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
        />
      );
    }

    if (type === "tool-audioPodcast") {
      const toolPart = part as any;
      return (
        <PodcastCard
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
        />
      );
    }

    if (type === "tool-webCapture") {
      const toolPart = part as any;
      return (
        <WebCaptureCard
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
        />
      );
    }

    if (type === "tool-documentParser") {
      const toolPart = part as any;
      return (
        <DocumentParserCard
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
        />
      );
    }

    if (type === "tool-calendarReminder") {
      const toolPart = part as any;
      return (
        <CalendarReminderCard
          key={toolPart.toolCallId ?? key}
          output={toolPart.output}
          state={toolPart.state}
        />
      );
    }

    if (type.startsWith("tool-") || type === "dynamic-tool") {
      const toolPart = part as any;
      const { state, toolCallId } = toolPart;
      const approvalId = toolPart.approval?.id || toolCallId;

      return (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={state !== "output-available"}
          key={toolCallId ?? key}
        >
          {type === "dynamic-tool" ? (
            <ToolHeader
              state={state}
              toolName={toolPart.toolName ?? "Outil MCP"}
              type={type}
            />
          ) : (
            <ToolHeader state={state} type={type as any} />
          )}
          <ToolContent>
            {(state === "input-available" ||
              state === "input-streaming" ||
              state === "approval-requested") && (
              <ToolInput input={toolPart.input} />
            )}
            {state === "output-available" && (
              <ToolOutput
                errorText={undefined}
                output={unwrapAgentToolOutput(toolPart.output)}
              />
            )}

            {state === "output-error" && (
              <ToolOutput errorText={toolPart.errorText} output={undefined} />
            )}
            {state === "approval-requested" && approvalId && (
              <ToolApprovalActions
                addToolApprovalResponse={addToolApprovalResponse}
                approvalId={approvalId}
                chatId={chatId}
                isAgent={Boolean(submitUserInputAnswer)}
                toolCallId={toolCallId}
              />
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
      {interruptedAfterToolCall && !isReadonly && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          <span className="min-w-0 flex-1">
            La réponse s'est interrompue avant le résultat de l'outil.
          </span>
          <button
            className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
            onClick={() => regenerate()}
            type="button"
          >
            Régénérer
          </button>
        </div>
      )}
      {actions}
    </>
  );

  return (
    <div
      className={cn(
        "group/message w-full",
        isAssistant
          ? "message-fade-in"
          : "animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
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
