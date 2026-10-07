"use client";

// Onglet « Agent » des paramètres globaux (/settings?tab=agent).
// Pourquoi un composant dédié : la page /settings/agent historique a été
// absorbée ici (exigence produit : tous les réglages dans l'application
// globale). Toute la logique (hook useAgentSettings, options de réflexion,
// familles d'outils) reste inchangée — seul l'enrobage change.

import {
  ActivityIcon,
  BrainIcon,
  FolderIcon,
  HistoryIcon,
  HomeIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { AgentActivityPanel } from "@/components/agent/agent-activity-panel";
import { AgentScheduleHistoryPanel } from "@/components/agent/agent-schedule-history-panel";
import { AgentChannelNotice } from "@/components/agent/alpha-badge";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { OptionSelector } from "@/components/settings/option-selector";
import { useAgentSettings } from "@/hooks/use-agent-settings";
import { useProjects } from "@/hooks/use-projects";
import { resolveReasoningOptions } from "@/lib/agent/reasoning-options";
import { AGENT_FAMILY_LABELS } from "@/lib/agent/tools/selector/families";
import type {
  AgentMode,
  ToolCategory,
  ToolPermission,
} from "@/lib/agent/types";
import {
  REASONING_LEVEL_DESCRIPTIONS,
  REASONING_LEVEL_LABELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";
import { isPaidTier } from "@/lib/auth/plan";
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
    <section
      className="flex scroll-mt-24 flex-col gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm sm:p-5"
      id={title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")}
    >
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

export function AgentTab() {
  const { data, isLoading, update } = useAgentSettings();
  const { projects } = useProjects();

  const settings = data?.settings;
  const flags = data?.flags;

  // Le sélecteur « Agent » comme écran par défaut n'est proposé qu'aux comptes
  // qui peuvent réellement l'utiliser : sinon l'affichage proposerait un
  // réglage que le serveur refuse, et l'utilisateur comprendrait qu'un bouton
  // ne fait rien.
  const canChooseDefaultMode = Boolean(
    flags?.["agent.enabled"] && data?.tier && isPaidTier(data.tier)
  );

  // Les niveaux proposés viennent des capacités du modèle de repli choisi, ou
  // de l'union du catalogue en mode automatique. Aucune liste n'est écrite ici.
  const reasoningOptions = resolveReasoningOptions({
    models: data?.agentModels ?? [],
    selectedModelId: settings?.defaultModel ?? null,
  });

  if (isLoading || !settings || !flags) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin text-primary" />
        <span className="text-sm">Chargement des paramètres Agent…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {flags["agent.enabled"] ? null : (
        <p className="surface-muted border-warning/30 bg-warning/10 p-4 text-xs text-warning">
          L'espace Agent est actuellement désactivé. Ces réglages seront
          conservés et appliqués dès sa réactivation.
        </p>
      )}

      {canChooseDefaultMode ? (
        <Section
          description="Écran affiché à chaque arrivée sur la page d'accueil. Vos conversations existantes gardent leur mode."
          icon={HomeIcon}
          title="Mode par défaut"
        >
          <OptionSelector
            items={[
              {
                description:
                  "Conversation directe avec le modèle, sans boucle d'outils.",
                id: "chat",
                label: "Chat",
              },
              {
                description:
                  "Agent autonome : il planifie, utilise vos outils et vos fichiers, et rend un résultat complet.",
                id: "agent",
                label: "Agent",
              },
            ]}
            onChange={(id) => update({ defaultMode: id as AgentMode })}
            value={settings.defaultMode}
          />
        </Section>
      ) : null}

      <Section
        description="Utilisé uniquement si le modèle partagé avec Chat n'est pas disponible ou compatible avec Agent."
        icon={SparklesIcon}
        title="Modèle de repli"
      >
        <ModelSelectorCompact
          allowEmpty
          capabilities={{}}
          emptyLabel="Automatique (recommandé)"
          fallbackToFirst={false}
          models={data.agentModels.map((entry) => ({
            description: entry.description,
            id: entry.id,
            isFree: entry.isFree,
            maxContext: entry.capabilities.contextWindow ?? undefined,
            name: entry.name,
            provider: entry.provider,
          }))}
          onModelChange={(modelId) => update({ defaultModel: modelId || null })}
          placeholder="Automatique"
          selectedModelId={settings.defaultModel ?? ""}
        />
      </Section>

      <Section
        description="Profondeur de réflexion demandée au modèle. Sans effet sur les outils : l'Agent choisit lui-même ce qu'il utilise, et les autorisations se règlent plus bas."
        icon={BrainIcon}
        title="Réflexion"
      >
        {flags["agent.reasoning"] ? (
          reasoningOptions.isEmpty ? (
            <p className="rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {reasoningOptions.isAutomatic
                ? "Aucun des modèles disponibles ne propose de niveau de réflexion réglable. L'effort restera celui du fournisseur."
                : `« ${reasoningOptions.modelId} » ne propose aucun niveau de réflexion réglable : son effort reste celui du fournisseur.`}
            </p>
          ) : (
            <>
              <OptionSelector
                items={reasoningOptions.levels.map((level) => ({
                  description: REASONING_LEVEL_DESCRIPTIONS[level],
                  id: level,
                  label: REASONING_LEVEL_LABELS[level],
                }))}
                onChange={(id) =>
                  update({ reasoningLevel: id as ReasoningLevel })
                }
                value={settings.reasoningLevel}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {reasoningOptions.mandatory
                  ? "Ce modèle raisonne obligatoirement : « Désactivée » ne sera pas proposé sur les modèles de cette famille."
                  : reasoningOptions.isAutomatic
                    ? "Sans modèle de repli choisi, ce niveau est une préférence : il est recalé sur ce que le modèle de chaque conversation accepte réellement."
                    : "Ce niveau fait partie de ceux acceptés par le modèle de repli choisi."}
              </p>
            </>
          )
        ) : (
          <p className="rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Le réglage de la réflexion est désactivé côté serveur pour
            l'instant. Aucun effort n'est transmis au modèle.
          </p>
        )}
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
                  "min-h-11 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  enabled
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/50 bg-card/60 text-muted-foreground hover:text-foreground"
                )}
                key={category}
                onClick={() => {
                  const current = new Set(settings.enabledCategories ?? []);
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
                  items={(
                    (tool.impact === "external_mutation" ||
                    tool.impact === "deletion"
                      ? ["ask", "off"]
                      : ["auto", "ask", "off"]) as ToolPermission[]
                  ).map((permission) => ({
                    description: TOOL_PERMISSION_DESCRIPTIONS[permission],
                    id: permission,
                    label: TOOL_PERMISSION_LABELS[permission],
                  }))}
                  onChange={(value) =>
                    update({
                      toolPolicies: {
                        [tool.id]: value as ToolPermission,
                      },
                    })
                  }
                  value={
                    (tool.impact === "external_mutation" ||
                      tool.impact === "deletion") &&
                    settings.toolPolicies[tool.id] === "auto"
                      ? "ask"
                      : (settings.toolPolicies[tool.id] ??
                        tool.defaultPermission)
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
        description="Ce que votre compte peut réellement utiliser. Une pastille verte signale une fonction active, une pastille grise une fonction indisponible — pour votre forfait, ou parce qu'elle est éteinte côté serveur. Ces pastilles sont une lecture, pas un réglage : pour choisir ce qu'Agent peut employer, utilisez « Outils » ci-dessus."
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
              ["agent.reasoning", "Réflexion"],
            ] as const
          ).map(([key, label]) => (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                flags[key]
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border/50 bg-muted/40 text-muted-foreground"
              )}
              key={key}
            >
              {label}
            </span>
          ))}
        </div>
        <AgentChannelNotice className="pt-1" />
      </Section>

      {flags["agent.activity"] || flags["agent.scheduleHistory"] ? (
        <>
          {flags["agent.activity"] ? (
            <Section
              description="Les dernières exécutions de l'Agent sur votre compte : durée, outils employés et résultat."
              icon={ActivityIcon}
              title="Activité Agent"
            >
              <AgentActivityPanel />
            </Section>
          ) : null}
          {flags["agent.scheduleHistory"] ? (
            <Section
              description="Historique des tâches planifiées déjà exécutées, réussies ou en échec."
              icon={HistoryIcon}
              title="Historique planifié"
            >
              <AgentScheduleHistoryPanel />
            </Section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
