"use client";

import {
  BarChart3Icon,
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  MessageSquareIcon,
  PieChartIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import useSWR from "swr";
import { AgentIcon } from "./agent-icon";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type AgentStatItem = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  emoji: string | null;
  color: string;
  defaultModelId: string;
  pinned: boolean;
  usageCount: number;
  lastUsedAt: string | null;
};

export type AgentsStatsData = {
  totalChats: number;
  totalAgentChats: number;
  totalStandardChats: number;
  totalAgents: number;
  agents: AgentStatItem[];
};

export function AgentsStats() {
  const { data, error, isLoading, mutate } = useSWR<AgentsStatsData>(
    "/api/agents/stats",
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              className="h-28 rounded-2xl border border-border/50 bg-muted/20 p-4"
              key={i}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl border border-border/50 bg-muted/20" />
          <div className="h-72 rounded-2xl border border-border/50 bg-muted/20" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
        <span>Impossible de charger les statistiques des agents.</span>
        <button
          className="text-primary hover:underline text-xs font-semibold"
          onClick={() => mutate()}
          type="button"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { agents = [], totalAgentChats, totalChats, totalStandardChats, totalAgents } = data;
  const topAgent = agents[0]?.usageCount > 0 ? agents[0] : null;
  const agentSharePercent = totalChats > 0 ? Math.round((totalAgentChats / totalChats) * 100) : 0;
  const maxAgentUsage = Math.max(...agents.map((a) => a.usageCount), 1);

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total discussions</span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquareIcon className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{totalChats}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalAgentChats} avec agent • {totalStandardChats} standard
            </p>
          </div>
        </div>

        {/* Part des agents */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Taux d'adoption des agents</span>
            <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <TrendingUpIcon className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{agentSharePercent}%</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              des conversations utilisent un agent personnalisé
            </p>
          </div>
        </div>

        {/* Agent le plus actif */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Agent le plus utilisé</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <SparklesIcon className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            {topAgent ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="size-5 rounded-md flex items-center justify-center text-white text-xs shrink-0"
                    style={{ backgroundColor: topAgent.color }}
                  >
                    <AgentIcon
                      emoji={topAgent.emoji}
                      icon={topAgent.icon}
                      size={12}
                      variant="plain"
                    />
                  </div>
                  <span className="text-base font-bold text-foreground truncate">{topAgent.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {topAgent.usageCount} conversation{topAgent.usageCount > 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <span className="text-base font-bold text-foreground">Aucun pour l'instant</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Lancez une discussion avec un agent</p>
              </>
            )}
          </div>
        </div>

        {/* Total agents configurés */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Agents configurés</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <BotIcon className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{totalAgents}/10</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              agents personnalisés prêts à l'emploi
            </p>
          </div>
        </div>
      </div>

      {/* Graphiques Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique en barres : Utilisation par agent */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3Icon className="size-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                Fréquence d'utilisation par agent
              </h4>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {agents.length} agent{agents.length > 1 ? "s" : ""}
            </span>
          </div>

          {agents.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Aucun agent créé pour le moment.
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              {agents.map((ag) => {
                const percent = Math.round((ag.usageCount / maxAgentUsage) * 100);
                return (
                  <div className="flex flex-col gap-1.5" key={ag.id}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="size-5 rounded-md flex items-center justify-center text-white text-[10px] shrink-0"
                          style={{ backgroundColor: ag.color }}
                        >
                          <AgentIcon
                            emoji={ag.emoji}
                            icon={ag.icon}
                            size={12}
                            variant="plain"
                          />
                        </div>
                        <span className="font-medium text-foreground truncate">{ag.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline truncate max-w-[140px]">
                          ({ag.defaultModelId})
                        </span>
                      </div>
                      <span className="font-semibold text-foreground shrink-0 font-mono text-xs">
                        {ag.usageCount} {ag.usageCount > 1 ? "chats" : "chat"}
                      </span>
                    </div>
                    {/* Barre de progression avec couleur de l'agent */}
                    <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: ag.color || "#6366f1",
                          width: `${Math.max(percent, 4)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Graphique Donut de Répartition (Agents vs Standard) */}
        <div className="lg:col-span-1 rounded-2xl border border-border/60 bg-card p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="size-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-foreground">Répartition des discussions</h4>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="relative size-36 flex items-center justify-center">
              {/* SVG Donut */}
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  className="text-muted/30"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.8"
                />
                {/* Agent chats slice */}
                <path
                  className="transition-all duration-700 ease-out"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#6366f1"
                  strokeDasharray={`${totalChats > 0 ? (totalAgentChats / totalChats) * 100 : 0}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.8"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-foreground">{agentSharePercent}%</span>
                <span className="text-[10px] text-muted-foreground font-medium">Agents</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-6 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-indigo-500" />
                  <span className="text-muted-foreground">Avec agent</span>
                </div>
                <span className="font-semibold text-foreground font-mono">{totalAgentChats}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-muted-foreground">Standard (sans agent)</span>
                </div>
                <span className="font-semibold text-foreground font-mono">{totalStandardChats}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau détaillé des agents */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="p-4 sm:px-6 border-b border-border/40 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Détail de l'activité par agent</h4>
            <p className="text-xs text-muted-foreground">
              Historique des sollicitations et dernière utilisation
            </p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            Aucun agent enregistré.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border/30">
                <tr>
                  <th className="py-3 px-4 font-semibold">Agent</th>
                  <th className="py-3 px-4 font-semibold">Modèle IA</th>
                  <th className="py-3 px-4 font-semibold text-center">Discussions</th>
                  <th className="py-3 px-4 font-semibold">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {agents.map((ag) => (
                  <tr className="hover:bg-muted/20 transition-colors" key={ag.id}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: ag.color }}
                        >
                          <AgentIcon
                            emoji={ag.emoji}
                            icon={ag.icon}
                            size={14}
                            variant="plain"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground block truncate">
                            {ag.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate block max-w-xs">
                            {ag.description || "Aucune description"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {ag.defaultModelId}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {ag.usageCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {ag.lastUsedAt ? (
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="size-3 text-muted-foreground/70" />
                          <span>{new Date(ag.lastUsedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Jamais utilisé</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
