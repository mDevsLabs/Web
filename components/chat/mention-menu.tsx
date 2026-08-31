"use client";

import {
  BotIcon,
  BrainIcon,
  CpuIcon,
  PlusIcon,
  SparklesIcon,
  SquareSlashIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { AgentIcon } from "@/components/agents/agent-icon";
import type { ProjectLite } from "@/hooks/use-projects";
import type { Agent, CustomCommand, McpServer, Skill } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { ProjectIcon } from "./project-icon";

type MentionProject = ProjectLite & { description?: string };

export type MentionSelectPayload =
  | { type: "project"; project: MentionProject }
  | { type: "agent"; agent: Agent }
  | { type: "skill"; skill: Skill }
  | { type: "mcp"; server: McpServer }
  | { type: "customCommand"; command: CustomCommand }
  | { type: "memory" };

type MentionMenuProps = {
  query: string;
  projects: MentionProject[];
  skills?: Skill[];
  mcpServers?: McpServer[];
  agents?: Agent[];
  customCommands?: CustomCommand[];
  isLoadingProjects?: boolean;
  /** Quota de mémoire atteint pour la portée courante : `add` n'est plus possible. */
  memoryAtLimit?: boolean;
  memoryCount?: number;
  memoryLimit?: number;
  onSelect: (payload: MentionSelectPayload) => void;
  onClose: () => void;
  selectedIndex: number;
  supportsTools?: boolean;
};

// Flat item list for keyboard nav: memory then skills then mcp then projects then agents then custom commands
export type FlatMentionItem =
  | { kind: "memory"; id: string; label: string }
  | { kind: "skill"; id: string; label: string; skill: Skill }
  | { kind: "mcp"; id: string; label: string; server: McpServer }
  | { kind: "project"; id: string; label: string; project: MentionProject }
  | { kind: "agent"; id: string; label: string; agent: Agent }
  | {
      kind: "custom-command";
      id: string;
      label: string;
      command: CustomCommand;
    };

function buildFlatList(
  query: string,
  projects: MentionProject[],
  skills: Skill[] = [],
  mcpServers: McpServer[] = [],
  agents: Agent[] = [],
  customCommands: CustomCommand[] = []
): FlatMentionItem[] {
  const q = query.toLowerCase().trim();

  const memoryItems: FlatMentionItem[] =
    !q || "memory".includes(q) || "mémoire".includes(q) || "memoire".includes(q)
      ? [{ id: "memory", kind: "memory" as const, label: "Memory" }]
      : [];

  const filteredSkills = q
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q) ||
          (Array.isArray(s.tags) &&
            s.tags.some((t) => t.toLowerCase().includes(q)))
      )
    : skills;

  const filteredMcp = q
    ? mcpServers.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q)
      )
    : mcpServers.filter((m) => m.isEnabled);

  const filteredProjects = q
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.name.toLowerCase().startsWith(q)
      )
    : projects;

  const filteredAgents = q
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q) ||
          (a.instructions ?? "").toLowerCase().includes(q)
      )
    : agents;

  const skillItems: FlatMentionItem[] = filteredSkills.map((s) => ({
    id: s.id,
    kind: "skill" as const,
    label: s.name,
    skill: s,
  }));

  const mcpItems: FlatMentionItem[] = filteredMcp.map((m) => ({
    id: m.id,
    kind: "mcp" as const,
    label: m.name,
    server: m,
  }));

  const projectItems: FlatMentionItem[] = filteredProjects.map((p) => ({
    id: p.id,
    kind: "project" as const,
    label: p.name,
    project: p,
  }));

  const agentItems: FlatMentionItem[] = filteredAgents.map((a) => ({
    agent: a,
    id: a.id,
    kind: "agent" as const,
    label: a.name,
  }));

  const filteredCustom = q
    ? customCommands.filter(
        (c) =>
          c.trigger.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
      )
    : customCommands;

  const customItems: FlatMentionItem[] = filteredCustom.map((c) => ({
    command: c,
    id: c.id,
    kind: "custom-command" as const,
    label: c.trigger,
  }));

  return [
    ...memoryItems,
    ...skillItems,
    ...mcpItems,
    ...projectItems,
    ...agentItems,
    ...customItems,
  ];
}

