"use client";

import {
  BrainIcon,
  CheckIcon,
  FolderIcon,
  GaugeIcon,
  WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AgentToolMode } from "@/hooks/use-agent-chat";
import { type ProjectLite, useProjects } from "@/hooks/use-projects";
import type { AgentFlags } from "@/lib/agent/flags";
import {
  AGENT_FAMILY_DESCRIPTIONS,
  AGENT_FAMILY_LABELS,
  type AgentToolFamily,
  TOOL_CATEGORY_TO_FAMILY,
} from "@/lib/agent/tools/selector/families";
import {
  AGENT_AUTONOMY_DESCRIPTIONS,
  AGENT_AUTONOMY_LABELS,
  type AgentAutonomy,
  type ToolCategory,
} from "@/lib/agent/types";
import {
  REASONING_LEVEL_DESCRIPTIONS,
  REASONING_LEVEL_LABELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import { cn } from "@/lib/utils";

const FAMILY_TO_CATEGORY = Object.fromEntries(
  Object.entries(TOOL_CATEGORY_TO_FAMILY).map(([category, family]) => [
    family,
    category,
  ])
) as Record<AgentToolFamily, ToolCategory>;

function familyAvailable(family: AgentToolFamily, flags: AgentFlags): boolean {
  switch (family) {
    case "artifact":
      return flags["agent.artifacts"];
    case "files":
    case "library":
      return flags["agent.files"];
    case "mcp":
      return flags["agent.mcp"];
    case "plugins":
      return flags["agent.plugins"];
    case "project":
      return flags["agent.projects"];
    case "skills":
      return flags["agent.skills"];
    case "web":
      return flags["agent.webSearch"];
    default:
      return true;
  }
}

function PickerTrigger({
  active,
  icon: Icon,
  label,
}: {
  active: boolean;
  icon: typeof FolderIcon;
  label: string;
}) {
  return (
    <button
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border/40 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground"
      )}
      type="button"
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function OptionRow({
  description,
  label,
  onSelect,
  selected,
}: {
  description?: string;
  label: string;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
        selected ? "bg-primary/10" : "hover:bg-muted"
      )}
      onClick={onSelect}
      type="button"
    >
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
        {selected ? <CheckIcon className="size-3.5 text-primary" /> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-[11.5px] leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function AgentProjectPicker({
  onChange,
  onOpenChange,
  open: controlledOpen,
  projectId,
}: {
  onChange: (project: ProjectLite | null) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  projectId: string | null;
}) {
  const { projects, isLoading } = useProjects();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const selected = projects.find((project) => project.id === projectId) ?? null;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <span>
          <PickerTrigger
            active={Boolean(selected)}
            icon={FolderIcon}
            label={selected ? selected.name : "Projet"}
          />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1.5" side="top">
        <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
          Relier la tâche à un projet
        </p>
        {isLoading ? (
          <p className="px-2.5 py-2 text-xs text-muted-foreground">
            Chargement des projets…
          </p>
        ) : null}
        {!isLoading && projects.length === 0 ? (
          <p className="px-2.5 py-2 text-xs text-muted-foreground">
            Aucun projet pour le moment.
          </p>
        ) : null}
        <div className="max-h-72 overflow-y-auto">
          {selected ? (
            <OptionRow
              label="Aucun projet"
              onSelect={() => {
                onChange(null);
                setOpen(false);
              }}
              selected={false}
            />
          ) : null}
          {projects.map((project) => (
            <OptionRow
              key={project.id}
              label={project.name}
              onSelect={() => {
                onChange(project);
                setOpen(false);
              }}
              selected={project.id === projectId}
            />
          ))}
        </div>
        {selected ? (
          <button
            className="mt-1 w-full cursor-pointer rounded-lg border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            type="button"
          >
            Retirer le projet
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function AgentToolsPicker({
  enabledCategories,
  flags,
  onChange,
  onOpenChange,
  open: controlledOpen,
  toolMode,
}: {
  enabledCategories: ToolCategory[] | null;
  flags: AgentFlags;
  onChange: (value: {
    enabledCategories: ToolCategory[] | null;
    toolMode: AgentToolMode;
  }) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  toolMode: AgentToolMode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const families = (
    Object.values(TOOL_CATEGORY_TO_FAMILY) as AgentToolFamily[]
  ).filter(
    (family, index, all) =>
      all.indexOf(family) === index && familyAvailable(family, flags)
  );

  const selectedFamilies = new Set(
    (enabledCategories ?? []).map(
      (category) => TOOL_CATEGORY_TO_FAMILY[category]
    )
  );

  const toggleFamily = (family: AgentToolFamily) => {
    const next = new Set(selectedFamilies);
    if (next.has(family)) {
      next.delete(family);
    } else {
      next.add(family);
    }
    const categories = [...next].map((entry) => FAMILY_TO_CATEGORY[entry]);
    onChange({
      enabledCategories: categories.length > 0 ? categories : null,
      toolMode: categories.length > 0 ? "categories" : "auto",
    });
  };

  const label =
    toolMode === "all"
      ? "Tous les outils"
      : toolMode === "categories" && selectedFamilies.size > 0
        ? `Outils : ${[...selectedFamilies]
            .map((family) => AGENT_FAMILY_LABELS[family])
            .join(", ")}`
        : "Outils";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <span>
          <PickerTrigger
            active={toolMode !== "auto"}
            icon={WrenchIcon}
            label={label}
          />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-1.5" side="top">
        <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
          Outils autorisés pour cette tâche
        </p>
        <OptionRow
          description="Agent choisit lui-même les outils pertinents."
          label="Automatique"
          onSelect={() =>
            onChange({ enabledCategories: null, toolMode: "auto" })
          }
          selected={toolMode === "auto"}
        />
        <OptionRow
          description="Expose toutes les familles disponibles pour cette tâche."
          label="Tous les outils compatibles"
          onSelect={() =>
            onChange({ enabledCategories: null, toolMode: "all" })
          }
          selected={toolMode === "all"}
        />
        <div className="my-1 h-px bg-border/50" />
        <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Choisir par famille
        </p>
        <div className="max-h-64 overflow-y-auto">
          {families.map((family) => (
            <OptionRow
              description={AGENT_FAMILY_DESCRIPTIONS[family]}
              key={family}
              label={AGENT_FAMILY_LABELS[family]}
              onSelect={() => toggleFamily(family)}
              selected={
                toolMode === "categories" && selectedFamilies.has(family)
              }
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AgentReasoningPicker({
  autonomy,
  onAutonomyChange,
  onOpenChange,
  onReasoningChange,
  open: controlledOpen,
  reasoningLevel,
  showAutonomy = true,
  showReasoning,
}: {
  autonomy: AgentAutonomy;
  onAutonomyChange: (value: AgentAutonomy) => void;
  onOpenChange?: (open: boolean) => void;
  onReasoningChange: (value: ReasoningLevel) => void;
  open?: boolean;
  reasoningLevel: ReasoningLevel;
  showAutonomy?: boolean;
  showReasoning: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  if (!(showReasoning || showAutonomy)) {
    return null;
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <span>
          <PickerTrigger
            active={showReasoning}
            icon={showReasoning ? BrainIcon : GaugeIcon}
            label={
              showReasoning
                ? `Réflexion : ${REASONING_LEVEL_LABELS[reasoningLevel]}`
                : "Autonomie"
            }
          />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-1.5" side="top">
        {showReasoning ? (
          <>
            <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
              Intensité de réflexion
            </p>
            {(["low", "medium", "high"] as ReasoningLevel[]).map((level) => (
              <OptionRow
                description={REASONING_LEVEL_DESCRIPTIONS[level]}
                key={level}
                label={REASONING_LEVEL_LABELS[level]}
                onSelect={() => onReasoningChange(level)}
                selected={reasoningLevel === level}
              />
            ))}
          </>
        ) : null}
        {showReasoning && showAutonomy ? (
          <div className="my-1 h-px bg-border/50" />
        ) : null}
        {showAutonomy ? (
          <>
            <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
              Autonomie
            </p>
            {(["careful", "standard", "high"] as AgentAutonomy[]).map(
              (level) => (
                <OptionRow
                  description={AGENT_AUTONOMY_DESCRIPTIONS[level]}
                  key={level}
                  label={AGENT_AUTONOMY_LABELS[level]}
                  onSelect={() => onAutonomyChange(level)}
                  selected={autonomy === level}
                />
              )
            )}
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
