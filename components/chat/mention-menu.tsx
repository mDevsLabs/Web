"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ProjectLite } from "@/hooks/use-projects";
import { AI_MODES, type AIModeId } from "@/lib/ai/modes";
import { cn } from "@/lib/utils";
import { ProjectIcon } from "./project-icon";

type MentionProject = ProjectLite & { description?: string };

export type MentionSelectPayload =
  | { type: "project"; project: MentionProject }
  | { type: "mode"; modeId: AIModeId };

type MentionMenuProps = {
  query: string;
  projects: MentionProject[];
  isLoadingProjects?: boolean;
  onSelect: (payload: MentionSelectPayload) => void;
  onClose: () => void;
  selectedIndex: number;
};

// Flat item list for keyboard nav: projects then modes
export type FlatMentionItem =
  | { kind: "project"; id: string; label: string; project: MentionProject }
  | { kind: "mode"; id: AIModeId; label: string };

function buildFlatList(
  query: string,
  projects: MentionProject[]
): FlatMentionItem[] {
  const q = query.toLowerCase().trim();
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
  return [...projectItems, ...modeItems];
}

export function getFilteredMentionItems(
  query: string,
  projects: MentionProject[]
): FlatMentionItem[] {
  return buildFlatList(query, projects);
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
    if (item.kind === "project") {
      onSelect({ project: item.project, type: "project" });
    } else {
      onSelect({ modeId: item.id, type: "mode" });
    }
  }, [item, onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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
  isLoadingProjects,
  onSelect,
  onClose: _onClose,
  selectedIndex,
}: MentionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const flat = useMemo(() => buildFlatList(query, projects), [query, projects]);

  // project sublists for section headers
  const projectItems = flat.filter((i) => i.kind === "project");
  const modeItems = flat.filter((i) => i.kind === "mode");

  useEffect(() => {
    const selected = menuRef.current?.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, query]);

  // Empty: no project + searching project-like query
  const showNoProject = !isLoadingProjects && projects.length === 0;

  if (flat.length === 0 && !showNoProject) {
    return null;
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-border/50 bg-card/95 shadow-[var(--shadow-float)] backdrop-blur-xl"
      ref={menuRef}
    >
      <div className="max-h-72 overflow-y-auto pb-1 no-scrollbar">
        {/* Section Projets */}
        <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40 flex items-center justify-between">
          <span>Projets</span>
          {isLoadingProjects ? (
            <span className="text-[10px] normal-case tracking-normal">
              Chargement…
            </span>
          ) : null}
        </div>
        {showNoProject ? (
          <div className="px-4 py-3 flex flex-col gap-2">
            <span className="text-[13px] text-muted-foreground">
              Aucuns projets crées.
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
          <div className="px-4 py-2 text-[12px] text-muted-foreground/50">
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
        <div className="px-4 py-2 mt-1 border-t border-border/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40">
          Modes IA
        </div>
        {modeItems.length === 0 ? (
          <div className="px-4 py-2 text-[12px] text-muted-foreground/50">
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
