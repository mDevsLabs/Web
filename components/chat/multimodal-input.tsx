"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  BrainIcon,
  CheckCircle2Icon,
  CloudIcon,
  Code2Icon,
  EyeIcon,
  LockIcon,
  PlusIcon,
  ScaleIcon,
  SparklesIcon,
  TargetIcon,
  UploadIcon,
  WrenchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { AI_MODES, type AIModeId } from "@/lib/ai/modes";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/app/(chat)/library/page";
import { useActiveChat } from "@/hooks/use-active-chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { PaperclipIcon, StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { CloudFilePickerDialog } from "./cloud-file-picker-dialog";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  editingMessage,
  onCancelEdit,
  isLoading,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage:
    | UseChatHelpers<ChatMessage>["sendMessage"]
    | (() => Promise<void>);
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    `input:${chatId}`,
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStorageInput, chatId]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  // Capacités du modèle sélectionné (source unique via /api/models)
  const { data: modelCapsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const capsMap: Record<string, ModelCapabilities> | undefined =
    modelCapsData?.capabilities;
  const currentCapabilities = capsMap?.[selectedModelId];
  const hasVisionSupport = Boolean(
    currentCapabilities?.vision ||
      currentCapabilities?.image ||
      currentCapabilities?.file
  );
  const hasStrictCaps = Boolean(capsMap && currentCapabilities !== undefined);

  // Vider les pièces jointes si le modèle ne supporte plus la vision/fichiers
  useEffect(() => {
    if (!hasStrictCaps) return;
    if (!hasVisionSupport && attachments.length > 0) {
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.error(
        "Pièces jointes retirées : ce modèle ne prend pas en charge les fichiers/images."
      );
    }
  }, [hasVisionSupport, hasStrictCaps, attachments.length, setAttachments]);

  const handleCloudAttachments = useCallback(
    (newAttachments: Attachment[]) => {
      if (!hasVisionSupport && hasStrictCaps) {
        toast.error(
          "Ce modèle ne prend pas en charge l'importation de fichiers."
        );
        return;
      }
      setAttachments((curr) => [...curr, ...newAttachments]);
    },
    [setAttachments, hasVisionSupport, hasStrictCaps]
  );


  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const val = event.target.value;
      setInput(val);

      if (val.startsWith("/") && !val.includes(" ")) {
        setSlashOpen(true);
        setSlashQuery(val.slice(1));
        setSlashIndex(0);
      } else {
        setSlashOpen(false);
      }
    },
    [setInput]
  );

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      setSlashOpen(false);
      setInput("");
      switch (cmd.action) {
        case "new":
          router.push("/");
          break;
        case "clear":
          setMessages(() => []);
          break;
        case "rename":
          toast("Rename is available from the sidebar chat menu.");
          break;
        case "model": {
          const modelBtn = document.querySelector<HTMLButtonElement>(
            "[data-testid='model-selector']"
          );
          modelBtn?.click();
          break;
        }
        case "theme":
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          break;
        case "delete":
          toast("Delete this chat?", {
            action: {
              label: "Delete",
              onClick: () => {
                fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                  { method: "DELETE" }
                );
                router.push("/");
                toast.success("Chat deleted");
              },
            },
          });
          break;
        case "purge":
          toast("Delete all chats?", {
            action: {
              label: "Delete all",
              onClick: () => {
                fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
                  {
                    method: "DELETE",
                  }
                );
                router.push("/");
                toast.success("All chats deleted");
              },
            },
          });
          break;
        default:
          break;
      }
    },
    [chatId, resolvedTheme, router, setInput, setMessages, setTheme]
  );

  const submitForm = useCallback(() => {
    if (attachments.length > 0 && !hasVisionSupport && hasStrictCaps) {
      toast.error(
        "Ce modèle ne prend pas en charge les fichiers. Retirez les pièces jointes ou changez de modèle."
      );
      return;
    }

    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );

    sendMessage({
      parts: [
        ...attachments.map((attachment) => ({
          mediaType: attachment.contentType,
          name: attachment.name,
          type: "file" as const,
          url: attachment.url,
        })),
        {
          text: input,
          type: "text",
        },
      ],
      role: "user",
    });

    setAttachments([]);
    setLocalStorageInput("");
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    hasVisionSupport,
    hasStrictCaps,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
        {
          body: formData,
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          contentType,
          name: pathname,
          url,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch {
      toast.error("Failed to upload file, please try again!");
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!hasVisionSupport && hasStrictCaps) {
        toast.error(
          "Ce modèle ne prend pas en charge l'importation de fichiers."
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch {
        toast.error("Failed to upload files");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile, hasVisionSupport, hasStrictCaps]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!hasVisionSupport && hasStrictCaps) {
        const itemsCheck = event.clipboardData?.items;
        if (itemsCheck) {
          const hasImages = Array.from(itemsCheck).some((i) =>
            i.type.startsWith("image/")
          );
          if (hasImages) {
            event.preventDefault();
            toast.error(
              "Ce modèle ne prend pas en charge les images. Changez de modèle pour coller des fichiers."
            );
            return;
          }
        }
        return;
      }
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) {
        return;
      }

      event.preventDefault();

      setUploadQueue((prev) => [...prev, "Pasted image"]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) =>
            attachment !== undefined &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch {
        toast.error("Failed to upload pasted image(s)");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile, hasVisionSupport, hasStrictCaps]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  // Bloquer le drag & drop si le modèle ne supporte pas vision/fichiers
  useEffect(() => {
    if (hasVisionSupport || !hasStrictCaps) return;
    const handler = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        // toast uniquement sur drop, pas sur dragover continu
        if (e.type === "drop") {
          toast.error(
            "Ce modèle ne prend pas en charge les fichiers. Changez de modèle pour glisser-déposer."
          );
        }
      }
    };
    const el = textareaRef.current?.closest("form") || document;
    el.addEventListener("dragover", handler as any);
    el.addEventListener("drop", handler as any);
    return () => {
      el.removeEventListener("dragover", handler as any);
      el.removeEventListener("drop", handler as any);
    };
  }, [hasVisionSupport, hasStrictCaps]);

  const handleCancelEditMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onCancelEdit?.();
    },
    [onCancelEdit]
  );

  const handleSlashClose = useCallback(() => {
    setSlashOpen(false);
  }, []);

  const handlePromptSubmit = useCallback(() => {
    if (input.startsWith("/")) {
      const query = input.slice(1).trim();
      const cmd = slashCommands.find((c) => c.name === query);
      if (cmd) {
        handleSlashSelect(cmd);
      }
      return;
    }
    if (!input.trim() && attachments.length === 0) {
      return;
    }
    if (attachments.length > 0 && !hasVisionSupport && hasStrictCaps) {
      toast.error(
        "Ce modèle ne prend pas en charge les fichiers. Retirez les pièces jointes ou changez de modèle."
      );
      return;
    }
    if (status === "ready" || status === "error") {
      submitForm();
    } else {
      toast.error("Please wait for the model to finish its response!");
    }
  }, [
    attachments.length,
    handleSlashSelect,
    hasVisionSupport,
    hasStrictCaps,
    input,
    status,
    submitForm,
  ]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (slashOpen) {
        const filtered = slashCommands.filter((cmd) =>
          cmd.name.startsWith(slashQuery.toLowerCase())
        );
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          if (filtered[slashIndex]) {
            handleSlashSelect(filtered[slashIndex]);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSlashOpen(false);
          return;
        }
      }
      if (e.key === "Escape" && editingMessage && onCancelEdit) {
        e.preventDefault();
        onCancelEdit();
      }
    },
    [
      editingMessage,
      handleSlashSelect,
      onCancelEdit,
      slashIndex,
      slashOpen,
      slashQuery,
    ]
  );

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {editingMessage && onCancelEdit ? (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Editing message</span>
          <button
            className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            onMouseDown={handleCancelEditMouseDown}
            type="button"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {!editingMessage &&
        !isLoading &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}

      <input
        accept={
          hasVisionSupport || !hasStrictCaps
            ? "image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv,application/json"
            : ""
        }
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        disabled={!hasVisionSupport && hasStrictCaps}
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <div className="relative">
        {slashOpen ? (
          <SlashCommandMenu
            onClose={handleSlashClose}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        ) : null}
      </div>

      <PromptInput
        className="[&>div]:rounded-2xl [&>div]:border [&>div]:border-border/30 [&>div]:bg-card/70 [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-shadow [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
        onSubmit={handlePromptSubmit}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <AttachmentPreviewItem
                attachment={attachment}
                fileInputRef={fileInputRef}
                key={attachment.url}
                setAttachments={setAttachments}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  contentType: "",
                  name: filename,
                  url: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className="min-h-24 text-[13px] leading-relaxed px-4 pt-3.5 pb-1.5 placeholder:text-muted-foreground/35"
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={handleTextareaKeyDown}
          placeholder={
            editingMessage ? "Modifier votre message..." : "Poser une question à mAI..."
          }
          ref={textareaRef}
          value={input}
        />
        <PromptInputFooter className="px-3 pb-3">
          <PromptInputTools>
            <PlusMenuButton
              fileInputRef={fileInputRef}
              onOpenCloudPicker={() => setCloudPickerOpen(true)}
              selectedModelId={selectedModelId}
              status={status}
            />
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className={cn(
                "h-7 w-7 rounded-xl transition-all duration-200",
                input.trim() || attachments.length > 0
                  ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                  : "bg-muted text-muted-foreground/25 cursor-not-allowed"
              )}
              data-testid="send-button"
              disabled={(!input.trim() && attachments.length === 0) || uploadQueue.length > 0}
              status={status}
              variant="secondary"
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
          )}
        </PromptInputFooter>
      </PromptInput>

      <CloudFilePickerDialog
        open={cloudPickerOpen}
        onOpenChange={setCloudPickerOpen}
        onSelectAttachments={handleCloudAttachments}
      />
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (prevProps.editingMessage !== nextProps.editingMessage) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    return true;
  }
);

