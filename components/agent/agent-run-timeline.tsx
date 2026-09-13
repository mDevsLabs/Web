"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  HammerIcon,
  HelpCircleIcon,
  Loader2Icon,
  PackageIcon,
  TriangleAlertIcon,
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
import type {
  AgentArtifactRef,
  AgentStepEvent,
  AgentStepType,
  ToolCategory,
} from "@/lib/agent/types";
import { cn } from "@/lib/utils";

// Timeline d'exécution : uniquement des actions, des outils, de la progression
// et des résultats utiles. Jamais de raisonnement privé du modèle — la boucle
// d'Agent est visible, sa pensée ne l'est pas.
const STEP_ICONS: Record<AgentStepType, typeof HammerIcon> = {
  artifact: PackageIcon,
  error: TriangleAlertIcon,
  message: CheckCircle2Icon,
  planning: CircleDashedIcon,
  tool_call: HammerIcon,
  tool_result: HammerIcon,
  verification: CheckCircle2Icon,
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
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/document?id=${artifact.documentId}`
    )
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
                href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/document?id=${artifact.documentId}`}
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

  const hasContent =
    Boolean(state.plan) ||
    state.steps.length > 0 ||
    state.artifacts.length > 0 ||
    state.sources.length > 0;

  if (!hasContent) {
    return null;
  }

  const toolByStepId = new Map(state.tools.map((tool) => [tool.stepId, tool]));

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-border/40 bg-card/50 p-3",
        className
      )}
      data-testid="agent-run-timeline"
    >
      {state.plan ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {state.plan.title}
          </p>
          <ol className="flex flex-col gap-1">
            {state.plan.items.map((item) => (
              <li className="flex items-center gap-2 text-[13px]" key={item.id}>
                <StatusDot status={item.status} />
                <span
                  className={cn(
                    item.status === "completed" &&
                      "text-muted-foreground line-through decoration-border",
                    item.status === "running" && "font-medium"
                  )}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {state.steps.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {state.steps.map((step) => {
            const tool = toolByStepId.get(step.stepId);
            const category: ToolCategory | undefined = tool?.category;
            const Icon = STEP_ICONS[step.type];
            return (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg px-1.5 py-1"
                initial={{ opacity: 0, y: 4 }}
                key={step.stepId}
                transition={{ duration: 0.2 }}
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium">
                      {step.title}
                    </span>
                    {category ? (
                      <span className="shrink-0 rounded-full border border-border/40 px-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {category}
                      </span>
                    ) : null}
                  </span>
                  {step.summary ? (
                    <span className="truncate text-[11.5px] text-muted-foreground">
                      {step.summary}
                    </span>
                  ) : null}
                </span>
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
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2 text-xs font-medium transition-colors hover:border-primary/40"
                key={artifact.documentId}
                onClick={() => setOpenArtifact(artifact)}
                type="button"
              >
                <FileTextIcon className="size-3.5 text-muted-foreground" />
                {artifact.title}
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
                    className="truncate underline decoration-border underline-offset-2 hover:text-foreground"
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
