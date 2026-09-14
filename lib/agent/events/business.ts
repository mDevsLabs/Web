import type {
  AgentPlan,
  AgentRunStatus,
  AgentStepStatus,
  AgentStepType,
  ToolCategory,
  ToolPermission,
} from "@/lib/agent/types";

// Événements métier Agent : les transitions importantes du domaine, dans une
// union discriminée sérialisable. Un dispatcher unique (emitBusinessEvent)
// les distribue aux consommateurs découplés — streaming (data parts),
// notifications, observabilité — sans couplage aux providers. La base reste la
// source de vérité ; ces événements reflètent des mutations déjà persistées
// (ou accompagnent la mutation dans la même unité de travail quand c'est
// critique, ex. approbations). Pas d'event sourcing : les tables AgentRun /
// AgentStep / ToolExecution suffisent.

export type AgentBusinessEvent =
  | { type: "run_started"; runId: string; model: string; chatId: string }
  | {
      type: "run_finished";
      runId: string;
      status: AgentRunStatus;
      chatId: string;
      error?: string;
    }
  | {
      type: "step_created";
      runId: string;
      stepId: string;
      stepType: AgentStepType;
      title: string;
    }
  | {
      type: "step_finished";
      runId: string;
      stepId: string;
      status: AgentStepStatus;
    }
  | {
      type: "tool_call_started";
      runId: string;
      stepId: string;
      toolExecutionId: string;
      toolId: string;
      category: ToolCategory;
      attempt: number;
    }
  | {
      type: "tool_call_finished";
      runId: string;
      stepId: string;
      toolExecutionId: string;
      toolId: string;
      success: boolean;
      durationMs: number;
    }
  | {
      type: "tool_retry_scheduled";
      runId: string;
      stepId: string;
      toolExecutionId: string;
      toolId: string;
      attempt: number;
      retryable: boolean;
      delayMs: number;
    }
  | {
      type: "approval_required";
      runId: string;
      approvalRequestId: string;
      toolId: string;
    }
  | { type: "waiting_for_user"; runId: string }
  | {
      type: "reorientation_applied";
      runId: string;
      instructionId: string;
      toolsRecomputed: boolean;
    }
  | {
      type: "duration_limit_reached";
      runId: string;
      limitKind: "tier" | "budget";
    };

// Un auditeur reçoit les événements sans les modifier. Retour synchrone :
// les consommateurs lents (email, push) gèrent eux-mêmes leur asynchronie
// en interne (fire-and-forget avec journalisation de leurs échecs).
export type AgentBusinessEventListener = (event: AgentBusinessEvent) => void;

const listeners = new Set<AgentBusinessEventListener>();

export function addAgentBusinessEventListener(
  listener: AgentBusinessEventListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearAgentBusinessEventListeners(): void {
  listeners.clear();
}

export function emitAgentBusinessEvent(event: AgentBusinessEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      // Un consommateur défaillant ne doit jamais interrompre le run.
      console.error("[agent] Échec d'un consommateur d'événement :", error);
    }
  }
}

// Contexte de plan et de permission réexporté pour les consommateurs qui
// veulent enrichir les notifications sans dépendre du runtime.
export type AgentBusinessPlan = AgentPlan;
export type AgentBusinessToolPermission = ToolPermission;
