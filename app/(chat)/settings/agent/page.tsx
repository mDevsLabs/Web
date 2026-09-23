"use client";

import {
  BrainIcon,
  FolderIcon,
  GaugeIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AgentActivityPanel } from "@/components/agent/agent-activity-panel";
import { AgentScheduleHistoryPanel } from "@/components/agent/agent-schedule-history-panel";
import {
  AgentChannelBadge,
  AgentChannelNotice,
} from "@/components/agent/alpha-badge";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { PageBackButton } from "@/components/chat/page-back-button";
import { OptionSelector } from "@/components/settings/option-selector";
import { useAgentSettings } from "@/hooks/use-agent-settings";
import { useProjects } from "@/hooks/use-projects";
import { AGENT_FAMILY_LABELS } from "@/lib/agent/tools/selector/families";
import {
  AGENT_AUTONOMY_DESCRIPTIONS,
  AGENT_AUTONOMY_LABELS,
  type AgentAutonomy,
  type ToolCategory,
  type ToolPermission,
} from "@/lib/agent/types";
import {
  REASONING_LEVEL_DESCRIPTIONS,
  REASONING_LEVEL_LABELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import { cn } from "@/lib/utils";

const TOOL_PERMISSION_LABELS: Record<ToolPermission, string> = {
  ask: "Demander",
  auto: "Automatique",
  off: "Désactivé",
};

const TOOL_PERMISSION_DESCRIPTIONS: Record<ToolPermission, string> = {
  ask: "Agent demande votre accord avant d'exécuter l'outil.",
  auto: "Agent peut utiliser l'outil sans confirmation.",
  off: "L'outil est retiré de cette conversation Agent.",
};

const SETTINGS_TOOL_CATEGORIES: ToolCategory[] = [
  "web",
  "files",
  "library",
  "project",
  "internal",
  "artifact",
  "plugins",
  "mcp",
  "skills",
];

function Section({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description?: string;
  icon: typeof SparklesIcon;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-3 pl-0 sm:pl-11">{children}</div>
    </section>
  );
}

export default function AgentSettingsPage() {
  const [activityView, setActivityView] = useState(false);
  const [historyView, setHistoryView] = useState(false);
  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    setActivityView(view === "activity");
    setHistoryView(view === "history");
  }, []);
  const { data, isLoading, update } = useAgentSettings();
  const { projects } = useProjects();

  const settings = data?.settings;
  const flags = data?.flags;

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-6xl p-4 pb-16 sm:p-6 md:p-10">
        <div className="flex items-start gap-3 border-b border-border/50 pb-6">
          <PageBackButton />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold tracking-wider text-primary uppercase">
                mAI Agent
              </span>
              <AgentChannelBadge />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Paramètres Agent
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Modèle, réflexion, autonomie et autorisations d'outils. Chaque
              réglage est revérifié côté serveur à l'exécution.
            </p>
          </div>
        </div>

        {flags?.["agent.activity"] || flags?.["agent.scheduleHistory"] ? (
          <nav className="mt-4 flex gap-4 text-sm">
            <Link href="/settings/agent">Paramètres</Link>
            {flags?.["agent.activity"] ? <Link href="/settings/agent?view=activity">Activité Agent</Link> : null}
            {flags?.["agent.scheduleHistory"] ? <Link href="/settings/agent?view=history">Historique planifié</Link> : null}
          </nav>
        ) : null}
        {activityView && flags?.["agent.activity"] ? <AgentActivityPanel /> : null}
        {historyView && flags?.["agent.scheduleHistory"] ? <AgentScheduleHistoryPanel /> : null}

        {(activityView && flags?.["agent.activity"]) || (historyView && flags?.["agent.scheduleHistory"]) ? null : isLoading || !settings || !flags ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <span className="text-sm">Chargement des paramètres…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-6">
            {flags["agent.enabled"] ? null : (
              <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
                L'espace Agent est actuellement désactivé. Ces réglages seront
                conservés et appliqués dès sa réactivation.
              </p>
            )}

            <Section
              description="Modèle utilisé par défaut pour les nouvelles tâches."
              icon={SparklesIcon}
              title="Modèle par défaut"
            >
              <ModelSelectorCompact
                allowEmpty
                capabilities={{}}
                emptyLabel="Automatique (recommandé)"
                models={data.agentModels.map((entry) => ({
                  description: entry.description,
                  id: entry.id,
                  isFree: entry.isFree,
                  maxContext: entry.capabilities.contextWindow ?? undefined,
                  name: entry.name,
                  provider: entry.provider,
                }))}
                onModelChange={(modelId) =>
                  update({ defaultModel: modelId || null })
                }
                placeholder="Automatique"
                selectedModelId={settings.defaultModel ?? ""}
              />
            </Section>

            <Section
              description="Profondeur de réflexion demandée au modèle. Autonomie ≠ réflexion : l'autonomie règle l'usage des outils."
              icon={BrainIcon}
              title="Intensité de réflexion"
            >
              {flags["agent.reasoning"] ? (
                <OptionSelector
                  items={(["low", "medium", "high"] as ReasoningLevel[]).map(
                    (level) => ({
                      description: REASONING_LEVEL_DESCRIPTIONS[level],
                      id: level,
                      label: REASONING_LEVEL_LABELS[level],
                    })
                  )}
                  onChange={(id) =>
                    update({ reasoningLevel: id as ReasoningLevel })
                  }
                  value={settings.reasoningLevel}
                />
              ) : (
                <p className="rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  La réflexion est prête côté Agent (registre, validation,
                  interface) mais reste masquée tant que le paramètre exact
                  n'est pas confirmé par le fournisseur de modèles.
                </p>
              )}
            </Section>

            <Section
              description={AGENT_AUTONOMY_DESCRIPTIONS[settings.autonomy]}
              icon={GaugeIcon}
              title="Autonomie"
            >
              <OptionSelector
                items={(["careful", "standard", "high"] as AgentAutonomy[]).map(
                  (level) => ({
                    description: AGENT_AUTONOMY_DESCRIPTIONS[level],
                    id: level,
                    label: AGENT_AUTONOMY_LABELS[level],
                  })
                )}
                onChange={(id) => update({ autonomy: id as AgentAutonomy })}
                value={settings.autonomy}
              />
            </Section>

            <Section
              description="Familles d'outils autorisées. Aucune sélection = sélection automatique selon la tâche."
              icon={WrenchIcon}
              title="Outils"
            >
              <div className="flex flex-wrap gap-2">
                {SETTINGS_TOOL_CATEGORIES.filter((category) => {
                  const available: Partial<Record<ToolCategory, boolean>> = {
                    artifact: flags["agent.artifacts"],
                    files: flags["agent.files"],
                    library: flags["agent.files"],
                    mcp: flags["agent.mcp"],
                    plugins: flags["agent.plugins"],
                    project: flags["agent.projects"],
                    skills: flags["agent.skills"],
                    web: flags["agent.webSearch"],
                  };
                  return category === "internal" || available[category];
                }).map((category) => {
                  const enabled =
                    settings.enabledCategories?.includes(category) ?? false;
                  return (
                    <button
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        enabled
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border/50 bg-card/60 text-muted-foreground hover:text-foreground"
                      )}
                      key={category}
                      onClick={() => {
                        const current = new Set(
                          settings.enabledCategories ?? []
                        );
                        if (current.has(category)) {
                          current.delete(category);
                        } else {
                          current.add(category);
                        }
                        const next = [...current];
                        update({
                          enabledCategories: next.length > 0 ? next : null,
                        });
                      }}
                      type="button"
                    >
                      {AGENT_FAMILY_LABELS[
                        category as keyof typeof AGENT_FAMILY_LABELS
                      ] ?? category}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section
              description="Par défaut, les lectures sont automatiques et les actions sensibles demandent une confirmation."
              icon={ShieldCheckIcon}
              title="Autorisations des outils"
            >
              <div className="flex flex-col gap-3">
                {data.tools.map((tool) => (
                  <div
                    className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
                    key={tool.id}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{tool.name}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                    <div className="shrink-0 sm:w-44">
                      <OptionSelector
                        items={(((tool.impact === "external_mutation" || tool.impact === "deletion") ? ["ask", "off"] : ["auto", "ask", "off"]) as ToolPermission[]).map(
                          (permission) => ({
                            description:
                              TOOL_PERMISSION_DESCRIPTIONS[permission],
                            id: permission,
                            label: TOOL_PERMISSION_LABELS[permission],
                          })
                        )}
                        onChange={(value) =>
                          update({
                            toolPolicies: {
                              [tool.id]: value as ToolPermission,
                            },
                          })
                        }
                        value={
                          (tool.impact === "external_mutation" || tool.impact === "deletion") && settings.toolPolicies[tool.id] === "auto"
                            ? "ask"
                            : settings.toolPolicies[tool.id] ?? tool.defaultPermission
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              description="Projet proposé par défaut dans le composer Agent."
              icon={FolderIcon}
              title="Projet par défaut"
            >
              <OptionSelector
                allowEmpty
                items={projects.map((project) => ({
                  id: project.id,
                  label: project.name,
                }))}
                onChange={(id) => update({ defaultProjectId: id || null })}
                placeholder="Aucun projet"
                value={settings.defaultProjectId ?? ""}
              />
            </Section>

            <Section
              description="Fonctionnalités activées côté serveur par les feature flags Alpha."
              icon={SparklesIcon}
              title="Disponibilité"
            >
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["agent.webSearch", "Recherche web"],
                    ["agent.files", "Fichiers"],
                    ["agent.projects", "Projets"],
                    ["agent.artifacts", "Livrables"],
                    ["agent.approvals", "Approbations"],
                    ["agent.plugins", "Plugins"],
                    ["agent.mcp", "MCP"],
                    ["agent.skills", "Skills"],
                  ] as const
                ).map(([key, label]) => (
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      flags[key]
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-border/50 bg-muted/40 text-muted-foreground"
                    )}
                    key={key}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <AgentChannelNotice className="pt-1" />
              <Link
                className="text-[11.5px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                href="/"
              >
                Retour à Agent
              </Link>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
