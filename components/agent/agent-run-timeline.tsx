"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  HammerIcon,
  HelpCircleIcon,
  LibraryIcon,
  Loader2Icon,
  MessageSquareIcon,
  PackageIcon,
  PlugIcon,
  PuzzleIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TimerIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentStreamState } from "@/components/agent/agent-stream-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  hasTimelineContent,
  visiblePlan,
} from "@/lib/agent/timeline-visibility";
import type {
  AgentArtifactRef,
  AgentRunEvent,
  AgentStepEvent,
  AgentStepType,
  AgentToolActivity,
  ToolCategory,
} from "@/lib/agent/types";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { cn } from "@/lib/utils";

// Timeline d'exécution : uniquement des actions observables — outils, fichiers,
// projet, livrables, approbations, retries, attentes. Jamais de raisonnement
// privé du modèle : la boucle d'Agent est visible, sa pensée ne l'est pas.
//
// Chaque étape porte une icône lisible par catégorie, un statut, une durée
// éventuelle et des détails développables. Les retries d'un même outil sont
// regroupés visuellement (chaque tentative reste persistée et consultable).
const STEP_ICONS: Record<AgentStepType, typeof HammerIcon> = {
  approval_request: ShieldCheckIcon,
  artifact: PackageIcon,
  error: TriangleAlertIcon,
  message: CheckCircle2Icon,
  planning: CircleDashedIcon,
  tool_call: HammerIcon,
  tool_result: HammerIcon,
  user_input_answer: MessageSquareIcon,
  user_input_request: HelpCircleIcon,
  verification: CheckCircle2Icon,
};

// Icônes par catégorie d'outil : distinguer recherche, fichiers, projet,
// plugin, MCP, Skill et livrable au premier coup d'œil.
const CATEGORY_ICONS: Partial<Record<ToolCategory, typeof HammerIcon>> = {
  artifact: PackageIcon,
  files: FileTextIcon,
  internal: HelpCircleIcon,
  library: LibraryIcon,
  mcp: PlugIcon,
  plugins: PuzzleIcon,
  project: FolderIcon,
  skills: SparklesIcon,
  web: SearchIcon,
};

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  artifact: "Livrable",
  files: "Fichier",
  internal: "Interne",
  library: "Bibliothèque",
  mcp: "MCP",
  plugins: "Plugin",
  project: "Projet",
  skills: "Skill",
  web: "Recherche",
};

function StatusDot({ status }: { status: AgentStepEvent["status"] }) {
  if (status === "running") {
    return <Loader2Icon className="size-3.5 animate-spin text-primary" />;
  }
  if (status === "failed") {
    return <TriangleAlertIcon className="size-3.5 text-destructive" />;
  }
  if (status === "completed") {
    return <CheckCircle2Icon className="size-3.5 text-emerald-500" />;
  }
  if (status === "skipped") {
    return <CircleDashedIcon className="size-3.5 text-muted-foreground" />;
  }
  return <CircleIcon className="size-3.5 text-muted-foreground/50" />;
}

const RUN_STATUS_BADGES: Record<
  AgentRunEvent["status"],
  { className: string; label: string }
> = {
  cancelled: {
    className: "border-border/60 text-muted-foreground",
    label: "Arrêté",
  },
  completed: {
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    label: "Terminé",
  },
  failed: {
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    label: "Échec",
  },
  queued: {
    className: "border-border/60 text-muted-foreground",
    label: "En file",
  },
  running: {
    className: "border-primary/30 bg-primary/10 text-primary",
    label: "En cours",
  },
  timed_out: {
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    label: "Délai dépassé",
  },
  waiting_for_approval: {
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    label: "En attente d'approbation",
  },
  waiting_for_tool: {
    className: "border-border/60 text-muted-foreground",
    label: "En attente d'un outil",
  },
  waiting_for_user: {
    className: "border-primary/30 bg-primary/10 text-primary",
    label: "Attend votre réponse",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms} ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${Math.round(seconds)} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest > 0 ? `${minutes} min ${rest} s` : `${minutes} min`;
}

function formatTokens(count: number): string {
  if (count < 1000) {
    return `${count}`;
  }
  return `${(count / 1000).toFixed(1)} k`;
}

function RunSummary({ run }: { run: AgentRunEvent }) {
  // Même raison que pour l'icône d'étape : `status` est relu depuis une colonne
  // varchar sans CHECK. On affiche le statut brut plutôt que de lever.
  const badge = RUN_STATUS_BADGES[run.status] ?? {
    className: "border-border/40",
    label: run.status,
  };
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border/40 bg-background/60 px-2.5 py-1.5 text-[11.5px] text-muted-foreground"
      data-testid="agent-run-summary"
    >
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          badge.className
        )}
      >
        {badge.label}
      </span>
      {run.model ? (
        <span className="max-w-full break-all">Modèle : {run.model}</span>
      ) : null}
      <span>Réflexion : {run.reasoningLevel}</span>
      <span className="inline-flex items-center gap-1">
        <TimerIcon className="size-3" />
        {run.stepCount ?? 0} étapes · {run.toolCallCount ?? 0} actions
      </span>
      {run.durationMs !== undefined && run.durationMs > 0 ? (
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="size-3" />
          {formatDuration(run.durationMs)}
        </span>
      ) : null}
      {run.totalTokens !== undefined && run.totalTokens > 0 ? (
        <span>
          ~{formatTokens(run.totalTokens)} tokens
          {run.inputTokens !== undefined && run.outputTokens !== undefined
            ? ` (${formatTokens(run.inputTokens)} → ${formatTokens(run.outputTokens)})`
            : ""}
        </span>
      ) : null}
      {run.error ? (
        <span className="text-destructive">Erreur : {run.error}</span>
      ) : null}
    </div>
  );
}

