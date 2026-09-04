"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  BotIcon,
  CpuIcon,
  FolderArchiveIcon,
  FolderKanbanIcon,
  GhostIcon,
  GlobeIcon,
  ImageIcon,
  PaperclipIcon,
  PlusIcon,
  SparklesIcon,
  TriangleAlertIcon,
  TrophyIcon,
  Volume2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
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
import { useDataStream } from "@/components/chat/data-stream-provider";
import { VoiceRecorderButton } from "@/components/chat/input/voice-recorder-button";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { QuizConfigDialog } from "@/components/chat/quiz-config-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useActiveChat,
  useActiveChat as useActiveChatForTools,
} from "@/hooks/use-active-chat";
import { useChatAttachments } from "@/hooks/use-chat-attachments";
import { useProjects } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import { useTier } from "@/hooks/use-tier";
import {
  chatModels,
  getModelCapabilities,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { TOOLS_META, type ToolId } from "@/lib/ai/tools/config";
import { executeCustomCommand } from "@/lib/commands/exec";
import { MAI_PENDING_ATTACHMENT_KEY } from "@/lib/constants";
import type { Agent, CustomCommand, McpServer, Skill } from "@/lib/db/schema";
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
import { CloudFilePickerDialog } from "./cloud-file-picker-dialog";
import { StopIcon } from "./icons";
import {
  getFilteredMentionItems,
  MentionMenu,
  type MentionSelectPayload,
} from "./mention-menu";
import { PreviewAttachment } from "./preview-attachment";
import { ProjectIcon } from "./project-icon";
import { SkillParamsDialog } from "./skill-params-dialog";
import {
  customCommandsToSlashCommands,
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

const DRAFT_COOKIE = "mai-draft";
const DRAFT_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours
const MAX_FILES_PER_MESSAGE = 4;
const MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024; // 50 Mo / message

const MENTION_TOKEN_RE = /(@[a-zA-Z0-9_\u00C0-\u017F-]+)( |\u00A0)?$/;

// Le texte réellement inséré dans le textarea lors de l'activation d'un outil.
// Ne correspond pas au libellé affiché sur la pastille ("Mémoire"), d'où cette
// résolution unique partagée par Backspace atomique et le bouton X.
function tokenForPendingTool(
  toolId: string,
  servers: McpServer[]
): string | null {
  if (toolId === "memory") {
    return "Memory";
  }
  if (toolId.startsWith("mcp:") || toolId === "mcp") {
    const srvId = toolId.replace(/^mcp:/, "");
    const srv = servers.find(
      (s) => s.id === srvId || s.name.toLowerCase() === srvId.toLowerCase()
    );
    return srv?.name ?? null;
  }
  return null;
}

function renderHighlightedMentions(
  text: string,
  mcpServers: McpServer[] = [],
  skills: Skill[] = [],
  agents: Agent[] = []
) {
  if (!text) return null;
  const mentionNames = [
    ...mcpServers.map((s) => s.name),
    ...skills.map((s) => s.name),
    ...agents.map((a) => a.name),
  ].filter(Boolean);

  mentionNames.sort((a, b) => b.length - a.length);

  const escapedNames = mentionNames.map((n) =>
    n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern =
    escapedNames.length > 0
      ? `(@(?:${escapedNames.join("|")}|[a-zA-Z0-9_\\u00C0-\\u017F-]+))`
      : "(@[a-zA-Z0-9_\\u00C0-\\u017F-]+)";
  const regex = new RegExp(pattern, "g");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span
        className="text-blue-600 dark:text-blue-400 bg-blue-500/15 rounded-xs"
        key={i}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
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
  const pathname = usePathname();
  const isNewChatInput = !pathname?.includes("/chat/");
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
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

  const didRestoreDraftRef = useRef(false);

  useEffect(() => {
    if (didRestoreDraftRef.current || !textareaRef.current) {
      return;
    }
    didRestoreDraftRef.current = true;

    let finalValue = textareaRef.current.value;
    if (!finalValue && localStorageInput) {
      finalValue = localStorageInput;
    }
    if (!finalValue && isNewChatInput) {
      const draft = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${DRAFT_COOKIE}=`))
        ?.split("=")[1];
      if (draft) {
        finalValue = decodeURIComponent(draft);
      }
    }
    if (finalValue) {
      setInput(finalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setInput, isNewChatInput]);

  // Brouillon global persisté 30 jours (cookie) pour les nouvelles conversations
  useEffect(() => {
    if (!isNewChatInput) {
      return;
    }
    const timer = setTimeout(() => {
      if (typeof document !== "undefined") {
        if (input.trim()) {
          document.cookie = `${DRAFT_COOKIE}=${encodeURIComponent(input)}; path=/; max-age=${DRAFT_MAX_AGE}`;
        } else {
          document.cookie = `${DRAFT_COOKIE}=; path=/; max-age=0`;
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [input, isNewChatInput]);

  // Handoff Cloud -> chat : consommer la pièce jointe en attente
  useEffect(() => {
    if (!isNewChatInput || typeof window === "undefined") {
      return;
    }
    try {
      const raw = sessionStorage.getItem(MAI_PENDING_ATTACHMENT_KEY);
      if (!raw) {
        return;
      }
      sessionStorage.removeItem(MAI_PENDING_ATTACHMENT_KEY);
      const pending = JSON.parse(raw) as {
        mediaType?: string;
        name?: string;
        prompt?: string;
        url?: string;
      };
      if (pending.url && pending.name) {
        setAttachments((prev) => [
          ...prev,
          {
            contentType: pending.mediaType,
            name: pending.name,
            url: pending.url,
          } as Attachment,
        ]);
      }
      if (pending.prompt) {
        setInput(pending.prompt);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewChatInput]);
  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
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
    setPendingCommand,
    setSkillParamValues,
    isGhostMode,
    toggleGhostMode,
  } = useActiveChat();
  const { isFree } = useTier();
  const { projects, isLoading: isProjectsLoading } = useProjects();

  const { data: userSkills = [] } = useSWR<Skill[]>(
    isFree ? null : "/api/skills",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: mcpData } = useSWR<{ servers: McpServer[] }>(
    isFree ? null : "/api/mcp",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const userMcpServers = useMemo(
    () => (Array.isArray(mcpData?.servers) ? mcpData.servers : []),
    [mcpData]
  );
  const { data: userAgents = [] } = useSWR<Agent[]>(
    isFree ? null : "/api/agents",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: customCommandsData = [] } = useSWR<CustomCommand[]>(
    isFree ? null : "/api/commands?kind=slash",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const customSlashCommands = useMemo(
    () => customCommandsToSlashCommands(customCommandsData),
    [customCommandsData]
  );
  const { data: customMentionCommands = [] } = useSWR<CustomCommand[]>(
    isFree ? null : "/api/commands?kind=mention",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );

  // Quota de mémoire de la portée du prochain message. Le serveur ignore
  // l'agent en Free : même règle ici, sinon on jugerait le quota d'un scope
  // que la requête n'écrira jamais.
  const { data: memoryQuotaData } = useSWR<{
    limit: number;
    memories: unknown[];
  }>(
    !isFree && activeAgent?.id
      ? `/api/memory?agentId=${activeAgent.id}`
      : "/api/memory",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 15_000, revalidateOnFocus: false }
  );
  const memoryCount = memoryQuotaData?.memories?.length ?? 0;
  const memoryLimit = memoryQuotaData?.limit ?? 0;
  const memoryAtLimit = Boolean(memoryQuotaData && memoryCount >= memoryLimit);

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

  // Live cost: fetch settings once + dataStream usage via shared useSettings hook
  const { data: costSettings } = useSettings({
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
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
  const currentCapabilities =
    capsMap?.[selectedModelId] || getModelCapabilities(selectedModelId);
  const hasVisionSupport = Boolean(
    currentCapabilities?.vision ||
      currentCapabilities?.image ||
      currentCapabilities?.file
  );
  const supportsTools = currentCapabilities?.tools !== false;
  const hasStrictCaps = Boolean(capsMap && currentCapabilities !== undefined);

  // Vider les outils si le modèle ne supporte pas les tools
  useEffect(() => {
    if (!supportsTools && pendingTools.length > 0) {
      clearPendingTools();
      toast.warning(
        "Outils désactivés : ce modèle ne prend pas en charge les outils (tools)."
      );
    }
  }, [supportsTools, pendingTools.length, clearPendingTools]);

  const {
    fileInputRef,
    uploadQueue,
    handleFileChange,
    handleCloudAttachments,
    resetUploadedBytes,
  } = useChatAttachments({
    attachments,
    hasStrictCaps,
    hasVisionSupport,
    setAttachments,
    textareaRef,
  });

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const val = event.target.value;
      const cursor = event.target.selectionStart ?? val.length;
      setInput(val);

      // Les sélections de session ne dépendent pas du texte saisi. Une mention peut
      // être supprimée sans désactiver l'agent ou le serveur sélectionné.
      /*
      // Si l'utilisateur efface la mention du texte, retirer l'outil/skill/agent correspondant
      // 1. MCP
      for (const tid of pendingTools) {
        const tidStr = tid as string;
        if (tidStr.startsWith("mcp:") || tidStr === "mcp") {
          const srvId = tidStr.replace(/^mcp:/, "");
          const srv = userMcpServers.find(
            (s) => s.id === srvId || s.name.toLowerCase() === srvId.toLowerCase()
          );
          const srvName = srv ? srv.name : "MCP";
          if (!val.includes(`@${srvName}`)) {
            togglePendingTool(tid as any);
          }
        }
      }

      // 2. Skill
      if (activeSkill && !val.includes(`@${activeSkill.name}`)) {
        clearActiveSkill();
      }

      // 3. Agent
      if (activeAgent && !val.includes(`@${activeAgent.name}`)) {
        clearActiveAgent();
      }
      */

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
    [
      setInput,
      pendingTools,
      userMcpServers,
      togglePendingTool,
      activeSkill,
      clearActiveSkill,
      activeAgent,
      clearActiveAgent,
    ]
  );

  const handleSlashSelect = useCallback(
    async (cmd: SlashCommand) => {
      setSlashOpen(false);
      setInput("");
      if (cmd.action === "custom" && cmd.custom) {
        executeCustomCommand(cmd.custom, {
          agents: userAgents,
          router,
          setActiveAgent: setActiveAgent as any,
          setActiveSkill: setActiveSkill as any,
          setPendingCommand,
          skills: userSkills,
          toast: (opts) => {
            if (opts.type === "error") {
              toast.error(opts.description);
            } else {
              toast.success(opts.description);
            }
          },
          togglePendingTool: togglePendingTool as any,
        });
        return;
      }
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
        case "planning": {
          router.push("/planning");
          break;
        }
        case "notes": {
          router.push("/library");
          break;
        }
        case "home": {
          router.push("/");
          break;
        }
        case "tool-chart": {
          togglePendingTool("generateChart" as any);
          toast.success("Outil Graphique activé pour le prochain message");
          break;
        }
        case "tool-memory": {
          togglePendingTool("memory" as any);
          toast.success("Outil Mémoire activé pour le prochain message");
          break;
        }
        case "tool-qr": {
          togglePendingTool("qrCodeGenerator" as any);
          toast.success("Outil QR Code activé pour le prochain message");
          break;
        }
        case "tool-summary": {
          setInput(
            "Fais-moi un résumé clair et structuré par sections de notre échange."
          );
          break;
        }
        case "quiz": {
          setQuizDialogOpen(true);
          break;
        }
        case "tools-clear": {
          clearPendingTools();
          toast("Tous les outils désactivés");
          break;
        }
        case "agents": {
          const agentBtn = document.querySelector<HTMLButtonElement>(
            "[data-testid='agent-selector']"
          );
          if (agentBtn) {
            agentBtn.click();
          } else {
            router.push("/agents");
          }
          break;
        }
        case "export": {
          try {
            const res = await fetch(`/api/chats/${chatId}/export?format=md`);
            if (!res.ok) {
              throw new Error("Export échoué");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chat-${chatId}.md`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Export Markdown téléchargé");
          } catch (e: any) {
            toast.error(e.message || "Erreur export");
          }
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
      userAgents,
      userSkills,
      setActiveAgent,
      setActiveSkill,
      setPendingCommand,
    ]
  );

  const handleMentionSelect = useCallback(
    (payload: MentionSelectPayload) => {
      // Bloquer si le modèle ne supporte pas les tools
      if (
        (payload.type === "skill" || payload.type === "mcp") &&
        !supportsTools
      ) {
        toast.warning(
          "Ce modèle ne prend pas en charge les outils (tools). Les compétences et MCP sont indisponibles."
        );
        setMentionOpen(false);
        setMentionQuery("");
        mentionTriggerPosRef.current = null;
        return;
      }

      // Bloquer si le quota de mémoire de cette portée est atteint
      if (payload.type === "memory" && memoryAtLimit) {
        toast.warning(
          `Limite de mémoires atteinte (${memoryCount}/${memoryLimit}) — libérez de l'espace dans l'onglet Mémoire des paramètres.`
        );
        setMentionOpen(false);
        setMentionQuery("");
        mentionTriggerPosRef.current = null;
        return;
      }

      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? input.length;
      let mentionTag = "";
      if (payload.type === "skill") {
        mentionTag = `@${payload.skill.name} `;
        setActiveSkill(payload.skill);
        toast.success(
          `Compétence appliquée à la discussion : ${payload.skill.name}`
        );
      } else if (payload.type === "mcp") {
        mentionTag = `@${payload.server.name} `;
        const mcpKey = `mcp:${payload.server.id}`;
        if (
          !pendingTools.includes(mcpKey as any) &&
          !pendingTools.includes("mcp" as any)
        ) {
          togglePendingTool(mcpKey as any);
        }
        toast.success(`Serveur MCP ciblé : ${payload.server.name}`);
      } else if (payload.type === "project") {
        mentionTag = `@${payload.project.name} `;
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
        mentionTag = `@${payload.agent.name} `;
        setActiveAgent(payload.agent);
        const icon = (payload.agent as any).emoji
          ? `${(payload.agent as any).emoji} `
          : "";
        toast.success(
          `Agent activé : ${icon}${payload.agent.name} — modèle ${(payload.agent as any).defaultModelId}`
        );
      } else if (payload.type === "system") {
        mentionTag = `@${payload.label} `;
        if (payload.action === "web") {
          togglePendingTool("webSearch" as any);
          toast.success("Outil Recherche Web activé !");
        } else if (payload.action === "planning") {
          toast.success("Référence à la planification ajoutée !");
        } else if (payload.action === "library") {
          toast.success("Référence au stockage ajoutée !");
        } else if (payload.action === "notes") {
          toast.success("Référence aux notes ajoutée !");
        }
      } else if (payload.type === "memory") {
        mentionTag = "@Memory ";
        if (!pendingTools.includes("memory")) {
          togglePendingTool("memory");
        }
        toast.success(
          "Mémoire activée pour le prochain message — l'IA pourra retenir ou retrouver des informations"
        );
      } else if (payload.type === "customCommand") {
        const command = payload.command;
        executeCustomCommand(command, {
          agents: userAgents,
          router,
          setActiveAgent: setActiveAgent as any,
          setActiveSkill: setActiveSkill as any,
          setPendingCommand,
          skills: userSkills,
          toast: (opts) => {
            if (opts.type === "error") {
              toast.error(opts.description);
            } else {
              toast.success(opts.description);
            }
          },
          togglePendingTool: togglePendingTool as any,
        });
        // Tag indicatif uniquement pour les actions qui se combinent au message
        if (
          command.actionType === "mcp" ||
          command.actionType === "tools" ||
          command.actionType === "agent" ||
          command.actionType === "skill"
        ) {
          mentionTag = `@${command.trigger} `;
        }
      }

      const atPos = mentionTriggerPosRef.current;
      let newVal = input;
      let targetCursorPos = cursor;
      if (atPos !== null && atPos >= 0) {
        const before = input.slice(0, atPos);
        const after = input.slice(cursor);
        newVal = `${before}${mentionTag}${after.trimStart()}`;
        targetCursorPos = before.length + mentionTag.length;
      } else {
        const before = input.trimEnd();
        newVal = `${before ? `${before} ` : ""}${mentionTag}`;
        targetCursorPos = newVal.length;
      }

      setInput(newVal);
      setMentionOpen(false);
      setMentionQuery("");
      mentionTriggerPosRef.current = null;
      // Refocus & positionner le curseur exactement après la mention
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          try {
            textareaRef.current.setSelectionRange(
              targetCursorPos,
              targetCursorPos
            );
          } catch {}
        }
      }, 50);
    },
    [
      input,
      memoryAtLimit,
      memoryCount,
      memoryLimit,
      setInput,
      supportsTools,
      pendingTools,
      setPendingCommand,
      setPendingProject,
      setActiveAgent,
      setActiveSkill,
      togglePendingTool,
      userAgents,
      userSkills,
    ]
  );

  const [skillParamsDialogOpen, setSkillParamsDialogOpen] = useState(false);

  const skillParamsList = useMemo(
    () =>
      Array.isArray((activeSkill as any)?.parameters)
        ? ((activeSkill as any).parameters as Array<{ name?: string }>).filter(
            (p) => p?.name
          )
        : [],
    [activeSkill]
  );

  const doSendCurrentMessage = useCallback(() => {
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
    resetUploadedBytes();
    if (typeof document !== "undefined") {
      document.cookie = `${DRAFT_COOKIE}=; path=/; max-age=0`;
    }

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    isGhostMode,
    resetUploadedBytes,
  ]);

  const handleSkillParamsSubmit = useCallback(
    (values: Record<string, string>) => {
      setSkillParamValues(values);
      doSendCurrentMessage();
    },
    [doSendCurrentMessage, setSkillParamValues]
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

    if (attachments.length > MAX_FILES_PER_MESSAGE) {
      toast.error(
        `Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message. Retirez des pièces jointes.`
      );
      return;
    }

    // Paramètres dynamiques du skill actif : saisie avant envoi (one-shot)
    if (skillParamsList.length > 0) {
      setSkillParamsDialogOpen(true);
      return;
    }

    doSendCurrentMessage();
  }, [
    isQuotaExhausted,
    costAiUsed,
    costAiLimit,
    attachments,
    hasVisionSupport,
    hasStrictCaps,
    skillParamsList,
    doSendCurrentMessage,
  ]);

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
      const cmd = getFilteredSlashCommands(
        query,
        {
          isFree,
          isHome: isNewChatInput,
        },
        customSlashCommands
      )[0];
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
    customSlashCommands,
    handleSlashSelect,
    hasVisionSupport,
    hasStrictCaps,
    input,
    isFree,
    isNewChatInput,
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
          userAgents as any,
          customMentionCommands
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
            } else if (item.kind === "custom-command") {
              handleMentionSelect({
                command: (item as any).command,
                type: "customCommand",
              });
            } else if (item.kind === "memory") {
              handleMentionSelect({ type: "memory" });
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
        const filtered = getFilteredSlashCommands(
          slashQuery,
          {
            isFree,
            isHome: isNewChatInput,
          },
          customSlashCommands
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
      if (e.key === "Backspace" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.currentTarget;
        const { value, selectionStart } = target;
        if (
          selectionStart === target.selectionEnd &&
          selectionStart !== null &&
          selectionStart > 0
        ) {
          const before = value.slice(0, selectionStart);
          const match = before.match(MENTION_TOKEN_RE);
          if (match) {
            e.preventDefault();
            const token = match[1];
            const deleteFrom = selectionStart - match[0].length;
            setInput(
              `${before.slice(0, deleteFrom)}${value.slice(selectionStart)}`
            );
            requestAnimationFrame(() => {
              try {
                target.setSelectionRange(deleteFrom, deleteFrom);
              } catch {}
            });

            const skillName = activeSkill ? `@${activeSkill.name}` : null;
            const agentName = activeAgent ? `@${activeAgent.name}` : null;
            const projectName = pendingProject
              ? `@${pendingProject.name}`
              : null;

            if (token === "@Memory") {
              if (pendingTools.includes("memory")) {
                togglePendingTool("memory");
              }
            } else if (skillName && token === skillName) {
              clearActiveSkill();
            } else if (agentName && token === agentName) {
              clearActiveAgent();
            } else if (projectName && token === projectName) {
              clearPendingProject();
            } else {
              const srv = userMcpServers.find((s) => `@${s.name}` === token);
              if (srv) {
                const toolId = `mcp:${srv.id}` as ToolId;
                if (pendingTools.includes(toolId)) {
                  togglePendingTool(toolId);
                }
              }
            }
          }
        }
      }
      if (e.key === "Escape" && editingMessage && onCancelEdit) {
        e.preventDefault();
        onCancelEdit();
      }
    },
    [
      activeAgent,
      activeSkill,
      clearActiveAgent,
      clearActiveSkill,
      clearPendingProject,
      customMentionCommands,
      customSlashCommands,
      editingMessage,
      handleSlashSelect,
      handleMentionSelect,
      isFree,
      isNewChatInput,
      onCancelEdit,
      pendingProject,
      pendingTools,
      setInput,
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
      togglePendingTool,
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
    <div
      className={cn("relative flex w-full flex-col gap-3 md:gap-4", className)}
    >
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
          {isNewChatInput ? (
            <button
              className="text-xs font-medium text-purple-400 hover:text-purple-300 underline shrink-0 ml-auto cursor-pointer"
              onClick={toggleGhostMode}
              type="button"
            >
              Désactiver
            </button>
          ) : null}
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
            Outils actifs :
          </span>
          {pendingTools.map((tid) => {
            const tidStr = tid as string;
            let label = tidStr;
            if (tidStr.startsWith("mcp:") || tidStr === "mcp") {
              const srvId = tidStr.replace(/^mcp:/, "");
              const srv = userMcpServers.find(
                (s) =>
                  s.id === srvId || s.name.toLowerCase() === srvId.toLowerCase()
              );
              label = srv ? srv.name : srvId || "Outil MCP";
            } else {
              const meta = TOOLS_META[tid as ToolId];
              label = meta?.label || tidStr;
            }
            return (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[11px] font-medium text-primary"
                key={tid}
              >
                {label}
                <button
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                  onClick={() => {
                    togglePendingTool(tid as ToolId);
                    const token = tokenForPendingTool(tidStr, userMcpServers);
                    if (token) {
                      const escaped = token.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                      );
                      setInput(
                        input
                          .replace(
                            new RegExp(`@${escaped}( |\u00A0)?`, "g"),
                            ""
                          )
                          .trim()
                      );
                    }
                  }}
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
            — pour le prochain message
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
            context={{ isFree, isHome: isNewChatInput }}
            customCommands={customSlashCommands}
            onClose={handleSlashClose}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
            supportsTools={supportsTools}
          />
        ) : null}
        {mentionOpen ? (
          <MentionMenu
            agents={userAgents as any}
            customCommands={customMentionCommands}
            isLoadingProjects={isProjectsLoading}
            mcpServers={userMcpServers}
            memoryAtLimit={memoryAtLimit}
            memoryCount={memoryCount}
            memoryLimit={memoryLimit}
            onClose={handleMentionClose}
            onSelect={handleMentionSelect}
            projects={projects as any}
            query={mentionQuery}
            selectedIndex={mentionIndex}
            skills={userSkills}
            supportsTools={supportsTools}
          />
        ) : null}
      </div>

      {!supportsTools && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11.5px] text-amber-700 dark:text-amber-400">
          <TriangleAlertIcon className="size-3.5 shrink-0" />
          <span>
            Ce modèle ne prend pas en charge les outils (tools). Les MCP,
            compétences et outils système sont désactivés.
          </span>
        </div>
      )}

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
          <div className="flex w-full self-start flex-wrap items-center gap-1.5 px-4 pt-2.5">
            {pendingTools.map((tid) => {
              const tidStr = tid as string;
              let label = tidStr;
              let IconComponent: any = null;
              if (tidStr.startsWith("mcp:") || tidStr === "mcp") {
                const srvId = tidStr.replace(/^mcp:/, "");
                const srv = userMcpServers.find(
                  (s) =>
                    s.id === srvId ||
                    s.name.toLowerCase() === srvId.toLowerCase()
                );
                label = srv ? srv.name : srvId || "Outil MCP";
                IconComponent = CpuIcon;
              } else {
                const meta = TOOLS_META[tid as ToolId];
                label = meta?.label || tidStr;
                IconComponent = meta?.icon;
              }
              return (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 shadow-xs"
                  key={tidStr}
                >
                  {IconComponent && <IconComponent className="size-3" />}
                  <span>{label}</span>
                  <button
                    aria-label="Désactiver l'outil"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-blue-500/20 cursor-pointer"
                    onClick={() => {
                      togglePendingTool(tid);
                      const token = tokenForPendingTool(tidStr, userMcpServers);
                      if (token) {
                        const escaped = token.replace(
                          /[.*+?^${}()|[\]\\]/g,
                          "\\$&"
                        );
                        setInput(
                          input
                            .replace(
                              new RegExp(`@${escaped}( |\u00A0)?`, "g"),
                              ""
                            )
                            .trim()
                        );
                      }
                    }}
                    type="button"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="relative w-full">
          {input ? (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden min-h-[48px] max-h-36 px-4 pb-1.5 text-[16px] md:text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-foreground select-none font-sans",
                pendingTools.length > 0 ||
                  attachments.length > 0 ||
                  uploadQueue.length > 0
                  ? "pt-1.5"
                  : "pt-3.5"
              )}
              ref={overlayRef}
            >
              {renderHighlightedMentions(
                input,
                userMcpServers,
                userSkills,
                userAgents
              )}
            </div>
          ) : null}
          <PromptInputTextarea
            className={cn(
              "min-h-[48px] max-h-36 text-[16px] md:text-[13.5px] leading-relaxed px-4 pb-1.5 placeholder:text-muted-foreground/45 resize-none relative z-10 font-sans",
              pendingTools.length > 0 ||
                attachments.length > 0 ||
                uploadQueue.length > 0
                ? "pt-1.5"
                : "pt-3.5",
              input
                ? "bg-transparent text-transparent caret-foreground selection:bg-blue-500/30 selection:text-transparent"
                : ""
            )}
            data-testid="multimodal-input"
            onBlur={handleTextareaBlur}
            onChange={handleInput}
            onKeyDown={handleTextareaKeyDown}
            onScroll={(e) => {
              if (overlayRef.current) {
                overlayRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            placeholder={
              editingMessage
                ? "Modifier votre message..."
                : "Poser une question"
            }
            ref={textareaRef}
            value={input}
          />
        </div>
        <PromptInputFooter className="px-3 pb-2.5 pt-0">
          <PromptInputTools>
            <PlusMenuButton
              fileInputRef={fileInputRef}
              onOpenCloudPicker={() => setCloudPickerOpen(true)}
              onOpenQuizConfig={() => setQuizDialogOpen(true)}
              selectedModelId={selectedModelId}
              status={status}
              supportsTools={supportsTools}
            />
            <VoiceRecorderButton input={input} setInput={setInput} />
            <ModelSelectorCompact
              fallbackModels={chatModels}
              focusInputAfterSelect
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
            <AgentSelectorCompact />
          </PromptInputTools>

          {status === "submitted" || status === "streaming" ? (
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

      <SkillParamsDialog
        onOpenChange={setSkillParamsDialogOpen}
        onSubmit={handleSkillParamsSubmit}
        open={skillParamsDialogOpen}
        skill={activeSkill}
      />

      <QuizConfigDialog
        isOpen={quizDialogOpen}
        onClose={() => setQuizDialogOpen(false)}
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
  onOpenQuizConfig,
  supportsTools = true,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
  onOpenCloudPicker: () => void;
  onOpenQuizConfig: () => void;
  supportsTools?: boolean;
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
    if (!supportsTools) {
      toast.warning("Ce modèle ne prend pas en charge les outils (tools).");
      return;
    }
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
  const isMcpActive = pendingTools.some(
    (t) => (t as string) === "mcp" || (t as string).startsWith("mcp:")
  );

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
            isGhostMode || !supportsTools
              ? "opacity-50 cursor-not-allowed bg-muted/20"
              : isImageActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
          )}
          disabled={isGhostMode || !supportsTools}
          onClick={() => {
            if (isGhostMode) {
              toast.error(
                "La génération d'image est indisponible en Mode fantôme"
              );
              return;
            }
            if (!supportsTools) {
              toast.warning(
                "La génération d'image nécessite un modèle avec support des outils."
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
              ) : supportsTools ? (
                isImageActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isGhostMode
                ? "Indisponible dans ce mode"
                : supportsTools
                  ? "Transformez vos idées en images"
                  : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>

        {/* Option 4: Créer un audio ou son */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            isGhostMode || !supportsTools
              ? "opacity-50 cursor-not-allowed bg-muted/20"
              : isAudioActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
          )}
          disabled={isGhostMode || !supportsTools}
          onClick={() => {
            if (isGhostMode) {
              toast.error(
                "La génération audio est indisponible en Mode fantôme"
              );
              return;
            }
            if (!supportsTools) {
              toast.warning(
                "La génération audio nécessite un modèle avec support des outils."
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
              ) : supportsTools ? (
                isAudioActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {isGhostMode
                ? "Indisponible dans ce mode"
                : supportsTools
                  ? "Synthèse vocale et audio IA"
                  : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>

        {/* Option 5: Recherche sur le Web */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            supportsTools
              ? isWebActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
              : "opacity-50 cursor-not-allowed bg-muted/20"
          )}
          disabled={!supportsTools}
          onClick={() => {
            if (!supportsTools) {
              toast.warning(
                "La recherche Web nécessite un modèle avec support des outils."
              );
              return;
            }
            toggleToolExclusive("webSearch", "Recherche sur le Web");
          }}
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
              {supportsTools ? (
                isWebActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {supportsTools
                ? "Trouvez des infos en temps réel"
                : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>

        {/* Option Quizzly : Disponible même en mode fantôme */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer hover:bg-muted/70 text-foreground"
          )}
          onClick={() => {
            onOpenQuizConfig();
            setOpen(false);
          }}
          type="button"
        >
          <div className="flex size-7 items-center justify-center rounded-lg text-amber-500 shrink-0">
            <TrophyIcon className="size-4" />
          </div>
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold truncate">
                Quizzly — Quiz interactif
              </span>
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              1 à 50 questions avec score
            </span>
          </div>
        </button>

        {/* Option 6: Compétences (Skills) */}
        {supportsTools ? (
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
        ) : (
          <button
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-not-allowed opacity-50 bg-muted/20"
            onClick={() => {
              toast.warning(
                "Les compétences (skills) nécessitent un modèle supportant les outils."
              );
            }}
            type="button"
          >
            <div className="flex size-7 items-center justify-center rounded-lg text-muted-foreground shrink-0">
              <SparklesIcon className="size-4" />
            </div>
            <div className="flex items-center justify-between w-full min-w-0 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold truncate">
                  Compétences (Skills)
                </span>
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              </div>
              <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
                Non supporté par ce modèle
              </span>
            </div>
          </button>
        )}

        {/* Option 7: Serveurs & Outils MCP */}
        <button
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors w-full cursor-pointer",
            supportsTools
              ? isMcpActive
                ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20 text-primary"
                : "hover:bg-muted/70 text-foreground"
              : "opacity-50 cursor-not-allowed bg-muted/20"
          )}
          disabled={!supportsTools}
          onClick={() => {
            if (!supportsTools) {
              toast.warning(
                "Les serveurs et outils MCP nécessitent un modèle avec support des outils."
              );
              return;
            }
            toggleToolExclusive("mcp" as any, "Outils MCP");
          }}
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
              {supportsTools ? (
                isMcpActive ? (
                  <span className="text-[10px] bg-primary text-primary-foreground font-medium px-1.5 py-0.5 rounded-full">
                    ACTIF
                  </span>
                ) : null
              ) : (
                <span className="text-[10px] bg-destructive/15 text-destructive font-medium px-1.5 py-0.5 rounded-full">
                  SANS TOOLS
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
              {supportsTools
                ? "Connecter bases & APIs"
                : "Non supporté par ce modèle"}
            </span>
          </div>
        </button>
      </PopoverContent>
    </Popover>
  );
}

const PlusMenuButton = memo(PurePlusMenuButton);

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