export function getFilteredMentionItems(
  query: string,
  projects: MentionProject[],
  skills: Skill[] = [],
  mcpServers: McpServer[] = [],
  agents: Agent[] = [],
  customCommands: CustomCommand[] = []
): FlatMentionItem[] {
  return buildFlatList(
    query,
    projects,
    skills,
    mcpServers,
    agents,
    customCommands
  );
}

function MentionItem({
  item,
  isSelected,
  memoryAtLimit,
  memoryCount,
  memoryLimit,
  onSelect,
  supportsTools = true,
}: {
  item: FlatMentionItem;
  isSelected: boolean;
  memoryAtLimit?: boolean;
  memoryCount?: number;
  memoryLimit?: number;
  onSelect: (payload: MentionSelectPayload) => void;
  supportsTools?: boolean;
}) {
  const isToolFeature = item.kind === "skill" || item.kind === "mcp";
  const isMemoryBlocked = item.kind === "memory" && Boolean(memoryAtLimit);
  const isDisabled = (isToolFeature && !supportsTools) || isMemoryBlocked;

  const handleClick = useCallback(() => {
    if (isMemoryBlocked) {
      toast.warning(
        `Limite de mémoires atteinte (${memoryCount ?? memoryLimit ?? 0}/${memoryLimit ?? 0}) — libérez de l'espace dans l'onglet Mémoire des paramètres.`
      );
      return;
    }
    if (isDisabled) {
      toast.warning(
        "Ce modèle ne prend pas en charge les outils (tools). Les compétences et serveurs MCP sont désactivés."
      );
      return;
    }
    if (item.kind === "skill") {
      onSelect({ skill: item.skill, type: "skill" });
    } else if (item.kind === "mcp") {
      onSelect({ server: item.server, type: "mcp" });
    } else if (item.kind === "project") {
      onSelect({ project: item.project, type: "project" });
    } else if (item.kind === "memory") {
      onSelect({ type: "memory" });
    } else if (item.kind === "custom-command") {
      onSelect({ command: item.command, type: "customCommand" });
    } else {
      onSelect({ agent: item.agent, type: "agent" });
    }
  }, [isDisabled, isMemoryBlocked, item, memoryCount, memoryLimit, onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (item.kind === "memory") {
    return (
      <button
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          isDisabled
            ? "opacity-40 cursor-not-allowed"
            : isSelected
              ? "bg-muted/70"
              : "hover:bg-muted/40"
        )}
        data-selected={isSelected && !isDisabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        type="button"
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <BrainIcon className="size-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-foreground truncate">
              @{item.label}
            </span>
            <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold px-1.5 py-0.2 rounded">
              Mémoire
            </span>
            {isDisabled && (
              <span className="text-[9px] bg-destructive/10 text-destructive font-semibold px-1.5 py-0.2 rounded">
                Limite atteinte ({memoryCount ?? 0}/{memoryLimit ?? 0})
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground/70 truncate">
            {isDisabled
              ? "Libérez de l'espace dans l'onglet Mémoire des paramètres"
              : "L'IA pourra retenir, retrouver ou oublier des informations"}
          </span>
        </div>
      </button>
    );
  }

  if (item.kind === "skill") {
    return (
      <button
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          isDisabled
            ? "opacity-40 cursor-not-allowed"
            : isSelected
              ? "bg-muted/70"
              : "hover:bg-muted/40"
        )}
        data-selected={isSelected && !isDisabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        type="button"
      >
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-white text-xs font-bold"
          style={{ backgroundColor: item.skill.color || "#6366f1" }}
        >
          <SparklesIcon className="size-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-foreground truncate">
              @{item.label}
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.2 rounded">
              Skill
            </span>
            {isDisabled && (
              <span className="text-[9px] bg-destructive/10 text-destructive font-semibold px-1.5 py-0.2 rounded">
                Non supporté
              </span>
            )}
          </div>
          {item.skill.description && (
            <span className="text-[11px] text-muted-foreground/70 truncate">
              {item.skill.description}
            </span>
          )}
        </div>
      </button>
    );
  }

  if (item.kind === "mcp") {
    return (
      <button
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          isDisabled
            ? "opacity-40 cursor-not-allowed"
            : isSelected
              ? "bg-muted/70"
              : "hover:bg-muted/40"
        )}
        data-selected={isSelected && !isDisabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        type="button"
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <CpuIcon className="size-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-foreground truncate">
              @{item.label}
            </span>
            <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold px-1.5 py-0.2 rounded uppercase">
              {item.server.transport}
            </span>
            {isDisabled && (
              <span className="text-[9px] bg-destructive/10 text-destructive font-semibold px-1.5 py-0.2 rounded">
                Non supporté
              </span>
            )}
          </div>
          {item.server.description && (
            <span className="text-[11px] text-muted-foreground/70 truncate">
              {item.server.description}
            </span>
          )}
        </div>
      </button>
    );
  }

  if (item.kind === "project") {
    return (
      <button
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          isSelected ? "bg-muted/70" : "hover:bg-muted/40"
        )}
        data-selected={isSelected}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        type="button"
      >
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-md"
          style={{
            background: `${item.project.color}18`,
            color: item.project.color,
          }}
        >
          <ProjectIcon
            className="size-3.5"
            name={item.project.icon}
            style={{ color: item.project.color }}
          />
        </div>
        <span className="text-[13px] font-medium text-foreground truncate">
          @{item.label}
        </span>
        <span className="text-[11px] text-muted-foreground/60 truncate ml-1">
          Projet — {item.project.chatCount ?? 0} discussions
        </span>
      </button>
    );
  }

  if (item.kind === "custom-command") {
    return (
      <button
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          isSelected ? "bg-muted/70" : "hover:bg-muted/40"
        )}
        data-selected={isSelected}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        type="button"
      >
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: item.command.color || "#6366f1" }}
        >
          <AgentIcon icon={item.command.icon} size={14} variant="plain" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-foreground truncate">
              @{item.label}
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.2 rounded flex items-center gap-1">
              <SquareSlashIcon className="size-3" /> Commande
            </span>
          </div>
          {item.command.description && (
            <span className="text-[11px] text-muted-foreground/70 truncate">
              {item.command.description}
            </span>
          )}
        </div>
      </button>
    );
  }

  // Agent
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
        isSelected ? "bg-muted/70" : "hover:bg-muted/40"
      )}
      data-selected={isSelected}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      type="button"
    >
      <div
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-white text-xs"
        style={{ backgroundColor: (item as any).agent.color || "#6366f1" }}
      >
        <AgentIcon
          emoji={(item as any).agent.emoji}
          icon={(item as any).agent.icon}
          size={14}
          variant="plain"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate flex items-center gap-1.5">
          @{item.label}
          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-1.5 py-0.2 rounded flex items-center gap-1">
            <BotIcon className="size-3" /> Agent
          </span>
        </span>
        {(item as any).agent.description && (
          <span className="text-[11px] text-muted-foreground/70 truncate">
            {(item as any).agent.description}
          </span>
        )}
      </div>
    </button>
  );
}

