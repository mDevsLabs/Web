"use client";

import {
  BrainIcon,
  GlobeIcon,
  ImageIcon,
  ListChecksIcon,
  MicIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  AgentProjectPicker,
  AgentReasoningPicker,
  AgentToolsPicker,
} from "@/components/agent/composer/agent-option-pickers";
import { AgentPlusMenu } from "@/components/agent/composer/agent-plus-menu";
import { CloudFilePickerDialog } from "@/components/chat/cloud-file-picker-dialog";
import {
  ComposerActionsRow,
  ComposerSendButton,
  ComposerShell,
  composerTextareaClass,
} from "@/components/chat/composer-primitives";
import { VoiceRecorderButton } from "@/components/chat/input/voice-recorder-button";
import {
  MentionMenu,
  type MentionSelectPayload,
} from "@/components/chat/mention-menu";
import {
  ModelSelectorCompact,
  type SharedModel,
} from "@/components/chat/model-selector-compact";
import { PreviewAttachment } from "@/components/chat/preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
} from "@/components/chat/slash-commands";
import type {
  AgentRequestOptions,
  AgentToolMode,
} from "@/hooks/use-agent-chat";
import {
  MAX_FILES_PER_MESSAGE,
  useChatAttachments,
} from "@/hooks/use-chat-attachments";
import { useComposerTriggers } from "@/hooks/use-composer-triggers";
import type { ProjectLite } from "@/hooks/use-projects";
import { useProjects } from "@/hooks/use-projects";
import { AGENT_HOME_PLACEHOLDER } from "@/lib/agent/channel";
import type { AgentFlags } from "@/lib/agent/flags";
import type { ToolCategory } from "@/lib/agent/types";
import type { AgentComposerActionId } from "@/lib/agent/ui/composer-actions";
import { getAgentComposerAction } from "@/lib/agent/ui/composer-actions";
import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";
import type { Agent, McpServer, Skill } from "@/lib/db/schema";
import type { PluginCatalogEntry } from "@/lib/plugins/types";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";

// AgentComposer : un seul composant, dont l'interface s'adapte aux capacités du
// modèle et aux fonctionnalités réellement actives. Il ne valide rien de
// définitif : chaque contrainte (type de fichier, nombre, outils, réflexion) est
// revérifiée côté serveur.
export type AgentComposerSubmit = {
  attachments: Attachment[];
  options: AgentRequestOptions;
  text: string;
};

// Chips des options one-shot actives : rappel visuel avec retrait possible,
// même langage que les chips d'outils du Chat.
const ONE_SHOT_CHIP_META: Partial<
  Record<keyof AgentRequestOptions, { icon: typeof BrainIcon; label: string }>
> = {
  audioEnabled: { icon: MicIcon, label: "Créer un audio" },
  forceWeb: { icon: GlobeIcon, label: "Recherche Web" },
  imageEnabled: { icon: ImageIcon, label: "Créer une image" },
  memoryEnabled: { icon: BrainIcon, label: "Mémoire" },
  tasksEnabled: { icon: ListChecksIcon, label: "Tâches" },
};

