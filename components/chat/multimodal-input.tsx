"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { ArrowUpIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
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
import { useWindowSize } from "usehooks-ts";
import { AgentSelectorCompact } from "@/components/agents/agent-selector";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { CloudFilePickerDialog } from "@/components/chat/cloud-file-picker-dialog";
import { AttachmentPreviewItem } from "@/components/chat/input/attachment-preview-item";
import {
  AgentChip,
  PendingToolsChips,
  ProjectChip,
  SkillChip,
} from "@/components/chat/input/context-chips";
import {
  EditingBanner,
  GhostBanner,
  NoToolsWarning,
  QuotaBanner,
} from "@/components/chat/input/input-banners";
import { renderHighlightedMentions } from "@/components/chat/input/mention-utils";
import { PlusMenuButton } from "@/components/chat/input/plus-menu";
import { StopButton } from "@/components/chat/input/stop-button";
import { useDrafts } from "@/components/chat/input/use-drafts";
import { useModelCapabilities } from "@/components/chat/input/use-model-capabilities";
import { useQuotaMeter } from "@/components/chat/input/use-quota-meter";
import { VoiceRecorderButton } from "@/components/chat/input/voice-recorder-button";
import {
  MentionMenu,
  type MentionSelectPayload,
} from "@/components/chat/mention-menu";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { PreviewAttachment } from "@/components/chat/preview-attachment";
import { QuizConfigDialog } from "@/components/chat/quiz-config-dialog";
import { SkillParamsDialog } from "@/components/chat/skill-params-dialog";
import {
  type SlashCommand,
  SlashCommandMenu,
} from "@/components/chat/slash-commands";
import { SuggestedActions } from "@/components/chat/suggested-actions";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { useActiveChat } from "@/hooks/use-active-chat";
import {
  MAX_FILES_PER_MESSAGE,
  useChatAttachments,
} from "@/hooks/use-chat-attachments";
import { useComposerTriggers } from "@/hooks/use-composer-triggers";
import { useProjects } from "@/hooks/use-projects";
import { useTier } from "@/hooks/use-tier";
import { chatModels } from "@/lib/ai/models";
import type { ToolId } from "@/lib/ai/tools/config";
import { memoryLimitForTier } from "@/lib/auth/plan";
import { runSlashCommand } from "@/lib/chat/slash-commands";
import { executeCustomCommand } from "@/lib/commands/exec";
import type { Agent, CustomCommand, McpServer, Skill } from "@/lib/db/schema";
import type { PluginCatalogEntry } from "@/lib/plugins/types";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const { clearCurrentDraft } = useDrafts({
    chatId,
    input,
    isNewChatInput,
    setAttachments,
    setInput,
    textareaRef,
  });

  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);

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
  const { isFree, raw: tierRaw } = useTier();
  const { projects, isLoading: isProjectsLoading } = useProjects();

  // Les Skills sont disponibles pour tous les forfaits (y compris Free).
  const { data: userSkills = [] } = useSWR<Skill[]>(
    "/api/skills",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  // Plugins installés et activés (payants) — proposés uniquement dans la
  // mention @ (le menu « + » ne liste plus les plugins).
  const { data: pluginsData } = useSWR<{ plugins: PluginCatalogEntry[] }>(
    isFree ? null : "/api/plugins",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const installedPlugins = useMemo(
    () =>
      Array.isArray(pluginsData?.plugins)
        ? pluginsData.plugins.filter(
            (plugin) => plugin.installed && plugin.enabled && !plugin.locked
          )
        : [],
    [pluginsData]
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
  const { data: userAgentsData } = useSWR<{ agents: Agent[]; limit: number | null }>(
    isFree ? null : "/api/agents",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const userAgents = useMemo(() => userAgentsData?.agents ?? [], [
    userAgentsData,
  ]);
  const { data: customCommandsData = [] } = useSWR<CustomCommand[]>(
    isFree ? null : "/api/commands?kind=slash",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
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
    (url: string) =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    { dedupingInterval: 15_000, revalidateOnFocus: false }
  );
  const fallbackLimit = memoryLimitForTier(tierRaw);
  const memoryLimit =
    typeof memoryQuotaData?.limit === "number" && memoryQuotaData.limit > 0
      ? memoryQuotaData.limit
      : fallbackLimit;
  const memoryCount = Array.isArray(memoryQuotaData?.memories)
    ? memoryQuotaData.memories.length
    : 0;
  const memoryAtLimit = Boolean(
    memoryLimit > 0 &&
      Array.isArray(memoryQuotaData?.memories) &&
      memoryCount >= memoryLimit
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

  const {
    costAiLimit,
    costAiUsed,
    costPercent,
    isQuotaExhausted,
    liveSessionTokens,
  } = useQuotaMeter();

  // Capacités du modèle sélectionné (source unique via /api/models)
  const { hasStrictCaps, hasVisionSupport, supportsTools } =
    useModelCapabilities(selectedModelId);

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

  const handleSlashCommand = useCallback(
    async (cmd: SlashCommand) => {
      setInput("");
      await runSlashCommand(cmd, {
        chatId,
        clearPendingTools,
        isGhostMode,
        onOpenQuizConfig: () => setQuizDialogOpen(true),
        pendingTools,
        resolvedTheme,
        router,
        setActiveAgent,
        setActiveSkill,
        setInput,
        setMessages: setMessages as any,
        setPendingCommand,
        setTheme,
        toggleGhostMode,
        togglePendingTool,
        userAgents,
        userSkills,
      });
    },
    [
      chatId,
      clearPendingTools,
      isGhostMode,
      pendingTools,
      resolvedTheme,
      router,
      setActiveAgent,
      setActiveSkill,
      setInput,
      setMessages,
      setPendingCommand,
      setTheme,
      toggleGhostMode,
      togglePendingTool,
      userAgents,
      userSkills,
    ]
  );

  const handleMentionSuggestion = useCallback(
    (payload: MentionSelectPayload) => {
      if (payload.type === "skill") {
        setActiveSkill(payload.skill);
        toast.success(
          `Compétence appliquée à la discussion : ${payload.skill.name}`
        );
      } else if (payload.type === "plugin") {
        for (const pluginTool of payload.plugin.tools) {
          if (!pendingTools.includes(pluginTool.id as any)) {
            togglePendingTool(pluginTool.id as any);
          }
        }
        toast.success(
          `Plugin activé pour le prochain message : ${payload.plugin.name}`
        );
      } else if (payload.type === "mcp") {
        const mcpKey = `mcp:${payload.server.id}`;
        if (
          !pendingTools.includes(mcpKey as any) &&
          !pendingTools.includes("mcp" as any)
        ) {
          togglePendingTool(mcpKey as any);
        }
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
        toast.success(
          `Agent activé : ${payload.agent.name} — modèle ${(payload.agent as any).defaultModelId}`
        );
      } else if (payload.type === "system") {
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
        if (!pendingTools.includes("memory")) {
          togglePendingTool("memory");
        }
        toast.success(
          "Mémoire activée pour le prochain message — l'IA pourra retenir ou retrouver des informations"
        );
      }
    },
    [
      pendingTools,
      setActiveAgent,
      setActiveSkill,
      setPendingProject,
      togglePendingTool,
    ]
  );

  const handleCustomMention = useCallback(
    (command: CustomCommand) => {
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

      return ["agent", "mcp", "skill", "tools"].includes(command.actionType)
        ? `@${command.trigger}`
        : null;
    },
    [
      router,
      setActiveAgent,
      setPendingCommand,
      setActiveSkill,
      togglePendingTool,
      userAgents,
      userSkills,
    ]
  );

  const resolveMention = useCallback(
    (payload: MentionSelectPayload) => {
      if (
        (payload.type === "skill" ||
          payload.type === "mcp" ||
          payload.type === "plugin" ||
          (payload.type === "system" && payload.action === "web")) &&
        !supportsTools
      ) {
        toast.warning(
          "Ce modèle ne prend pas en charge les outils (tools). Les compétences et MCP sont indisponibles."
        );
        return false;
      }
      if (payload.type === "memory" && memoryAtLimit) {
        toast.warning(
          `Limite de mémoires atteinte (${memoryCount}/${memoryLimit}) — libérez de l'espace dans l'onglet Mémoire des paramètres.`
        );
        return false;
      }
      return true;
    },
    [memoryAtLimit, memoryCount, memoryLimit, supportsTools]
  );

  const {
    closeMenus,
    filteredSlashCommands,
    customSlashCommands,
    handleMentionSelect,
    handleSlashSelect,
    handleTextareaKeyDown: handleSharedTextareaKeyDown,
    mentionIndex,
    mentionMenuId,
    mentionOpen,
    mentionQuery,
    slashIndex,
    slashMenuId,
    slashOpen,
    slashQuery,
    textareaProps,
  } = useComposerTriggers({
    activeAgent,
    activeSkill,
    clearActiveAgent,
    clearActiveSkill,
    clearPendingProject,
    customCommands: customCommandsData,
    customMentionCommands,
    input,
    installedPlugins,
    isFree,
    isNewChatInput,
    mcpServers: userMcpServers,
    memoryAtLimit,
    memoryLimit,
    mode: "chat",
    onCustomCommand: handleCustomMention,
    onSlashCommand: handleSlashCommand,
    onSuggestionSelect: handleMentionSuggestion,
    pendingProject,
    pendingTools,
    projects,
    resolveMention,
    setInput,
    skills: userSkills,
    supportsTools,
    textareaRef,
    togglePendingTool,
    userAgents,
  });

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
    setInput("");
    resetUploadedBytes();
    // Le message est parti : le brouillon local n'a plus de raison d'exister.
    // En cas d'échec réseau, le contenu reste dans le dernier message affiché
    // (voir la garde anti-doublon sur status === "error").
    clearCurrentDraft();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    width,
    chatId,
    isGhostMode,
    resetUploadedBytes,
    clearCurrentDraft,
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

  const handleSlashClose = useCallback(() => {
    closeMenus();
  }, [closeMenus]);

  const handleMentionClose = useCallback(() => {
    closeMenus();
  }, [closeMenus]);

  const handlePromptSubmit = useCallback(() => {
    if (mentionOpen || slashOpen) {
      return;
    }

    const exactSlash = input.trim().match(/^\/([\p{L}\p{N}_-]+)$/u);
    if (exactSlash) {
      const query = exactSlash[1].toLowerCase();
      const command = filteredSlashCommands.find(
        (item) =>
          item.name.toLowerCase() === query ||
          item.aliases?.some((alias) => alias.toLowerCase() === query)
      );
      if (command) {
        handleSlashSelect(command);
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
    filteredSlashCommands,
    handleSlashSelect,
    hasVisionSupport,
    hasStrictCaps,
    input,
    mentionOpen,
    slashOpen,
    status,
    submitForm,
  ]);

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape" && editingMessage && onCancelEdit) {
        event.preventDefault();
        onCancelEdit();
        return;
      }
      handleSharedTextareaKeyDown(event);
    },
    [editingMessage, handleSharedTextareaKeyDown, onCancelEdit]
  );

  // Le hook partagé gère la fermeture retardée après blur.
  const handleTextareaBlur = useCallback(() => {
    closeMenus();
  }, [closeMenus]);

  return (
    <div
      className={cn("relative flex w-full flex-col gap-3 md:gap-4", className)}
    >
      {isGhostMode ? (
        <GhostBanner
          isNewChatInput={isNewChatInput}
          toggleGhostMode={toggleGhostMode}
        />
      ) : null}

      {pendingProject ? (
        <ProjectChip
          clearPendingProject={clearPendingProject}
          pendingProject={pendingProject}
        />
      ) : null}

      {activeAgent ? (
        <AgentChip
          activeAgent={activeAgent}
          clearActiveAgent={clearActiveAgent}
        />
      ) : null}
      {activeSkill ? (
        <SkillChip
          activeSkill={activeSkill}
          clearActiveSkill={clearActiveSkill}
        />
      ) : null}

      {pendingTools.length > 0 ? (
        <PendingToolsChips
          clearPendingTools={clearPendingTools}
          input={input}
          pendingTools={pendingTools}
          setInput={setInput}
          togglePendingTool={togglePendingTool}
          userMcpServers={userMcpServers}
          variant="plain"
        />
      ) : null}

      {costPercent >= 75 ? (
        <QuotaBanner
          costAiLimit={costAiLimit}
          costAiUsed={costAiUsed}
          costPercent={costPercent}
          liveSessionTokens={liveSessionTokens}
        />
      ) : null}

      {editingMessage && onCancelEdit ? (
        <EditingBanner onCancelEdit={onCancelEdit} />
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
            context={{ isFree, isHome: isNewChatInput, mode: "chat" }}
            customCommands={customSlashCommands}
            id={slashMenuId}
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
            id={mentionMenuId}
            isLoadingProjects={isProjectsLoading}
            mcpServers={userMcpServers}
            memoryAtLimit={memoryAtLimit}
            memoryCount={memoryCount}
            memoryLimit={memoryLimit}
            onClose={handleMentionClose}
            onSelect={handleMentionSelect}
            plugins={installedPlugins}
            projects={projects as any}
            query={mentionQuery}
            selectedIndex={mentionIndex}
            skills={userSkills}
            supportsTools={supportsTools}
          />
        ) : null}
      </div>

      {!supportsTools && <NoToolsWarning />}

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
          <PendingToolsChips
            clearPendingTools={clearPendingTools}
            input={input}
            pendingTools={pendingTools}
            setInput={setInput}
            togglePendingTool={togglePendingTool}
            userMcpServers={userMcpServers}
            variant="icons"
          />
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
                userAgents,
                installedPlugins
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
            {...textareaProps}
            onBlur={handleTextareaBlur}
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
