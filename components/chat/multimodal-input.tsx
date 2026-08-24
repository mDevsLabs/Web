"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  BrainIcon,
  CloudIcon,
  EyeIcon,
  FolderKanbanIcon,
  MicIcon,
  MicOffIcon,
  PlusIcon,
  UploadIcon,
  WrenchIcon,
  XIcon,
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
import { formatBytes } from "@/app/(chat)/library/page";
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
import { useDataStream } from "@/components/chat/data-stream-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useActiveChat,
  useActiveChat as useActiveChatForTools,
} from "@/hooks/use-active-chat";
import { useProjects } from "@/hooks/use-projects";
import { useSpeechRecognition } from "@/hooks/use-speech";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { AI_MODES } from "@/lib/ai/modes";
import { TOOL_IDS, TOOLS_META, type ToolId } from "@/lib/ai/tools/config";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { CloudFilePickerDialog } from "./cloud-file-picker-dialog";
import { StopIcon } from "./icons";
import {
  getFilteredMentionItems,
  MentionMenu,
  type MentionSelectPayload,
} from "./mention-menu";
import { PreviewAttachment } from "./preview-attachment";
import { ProjectIcon } from "./project-icon";
import {
  getFilteredSlashCommands,
  type SlashCommand,
  SlashCommandMenu,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function detectTrigger(
  input: string,
  cursorPos: number
): { type: "slash" | "mention"; query: string; start: number } | null {
  const before = input.slice(0, cursorPos);
  // Slash: only if at start or after newline? spec: au fur et à mesure, so detect /(^|\n| ) slash but for slash we keep simple: last token starting with /
  const slashMatch = before.match(/(^|\n|\s)\/(\w*)$/);
  // Special: if whole input is like "/model" at pos 0 also match
  const slashAtStart = before.match(/^\/(\w*)$/);
  if (slashAtStart) {
    return { query: slashAtStart[1], start: 0, type: "slash" };
  }
  if (slashMatch) {
    // ensure it's last token without space inside
    const q = slashMatch[2];
    // slash trigger only if no space after slash token
    return { query: q, start: before.lastIndexOf("/"), type: "slash" };
  }
  // Mention: (^|\s)@\w* at cursor
  const mentionMatch = before.match(/(^|\s)@(\w*)$/);
  if (mentionMatch) {
    const atIndex = before.lastIndexOf("@");
    return { query: mentionMatch[2], start: atIndex, type: "mention" };
  }
  return null;
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

  // Mention (@) state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionTriggerPosRef = useRef<number | null>(null);

  const {
    pendingProject,
    setPendingProject,
    clearPendingProject,
    setCurrentModeId,
    pendingTools,
    togglePendingTool,
    clearPendingTools,
  } = useActiveChat();
  const { projects, isLoading: isProjectsLoading } = useProjects();

  // Enrichir pendingProject avec données fraîches (nom/couleur) quand la liste arrive
  useEffect(() => {
    if (!pendingProject || projects.length === 0) {
      return;
    }
    const found = projects.find((p) => p.id === pendingProject.id);
    if (
      found &&
      (found.name !== pendingProject.name ||
        found.color !== pendingProject.color ||
        found.icon !== pendingProject.icon)
    ) {
      setPendingProject({
        color: found.color,
        icon: found.icon,
        id: found.id,
        name: found.name,
      });
    }
  }, [projects, pendingProject, setPendingProject]);

  // Voice STT toggle (mic)
  const speechBaseRef = useRef<string>("");
  const handleSpeechTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      const base = speechBaseRef.current;
      if (isFinal) {
        const next = base ? `${base} ${text}` : text;
        speechBaseRef.current = next;
        setInput(next);
      } else {
        const next = base ? `${base} ${text}` : text;
        setInput(next);
      }
    },
    [setInput]
  );
  const {
    isListening,
    isSupported: isSpeechSupported,
    toggle: toggleListening,
  } = useSpeechRecognition(handleSpeechTranscript);
  const handleMicClick = useCallback(() => {
    if (!isSpeechSupported) {
      toast.error("Reconnaissance vocale non supportée par ce navigateur.");
      return;
    }
    if (!isListening) {
      speechBaseRef.current = input;
    }
    toggleListening();
  }, [isListening, isSpeechSupported, input, toggleListening]);

  // Live cost: poll settings + dataStream usage
  const { data: costSettings } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/settings`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: true }
  );
  const { dataStream } = useDataStream();
  const [liveSessionTokens, setLiveSessionTokens] = useState(0);
  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }
    const last = dataStream[dataStream.length - 1] as any;
    if (last?.type === "data-usage" && last?.data?.tokens) {
      setLiveSessionTokens((prev) => prev + Number(last.data.tokens));
    }
  }, [dataStream]);
  const costAiUsed =
    (costSettings?.aiUsage?.tokensUsed ?? 0) + liveSessionTokens;
  const costAiLimit = costSettings?.aiUsage?.limit ?? 500_000;
  const costPercent =
    costAiLimit > 0
      ? Math.min(100, Math.round((costAiUsed / costAiLimit) * 100))
      : 0;
  useEffect(() => {
    if (costPercent >= 90 && costAiLimit > 0) {
      toast.error(
        `⚠️ Tu as utilisé ${costPercent}% de ton quota mAI (${costAiUsed}/${costAiLimit} tokens) — mise à niveau recommandée.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costPercent]);

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
    if (!hasStrictCaps) {
      return;
    }
    if (!hasVisionSupport && attachments.length > 0) {
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      const cursor = event.target.selectionStart ?? val.length;
      setInput(val);

      const trigger = detectTrigger(val, cursor);
      if (trigger?.type === "slash") {
        setSlashOpen(true);
        setSlashQuery(trigger.query);
        setSlashIndex(0);
        setMentionOpen(false);
        mentionTriggerPosRef.current = null;
      } else if (trigger?.type === "mention") {
        setMentionOpen(true);
        setMentionQuery(trigger.query);
        setMentionIndex(0);
        mentionTriggerPosRef.current = trigger.start;
        setSlashOpen(false);
      } else {
        setSlashOpen(false);
        setMentionOpen(false);
        mentionTriggerPosRef.current = null;
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
        case "usage": {
          router.push("/settings?tab=usage");
          // try scroll after navigation
          setTimeout(() => {
            const el =
              document.getElementById("usage-mAI") ||
              document.getElementById("usage");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 400);
          break;
        }
        case "library": {
          router.push("/library");
          break;
        }
        case "projects": {
          router.push("/projects");
          break;
        }
        case "search": {
          // Dispatch global event for CommandDialog in sidebar, fallback to toast if listener absent
          window.dispatchEvent(new CustomEvent("open-search-dialog"));
          // Also try common selectors as fallback (focus sidebar search if exists)
          setTimeout(() => {
            const trigger = document.querySelector<HTMLButtonElement>(
              "[data-search-trigger]"
            );
            trigger?.click();
          }, 50);
          break;
        }
        case "tool-image": {
          togglePendingTool("imageGenerate" as any);
          toast.success(
            "Outil imageGenerate activé pour le prochain message — fortement recommandé"
          );
          break;
        }
        case "tool-code": {
          togglePendingTool("codeExecution" as any);
          toast.success(
            "Outil codeExecution activé pour le prochain message — fortement recommandé"
          );
          break;
        }
        case "tool-weather": {
          togglePendingTool("getWeather" as any);
          toast.success("Outil Météo activé pour le prochain message");
          break;
        }
        case "tool-doc": {
          // toggle all doc tools as a group
          const docTools: any[] = [
            "createDocument",
            "editDocument",
            "updateDocument",
          ];
          const hasAny = docTools.some((t) => pendingTools.includes(t as any));
          if (hasAny) {
            docTools.forEach((t) => {
              if (pendingTools.includes(t as any)) {
                togglePendingTool(t as any);
              }
            });
            toast("Outils documents désactivés");
          } else {
            docTools.forEach((t) => togglePendingTool(t as any));
            toast.success(
              "Outils documents activés pour le prochain message — fortement recommandés"
            );
          }
          break;
        }
        case "tool-suggest": {
          togglePendingTool("requestSuggestions" as any);
          toast.success("Outil suggestions activé pour le prochain message");
          break;
        }
        case "tools-clear": {
          clearPendingTools();
          toast("Tous les outils désactivés");
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
    [
      chatId,
      resolvedTheme,
      router,
      setInput,
      setMessages,
      setTheme,
      pendingTools,
      togglePendingTool,
      clearPendingTools,
    ]
  );

  const handleMentionSelect = useCallback(
    (payload: MentionSelectPayload) => {
      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? input.length;
      // Replace @query token with empty (remove trigger)
      let newVal = input;
      const atPos = mentionTriggerPosRef.current;
      if (atPos !== null && atPos >= 0) {
        // Find end of @token (cursor)
        const before = input.slice(0, atPos);
        const after = input.slice(cursor);
        newVal = before + after;
        // Trim extra space if before ends with space and after starts with space?
        newVal = newVal.replace(/\s{2,}/g, " ").trimStart();
        setInput(newVal);
        // Persist pill / mode
        if (payload.type === "project") {
          setPendingProject({
            color: payload.project.color,
            icon: payload.project.icon,
            id: payload.project.id,
            name: payload.project.name,
          });
          toast.success(
            `Conversations enregistrées dans : ${payload.project.name}`
          );
        } else {
          setCurrentModeId(payload.modeId);
          toast.success(`Mode IA : ${AI_MODES[payload.modeId].label}`);
        }
      } else {
        // fallback: just clear input token
        setInput("");
        if (payload.type === "project") {
          setPendingProject({
            color: payload.project.color,
            icon: payload.project.icon,
            id: payload.project.id,
            name: payload.project.name,
          });
          toast.success(
            `Conversations enregistrées dans : ${payload.project.name}`
          );
        } else {
          setCurrentModeId(payload.modeId);
          toast.success(`Mode IA : ${AI_MODES[payload.modeId].label}`);
        }
      }
      setMentionOpen(false);
      setMentionQuery("");
      mentionTriggerPosRef.current = null;
      // Refocus
      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [input, setInput, setPendingProject, setCurrentModeId]
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
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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
    if (hasVisionSupport || !hasStrictCaps) {
      return;
    }
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

  const handleMentionClose = useCallback(() => {
    setMentionOpen(false);
  }, []);

  const handlePromptSubmit = useCallback(() => {
    if (mentionOpen) {
      // If mention menu open, let Enter select instead of submit
      return;
    }
    if (input.startsWith("/")) {
      const query = input.slice(1).trim().split(/\s/)[0] ?? "";
      const cmd = getFilteredSlashCommands(query)[0];
      // fallback exact match
      if (
        cmd &&
        (cmd.name === query.toLowerCase() ||
          cmd.aliases?.includes(query.toLowerCase()))
      ) {
        handleSlashSelect(cmd);
        return;
      }
      // If slash menu open, Enter should select not submit
      if (slashOpen) {
        return;
      }
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
    slashOpen,
    mentionOpen,
  ]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionOpen) {
        const flat = getFilteredMentionItems(mentionQuery, projects as any);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => Math.min(i + 1, flat.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          if (flat[mentionIndex]) {
            const item = flat[mentionIndex];
            if (item.kind === "project") {
              handleMentionSelect({
                project: (item as any).project,
                type: "project",
              });
            } else {
              handleMentionSelect({ modeId: item.id as any, type: "mode" });
            }
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionOpen(false);
          return;
        }
      }
      if (slashOpen) {
        const filtered = getFilteredSlashCommands(slashQuery);
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
      handleMentionSelect,
      onCancelEdit,
      slashIndex,
      slashOpen,
      slashQuery,
      mentionOpen,
      mentionQuery,
      mentionIndex,
      projects,
    ]
  );

  // Close menus on blur after delay
  const handleTextareaBlur = useCallback(() => {
    setTimeout(() => {
      setSlashOpen(false);
      setMentionOpen(false);
    }, 150);
  }, []);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {pendingProject ? (
        <div className="flex items-center gap-2 px-1 -mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
            <FolderKanbanIcon className="size-3.5 text-primary" />
            <ProjectIcon
              className="size-3.5"
              name={pendingProject.icon}
              style={{ color: pendingProject.color }}
            />
            <span>Dans : {pendingProject.name}</span>
            <button
              aria-label="Retirer le projet"
              className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={clearPendingProject}
              title="Retirer le projet"
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Session complète — toutes les nouvelles discussions y seront
            enregistrées.
          </span>
        </div>
      ) : null}

      {pendingTools.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 px-1 -mb-1">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Outils actifs (one-shot):
          </span>
          {pendingTools.map((tid) => {
            const meta = TOOLS_META[tid as ToolId];
            return (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[11px] font-medium text-primary"
                key={tid}
              >
                {meta?.label || tid}
                <button
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                  onClick={() => togglePendingTool(tid as ToolId)}
                  type="button"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            );
          })}
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1"
            onClick={clearPendingTools}
            type="button"
          >
            Tout désactiver
          </button>
          <span className="text-[10px] text-muted-foreground">
            — fortement recommandé pour le prochain message
          </span>
        </div>
      ) : null}

      {costPercent >= 75 ? (
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] ${costPercent >= 90 ? "bg-red-500/10 border-red-500/30 text-red-600" : costPercent >= 75 ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-muted/30 border-border/40 text-muted-foreground"}`}
        >
          <span className="font-semibold">
            {costPercent >= 90 ? "⚠️ Quota mAI à " : "Quota mAI: "}
            {costPercent}%
          </span>
          <span className="font-mono text-[10px]">
            {costAiUsed}/{costAiLimit} tokens
          </span>
          <span className="hidden sm:inline">
            {liveSessionTokens > 0
              ? `(+${liveSessionTokens} cette session)`
              : ""}
          </span>
          <span className="ml-auto hidden sm:inline text-[10px]">
            {costPercent >= 90 ? "Mise à niveau recommandée" : ""}
          </span>
        </div>
      ) : null}

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
        {mentionOpen ? (
          <MentionMenu
            isLoadingProjects={isProjectsLoading}
            onClose={handleMentionClose}
            onSelect={handleMentionSelect}
            projects={projects as any}
            query={mentionQuery}
            selectedIndex={mentionIndex}
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
          onBlur={handleTextareaBlur}
          onChange={handleInput}
          onKeyDown={handleTextareaKeyDown}
          placeholder={
            editingMessage
              ? "Modifier votre message..."
              : "Poser une question à mAI...  (/ pour commandes, @ pour projets & modes)"
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
            <Button
              className={`h-7 w-7 rounded-lg p-1 border ${isListening ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "border-border/40 hover:bg-muted text-foreground"} ${isSpeechSupported ? "" : "opacity-40"}`}
              onClick={handleMicClick}
              title={isListening ? "Arrêter la dictée" : "Dictée vocale"}
              type="button"
              variant="ghost"
            >
              {isListening ? (
                <MicOffIcon className="size-4" />
              ) : (
                <MicIcon className="size-4" />
              )}
            </Button>
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
              disabled={
                (!input.trim() && attachments.length === 0) ||
                uploadQueue.length > 0
              }
              status={status}
              variant="secondary"
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
          )}
        </PromptInputFooter>
      </PromptInput>

      <CloudFilePickerDialog
        onOpenChange={setCloudPickerOpen}
        onSelectAttachments={handleCloudAttachments}
        open={cloudPickerOpen}
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
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${Math.round(n / 1000)}k`;
  }
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
  const isVisionLoading = !hasStrictCapsBtn && !modelsResponse;

  const aiTokensUsed = settingsData?.aiUsage?.tokensUsed ?? 0;
  const aiTokensLimit = settingsData?.aiUsage?.limit ?? 500_000;
  const aiPercentUsed =
    aiTokensLimit > 0
      ? Math.min(100, Math.round((aiTokensUsed / aiTokensLimit) * 100))
      : 0;

  const cloudBytesUsed = libraryData?.storage?.bytes_used ?? 0;
  const cloudBytesLimit = libraryData?.storage?.bytes_limit ?? 524_288_000;
  const cloudPercentUsed =
    libraryData?.storage?.percent_used ??
    (cloudBytesLimit > 0
      ? Math.min(100, Math.round((cloudBytesUsed / cloudBytesLimit) * 100))
      : 0);

  const { pendingTools, togglePendingTool, clearPendingTools } =
    useActiveChatForTools();
  const [open, setOpen] = useState(false);

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
    setOpen(false);
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
    setOpen(false);
  };

  const isToolEnabled = (id: ToolId) => pendingTools.includes(id);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          className="h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors hover:bg-muted text-foreground cursor-pointer shadow-2xs relative"
          data-testid="plus-menu-button"
          disabled={status !== "ready" && status !== "error"}
          title="Ajouter du contenu & Outils (one-shot)"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
          {pendingTools.length > 0 && (
            <span className="absolute -top-1 -right-1 size-2.5 bg-primary rounded-full ring-2 ring-background" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-0"
        side="bottom"
      >
        <SheetHeader className="p-5 pb-3 text-left border-b border-border/40">
          <SheetTitle className="text-base flex items-center gap-2">
            <PlusIcon className="size-4" /> Options & Outils IA (one-shot)
          </SheetTitle>
          <SheetDescription className="text-xs">
            Tous les outils sont <strong>désactivés par défaut</strong>.
            Active-les pour le <strong>prochain message uniquement</strong> —
            l'IA les utilisera de façon extrêmement recommandée. Via{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-[11px]">
              /image
            </code>
            ,{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-[11px]">
              /code
            </code>{" "}
            aussi.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-5">
          {/* Fichiers */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Fichiers
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors",
                  hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
                    ? "bg-card hover:bg-muted border-border/60"
                    : "opacity-45 cursor-not-allowed bg-muted border-border/40"
                )}
                disabled={!hasFileOrImage && hasStrictCapsBtn}
                onClick={handleDeviceUploadClick}
              >
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  <UploadIcon className="size-3.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-[13px]">Appareil</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {isVisionLoading
                      ? "Vérification..."
                      : hasFileOrImage || !hasStrictCapsBtn
                        ? "Photos, PDF, code locaux"
                        : "Non supporté"}
                  </span>
                </div>
              </button>
              <button
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors",
                  hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
                    ? "bg-card hover:bg-muted border-border/60"
                    : "opacity-45 cursor-not-allowed bg-muted border-border/40"
                )}
                disabled={!hasFileOrImage && hasStrictCapsBtn}
                onClick={handleCloudImportClick}
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                  <CloudIcon className="size-3.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-[13px]">
                    Bibliothèque Cloud
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {isVisionLoading
                      ? "Vérification..."
                      : hasFileOrImage || !hasStrictCapsBtn
                        ? "Documents enregistrés"
                        : "Non supporté"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Outils IA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Outils IA — one-shot
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {pendingTools.length} actif(s)
                </span>
                {pendingTools.length > 0 && (
                  <button
                    className="text-[11px] px-2 py-1 rounded-lg bg-muted hover:bg-muted/80"
                    onClick={() => {
                      clearPendingTools();
                      toast("Tous les outils désactivés");
                    }}
                  >
                    Tout désactiver
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {TOOL_IDS.map((id) => {
                const meta = TOOLS_META[id as ToolId];
                const Icon = meta.icon as any;
                const enabled = isToolEnabled(id as ToolId);
                return (
                  <button
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      enabled
                        ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                        : "bg-card hover:bg-muted border-border/60"
                    )}
                    key={id}
                    onClick={() => {
                      togglePendingTool(id as ToolId);
                      toast(
                        enabled
                          ? `${meta.label} désactivé`
                          : `${meta.label} activé — fortement recommandé`
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        enabled
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium flex items-center gap-1.5">
                        {meta.label}
                        {enabled && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                            ACTIF
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-tight">
                        {meta.description}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-9 h-5 rounded-full p-0.5 transition-colors shrink-0",
                        enabled ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "size-4 rounded-full bg-white shadow-sm transition-transform",
                          enabled ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
              💡 Tous désactivés par défaut. Active uniquement ce dont tu as
              besoin pour le prochain message. L'IA recevra{" "}
              <strong>"outil extrêmement recommandé"</strong> dans le prompt
              système.
            </div>
          </div>

          {/* Usages */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/30 space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold">mAI - {aiPercentUsed}%</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {formatTokenCount(aiTokensUsed)} /{" "}
                {formatTokenCount(aiTokensLimit)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  aiPercentUsed > 90
                    ? "bg-red-500"
                    : aiPercentUsed > 75
                      ? "bg-amber-500"
                      : "bg-primary"
                )}
                style={{ width: `${aiPercentUsed}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold">Cloud - {cloudPercentUsed}%</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {formatBytes(cloudBytesUsed)} / {formatBytes(cloudBytesLimit)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  cloudPercentUsed > 90
                    ? "bg-red-500"
                    : cloudPercentUsed > 75
                      ? "bg-amber-500"
                      : "bg-blue-500"
                )}
                style={{ width: `${cloudPercentUsed}%` }}
              />
            </div>
            {aiPercentUsed > 90 && (
              <div className="text-[11px] text-red-500 font-medium">
                ⚠️ 90% atteint — envisage une mise à niveau.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
  const maybeWithTooltip = (icon: ReactNode, label: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{icon}</span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );

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
    anthropic: "Anthropic",
    cohere: "Cohere",
    deepseek: "DeepSeek",
    google: "Google",
    mai: "mAI",
    mdevslabs: "mAI Exclusif",
    "meta-llama": "Meta Llama",
    mistral: "Mistral AI",
    mistralai: "Mistral AI",
    openai: "OpenAI",
    qwen: "Qwen / Alibaba",
    xai: "xAI",
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
          <ModelSelectorName>
            {selectedModel?.name || "Modèle IA"}
          </ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent commandDefaultValue={selectedModel?.id}>
        <ModelSelectorInput placeholder="Rechercher un modèle..." />
        <ModelSelectorList>
          {Object.entries(grouped).map(([groupKey, groupModels]) => (
            <ModelSelectorGroup
              heading={
                providerNames[groupKey.toLowerCase()] || groupKey.toUpperCase()
              }
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
