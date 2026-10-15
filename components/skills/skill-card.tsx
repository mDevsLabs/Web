"use client";

import {
  CopyIcon,
  CpuIcon,
  DownloadIcon,
  Edit2Icon,
  HistoryIcon,
  MoreVerticalIcon,
  PinIcon,
  PinOffIcon,
  Share2Icon,
  SparklesIcon,
  Trash2Icon,
  WrenchIcon,
} from "@mdevs/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Skill } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function SkillCard({
  skill,
  onTogglePin,
  onEdit,
  onDuplicate,
  onOpenVersions,
  onShare,
  onExport,
  onDeleteRequest,
}: {
  skill: Skill;
  onTogglePin: (s: Skill) => void;
  onEdit: (s: Skill) => void;
  onDuplicate: (s: Skill) => void;
  onOpenVersions: (s: Skill) => void;
  onShare: (s: Skill) => void;
  onExport: (s: Skill) => void;
  onDeleteRequest: (s: Skill) => void;
}) {
  const skillTools = (skill.tools as string[]) || [];
  const skillParams = (skill.parameters as any[]) || [];

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group",
        skill.pinned
          ? "border-amber-500/30 bg-amber-500/[0.02]"
          : "border-border/60 hover:border-border"
      )}
    >
      {/* Header de la carte */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: skill.color || "#6366f1" }}
          >
            <SparklesIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {skill.name}
              </h3>
              {skill.pinned && (
                <PinIcon className="size-3 text-amber-500 shrink-0 fill-amber-500" />
              )}
            </div>
            <p className="text-[12px] text-muted-foreground line-clamp-2">
              {skill.description || "Aucune description"}
            </p>
          </div>
        </div>

        {/* Menu d'actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
              variant="ghost"
            >
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onTogglePin(skill)}
            >
              {skill.pinned ? (
                <>
                  <PinOffIcon className="size-3.5" />
                  <span>Désépingler</span>
                </>
              ) : (
                <>
                  <PinIcon className="size-3.5 text-amber-500" />
                  <span>Épingler en haut</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onEdit(skill)}
            >
              <Edit2Icon className="size-3.5" />
              <span>Modifier / Renommer</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onDuplicate(skill)}
            >
              <CopyIcon className="size-3.5" />
              <span>Dupliquer</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onOpenVersions(skill)}
            >
              <HistoryIcon className="size-3.5" />
              <span>Historique des versions</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onShare(skill)}
            >
              <Share2Icon className="size-3.5" />
              <span>Partager</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onExport(skill)}
            >
              <DownloadIcon className="size-3.5" />
              <span>Exporter (.json)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
              onClick={() => onDeleteRequest(skill)}
            >
              <Trash2Icon className="size-3.5" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Aperçu Instructions */}
      <div className="flex-1 mb-3 bg-muted/30 p-2.5 rounded-xl border border-border/30 overflow-y-auto max-h-28 min-h-[68px] no-scrollbar">
        <p className="text-xs text-muted-foreground/90 font-mono break-words leading-relaxed whitespace-pre-wrap">
          {skill.instructions}
        </p>
      </div>

      {/* Outils associés & Tags */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 flex-wrap">
            {skillTools.length > 0 ? (
              skillTools.map((t) => (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-[10.5px] font-medium text-foreground"
                  key={t}
                >
                  <WrenchIcon className="size-2.5 text-primary" />
                  {t}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground/60 italic">
                Aucun outil spécifique
              </span>
            )}
            {skillTools.includes("mcp") &&
              Array.isArray((skill as any).mcpServerIds) &&
              (skill as any).mcpServerIds.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-[10.5px] font-medium">
                  <CpuIcon className="size-2.5" />
                  {(skill as any).mcpServerIds.length} MCP
                </span>
              )}
          </div>
          <div className="flex items-center gap-2">
            {skillParams.length > 0 && (
              <span className="text-[11px] text-muted-foreground shrink-0">
                {skillParams.length} param(s)
              </span>
            )}
            {(skill as any).mcpServerIds?.length > 0 && (
              <span className="text-[10px] text-purple-600">
                {Object.keys((skill as any).mcpToolFilter || {}).length} filtres
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {Array.isArray(skill.tags) && skill.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {skill.tags.map((t) => (
              <span
                className="text-[10px] text-muted-foreground/70"
                key={t}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