export function AgentComposer({
  capabilities,
  className,
  flags,
  isRunning,
  modelId,
  models,
  onModelChange,
  onOptionsChange,
  onProjectChange,
  onStop,
  onSubmit,
  options,
  placeholder = AGENT_HOME_PLACEHOLDER,
  project,
}: {
  capabilities: ModelCapabilities;
  className?: string;
  flags: AgentFlags;
  isRunning: boolean;
  modelId: string;
  models: SharedModel[];
  onModelChange: (modelId: string) => void;
  onOptionsChange: (patch: Partial<AgentRequestOptions>) => void;
  onProjectChange: (project: ProjectLite | null) => void;
  onStop: () => void;
  onSubmit: (payload: AgentComposerSubmit) => void;
  options: AgentRequestOptions;
  placeholder?: string;
  project: ProjectLite | null;
}) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // « reasoning » n'est pas une action du menu « + » : c'est un panneau local,
  // mais il partage le même état d'ouverture pour qu'un seul panneau soit
  // ouvert à la fois.
  const [openPicker, setOpenPicker] = useState<
    AgentComposerActionId | "reasoning" | null
  >(null);
  const [isCloudPickerOpen, setIsCloudPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const supportsFiles =
    capabilities.file || capabilities.image || capabilities.vision;
  const maxFiles = Math.min(
    supportsFiles ? capabilities.maxFiles : 0,
    MAX_FILES_PER_MESSAGE
  );

  const {
    fileInputRef,
    handleCloudAttachments,
    handleFileChange,
    removeAttachment,
    uploadQueue,
  } = useChatAttachments({
    attachments,
    hasStrictCaps: true,
    hasVisionSupport: supportsFiles,
    setAttachments,
    textareaRef,
  });

  const showReasoning = Boolean(
    flags["agent.reasoning"] && capabilities.reasoning
  );

  // Données des menus @ : projets, skills, agents et serveurs MCP de
  // l'utilisateur. Plugins et commandes personnalisées restent hors Agent
  // (pas d'outils plugins exécutables à ce jour) — filtrés à la source.
  const { projects: allProjects } = useProjects();
  const { data: userSkills = [] } = useSWR<Skill[]>(
    "/api/skills",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: userAgents = [] } = useSWR<Agent[]>(
    "/api/agents",
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: mcpData } = useSWR<{ servers: McpServer[] }>(
    flags["agent.mcp"] ? "/api/mcp" : null,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const userMcpServers = useMemo(
    () => (Array.isArray(mcpData?.servers) ? mcpData.servers : []),
    [mcpData]
  );
  const { data: pluginData } = useSWR<{ plugins: PluginCatalogEntry[] }>(
    flags["agent.plugins"] ? "/api/plugins" : null,
    (url: string) => fetch(url).then((response) => response.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const userPlugins = useMemo(
    () => (pluginData?.plugins ?? []).filter((plugin) => plugin.installed && plugin.enabled && !plugin.locked),
    [pluginData]
  );

  const handleMentionSelection = useCallback(
    (payload: MentionSelectPayload) => {
      switch (payload.type) {
        case "agent":
          toast.success(
            `Assistant « ${payload.agent.name} » ciblé pour la tâche.`
          );
          break;
        case "memory":
          onOptionsChange({ memoryEnabled: true });
          toast.success("Mémoire activée pour la prochaine tâche.");
          break;
        case "project":
          onProjectChange(payload.project);
          toast.success(`Tâche reliée au projet : ${payload.project.name}`);
          break;
        case "skill":
          toast.success(`Compétence « ${payload.skill.name} » activée.`);
          break;
        case "plugin":
          toast.success(`Plugin « ${payload.plugin.name} » disponible pour cette tâche.`);
          break;
        case "system":
          if (payload.action === "web") {
            onOptionsChange({ forceWeb: true });
            toast.success("Recherche Web activée pour la prochaine tâche.");
          } else {
            toast.success(
              "Référence ajoutée — Agent s'appuiera sur ce contenu."
            );
          }
          break;
        default:
          // MCP et commandes personnalisées ne sont pas des mentions de tâche Agent.
          toast.info(
            "Cet élément n'est pas encore pris en charge dans le mode Agent."
          );
          break;
      }
    },
    [onOptionsChange, onProjectChange]
  );

  // Triggers @ et / : la logique (détection, navigation clavier, insertion de
  // token) est partagée avec le Chat via useComposerTriggers. Les sélections
  // sont traduites en options Agent (skill, agent/assistant, projet, mémoire,
  // web) — le serveur revérifie tout.
  const {
    closeMenus,
    handleMentionSelect: insertMentionToken,
    handleTextareaBlur,
    handleTextareaKeyDown,
    mentionIndex,
    mentionOpen,
    mentionQuery,
    slashIndex,
    slashOpen,
    slashQuery,
    textareaProps,
  } = useComposerTriggers({
    input,
    mcpServers: userMcpServers,
    onSuggestionSelect: handleMentionSelection,
    projects: allProjects,
    setInput,
    skills: userSkills,
    installedPlugins: userPlugins,
    textareaRef,
    userAgents,
  });

  const handleSlashSelection = useCallback(
    (command: SlashCommand) => {
      switch (command.action) {
        case "tool-audio":
          onOptionsChange({ audioEnabled: true });
          toast.success("Création audio activée pour la prochaine tâche.");
          break;
        case "tool-image":
          onOptionsChange({ imageEnabled: true });
          toast.success("Création d'image activée pour la prochaine tâche.");
          break;
        case "tool-memory":
          onOptionsChange({ memoryEnabled: true });
          toast.success("Mémoire activée pour la prochaine tâche.");
          break;
        case "tool-web":
          onOptionsChange({ forceWeb: true });
          toast.success("Recherche Web activée pour la prochaine tâche.");
          break;
        case "tasks":
          onOptionsChange({ tasksEnabled: !options.tasksEnabled });
          toast.success(
            options.tasksEnabled
              ? "Option Tâches désactivée."
              : "Agent concevra d'abord un plan de tâches."
          );
          break;
        default:
          toast.info(
            `« /${command.name} » n'est pas pris en charge dans le mode Agent.`
          );
          break;
      }
    },
    [onOptionsChange, options.tasksEnabled]
  );

  const submit = useCallback(() => {
    const text = input.trim();
    if (isRunning || (!text && attachments.length === 0)) {
      return;
    }
    onSubmit({
      attachments,
      options: { ...options, projectId: project?.id ?? null },
      text,
    });
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [attachments, input, isRunning, onSubmit, options, project?.id]);

  const resize = useCallback(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 320)}px`;
  }, []);

  const handleAction = useCallback(
    (id: AgentComposerActionId) => {
      // Entrées one-shot : toggle de l'option correspondante, sans panneau.
      switch (id) {
        case "audio":
          onOptionsChange({ audioEnabled: !options.audioEnabled });
          toast.success(
            options.audioEnabled
              ? "Création audio désactivée."
              : "Création audio activée pour la prochaine tâche."
          );
          return;
        case "image":
          onOptionsChange({ imageEnabled: !options.imageEnabled });
          toast.success(
            options.imageEnabled
              ? "Création d'image désactivée."
              : "Création d'image activée pour la prochaine tâche."
          );
          return;
        case "memory":
          onOptionsChange({ memoryEnabled: !options.memoryEnabled });
          toast.success(
            options.memoryEnabled
              ? "Mémoire désactivée."
              : "Mémoire activée pour la prochaine tâche."
          );
          return;
        case "tasks":
          onOptionsChange({ tasksEnabled: !options.tasksEnabled });
          toast.success(
            options.tasksEnabled
              ? "Option Tâches désactivée."
              : "Agent concevra d'abord un plan de tâches."
          );
          return;
        case "web":
          onOptionsChange({ forceWeb: !options.forceWeb });
          toast.success(
            options.forceWeb
              ? "Recherche Web désactivée."
              : "Recherche Web activée pour la prochaine tâche."
          );
          return;
        default:
          break;
      }

      if (id === "files") {
        if (!supportsFiles) {
          toast.error("Ce modèle ne prend pas en charge ce type de fichier.");
          return;
        }
        if (attachments.length >= maxFiles) {
          toast.error(`Maximum ${maxFiles} fichiers par tâche.`);
          return;
        }
        fileInputRef.current?.click();
        return;
      }
      if (id === "library") {
        if (!supportsFiles) {
          toast.error("Ce modèle ne prend pas en charge ce type de fichier.");
          return;
        }
        setIsCloudPickerOpen(true);
        return;
      }
      setOpenPicker((current) => (current === id ? null : id));
    },
    [
      attachments.length,
      fileInputRef,
      maxFiles,
      onOptionsChange,
      options.audioEnabled,
      options.forceWeb,
      options.imageEnabled,
      options.memoryEnabled,
      options.tasksEnabled,
      supportsFiles,
    ]
  );

  const pickerOpenChange = useCallback(
    (id: AgentComposerActionId | "reasoning") => (open: boolean) =>
      setOpenPicker((current) => (open ? id : current === id ? null : current)),
    []
  );

  const canSend = input.trim().length > 0 || attachments.length > 0;

  // Chips one-shot actives, dérivées des options.
  const activeOneShotChips = useMemo(
    () =>
      (
        Object.entries(ONE_SHOT_CHIP_META) as [
          keyof AgentRequestOptions,
          { icon: typeof BrainIcon; label: string },
        ][]
      ).filter(([key]) => options[key] === true),
    [options]
  );

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <input
        accept="image/*,application/pdf,text/*,.csv,.json,.docx"
        className="hidden"
        multiple={maxFiles > 1}
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      <div className="relative">
        {slashOpen ? (
          <SlashCommandMenu
            context={{ isFree: false, isHome: true, mode: "agent" }}
            customCommands={[]}
            onClose={closeMenus}
            onSelect={handleSlashSelection}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        ) : null}
        {mentionOpen ? (
          <MentionMenu
            agents={userAgents}
            customCommands={[]}
            isLoadingProjects={false}
            mcpServers={userMcpServers}
            memoryAtLimit={false}
            onClose={closeMenus}
            onSelect={insertMentionToken}
            plugins={userPlugins}
            projects={allProjects as never}
            query={mentionQuery}
            selectedIndex={mentionIndex}
            skills={userSkills}
          />
        ) : null}
      </div>

      <ComposerShell className="p-2">
        {attachments.length > 0 || uploadQueue.length > 0 ? (
          <div className="flex flex-wrap gap-2 px-2 pt-2">
            {attachments.map((attachment, index) => (
              <PreviewAttachment
                attachment={attachment}
                key={`${attachment.url}-${index}`}
                onRemove={() => removeAttachment(index)}
              />
            ))}
          </div>
        ) : null}

        <textarea
          aria-label="Décrire la tâche à confier à Agent"
          className={composerTextareaClass}
          data-testid="agent-composer-input"
          disabled={isRunning}
          onBlur={handleTextareaBlur}
          onChange={textareaProps.onChange}
          onInput={resize}
          onKeyDown={handleTextareaKeyDown}
          placeholder={placeholder}
          ref={textareaRef}
          rows={1}
          value={input}
        />

        <ComposerActionsRow className="px-1 pb-1">
          <div className="flex min-w-0 items-center gap-1">
            <AgentPlusMenu
              availability={{
                capabilities,
                flags,
              }}
              disabled={isRunning}
              onSelect={handleAction}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ModelSelectorCompact
              capabilities={{ [modelId]: capabilities }}
              models={models}
              onModelChange={onModelChange}
              placeholder="Modèle d'IA"
              selectedModelId={modelId}
            />
            <VoiceRecorderButton input={input} setInput={setInput} />
            <ComposerSendButton
              canSend={canSend}
              loading={uploadQueue.length > 0}
              onSend={submit}
              onStop={onStop}
              running={isRunning}
              sendLabel="Confier la tâche à Agent"
              sendTestId="agent-send-button"
              sendTitle="Confier la tâche à Agent"
              stopLabel="Arrêter Agent"
              stopTestId="agent-stop-button"
              stopTitle="Arrêter Agent"
              type="button"
            />
          </div>
        </ComposerActionsRow>
      </ComposerShell>

      {activeOneShotChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {activeOneShotChips.map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                key={String(key)}
              >
                <Icon className="size-3" />
                {meta.label}
                <button
                  aria-label={`Retirer ${meta.label}`}
                  className="ml-0.5 cursor-pointer rounded-full p-0.5 hover:bg-primary/20"
                  onClick={() =>
                    onOptionsChange({
                      [key]: false,
                    } as Partial<AgentRequestOptions>)
                  }
                  type="button"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5 px-1">
        {flags["agent.projects"] ? (
          <AgentProjectPicker
            onChange={onProjectChange}
            onOpenChange={pickerOpenChange("project")}
            open={openPicker === "project"}
            projectId={project?.id ?? null}
          />
        ) : null}
        {flags["agent.files"] ? (
          supportsFiles ? (
            <button
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/40 bg-card/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsCloudPickerOpen(true)}
              type="button"
            >
              <PaperclipIcon className="size-3.5" />
              Fichiers
            </button>
          ) : (
            <span
              className="rounded-full border border-border/40 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
              title="Ce modèle ne prend pas en charge ce type de fichier."
            >
              Fichiers indisponibles
            </span>
          )
        ) : null}
        <AgentToolsPicker
          enabledCategories={options.enabledCategories}
          flags={flags}
          onChange={({ enabledCategories, toolMode }) =>
            onOptionsChange({
              enabledCategories,
              toolMode: toolMode as AgentToolMode,
            })
          }
          onOpenChange={pickerOpenChange("tools")}
          open={openPicker === "tools"}
          toolMode={options.toolMode}
        />
        <AgentReasoningPicker
          autonomy={options.autonomy}
          onAutonomyChange={(autonomy) => onOptionsChange({ autonomy })}
          onOpenChange={pickerOpenChange("reasoning")}
          onReasoningChange={(reasoningLevel: ReasoningLevel) =>
            onOptionsChange({ reasoningLevel })
          }
          open={openPicker === "reasoning"}
          reasoningLevel={options.reasoningLevel}
          showReasoning={showReasoning}
        />
      </div>

      <CloudFilePickerDialog
        onOpenChange={setIsCloudPickerOpen}
        onSelectAttachments={handleCloudAttachments}
        open={isCloudPickerOpen}
      />
    </div>
  );
}
