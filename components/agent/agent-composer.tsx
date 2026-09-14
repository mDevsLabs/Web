"use client";

import { PaperclipIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AgentProjectPicker,
  AgentReasoningPicker,
  AgentToolsPicker,
} from "@/components/agent/composer/agent-option-pickers";
import { AgentPlusMenu } from "@/components/agent/composer/agent-plus-menu";
import {
  ComposerActionsRow,
  ComposerSendButton,
  ComposerShell,
  composerTextareaClass,
} from "@/components/chat/composer-primitives";
import { CloudFilePickerDialog } from "@/components/chat/cloud-file-picker-dialog";
import { VoiceRecorderButton } from "@/components/chat/input/voice-recorder-button";
import {
  ModelSelectorCompact,
  type SharedModel,
} from "@/components/chat/model-selector-compact";
import { PreviewAttachment } from "@/components/chat/preview-attachment";
import type {
  AgentRequestOptions,
  AgentToolMode,
} from "@/hooks/use-agent-chat";
import {
  MAX_FILES_PER_MESSAGE,
  useChatAttachments,
} from "@/hooks/use-chat-attachments";
import type { ProjectLite } from "@/hooks/use-projects";
import { AGENT_HOME_PLACEHOLDER } from "@/lib/agent/channel";
import type { AgentFlags } from "@/lib/agent/flags";
import type { ToolCategory } from "@/lib/agent/types";
import type { AgentComposerActionId } from "@/lib/agent/ui/composer-actions";
import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";
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
      setOpenPicker((current) => (current === id ? null : id));
    },
    [attachments.length, fileInputRef, maxFiles, supportsFiles]
  );

  const pickerOpenChange = useCallback(
    (id: AgentComposerActionId | "reasoning") => (open: boolean) =>
      setOpenPicker((current) => (open ? id : current === id ? null : current)),
    []
  );

  const canSend = input.trim().length > 0 || attachments.length > 0;

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
          onChange={(event) => setInput(event.target.value)}
          onInput={resize}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
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
              running={isRunning}
              sendLabel="Confier la tâche à Agent"
              sendTestId="agent-send-button"
              sendTitle="Confier la tâche à Agent"
              stopLabel="Arrêter Agent"
              onStop={onStop}
              stopTestId="agent-stop-button"
              stopTitle="Arrêter Agent"
              type="button"
            />
          </div>
        </ComposerActionsRow>
      </ComposerShell>

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
