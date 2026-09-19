"use client";

import { BotIcon, CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { AgentIcon } from "@/components/agents/agent-icon";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useTier } from "@/hooks/use-tier";
import type { Agent } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AgentSelectorCompact() {
  const { activeAgent, setActiveAgent, clearActiveAgent } = useActiveChat();
  const { isFree } = useTier();
  const { data: agents = [] } = useSWR<Agent[]>(
    isFree ? null : "/api/agents",
    fetcher
  );
  const [open, setOpen] = useState(false);

  if (isFree) {
    return null;
  }

  const handleSelect = (agent: Agent | null) => {
    if (agent) {
      setActiveAgent(agent);
    } else {
      clearActiveAgent();
    }
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-8 rounded-full border border-border/40 px-2.5 gap-1.5 text-xs font-medium hover:bg-muted",
            activeAgent &&
              "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
          )}
          data-testid="agent-selector"
          size="sm"
          title={
            activeAgent
              ? `Agent actif : ${activeAgent.name}`
              : "Choisir un agent"
          }
          variant="ghost"
        >
          <BotIcon className="size-3.5 shrink-0" />
          <span className="max-w-[100px] truncate hidden sm:inline">
            {activeAgent
              ? activeAgent.emoji
                ? `${activeAgent.emoji} ${activeAgent.name}`
                : activeAgent.name
              : "Agent"}
          </span>
          {activeAgent && (
            <span
              className="size-5 rounded-full flex items-center justify-center text-[11px] shrink-0"
              style={{ backgroundColor: activeAgent.color || "#6366f1" }}
            >
              <AgentIcon
                emoji={activeAgent.emoji}
                icon={activeAgent.icon}
                size={12}
                variant="plain"
              />
            </span>
          )}
          <ChevronDownIcon className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[320px] p-2 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl flex flex-col gap-1"
      >
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BotIcon className="size-3.5" /> Agents
          </span>
          <span className="text-[10px] normal-case font-normal">
            {agents.length}/10
          </span>
        </div>
        <button
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm hover:bg-muted/50",
            !activeAgent && "bg-muted"
          )}
          onClick={() => handleSelect(null)}
        >
          <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <BotIcon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-xs">Aucun agent</span>
            <p className="text-[11px] text-muted-foreground">
              Style par défaut
            </p>
          </div>
          {!activeAgent && (
            <CheckIcon className="size-4 text-primary ml-auto" />
          )}
        </button>
        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 no-scrollbar">
          {agents.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Aucun agent créé.{" "}
              <a
                className="text-primary hover:underline"
                href="/agents"
                onClick={() => setOpen(false)}
              >
                Créer →
              </a>
            </div>
          ) : (
            agents.map((a) => (
              <button
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-muted/50",
                  activeAgent?.id === a.id && "bg-indigo-500/10"
                )}
                key={a.id}
                onClick={() => handleSelect(a)}
              >
                <div
                  className="size-7 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: a.color || "#6366f1" }}
                >
                  <AgentIcon
                    emoji={a.emoji}
                    icon={a.icon}
                    size={14}
                    variant="plain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs truncate block">
                    {a.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {a.description || a.defaultModelId}
                  </span>
                </div>
                {activeAgent?.id === a.id && (
                  <CheckIcon className="size-4 text-indigo-600 ml-auto" />
                )}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border/40 pt-1.5 mt-1">
          <a
            className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-primary hover:underline"
            href="/agents"
            onClick={() => setOpen(false)}
          >
            Gérer mes agents →
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
