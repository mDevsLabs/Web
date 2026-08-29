"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  BotIcon,
  BrainIcon,
  CpuIcon,
  EyeIcon,
  FolderArchiveIcon,
  FolderKanbanIcon,
  GhostIcon,
  GlobeIcon,
  ImageIcon,
  MicIcon,
  MicOffIcon,
  PaperclipIcon,
  PlusIcon,
  SparklesIcon,
  TriangleAlertIcon,
  Volume2Icon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
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
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { AgentSelectorCompact } from "@/components/agents/agent-selector";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useActiveChat,
  useActiveChat as useActiveChatForTools,
} from "@/hooks/use-active-chat";
import { useProjects } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import { useSpeechRecognition } from "@/hooks/use-speech";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { TOOLS_META, type ToolId } from "@/lib/ai/tools/config";
import type { Agent, McpServer, Skill } from "@/lib/db/schema";
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

function _setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
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
  const isMobileWidth = width ? width < 768 : false;

  useEffect(() => {
    if (!hasAutoFocused.current && width && !isMobileWidth) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width, isMobileWidth]);

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
  }, [localStorageInput, setInput]);

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
    activeSkill,
    setActiveSkill,
    clearActiveSkill,
    activeAgent,
    setActiveAgent,
    clearActiveAgent,
    pendingTools,
    togglePendingTool,
    clearPendingTools,
    isGhostMode,
    toggleGhostMode,
  } = useActiveChat();
  const { projects, isLoading: isProjectsLoading } = useProjects();

  const { data: userSkills = [] } = useSWR<Skill[]>(
    "/api/skills",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: mcpData } = useSWR<{ servers: McpServer[] }>(
    "/api/mcp",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const userMcpServers = useMemo(
    () => (Array.isArray(mcpData?.servers) ? mcpData.servers : []),
    [mcpData]
  );
  const { data: userAgents = [] } = useSWR<Agent[]>(
    "/api/agents",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );

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

  // Live cost: poll settings + dataStream usage via shared useSettings hook
  const { data: costSettings } = useSettings({
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const { dataStream } = useDataStream();
  const [liveSessionTokens, setLiveSessionTokens] = useState(0);
  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }
    const last = dataStream.at(-1) as any;
    if (last?.type === "data-usage" && last?.data?.tokens) {
      setLiveSessionTokens((prev) => prev + Number(last.data.tokens));
    }
  }, [dataStream]);
  const costAiUsed =
    (costSettings?.aiUsage?.tokensUsed ?? 0) + liveSessionTokens;
  const costAiLimit = costSettings?.aiUsage?.limit ?? 2_000_000;
  const isQuotaExhausted = costAiLimit > 0 && costAiUsed >= costAiLimit;
  const costPercent =
    costAiLimit > 0
      ? Math.min(100, Math.round((costAiUsed / costAiLimit) * 100))
      : 0;
  useEffect(() => {
    if (costPercent >= 90 && costAiLimit > 0) {
      toast.error(
        `Tu as utilisé ${costPercent}% de ton quota mAI (${costAiUsed.toLocaleString()}/${costAiLimit.toLocaleString()} tokens) — mise à niveau recommandée.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costPercent, costAiUsed.toLocaleString, costAiLimit]);

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
        case "ghost": {
          toggleGhostMode();
          break;
        }
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
          if (isGhostMode) {
            toast.error(
              "La génération d'image est indisponible en Mode fantôme"
            );
            break;
          }
          togglePendingTool("imageGenerate" as any);
          toast.success(
            "Outil imageGenerate activé pour le prochain message — fortement recommandé"
          );
          break;
        }
        case "tool-audio": {
          if (isGhostMode) {
            toast.error("La génération audio est indisponible en Mode fantôme");
            break;
          }
          togglePendingTool("audioGenerate" as any);
          toast.success(
            "Outil audioGenerate activé pour le prochain message — fortement recommandé"
          );
          break;
        }
        case "tool-web": {
          togglePendingTool("webSearch" as any);
          toast.success("Outil Recherche Web activé pour le prochain message");
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
        case "tool-calc": {
          togglePendingTool("calculator" as any);
          toast.success(
            "Outil Calculatrice + conversions activé pour le prochain message"
          );
          break;
        }
        case "tool-time": {
          togglePendingTool("dateTime" as any);
          toast.success(
            "Outil Date & heure (fuseaux horaires) activé pour le prochain message"
          );
          break;
        }
        case "tool-note": {
          togglePendingTool("note" as any);
          toast.success(
            "Outil Note (téléchargeable) activé pour le prochain message"
          );
          break;
        }
        case "tools-clear": {
          clearPendingTools();
          toast("Tous les outils désactivés");
          break;
        }
        case "agents": {
          router.push("/agents");
          toast("Ouverture de la page Agents");
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
      toggleGhostMode,
      isGhostMode,
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
        // Persist pill / agent / skill / mcp
        if (payload.type === "skill") {
          setActiveSkill(payload.skill);
          toast.success(
            `Compétence appliquée à la discussion : ${payload.skill.name}`
          );
        } else if (payload.type === "mcp") {
          togglePendingTool("mcp" as any);
          toast.success(`Serveur MCP ciblé : ${payload.server.name}`);
        } else if (payload.type === "project") {
          setPendingProject({
            color: payload.project.color,
            icon: payload.project.icon,
            id: payload.project.id,
            name: payload.project.name,
          });
          toast.success(
            `Conversations enregistrées dans : ${payload.project.name}`
          );
        } else if (payload.type === "agent") {
          setActiveAgent(payload.agent);
          const icon = (payload.agent as any).emoji
            ? `${(payload.agent as any).emoji} `
            : "";
          toast.success(
            `Agent activé : ${icon}${payload.agent.name} — modèle ${(payload.agent as any).defaultModelId}`
          );
          // onModelChange will be triggered via setActiveAgent side-effect (cookie)
        }
      } else {
        // fallback: just clear input token
        setInput("");
        if (payload.type === "skill") {
          setActiveSkill(payload.skill);
          toast.success(
            `Compétence appliquée à la discussion : ${payload.skill.name}`
          );
        } else if (payload.type === "mcp") {
          togglePendingTool("mcp" as any);
          toast.success(`Serveur MCP ciblé : ${payload.server.name}`);
        } else if (payload.type === "project") {
          setPendingProject({
            color: payload.project.color,
            icon: payload.project.icon,
            id: payload.project.id,
            name: payload.project.name,
          });
          toast.success(
            `Conversations enregistrées dans : ${payload.project.name}`
          );
        } else if ((payload as any).type === "agent") {
          setActiveAgent((payload as any).agent);
          toast.success(`Agent activé : ${(payload as any).agent.name}`);
        }
      }
      setMentionOpen(false);
      setMentionQuery("");
      mentionTriggerPosRef.current = null;
      // Refocus
      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [
      input,
      setInput,
      setPendingProject,
      setActiveAgent,
      setActiveSkill,
      togglePendingTool,
    ]
  );

  const submitForm = useCallback(() => {
    if (isQuotaExhausted) {
      toast.error(
        `Votre quota hebdomadaire mAI est atteint (${costAiUsed.toLocaleString()}/${costAiLimit.toLocaleString()} tokens). Mettez à niveau votre forfait sur https://mai-devs.vercel.app pour continuer !`
      );
      return;
    }

    if (attachments.length > 0 && !hasVisionSupport && hasStrictCaps) {
      toast.error(
        "Ce modèle ne prend pas en charge les fichiers. Retirez les pièces jointes ou changez de modèle."
      );
      return;
    }

    if (!isGhostMode) {
      window.history.pushState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
    }

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
    isQuotaExhausted,
    costAiUsed,
    costAiLimit,
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
    isGhostMode,
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
        const flat = getFilteredMentionItems(
          mentionQuery,
          projects as any,
          userSkills,
          userMcpServers,
          userAgents as any
        );
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
            if (item.kind === "skill") {
              handleMentionSelect({
                skill: item.skill,
                type: "skill",
              });
            } else if (item.kind === "mcp") {
              handleMentionSelect({
                server: item.server,
                type: "mcp",
              });
            } else if (item.kind === "project") {
              handleMentionSelect({
                project: (item as any).project,
                type: "project",
              });
            } else if (item.kind === "agent") {
              handleMentionSelect({
                agent: (item as any).agent,
                type: "agent",
              });
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
      userAgents,
      userSkills,
      userMcpServers,
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
      {isGhostMode ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <GhostIcon className="size-4 shrink-0 text-purple-400 animate-pulse" />
            <span className="font-semibold text-foreground shrink-0">
              Mode fantôme actif
            </span>
            <span className="hidden sm:inline text-muted-foreground truncate">
              — Discussion temporaire non enregistrée. Génération d'image
              indisponible.
            </span>
          </div>
          <button
            className="text-xs font-medium text-purple-400 hover:text-purple-300 underline shrink-0 ml-auto cursor-pointer"
            onClick={toggleGhostMode}
            type="button"
          >
            Désactiver
          </button>
        </div>
      ) : null}

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

      {activeAgent ? (
        <div className="flex items-center gap-2 px-1 -mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
            <span
              className="size-5 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: activeAgent.color || "#6366f1" }}
            >
              {(activeAgent as any).emoji ? (
                (activeAgent as any).emoji
              ) : (
                <BotIcon className="size-3.5" />
              )}
            </span>
            <span>Agent actif : {activeAgent.name}</span>
            <button
              aria-label="Retirer l'agent"
              className="ml-1 rounded-full p-0.5 hover:bg-indigo-500/20 text-muted-foreground hover:text-foreground"
              onClick={clearActiveAgent}
              title="Retirer l'agent"
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Sélection globale — modèle {activeAgent.defaultModelId}
          </span>
        </div>
      ) : null}
      {activeSkill ? (
        <div className="flex items-center gap-2 px-1 -mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
            <SparklesIcon className="size-3.5 text-primary" />
            <span>Compétence active : {activeSkill.name}</span>
            <button
              aria-label="Retirer la compétence"
              className="ml-1 rounded-full p-0.5 hover:bg-primary/20 text-muted-foreground hover:text-foreground"
              onClick={clearActiveSkill}
              title="Retirer la compétence"
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Appliquée à toute la discussion
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
          <span className="font-semibold flex items-center gap-1">
            {costPercent >= 90 ? (
              <TriangleAlertIcon className="size-3.5 shrink-0" />
            ) : null}
            {costPercent >= 90 ? "Quota mAI à " : "Quota mAI: "}
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
            agents={userAgents as any}
            isLoadingProjects={isProjectsLoading}
            mcpServers={userMcpServers}
            onClose={handleMentionClose}
            onSelect={handleMentionSelect}
            projects={projects as any}
            query={mentionQuery}
            selectedIndex={mentionIndex}
            skills={userSkills}
          />
        ) : null}
      </div>

      <PromptInput
        className="[&>div]:rounded-[28px] [&>div]:border [&>div]:border-border/40 [&>div]:bg-card/85 [&>div]:backdrop-blur-xl [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-all [&>div]:duration-200 [&>div]:focus-within:border-border/70 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
        data-onboarding="chat-input"
        onSubmit={handlePromptSubmit}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-4 pt-3 no-scrollbar"
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

        {pendingTools.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
            {pendingTools.map((tid) => {
              const meta = TOOLS_META[tid as ToolId];
              const Icon = meta?.icon as any;
              return (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[11px] font-medium text-primary shadow-xs"
                  key={tid}
                >
                  {Icon && <Icon className="size-3" />}
                  <span>{meta?.label || tid}</span>
                  <button
                    aria-label="Désactiver l'outil"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 cursor-pointer"
                    onClick={() => togglePendingTool(tid as ToolId)}
                    type="button"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        <PromptInputTextarea
          className="min-h-[48px] max-h-36 text-[16px] md:text-[13.5px] leading-relaxed px-4 pt-3.5 pb-1.5 placeholder:text-muted-foreground/45 resize-none"
          data-testid="multimodal-input"
          onBlur={handleTextareaBlur}
          onChange={handleInput}
          onKeyDown={handleTextareaKeyDown}
          placeholder={
            editingMessage ? "Modifier votre message..." : "Poser une question"
          }
          ref={textareaRef}
          value={input}
        />
        <PromptInputFooter className="px-3 pb-2.5 pt-0">
          <PromptInputTools>
            <PlusMenuButton
              fileInputRef={fileInputRef}
              onOpenCloudPicker={() => setCloudPickerOpen(true)}
              selectedModelId={selectedModelId}
              status={status}
            />
            <Button
              className={`h-9 w-9 sm:h-8 sm:w-8 rounded-full p-1.5 border ${isListening ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "border-border/40 hover:bg-muted text-foreground"} ${isSpeechSupported ? "" : "opacity-40"}`}
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
            <AgentSelectorCompact />
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className={cn(
                "h-9 w-9 sm:h-8 sm:w-8 rounded-full transition-all duration-200",
                isQuotaExhausted
                  ? "bg-destructive/20 text-destructive cursor-not-allowed opacity-70"
                  : input.trim() || attachments.length > 0
                    ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                    : "bg-muted text-muted-foreground/25 cursor-not-allowed"
              )}
              data-testid="send-button"
              disabled={
                (!input.trim() && attachments.length === 0) ||
                uploadQueue.length > 0 ||
                isQuotaExhausted
              }
              status={status}
              title={
                isQuotaExhausted
                  ? "Quota hebdomadaire mAI atteint"
                  : "Envoyer le message"
              }
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

function _formatTokenCount(n: number) {
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

  const caps: Record<string, ModelCapabilities> | undefined =
    modelsResponse?.capabilities;
  const currentCap = caps?.[selectedModelId];
  const hasStrictCapsBtn = Boolean(caps && currentCap !== undefined);
  const hasFileOrImage = hasStrictCapsBtn
    ? Boolean(currentCap?.vision || currentCap?.image || currentCap?.file)
    : false;
  const isVisionLoading = !hasStrictCapsBtn && !modelsResponse;

  const {
    pendingTools,
    togglePendingTool,
    clearPendingTools,
    isGhostMode,
    activeSkill,
  } = useActiveChatForTools();
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

  const toggleToolExclusive = (toolId: ToolId, label: string) => {
    const isCurrentlyEnabled = pendingTools.includes(toolId);
    togglePendingTool(toolId);
    toast(
      isCurrentlyEnabled
        ? `${label} désactivé`
        : `${label} activé pour le prochain message`
    );
    setOpen(false);
  };

  const isImageActive = pendingTools.includes("imageGenerate" as ToolId);
  const isAudioActive = pendingTools.includes("audioGenerate" as ToolId);
  const isWebActive = pendingTools.includes("webSearch" as ToolId);
  const isMcpActive = pendingTools.includes("mcp" as ToolId);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-9 w-9 sm:h-8 sm:w-8 rounded-full border border-border/40 p-1.5 transition-colors hover:bg-muted text-foreground cursor-pointer shrink-0 relative",
            pendingTools.length > 0 &&
              "bg-primary/10 border-primary/30 text-primary"
          )}
          data-testid="plus-menu-button"
          disabled={status !== "ready" && status !== "error"}
          title="Ajouter des options & outils"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
          {pendingTools.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-2 bg-primary rounded-full ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[320px] sm:w-[480px] p-2 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl flex flex-col gap-1 z-50"
        side="top"
        sideOffset={10}
      >
        {/* Option 1: Ajouter des photos et fichiers */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted/70 text-foreground"
              : "opacity-45 cursor-not-allowed bg-muted/30"
          )}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          onClick={handleDeviceUploadClick}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-foreground/80 shrink-0">
            <PaperclipIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <span className="text-[13.5px] font-semibold text-foreground truncate">
              Ajouter des photos et fichiers
            </span>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isVisionLoading
                ? "Vérification..."
                : hasFileOrImage || !hasStrictCapsBtn
                  ? "Importer depuis l’ordinateur"
                  : "Non supporté"}
            </span>
          </div>
        </button>

        {/* Option 2: Ajouter depuis la bibliothèque */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            hasFileOrImage || isVisionLoading || !hasStrictCapsBtn
              ? "hover:bg-muted/70 text-foreground"
              : "opacity-45 cursor-not-allowed bg-muted/30"
          )}
          disabled={!hasFileOrImage && hasStrictCapsBtn}
          onClick={handleCloudImportClick}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-foreground/80 shrink-0">
            <FolderArchiveIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <span className="text-[13.5px] font-semibold text-foreground truncate">
              Ajouter depuis la bibliothèque
            </span>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              Parcourez et recherchez vos fichiers
            </span>
          </div>
        </button>

        {/* Option 3: Créer une image */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            isGhostMode
              ? "opacity-50 cursor-not-allowed bg-muted/20"
              : isImageActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
          )}
          disabled={isGhostMode}
          onClick={() => {
            if (isGhostMode) {
              toast.error(
                "La génération d'image est indisponible en Mode fantôme"
              );
              return;
            }
            toggleToolExclusive("imageGenerate", "Création d'image");
          }}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-cyan-500 shrink-0">
            <ImageIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Créer une image
              </span>
              {isGhostMode ? (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 font-medium px-1.5 py-0.5 rounded-full">
                  INDISPONIBLE EN FANTÔME
                </span>
              ) : isImageActive ? (
                <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                  ACTIF
                </span>
              ) : null}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isGhostMode
                ? "Indisponible dans ce mode"
                : "Transformez vos idées en images"}
            </span>
          </div>
        </button>

        {/* Option 4: Créer un audio ou son */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            isGhostMode
              ? "opacity-50 cursor-not-allowed bg-muted/20"
              : isAudioActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
          )}
          disabled={isGhostMode}
          onClick={() => {
            if (isGhostMode) {
              toast.error(
                "La génération audio est indisponible en Mode fantôme"
              );
              return;
            }
            toggleToolExclusive("audioGenerate", "Génération audio");
          }}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-emerald-500 shrink-0">
            <Volume2Icon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Créer un audio ou son
              </span>
              {isGhostMode ? (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 font-medium px-1.5 py-0.5 rounded-full">
                  INDISPONIBLE EN FANTÔME
                </span>
              ) : isAudioActive ? (
                <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                  ACTIF
                </span>
              ) : null}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isGhostMode
                ? "Indisponible dans ce mode"
                : "Synthèse vocale et audio IA"}
            </span>
          </div>
        </button>

        {/* Option 5: Recherche sur le Web */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            isWebActive
              ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
              : "hover:bg-muted/70 text-foreground"
          )}
          onClick={() =>
            toggleToolExclusive("webSearch", "Recherche sur le Web")
          }
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-sky-500 shrink-0">
            <GlobeIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Recherche sur le Web
              </span>
              {isWebActive && (
                <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                  ACTIF
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              Trouvez des infos en temps réel
            </span>
          </div>
        </button>

        {/* Option 6: Compétences (Skills) */}
        <Link
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            activeSkill
              ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
              : "hover:bg-muted/70 text-foreground"
          )}
          href="/skills"
          onClick={() => setOpen(false)}
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-primary shrink-0">
            <SparklesIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Compétences (Skills)
              </span>
              {activeSkill && (
                <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                  {activeSkill.name}
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              Gérer et configurer
            </span>
          </div>
        </Link>

        {/* Option 7: Serveurs & Outils MCP */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            isMcpActive
              ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
              : "hover:bg-muted/70 text-foreground"
          )}
          onClick={() => toggleToolExclusive("mcp" as any, "Outils MCP")}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
            <CpuIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Outils & Serveurs MCP
              </span>
              {isMcpActive && (
                <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                  ACTIF
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              Connecter bases & APIs
            </span>
          </div>
        </button>
      </PopoverContent>
    </Popover>
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
      value={`${model.name} ${model.id}`}
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
          className="h-8 sm:h-7 max-w-[220px] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
