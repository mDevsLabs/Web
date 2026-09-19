"use client";

import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiEndpoints } from "@/lib/client/api-endpoints";

// Actions suggérées d'un run Agent : strictement pilotées par le registre
// serveur. Le composant reçoit des actions déjà validées (identifiant connu,
// payload conforme, outils compatibles) ; un clic envoie l'identifiant et le
// payload au serveur, qui revalide tout avant d'exécuter. Le frontend
// n'exécute jamais une commande libre du modèle.

export type SuggestedActionDisplay = {
  id: string;
  label: string;
  payload: Record<string, unknown>;
};

export function AgentSuggestedActions({
  actions,
  runId,
}: {
  actions: SuggestedActionDisplay[];
  runId: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  if (actions.length === 0) {
    return null;
  }

  const handleAction = async (action: SuggestedActionDisplay) => {
    if (busyId || doneIds.has(action.id)) {
      return;
    }
    setBusyId(action.id);
    try {
      const response = await fetch(
        apiEndpoints.agentRunSuggestedAction(runId),
        {
          body: JSON.stringify({
            actionId: action.id,
            payload: action.payload ?? {},
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );
      const data = (await response.json().catch(() => null)) as {
        link?: string;
        ok?: boolean;
      } | null;
      if (!response.ok || !data?.ok) {
        toast.error(
          "Cette action n'est plus disponible avec l'état actuel du run."
        );
        return;
      }
      setDoneIds((current) => new Set(current).add(action.id));
      toast.success("Action effectuée.");
      if (data.link) {
        window.open(data.link, "_blank", "noopener,noreferrer");
      }
    } catch {
      toast.error("Impossible d'effectuer cette action pour le moment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="flex flex-col gap-1.5"
      data-testid="agent-suggested-actions"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <SparklesIcon className="size-3" />
        Actions suggérées
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const isDone = doneIds.has(action.id);
          return (
            <button
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              data-testid={`agent-suggested-action-${action.id}`}
              disabled={busyId !== null || isDone}
              key={action.id}
              onClick={() => handleAction(action)}
              type="button"
            >
              {isDone ? "Effectuée" : action.label}
              {isDone ? null : <ArrowRightIcon className="size-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
