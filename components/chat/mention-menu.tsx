"use client";

import { CpuIcon, PlusIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ProjectLite } from "@/hooks/use-projects";
import { AI_MODES, type AIModeId } from "@/lib/ai/modes";
import type { McpServer, Skill } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { ProjectIcon } from "./project-icon";

type MentionProject = ProjectLite & { description?: string };

export type MentionSelectPayload =
  | { type: "project"; project: MentionProject }
  | { type: "mode"; modeId: AIModeId }
  | { type: "skill"; skill: Skill }
  | { type: "mcp"; server: McpServer };

type MentionMenuProps = {
  query: string;
  projects: MentionProject[];
  skills?: Skill[];
  mcpServers?: McpServer[];
  isLoadingProjects?: boolean;
  onSelect: (payload: MentionSelectPayload) => void;
  onClose: () => void;
  selectedIndex: number;
};

// Flat item list for keyboard nav: skills then mcp then projects then modes
export type FlatMentionItem =
  | { kind: "skill"; id: string; label: string; skill: Skill }
  | { kind: "mcp"; id: string; label: string; server: McpServer }
  | { kind: "project"; id: string; label: string; project: MentionProject }
  | { kind: "mode"; id: AIModeId; label: string };

function buildFlatList(
  query: string,
  projects: MentionProject[],
  skills: Skill[] = [],
  mcpServers: McpServer[] = []
): FlatMentionItem[] {
  const q = query.toLowerCase().trim();

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

  const modeEntries = Object.values(AI_MODES) as (typeof AI_MODES)[AIModeId][];
  const filteredModes = q
    ? modeEntries.filter(
        (mo) =>
          mo.label.toLowerCase().includes(q) ||
          mo.id.toLowerCase().includes(q) ||
          mo.description.toLowerCase().includes(q) ||
          mo.shortLabel.toLowerCase().includes(q)
      )
    : modeEntries;

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

  const modeItems: FlatMentionItem[] = filteredModes.map((mo) => ({
    id: mo.id as AIModeId,
    kind: "mode" as const,
    label: mo.label,
  }));

  return [...skillItems, ...mcpItems, ...projectItems, ...modeItems];
}

export function getFilteredMentionItems(
  query: string,
  projects: MentionProject[],
  skills: Skill[] = [],
  mcpServers: McpServer[] = []
): FlatMentionItem[] {
  return buildFlatList(query, projects, skills, mcpServers);
}

function MentionItem({
  item,
  isSelected,
  onSelect,
}: {
  item: FlatMentionItem;
  isSelected: boolean;
  onSelect: (payload: MentionSelectPayload) => void;
}) {
  const handleClick = useCallback(() => {
    if (item.kind === "skill") {
      onSelect({ skill: item.skill, type: "skill" });
    } else if (item.kind === "mcp") {
      onSelect({ server: item.server, type: "mcp" });
    } else if (item.kind === "project") {
      onSelect({ project: item.project, type: "project" });
    } else {
      onSelect({ modeId: item.id, type: "mode" });
    }
  }, [item, onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (item.kind === "skill") {
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
          isSelected ? "bg-muted/70" : "hover:bg-muted/40"
        )}
        data-selected={isSelected}
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

  const mode = AI_MODES[item.id];
  const Icon = mode.icon;
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
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </div>
      <span className="text-[13px] font-medium text-foreground">
        @{mode.label}
      </span>
      <span className="text-[11px] text-muted-foreground/60 truncate ml-1">
        {mode.description}
      </span>
    </button>
  );
}

export function MentionMenu({
  query,
  projects,
  skills = [],
  mcpServers = [],
  isLoadingProjects,
  onSelect,
  onClose: _onClose,
  selectedIndex,
}: MentionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const flat = useMemo(
    () => buildFlatList(query, projects, skills, mcpServers),
    [query, projects, skills, mcpServers]
  );

  const skillItems = flat.filter((i) => i.kind === "skill");
  const mcpItems = flat.filter((i) => i.kind === "mcp");
  const projectItems = flat.filter((i) => i.kind === "project");
  const modeItems = flat.filter((i) => i.kind === "mode");

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
      className="absolute bottom-full left-0 right-0 z-50 mb-3 overflow-hidden rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
      ref={menuRef}
    >
      <div className="max-h-80 overflow-y-auto pb-1 no-scrollbar">
        {/* Section Skills */}
        {skillItems.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/40 border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Compétences / Skills</span>
              <span className="text-[10px] text-primary normal-case">
                Appliquer à la discussion
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
                />
              );
            })}
          </>
        )}

        {/* Section MCP */}
        {mcpItems.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/40 border-t border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Serveurs MCP
            </div>
            {mcpItems.map((item) => {
              const flatIndex = flat.indexOf(item);
              return (
                <MentionItem
                  isSelected={flatIndex === selectedIndex}
                  item={item}
                  key={`mcp-${item.id}`}
                  onSelect={onSelect}
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

        {/* Section Modes */}
        <div className="px-4 py-2 mt-1 bg-muted/40 border-t border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Modes IA
        </div>
        {modeItems.length === 0 ? (
          <div className="px-4 py-2.5 text-[12px] text-muted-foreground/60">
            Aucun mode correspondant
          </div>
        ) : (
          modeItems.map((item) => {
            const flatIndex = flat.indexOf(item);
            return (
              <MentionItem
                isSelected={flatIndex === selectedIndex}
                item={item}
                key={`m-${item.id}`}
                onSelect={onSelect}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
