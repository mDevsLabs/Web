"use client";

import {
  BotIcon,
  CpuIcon,
  FolderKanbanIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { ProjectIcon } from "@/components/chat/project-icon";
import { TOOLS_META, type ToolId } from "@/lib/ai/tools/config";
import type { Agent, McpServer, Skill } from "@/lib/db/schema";
import { getPluginByToolId } from "@/lib/plugins/catalog";
import { PluginIcon } from "@/lib/plugins/icon";
import { tokenForPendingTool } from "./mention-utils";

export function ProjectChip({
  pendingProject,
  clearPendingProject,
}: {
  pendingProject: {
    id: string;
    name: string;
    color?: string | null;
    icon?: string | null;
  };
  clearPendingProject: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-1 -mb-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
        <FolderKanbanIcon className="size-3.5 text-primary" />
        <ProjectIcon
          className="size-3.5"
          name={pendingProject.icon}
          style={{ color: pendingProject.color ?? undefined }}
        />
        <span>Dans : {pendingProject.name}</span>
        <button
          aria-label="Retirer le projet"
          className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={clearPendingProject}
          title="Retirer le projet"
          type="button"
        >
          <XIcon className="size-3" />
        </button>
      </span>
      <span className="text-[11px] text-muted-foreground">
        Session complète — toutes les nouvelles discussions y seront
        enregistrées.
      </span>
    </div>
  );
}

export function AgentChip({
  activeAgent,
  clearActiveAgent,
}: {
  activeAgent: Agent;
  clearActiveAgent: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-1 -mb-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
        <span
          className="size-5 rounded-full flex items-center justify-center text-white text-xs"
          style={{ backgroundColor: activeAgent.color || "#6366f1" }}
        >
          {(activeAgent as any).emoji ? (
            (activeAgent as any).emoji
          ) : (
            <BotIcon className="size-3.5" />
          )}
        </span>
        <span>Agent actif : {activeAgent.name}</span>
        <button
          aria-label="Retirer l'agent"
          className="ml-1 rounded-full p-0.5 hover:bg-indigo-500/20 text-muted-foreground hover:text-foreground"
          onClick={clearActiveAgent}
          title="Retirer l'agent"
          type="button"
        >
          <XIcon className="size-3" />
        </button>
      </span>
      <span className="text-[11px] text-muted-foreground">
        Sélection globale — modèle {activeAgent.defaultModelId}
      </span>
    </div>
  );
}

export function SkillChip({
  activeSkill,
  clearActiveSkill,
}: {
  activeSkill: Skill;
  clearActiveSkill: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-1 -mb-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-foreground">
        <SparklesIcon className="size-3.5 text-primary" />
        <span>Compétence active : {activeSkill.name}</span>
        <button
          aria-label="Retirer la compétence"
          className="ml-1 rounded-full p-0.5 hover:bg-primary/20 text-muted-foreground hover:text-foreground"
          onClick={clearActiveSkill}
          title="Retirer la compétence"
          type="button"
        >
          <XIcon className="size-3" />
        </button>
      </span>
      <span className="text-[11px] text-muted-foreground">
        Appliquée à toute la discussion
      </span>
    </div>
  );
}

// Pastilles des outils activés — deux variantes historiques conservées :
// "plain" (bloc au-dessus de la zone de saisie) et "icons" (rangée dans le PromptInput).
export function PendingToolsChips({
  pendingTools,
  userMcpServers,
  input,
  setInput,
  togglePendingTool,
  clearPendingTools,
  variant,
}: {
  pendingTools: readonly unknown[];
  userMcpServers: McpServer[];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  togglePendingTool: (toolId: any) => void;
  clearPendingTools: () => void;
  variant: "plain" | "icons";
}) {
  const removeToken = (tidStr: string) => {
    const token = tokenForPendingTool(tidStr, userMcpServers);
    if (token) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      setInput(
        input.replace(new RegExp(`@${escaped}( |\u00A0)?`, "g"), "").trim()
      );
    }
  };

  if (variant === "plain") {
    return (
      <div className="flex flex-wrap items-center gap-1.5 px-1 -mb-1">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Outils actifs :
        </span>
        {pendingTools.map((tid) => {
          const tidStr = tid as string;
          let label = tidStr;
          if (tidStr.startsWith("mcp:") || tidStr === "mcp") {
            const srvId = tidStr.replace(/^mcp:/, "");
            const srv = userMcpServers.find(
              (s) =>
                s.id === srvId || s.name.toLowerCase() === srvId.toLowerCase()
            );
            label = srv ? srv.name : srvId || "Outil MCP";
          } else {
            const plugin = getPluginByToolId(tidStr);
            if (plugin) {
              label = plugin.name;
            } else {
              const meta = TOOLS_META[tid as ToolId];
              label = meta?.label || tidStr;
            }
          }
          return (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[11px] font-medium text-primary"
              key={String(tid)}
            >
              {label}
              <button
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                onClick={() => {
                  togglePendingTool(tid as ToolId);
                  removeToken(tidStr);
                }}
                type="button"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          );
        })}
        <button
          className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1"
          onClick={clearPendingTools}
          type="button"
        >
          Tout désactiver
        </button>
        <span className="text-[10px] text-muted-foreground">
          — pour le prochain message
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full self-start flex-wrap items-center gap-1.5 px-4 pt-2.5">
      {pendingTools.map((tid) => {
        const tidStr = tid as string;
        let label = tidStr;
        let IconComponent: any = null;
        const plugin = getPluginByToolId(tidStr);
        if (tidStr.startsWith("mcp:") || tidStr === "mcp") {
          const srvId = tidStr.replace(/^mcp:/, "");
          const srv = userMcpServers.find(
            (s) =>
              s.id === srvId || s.name.toLowerCase() === srvId.toLowerCase()
          );
          label = srv ? srv.name : srvId || "Outil MCP";
          IconComponent = CpuIcon;
        } else {
          const meta = TOOLS_META[tid as ToolId];
          label = plugin?.name ?? meta?.label ?? tidStr;
          IconComponent = plugin ? null : meta?.icon;
        }
        return (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 shadow-xs"
            key={tidStr}
          >
            {plugin ? (
              <PluginIcon className="size-3" icon={plugin.icon} />
            ) : IconComponent ? (
              <IconComponent className="size-3" />
            ) : null}
            <span>{label}</span>
            <button
              aria-label="Désactiver l'outil"
              className="ml-0.5 rounded-full p-0.5 hover:bg-blue-500/20 cursor-pointer"
              onClick={() => {
                togglePendingTool(tid);
                removeToken(tidStr);
              }}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}
