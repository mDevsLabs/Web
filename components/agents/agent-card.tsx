"use client";

import {
  CheckIcon,
  CopyIcon,
  Edit2Icon,
  MessageSquareTextIcon,
  MoreVerticalIcon,
  PinIcon,
  Trash2Icon,
} from "@mdevs/icons";
import { AgentIcon } from "@/components/agents/agent-icon";
import { DEFAULT_AGENT_COLOR } from "@/components/agents/agent-presets";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Agent } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  onActivate: (agent: Agent) => void;
  onTogglePin: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onStartChat: (agent: Agent) => void;
}

export function AgentCard({
  agent,
  isActive,
  onActivate,
  onTogglePin,
  onEdit,
  onDuplicate,
  onDelete,
  onStartChat,
}: AgentCardProps) {
  const isPinned = Boolean((agent as any).pinned);
  const skillCount = (agent.skillIds as string[] | null)?.length ?? 0;
  const mcpCount = (agent.mcpServerIds as string[] | null)?.length ?? 0;
  const fileCount = (agent.cloudFileUrls as string[] | null)?.length ?? 0;
  const starterPromptCount = (agent as any).starterPrompts?.length ?? 0;
  const hasModelParams =
    (agent as any).temperature !== null ||
    (agent as any).topP !== null ||
    (agent as any).maxTokens !== null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group",
        isActive
          ? "border-foreground/30 ring-1 ring-foreground/10 bg-foreground/[0.03]"
          : "border-border/60 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="size-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{
              backgroundColor: agent.color || DEFAULT_AGENT_COLOR,
            }}
          >
            <AgentIcon icon={agent.icon} size={20} variant="plain" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
              {agent.name}{" "}
              {isPinned && (
                <PinIcon className="size-3 text-muted-foreground shrink-0" />
              )}{" "}
              {isActive && (
                <span className="text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded-full">
                  Actif
                </span>
              )}
            </h3>
            <p className="text-[12px] text-muted-foreground truncate">
              {agent.description || "Aucune description"}
            </p>
          </div>
        </div>

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
              onClick={() => onActivate(agent)}
            >
              <CheckIcon className="size-3.5" />
              Activer (global)
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onTogglePin(agent)}
            >
              <PinIcon className="size-3.5" />
              {isPinned ? "Désépingler" : "Épingler"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onEdit(agent)}
            >
              <Edit2Icon className="size-3.5" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => onDuplicate(agent)}
            >
              <CopyIcon className="size-3.5" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
              onClick={() => onDelete(agent)}
            >
              <Trash2Icon className="size-3.5" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 mb-3 bg-muted/30 p-2.5 rounded-xl border border-border/30 overflow-hidden">
        <p className="text-xs text-muted-foreground/90 line-clamp-3 font-mono break-words leading-relaxed">
          {agent.instructions}
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border/40 text-[11px]">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
            {(agent as any).defaultModelId}
          </span>
          {skillCount > 0 && (
            <span className="bg-muted px-1.5 py-0.5 rounded">
              Skills {skillCount}
            </span>
          )}
          {mcpCount > 0 && (
            <span className="bg-info/10 text-info px-1.5 py-0.5 rounded">
              MCP {mcpCount}
            </span>
          )}
          {fileCount > 0 && (
            <span className="bg-warning/10 text-warning px-1.5 py-0.5 rounded">
              Fichiers {fileCount}
            </span>
          )}
          {hasModelParams && (
            <span className="bg-info/10 text-info px-1.5 py-0.5 rounded">
              Params modèle
            </span>
          )}
          {starterPromptCount > 0 && (
            <span className="bg-success/10 text-success px-1.5 py-0.5 rounded">
              Démarrage {starterPromptCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="h-7 text-xs flex-1 gap-1.5"
            onClick={() => onStartChat(agent)}
            size="sm"
            variant="default"
          >
            <MessageSquareTextIcon className="size-3.5" />
            <span>Discuter</span>
          </Button>
          <Button
            className="h-7 text-xs"
            onClick={() => onActivate(agent)}
            size="sm"
            variant={isActive ? "secondary" : "outline"}
          >
            {isActive ? "Activé" : "Activer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