function PureAttachmentPreviewItem({
  attachment,
  fileInputRef,
  setAttachments,
}: {
  attachment: Attachment;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
}) {
  const handleRemove = useCallback(() => {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((a) => a.url !== attachment.url)
    );
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [attachment.url, fileInputRef, setAttachments]);

  return <PreviewAttachment attachment={attachment} onRemove={handleRemove} />;
}

const AttachmentPreviewItem = memo(PureAttachmentPreviewItem);

function formatTokenCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function PurePlusMenuButton({
  fileInputRef,
  status,
  selectedModelId,
  onOpenCloudPicker,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
  onOpenCloudPicker: () => void;
}) {
  const { data: modelsResponse } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );

  const { data: settingsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/settings`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: true }
  );

  const { data: libraryData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/library`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: true }
  );

  const caps: Record<string, ModelCapabilities> | undefined =
    modelsResponse?.capabilities;
  const currentCap = caps?.[selectedModelId];
  const hasStrictCapsBtn = Boolean(caps && currentCap !== undefined);
  const hasFileOrImage = hasStrictCapsBtn
    ? Boolean(currentCap?.vision || currentCap?.image || currentCap?.file)
    : false;
  // Pendant le chargement initial, on considère non grisé pour éviter flash
  const isVisionLoading = !hasStrictCapsBtn && !modelsResponse;

  // Calculs d'usages
  const aiTokensUsed = settingsData?.aiUsage?.tokensUsed ?? 0;
  const aiTokensLimit = settingsData?.aiUsage?.limit ?? 500000;
  const aiPercentUsed =
    aiTokensLimit > 0
      ? Math.min(100, Math.round((aiTokensUsed / aiTokensLimit) * 100))
      : 0;

  const cloudBytesUsed = libraryData?.storage?.bytes_used ?? 0;
  const cloudBytesLimit = libraryData?.storage?.bytes_limit ?? 524288000;
  const cloudPercentUsed =
    libraryData?.storage?.percent_used ??
    (cloudBytesLimit > 0
      ? Math.min(100, Math.round((cloudBytesUsed / cloudBytesLimit) * 100))
      : 0);

  // Mode IA global (via ActiveChat context)
  const { currentModeId, setCurrentModeId } = useActiveChat();

  const handleModeSelect = (id: AIModeId) => {
    setCurrentModeId(id);
    toast.success(`Mode IA : ${AI_MODES[id].label}`);
  };

  const handleDeviceUploadClick = () => {
    if (!hasFileOrImage && hasStrictCapsBtn && !isVisionLoading) {
      toast.error(
        "Ce modèle ne prend pas en charge l'importation de fichiers."
      );
      return;
    }
    if (isVisionLoading) {
      toast("Chargement des capacités du modèle...");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleCloudImportClick = () => {
    if (!hasFileOrImage && hasStrictCapsBtn && !isVisionLoading) {
      toast.error(
        "Ce modèle ne prend pas en charge l'importation de fichiers."
      );
      return;
    }
    if (isVisionLoading) {
      toast("Chargement des capacités du modèle...");
      return;
    }
    onOpenCloudPicker();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors hover:bg-muted text-foreground cursor-pointer shadow-2xs"
          data-testid="plus-menu-button"
          disabled={status !== "ready" && status !== "error"}
          variant="ghost"
          title="Ajouter du contenu & Options"
        >
          <PlusIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-80 p-2 rounded-2xl bg-popover/95 backdrop-blur-md shadow-2xl border border-border/60"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Ajouter du contexte à l'IA
        </DropdownMenuLabel>

        {/* Option 1: Importer depuis l'appareil */}
        <DropdownMenuItem
          onClick={handleDeviceUploadClick}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          className={cn(
            "flex items-start gap-2.5 p-2 rounded-xl cursor-pointer text-xs transition-colors",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted focus:bg-muted text-foreground"
              : "opacity-45 cursor-not-allowed text-muted-foreground"
          )}
        >
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <UploadIcon className="size-3.5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[13px]">
              Importer depuis votre appareil
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              {isVisionLoading
                ? "Vérification du modèle..."
                : hasFileOrImage || !hasStrictCapsBtn
                  ? "Photos, PDF, code et documents locaux"
                  : "Non supporté par ce modèle"}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Option 2: Importer depuis la Bibliothèque Cloud */}
        <DropdownMenuItem
          onClick={handleCloudImportClick}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          className={cn(
            "flex items-start gap-2.5 p-2 rounded-xl cursor-pointer text-xs transition-colors mt-1",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted focus:bg-muted text-foreground"
              : "opacity-45 cursor-not-allowed text-muted-foreground"
          )}
        >
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
            <CloudIcon className="size-3.5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[13px]">
              Fichiers de la Bibliothèque Cloud
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              {isVisionLoading
                ? "Vérification du modèle..."
                : hasFileOrImage || !hasStrictCapsBtn
                  ? "Sélectionner parmi vos documents enregistrés"
                  : "Non supporté par ce modèle"}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Modes IA - sous-menu déroulant global */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-xs mt-1 data-[state=open]:bg-muted">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
              <SparklesIcon className="size-3.5" />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-medium text-[13px] text-foreground">Mode d'IA</span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {AI_MODES[currentModeId]?.label ?? "Standard"} • global
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={8}
            className="w-72 p-2 rounded-2xl bg-popover/95 backdrop-blur-md shadow-2xl border border-border/60"
          >
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Choisir un mode (global)
            </DropdownMenuLabel>
            {Object.values(AI_MODES).map((mode) => {
              const Icon = mode.icon;
              const isActive = currentModeId === mode.id;
              return (
                <DropdownMenuItem
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id as AIModeId)}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs mt-1 transition-colors",
                    isActive
                      ? "bg-primary/10 border border-primary/20 text-foreground"
                      : "hover:bg-muted focus:bg-muted text-foreground border border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-lg shrink-0 mt-0.5",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-medium text-[13px] flex items-center gap-1.5">
                      {mode.label}
                      {isActive && <CheckCircle2Icon className="size-3.5 text-primary" />}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {mode.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="my-2 bg-border/40" />
            <div className="px-2 py-1 text-[10px] text-muted-foreground leading-tight">
              Descriptions complètes dans Paramètres → Préférences IA.
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="my-2 bg-border/40" />

        {/* Visibilité Usages mAI & Cloud en petit texte */}
        <div className="px-2 py-1.5 flex flex-col gap-2 bg-muted/30 rounded-xl border border-border/30">
          {/* Usage mAI */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">
                mAI - {aiPercentUsed}% utilisés
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {formatTokenCount(aiTokensUsed)} / {formatTokenCount(aiTokensLimit)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  aiPercentUsed > 90
                    ? "bg-red-500"
                    : aiPercentUsed > 75
                    ? "bg-amber-500"
                    : "bg-primary"
                )}
                style={{ width: `${aiPercentUsed}%` }}
              />
            </div>
          </div>

          {/* Usage Cloud */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">
                Cloud - {cloudPercentUsed}% utilisés
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {formatBytes(cloudBytesUsed)} / {formatBytes(cloudBytesLimit)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  cloudPercentUsed > 90
                    ? "bg-red-500"
                    : cloudPercentUsed > 75
                    ? "bg-amber-500"
                    : "bg-blue-500"
                )}
                style={{ width: `${cloudPercentUsed}%` }}
              />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const PlusMenuButton = memo(PurePlusMenuButton);

function ModelSelectorOption({
  capabilities,
  model,
  onModelChange,
  selectedModelId,
  setOpen,
}: {
  capabilities: Record<string, ModelCapabilities> | undefined;
  model: ChatModel;
  onModelChange?: (modelId: string) => void;
  selectedModelId: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [logoProvider] = model.id.split("/");
  const maybeWithTooltip = (icon: ReactNode, label: string) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{icon}</span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const handleSelect = useCallback(() => {
    onModelChange?.(model.id);
    document.cookie = `chat-model=${encodeURIComponent(model.id)}; path=/; max-age=31536000`;
    setOpen(false);
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>("[data-testid='multimodal-input']")
        ?.focus();
    }, 50);
  }, [model.id, onModelChange, setOpen]);

  return (
    <ModelSelectorItem
      className={cn(
        "flex w-full cursor-pointer transition-colors text-[13px] py-2 px-2.5 rounded-lg",
        model.id === selectedModelId &&
          "bg-muted/80 font-medium text-foreground",
        "data-[selected=true]:bg-muted data-[selected=true]:text-foreground hover:bg-muted/50"
      )}
      onSelect={handleSelect}
      value={model.name + " " + model.id}
    >
      <ModelSelectorLogo provider={logoProvider} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      <div className="ml-auto flex items-center gap-2 text-foreground/70">
        {capabilities?.[model.id]?.tools
          ? maybeWithTooltip(
              <WrenchIcon className="size-3.5" />,
              "Outils supportés"
            )
          : null}
        {capabilities?.[model.id]?.image ||
        capabilities?.[model.id]?.file ||
        capabilities?.[model.id]?.vision
          ? maybeWithTooltip(
              <EyeIcon className="size-3.5" />,
              "Fichiers & Images supportés"
            )
          : null}
        {capabilities?.[model.id]?.reasoning
          ? maybeWithTooltip(
              <BrainIcon className="size-3.5" />,
              "Raisonnement avancé"
            )
          : null}
      </div>
    </ModelSelectorItem>
  );
}

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: modelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: true }
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    modelsData?.capabilities;
  const models: ChatModel[] =
    modelsData?.models && modelsData.models.length > 0
      ? modelsData.models
      : chatModels;

  const selectedModel =
    models.find((m: ChatModel) => m.id === selectedModelId) ??
    models.find((m: ChatModel) => m.id === DEFAULT_CHAT_MODEL) ??
    models[0];
  const [provider] = (selectedModel?.id || DEFAULT_CHAT_MODEL).split("/");

  // Regrouper par fournisseur
  const grouped: Record<string, ChatModel[]> = {};
  for (const m of models) {
    const p = m.provider || "mAI";
    if (!grouped[p]) {
      grouped[p] = [];
    }
    grouped[p].push(m);
  }

  const providerNames: Record<string, string> = {
    google: "Google",
    "meta-llama": "Meta Llama",
    deepseek: "DeepSeek",
    qwen: "Qwen / Alibaba",
    openai: "OpenAI",
    anthropic: "Anthropic",
    mistralai: "Mistral AI",
    mistral: "Mistral AI",
    cohere: "Cohere",
    xai: "xAI",
    mdevslabs: "mAI Exclusif",
    mai: "mAI",
  };

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button
          className="h-7 max-w-[220px] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          data-testid="model-selector"
          variant="ghost"
        >
          {provider ? <ModelSelectorLogo provider={provider} /> : null}
          <ModelSelectorName>{selectedModel?.name || "Modèle IA"}</ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent commandDefaultValue={selectedModel?.id}>
        <ModelSelectorInput placeholder="Rechercher un modèle..." />
        <ModelSelectorList>
          {Object.entries(grouped).map(([groupKey, groupModels]) => (
            <ModelSelectorGroup
              heading={providerNames[groupKey.toLowerCase()] || groupKey.toUpperCase()}
              key={groupKey}
            >
              {groupModels.map((model) => (
                <ModelSelectorOption
                  capabilities={capabilities}
                  key={model.id}
                  model={model}
                  onModelChange={onModelChange}
                  selectedModelId={selectedModel?.id}
                  setOpen={setOpen}
                />
              ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      stop();
      setMessages((messages) => messages);
    },
    [setMessages, stop]
  );

  return (
    <Button
      className="h-7 w-7 rounded-xl bg-foreground p-1 text-background transition-all duration-200 hover:opacity-85 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/25 disabled:cursor-not-allowed"
      data-testid="stop-button"
      onClick={handleClick}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
