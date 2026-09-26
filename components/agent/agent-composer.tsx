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
import { SkillParamsDialog } from "@/components/chat/skill-params-dialog";
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
  modelIsCompatible = true,
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
  modelIsCompatible?: boolean;
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
  const [skillParamsDialogOpen, setSkillParamsDialogOpen] = useState(false);
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

  // Données des menus @ : projets, skills, agents, plugins et serveurs MCP
  // de l'utilisateur. Les effects de session sont retransmis dans la requête
  // et revérifiés côté serveur.
  //
  // Ces trois fetchers ne doivent jamais renvoyer autre chose qu'un tableau
  // exploitable : le `= []` par défaut de SWR ne couvre que `undefined`, donc
  // une réponse 200 au corps inattendu empoisonnait le cache et faisait lever
  // `find is not a function` à CHAQUE rendu du composer — donc sur tout le
  // mode Agent. `jsonArray`/`jsonObject` filtrent et laissent SWR réessayer.
  const { projects: allProjects } = useProjects();
  const { data: userSkills = [] } = useSWR<Skill[]>(
    "/api/skills",
    (url: string) =>
      fetch(url).then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`skills HTTP ${response.status}`))
      ),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const skills = useMemo(
    () => (Array.isArray(userSkills) ? userSkills : []),
    [userSkills]
  );
  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === options.skillId) ?? null,
    [options.skillId, skills]
  );
  const selectedSkillHasParams = useMemo(
    () =>
      Array.isArray((selectedSkill as any)?.parameters) &&
      (selectedSkill as any).parameters.length > 0,
    [selectedSkill]
  );

  const { data: userAgentsData } = useSWR<{
    agents: Agent[];
    limit: number | null;
  }>(
    "/api/agents",
    (url: string) =>
      fetch(url).then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`agents HTTP ${response.status}`))
      ),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const agents = useMemo(
    () => (Array.isArray(userAgentsData?.agents) ? userAgentsData.agents : []),
    [userAgentsData]
  );
  const { data: mcpData } = useSWR<{ servers: McpServer[] }>(
    flags["agent.mcp"] ? "/api/mcp" : null,
    (url: string) =>
      fetch(url).then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`mcp HTTP ${response.status}`))
      ),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const userMcpServers = useMemo(
    () => (Array.isArray(mcpData?.servers) ? mcpData.servers : []),
    [mcpData]
  );
  const { data: pluginData } = useSWR<{ plugins: PluginCatalogEntry[] }>(
    flags["agent.plugins"] ? "/api/plugins" : null,
    (url: string) =>
      fetch(url).then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`plugins HTTP ${response.status}`))
      ),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const userPlugins = useMemo(
    () =>
      (Array.isArray(pluginData?.plugins) ? pluginData.plugins : []).filter(
        (plugin) => plugin.installed && plugin.enabled && !plugin.locked
      ),
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
          onOptionsChange({
            skillId: payload.skill.id,
            skillParams: null,
          });
          toast.success(`Compétence « ${payload.skill.name} » activée.`);
          break;
        case "mcp": {
          const serverId = payload.server.id;
          const nextServerIds = options.mcpServerIds.includes(serverId)
            ? options.mcpServerIds.filter((id) => id !== serverId)
            : [...options.mcpServerIds, serverId];
          onOptionsChange({ mcpServerIds: nextServerIds });
          toast.success(
            nextServerIds.includes(serverId)
              ? `Serveur MCP « ${payload.server.name} » activé.`
              : `Serveur MCP « ${payload.server.name} » désactivé.`
          );
          break;
        }
        case "plugin":
          toast.success(
            `Plugin « ${payload.plugin.name} » disponible pour cette tâche.`
          );
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
          // Les commandes personnalisées et les éléments non reconnus ne
          // sont pas des actions de tâche Agent.
          toast.info(
            "Cet élément n'est pas encore pris en charge dans le mode Agent."
          );
          break;
      }
    },
    [onOptionsChange, onProjectChange, options.mcpServerIds]
  );

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

  // Triggers @ et / : la logique (détection, navigation clavier, insertion de
  // token) est partagée avec le Chat via useComposerTriggers. Les sélections
  // sont traduites en options Agent (skill, agent/assistant, projet, mémoire,
  // web) — le serveur revérifie tout.
  const {
    closeMenus,
    handleMentionSelect: insertMentionToken,
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
    activeSkill: skills.find((skill) => skill.id === options.skillId) ?? null,
    clearActiveSkill: () =>
      onOptionsChange({ skillId: null, skillParams: null }),
    clearPendingProject: () => onProjectChange(null),
    input,
    installedPlugins: userPlugins,
    isFree: false,
    isNewChatInput: true,
    mcpServers: userMcpServers,
    mode: "agent",
    onSlashCommand: handleSlashSelection,
    onSuggestionSelect: handleMentionSelection,
    pendingProject: project ? { name: project.name } : null,
    pendingTools: options.mcpServerIds.map((serverId) => `mcp:${serverId}`),
    projects: allProjects,
    setInput,
    skills,
    supportsTools: capabilities.tools,
    textareaRef,
    togglePendingTool: (toolId) => {
      if (!toolId.startsWith("mcp:")) return;
      const serverId = toolId.slice(4);
      onOptionsChange({
        mcpServerIds: options.mcpServerIds.includes(serverId)
          ? options.mcpServerIds.filter((id) => id !== serverId)
          : [...options.mcpServerIds, serverId],
      });
    },
    userAgents: agents,
  });

  const sendTask = useCallback(
    (skillParams: Record<string, string> | null = options.skillParams) => {
      const text = input.trim();
      if (isRunning || (!text && attachments.length === 0)) {
        return;
      }
      onSubmit({
        attachments,
        options: {
          ...options,
          projectId: project?.id ?? null,
          skillParams,
        },
        text,
      });
      // Les Skills et serveurs MCP mentionnés sont one-shot : le snapshot
      // envoyé ci-dessus conserve la requête, puis l'interface revient à zéro.
      onOptionsChange({ mcpServerIds: [], skillId: null, skillParams: null });
      setInput("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [
      attachments,
      input,
      isRunning,
      onOptionsChange,
      onSubmit,
      options,
      project?.id,
    ]
  );

  const submit = useCallback(() => {
    const text = input.trim();
    if (isRunning || (!text && attachments.length === 0)) {
      return;
    }
    if (selectedSkillHasParams) {
      setSkillParamsDialogOpen(true);
      return;
    }
    sendTask();
  }, [attachments.length, input, isRunning, selectedSkillHasParams, sendTask]);

  const handleSkillParamsSubmit = useCallback(
    (values: Record<string, string>) => {
      setSkillParamsDialogOpen(false);
      sendTask(values);
    },
    [sendTask]
  );

  const canSend =
    modelIsCompatible && (input.trim().length > 0 || attachments.length > 0);

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      textareaProps.onKeyDown?.(event);
      if (
        event.defaultPrevented ||
        event.key !== "Enter" ||
        event.shiftKey ||
        event.nativeEvent.isComposing ||
        mentionOpen ||
        slashOpen ||
        !canSend
      ) {
        return;
      }

      event.preventDefault();
      submit();
    },
    [canSend, mentionOpen, slashOpen, submit, textareaProps.onKeyDown]
  );

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
            id={slashMenuId}
            onClose={closeMenus}
            onSelect={handleSlashSelection}
            query={slashQuery}
            selectedIndex={slashIndex}
            supportsTools={capabilities.tools}
          />
        ) : null}
        {mentionOpen ? (
          <MentionMenu
            agents={agents}
            customCommands={[]}
            id={mentionMenuId}
            isLoadingProjects={false}
            mcpServers={userMcpServers}
            memoryAtLimit={false}
            onClose={closeMenus}
            onSelect={insertMentionToken}
            plugins={userPlugins}
            projects={allProjects as never}
            query={mentionQuery}
            selectedIndex={mentionIndex}
            skills={skills}
            supportsTools={capabilities.tools}
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
          {...textareaProps}
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

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:shrink-0 sm:flex-nowrap">
            <ModelSelectorCompact
              capabilities={{ [modelId]: capabilities }}
              fallbackToFirst={false}
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
              sendTitle={
                modelIsCompatible
                  ? "Confier la tâche à Agent"
                  : "Choisissez un modèle compatible avec Agent"
              }
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

      <SkillParamsDialog
        onOpenChange={setSkillParamsDialogOpen}
        onSubmit={handleSkillParamsSubmit}
        open={skillParamsDialogOpen}
        skill={selectedSkill}
      />
    </div>
  );
}