export function MentionMenu({
  query,
  projects,
  skills = [],
  mcpServers = [],
  agents = [],
  customCommands = [],
  isLoadingProjects,
  memoryAtLimit,
  memoryCount,
  memoryLimit,
  onSelect,
  onClose: _onClose,
  selectedIndex,
  supportsTools = true,
}: MentionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const flat = useMemo(
    () =>
      buildFlatList(
        query,
        projects,
        skills,
        mcpServers,
        agents,
        customCommands
      ),
    [query, projects, skills, mcpServers, agents, customCommands]
  );

  const memoryItems = flat.filter((i) => i.kind === "memory");
  const skillItems = flat.filter((i) => i.kind === "skill");
  const mcpItems = flat.filter((i) => i.kind === "mcp");
  const projectItems = flat.filter((i) => i.kind === "project");
  const agentItems = flat.filter((i) => i.kind === "agent");
  const customCommandItems = flat.filter((i) => i.kind === "custom-command");

  useEffect(() => {
    const selected = menuRef.current?.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, []);

  const showNoProject = !isLoadingProjects && projects.length === 0;

  if (flat.length === 0 && !showNoProject) {
    return null;
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-3 overflow-hidden rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 text-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
      ref={menuRef}
    >
      <div className="max-h-80 overflow-y-auto pb-1 no-scrollbar">
        {/* Section Mémoire (@Memory) */}
        {memoryItems.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/40 border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BrainIcon className="size-3.5" /> Mémoire
              </span>
            </div>
            {memoryItems.map((item) => {
              const flatIndex = flat.indexOf(item);
              return (
                <MentionItem
                  isSelected={flatIndex === selectedIndex}
                  item={item}
                  key={`mem-${item.id}`}
                  memoryAtLimit={memoryAtLimit}
                  memoryCount={memoryCount}
                  memoryLimit={memoryLimit}
                  onSelect={onSelect}
                />
              );
            })}
          </>
        )}

        {/* Section Skills */}
        {skillItems.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/40 border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Compétences / Skills</span>
              <span
                className={cn(
                  "text-[10px] normal-case",
                  supportsTools
                    ? "text-primary"
                    : "text-amber-600 dark:text-amber-400 font-medium"
                )}
              >
                {supportsTools
                  ? "Appliquer à la discussion"
                  : "Indisponible avec ce modèle"}
              </span>
            </div>
            {skillItems.map((item) => {
              const flatIndex = flat.indexOf(item);
              return (
                <MentionItem
                  isSelected={flatIndex === selectedIndex}
                  item={item}
                  key={`s-${item.id}`}
                  onSelect={onSelect}
                  supportsTools={supportsTools}
                />
              );
            })}
          </>
        )}

        {/* Section MCP */}
        {mcpItems.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/40 border-t border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Serveurs MCP</span>
              {!supportsTools && (
                <span className="text-[10px] normal-case text-amber-600 dark:text-amber-400 font-medium">
                  Indisponible avec ce modèle
                </span>
              )}
            </div>
            {mcpItems.map((item) => {
              const flatIndex = flat.indexOf(item);
              return (
                <MentionItem
                  isSelected={flatIndex === selectedIndex}
                  item={item}
                  key={`mcp-${item.id}`}
                  onSelect={onSelect}
                  supportsTools={supportsTools}
                />
              );
            })}
          </>
        )}

        {/* Section Projets */}
        <div className="px-4 py-2 bg-muted/40 border-t border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Projets (@)</span>
          {isLoadingProjects ? (
            <span className="text-[10px] normal-case tracking-normal font-normal">
              Chargement…
            </span>
          ) : null}
        </div>
        {showNoProject ? (
          <div className="px-4 py-3 flex flex-col gap-2">
            <span className="text-[13px] text-muted-foreground">
              Aucuns projets créés.
            </span>
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline w-fit"
              href="/projects"
              onClick={() => _onClose()}
            >
              <PlusIcon className="size-3.5" /> Créer un projet
            </Link>
          </div>
        ) : projectItems.length === 0 ? (
          <div className="px-4 py-2.5 text-[12px] text-muted-foreground/60">
            Aucun projet correspondant à “{query}”
          </div>
        ) : (
          projectItems.map((item) => {
            const flatIndex = flat.indexOf(item);
            return (
              <MentionItem
                isSelected={flatIndex === selectedIndex}
                item={item}
                key={`p-${item.id}`}
                onSelect={onSelect}
              />
            );
          })
        )}

        {/* Section Agents */}
        {agentItems.length > 0 || query.trim().length === 0 ? (
          <>
            <div className="px-4 py-2 mt-1 bg-muted/40 border-t border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BotIcon className="size-3.5" /> Agents
            </div>
            {agentItems.length === 0 ? (
              <div className="px-4 py-2.5 text-[12px] text-muted-foreground/60 flex flex-col gap-1">
                <span>Aucun agent correspondant</span>
                <Link
                  className="text-primary hover:underline text-xs"
                  href="/agents"
                  onClick={() => _onClose()}
                >
                  Créer un agent →
                </Link>
              </div>
            ) : (
              agentItems.map((item) => {
                const flatIndex = flat.indexOf(item);
                return (
                  <MentionItem
                    isSelected={flatIndex === selectedIndex}
                    item={item}
                    key={`ag-${item.id}`}
                    onSelect={onSelect}
                  />
                );
              })
            )}
          </>
        ) : null}

        {/* Section Commandes personnalisées */}
        {customCommandItems.length > 0 && (
          <>
            <div className="px-4 py-2 mt-1 bg-muted/40 border-t border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SquareSlashIcon className="size-3.5" /> Commandes personnalisées
            </div>
            {customCommandItems.map((item) => {
              const flatIndex = flat.indexOf(item);
              return (
                <MentionItem
                  isSelected={flatIndex === selectedIndex}
                  item={item}
                  key={`cmd-${item.id}`}
                  onSelect={onSelect}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