function ToolRetryGroup({
  activities,
  stepId,
}: {
  activities: AgentToolActivity[];
  stepId: string;
}) {
  const [showAttempts, setShowAttempts] = useState(false);
  const last = activities.at(-1);
  const first = activities[0];
  if (!last) {
    return null;
  }
  const totalDuration = activities.reduce(
    (total, activity) => total + (activity.durationMs ?? 0),
    0
  );
  const Icon = CATEGORY_ICONS[last.category] ?? STEP_ICONS.tool_result;

  return (
    <div className="flex flex-col">
      <button
        className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-muted/40"
        data-testid={`agent-step-${stepId}`}
        id={`agent-step-${stepId}`}
        onClick={() => setShowAttempts((current) => !current)}
        type="button"
      >
        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
          <Icon className="size-3.5 text-muted-foreground" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium">
              {last.label}
            </span>
            <span className="shrink-0 rounded-full border border-border/40 px-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[last.category] ?? last.category}
            </span>
            {activities.length > 1 ? (
              <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                {activities.length} tentatives
              </span>
            ) : null}
          </span>
          {last.summary ? (
            <span className="truncate text-[11.5px] text-muted-foreground">
              {last.summary}
            </span>
          ) : null}
        </span>
        {totalDuration > 0 ? (
          <span className="shrink-0 pt-0.5 text-[10.5px] tabular-nums text-muted-foreground/70">
            {formatDuration(totalDuration)}
          </span>
        ) : null}
        <StatusDot status={last.status === "failed" ? "failed" : "completed"} />
      </button>
      {showAttempts && activities.length > 1 ? (
        <div className="ml-6 flex flex-col gap-0.5 border-l border-border/40 pl-2.5">
          {activities.map((activity, index) => (
            <div
              className="flex items-center gap-2 text-[11px] text-muted-foreground"
              key={`${activity.stepId}-${activity.toolId}-${index}`}
            >
              <span className="tabular-nums">Tentative {index + 1}</span>
              {activity.errorCategory ? (
                <span className="rounded-full bg-muted px-1.5 text-[10px]">
                  {activity.errorCategory}
                </span>
              ) : null}
              {activity.durationMs ? (
                <span className="tabular-nums">
                  {formatDuration(activity.durationMs)}
                </span>
              ) : null}
              <StatusDot
                status={activity.status === "failed" ? "failed" : "completed"}
              />
            </div>
          ))}
          {first?.summary && last.summary !== first.summary ? (
            <p className="text-[10.5px] italic text-muted-foreground/70">
              Première tentative : {first.summary}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ArtifactDialog({
  artifact,
  onOpenChange,
  open,
}: {
  artifact: AgentArtifactRef | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!(open && artifact)) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setContent(null);
    fetch(apiEndpoints.document(artifact.documentId))
      .then((response) => (response.ok ? response.json() : null))
      .then((documents: { content?: string }[] | null) => {
        if (!cancelled) {
          setContent(documents?.at(-1)?.content ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContent(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [artifact, open]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate">
            {artifact?.title ?? "Livrable"}
          </DialogTitle>
          <DialogDescription>
            Livrable produit par Agent et enregistré dans vos documents.
          </DialogDescription>
        </DialogHeader>
        {artifact ? (
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-border/50 bg-muted/30 p-3">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Chargement…</p>
            ) : content === null ? (
              <p className="text-xs text-muted-foreground">
                Contenu indisponible. Le livrable reste consultable depuis vos
                documents.
              </p>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed">
                {content}
              </pre>
            )}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          {artifact ? (
            <Button asChild size="sm" variant="outline">
              <a
                href={apiEndpoints.document(artifact.documentId)}
                rel="noreferrer"
                target="_blank"
              >
                <DownloadIcon className="size-3.5" />
                Télécharger
              </a>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgentRunTimeline({
  className,
  state,
}: {
  className?: string;
  state: AgentStreamState;
}) {
  const [openArtifact, setOpenArtifact] = useState<AgentArtifactRef | null>(
    null
  );

  // Un plan caché ne compte pas comme contenu : sinon la timeline s'afficherait
  // vide pour un run qui n'a produit ni étape, ni livrable, ni source.
  const plan = visiblePlan(state);
  const hasContent = hasTimelineContent({ ...state, plan });

  if (!hasContent) {
    return null;
  }

  // Regroupement des retries : activités du même outil sur le même step,
  // ordonnées par tentative. Chaque tentative reste une ligne persistée côté
  // serveur ; seul l'affichage est regroupé.
  const activitiesByStep = new Map<string, AgentToolActivity[]>();
  for (const activity of state.tools) {
    const key = `${activity.stepId}:${activity.toolId}`;
    const bucket = activitiesByStep.get(key);
    if (bucket) {
      bucket.push(activity);
    } else {
      activitiesByStep.set(key, [activity]);
    }
  }
  const renderedStepIds = new Set<string>();

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-border/40 bg-card/50 p-3",
        className
      )}
      data-testid="agent-run-timeline"
      id="agent-run-timeline"
    >
      {state.run ? <RunSummary run={state.run} /> : null}

      {plan ? (
        <div aria-live="polite" className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {plan.title}
          </p>
          <ol className="flex flex-col gap-1">
            {(plan.items ?? []).map((item) => (
              <li className="flex items-center gap-2 text-[13px]" key={item.id}>
                <StatusDot status={item.status} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "min-w-0 break-words",
                      item.status === "completed" &&
                        "text-muted-foreground line-through decoration-border",
                      item.status === "running" && "font-medium"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="text-[11px] leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {state.steps.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {state.steps.map((step) => {
            // Un step déjà couvert par un groupe de retries n'est pas rendu
            // seul : le groupe le remplace à la première occurrence.
            if (renderedStepIds.has(step.stepId)) {
              return null;
            }
            const activities = state.tools.filter(
              (tool) => tool.stepId === step.stepId
            );
            const retryGroup =
              activities.length > 0
                ? activitiesByStep.get(
                    `${step.stepId}:${activities.at(-1)?.toolId}`
                  )
                : undefined;
            if (retryGroup && retryGroup.length > 1) {
              for (const activity of retryGroup) {
                renderedStepIds.add(activity.stepId);
              }
              return (
                <ToolRetryGroup
                  activities={retryGroup}
                  key={`retry-${step.stepId}`}
                  stepId={step.stepId}
                />
              );
            }
            const activity = activities.at(-1);
            const category: ToolCategory | undefined = activity?.category;
            // `step.type` vient de la base, où la colonne n'est qu'un varchar
            // sans CHECK : une valeur hors énumération rendrait `Icon` undefined
            // et React lèverait « Element type is invalid » au premier rendu de
            // l'historique. Le repli final est donc obligatoire.
            const Icon =
              (category ? CATEGORY_ICONS[category] : undefined) ??
              STEP_ICONS[step.type] ??
              CircleIcon;
            return (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg px-1.5 py-1"
                data-testid={`agent-step-${step.stepId}`}
                id={`agent-step-${step.stepId}`}
                initial={{ opacity: 0, y: 4 }}
                key={step.stepId}
                transition={{ duration: 0.2 }}
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 break-words text-[13px] font-medium">
                      {step.title}
                    </span>
                    {category ? (
                      <span className="shrink-0 rounded-full border border-border/40 px-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {CATEGORY_LABELS[category] ?? category}
                      </span>
                    ) : null}
                    {activity?.attempt && activity.attempt > 1 ? (
                      <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        Tentative {activity.attempt}
                      </span>
                    ) : null}
                  </span>
                  {step.summary ? (
                    <span className="truncate text-[11.5px] text-muted-foreground">
                      {step.summary}
                    </span>
                  ) : null}
                </span>
                {activity?.durationMs ? (
                  <span className="shrink-0 pt-0.5 text-[10.5px] tabular-nums text-muted-foreground/70">
                    {formatDuration(activity.durationMs)}
                  </span>
                ) : null}
                <StatusDot status={step.status} />
              </motion.div>
            );
          })}
        </div>
      ) : null}

      {state.artifacts.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Livrables
          </p>
          <div className="flex flex-wrap gap-2">
            {state.artifacts.map((artifact) => (
              <button
                className="flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2 text-xs font-medium transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2"
                data-testid={`agent-artifact-${artifact.documentId}`}
                key={artifact.documentId}
                onClick={() => setOpenArtifact(artifact)}
                type="button"
              >
                <FileTextIcon className="size-3.5 text-muted-foreground" />
                <span className="max-w-[min(22rem,70vw)] truncate">
                  {artifact.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {state.sources.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <GlobeIcon className="size-3" />
            Sources utilisées
          </p>
          <ul className="flex flex-col gap-1">
            {state.sources.slice(0, 12).map((source) => (
              <li
                className="flex items-center gap-2 text-[12px]"
                key={source.id}
              >
                <HelpCircleIcon className="size-3 shrink-0 text-muted-foreground/60" />
                {source.url ? (
                  <a
                    className="min-w-0 truncate underline decoration-border underline-offset-2 hover:text-foreground"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.title}
                  </a>
                ) : (
                  <span className="truncate">{source.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ArtifactDialog
        artifact={openArtifact}
        onOpenChange={(open) => {
          if (!open) {
            setOpenArtifact(null);
          }
        }}
        open={Boolean(openArtifact)}
      />
    </div>
  );
}
