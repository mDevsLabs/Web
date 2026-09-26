import type { ScheduleRule } from "@/lib/agent/contracts";
import type { DurationCheckpoint } from "@/lib/agent/limits";
import type { AgentRunStatus } from "@/lib/agent/types";
import type { NormalizedUsage } from "@/lib/agent/usage";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";

// Définitions de schéma des fondations Agent (tables et colonnes ajoutées par
// la migration 0017). Placées ici pour rester importables sans dépendre de
// lib/db/schema.ts (qui importe ce module pour ses types) : les définitions
// Drizzle vivent dans schema.ts, ce fichier documente les formes typées
// partagées et les contraintes applicatives.

// ---------------------------------------------------------------------------
// AgentSchedule — tâche planifiée Agent (règle en heure LOCALE + fuseau IANA)
// ---------------------------------------------------------------------------

export type AgentScheduleStatus = "active" | "paused" | "deleted";

export type AgentScheduleConfig = {
  // Catégories d'outils autorisées (null = réglages utilisateur).
  autonomy: "careful" | "high" | "standard";
  enabledCategories: string[] | null;
  // Les sept niveaux du fournisseur, pas un triplet : un run planifié peut
  // demander « max » si son modèle l'accepte.
  reasoningLevel: ReasoningLevel;
};

export type AgentScheduleRecord = {
  agentId: string | null;
  config: AgentScheduleConfig;
  createdAt: Date;
  // Suppression logique : les runs passés restent rattachables.
  deletedAt: Date | null;
  id: string;
  instructions: string;
  lastError: string | null;
  lastRunAt: Date | null;
  modelId: string;
  nextDueAt: Date;
  projectId: string | null;
  revision: number;
  rule: ScheduleRule;
  status: AgentScheduleStatus;
  timezone: string;
  title: string;
  updatedAt: Date;
  userId: string;
};

// ---------------------------------------------------------------------------
// AgentScheduleOccurrence — une exécution prévue, UNIQUE(scheduleId, dueAt)
// ---------------------------------------------------------------------------

export type AgentOccurrenceStatus =
  | "claimed"
  | "completed"
  | "failed"
  | "pending"
  | "running"
  | "waiting"
  | "skipped";

export type AgentOccurrenceRecord = {
  attempt: number;
  claimedAt: Date | null;
  claimedBy: string | null;
  // Lease anti-double-exécution entre workers concurrents ; expirée => repris.
  leaseUntil: Date | null;
  dueAt: Date;
  finishedAt: Date | null;
  id: string;
  runId: string | null;
  scheduleId: string;
  scheduleVersionId: string | null;
  status: AgentOccurrenceStatus;
};

export const OCCURRENCE_LEASE_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// ApprovalRequest — approbation persistante liée à un appel d'outil précis
// ---------------------------------------------------------------------------

export type ApprovalRequestStatus =
  | "approved"
  | "denied"
  | "expired"
  | "pending";

export type ApprovalRequestRecord = {
  createdAt: Date;
  decidedAt: Date | null;
  denyReason: string | null;
  expiresAt: Date;
  id: string;
  params: Record<string, unknown>;
  // SHA-256 canonique des paramètres : toute modification de paramètres
  // invalide l'approbation (hash différent => expired).
  paramsHash: string;
  runId: string;
  status: ApprovalRequestStatus;
  stepId: string | null;
  toolExecutionId: string | null;
  toolCallId: string | null;
  toolId: string;
};

export const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// AgentRunInstruction — réorientations ordonnées d'un run
// ---------------------------------------------------------------------------

export type AgentRunInstructionStatus = "applied" | "discarded" | "pending";

export type AgentRunInstructionRecord = {
  appliedAt: Date | null;
  appliedStepIndex: number | null;
  createdAt: Date;
  id: string;
  // Rang d'application : l'ordre des interventions est conservé.
  seq: number;
  stopRequested: boolean;
  text: string;
  runId: string;
  status: AgentRunInstructionStatus;
};

// ---------------------------------------------------------------------------
// Colonnes ajoutées aux tables existantes (voir migration 0017)
// ---------------------------------------------------------------------------

// AgentRun.checkpoint : reprise après crash / avancement par ticks.
export type AgentRunCheckpoint = {
  duration: DurationCheckpoint;
  instructionsPending: number;
  lastStepIndex: number;
  toolSelectionSignature: string | null;
};

// AgentRun.status : le statut timed_out s'ajoute aux statuts existants.
export const EXTENDED_RUN_STATUSES: readonly AgentRunStatus[] = [
  "queued",
  "running",
  "waiting_for_tool",
  "waiting_for_approval",
  "waiting_for_user",
  "completed",
  "failed",
  "cancelled",
  "timed_out",
];

// AgentRun.usage : structure normalisée (remplace progressivement l'agrégat
// libre AgentRunUsage ; l'historique reste lisible).
export type AgentRunUsageNormalized = AgentRunUsageShape & NormalizedUsage;

type AgentRunUsageShape = {
  durationMs?: number;
};

// ToolExecution : chaque tentative est une ligne, regroupée par step.
export type ToolExecutionAttemptFields = {
  attempt: number;
  errorCategory: string | null;
  parentExecutionId: string | null;
  retryAfterMs: number | null;
  retryable: boolean;
};

// Aide au calcul du hash canonique des paramètres d'approbation : clés triées,
// sérialisation stable. Implémentation côté serveur (crypto) dans les queries.
export function canonicalParamsKey(params: unknown): string {
  return JSON.stringify(params, (_key, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : 1
          )
        )
      : value
  );
}

export const SCHEDULE_SCHEMA_HINT =
  "Voir lib/db/migrations/0017_agent_foundation.sql";
