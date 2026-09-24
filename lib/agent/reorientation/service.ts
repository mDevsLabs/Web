import "server-only";

import {
  type ReorientationInstruction,
  reorientationInstructionSchema,
} from "@/lib/agent/contracts";
import type { AgentRunInstructionRecord } from "@/lib/agent/db-schema";
import { emitAgentBusinessEvent } from "@/lib/agent/events/business";
import {
  enqueueRunInstruction,
  listPendingRunInstructions,
  markRunInstructionsApplied,
} from "@/lib/db/agent-foundation-queries";

// Réorientation d'un run en cours : toute intervention utilisateur pendant un
// run est interprétée par le modèle en une instruction structurée (contrat
// ReorientationInstruction), mise en file ORDONNÉE et appliquée au prochain
// point sûr. L'ordre des interventions multiples est conservé (seq) ; la
// protection contre les écritures concurrentes repose sur la révision
// optimiste du run (saveAgentRunCheckpoint) et l'attribution séquentielle des
// instructions. Les étapes déjà exécutées restent dans l'historique.

// File séquentielle : le seq est attribué à l'insertion (nombre d'instructions
// déjà en file + 1). En cas de collision concurrente, la contrainte de tri
// (seq, createdAt) garantit un ordre total déterministe.
export async function submitReorientation(params: {
  instruction: unknown;
  runId: string;
}): Promise<
  | { ok: true; instruction: AgentRunInstructionRecord }
  | { ok: false; reason: "invalid" | "run_not_active" }
> {
  const parsed = reorientationInstructionSchema.safeParse(params.instruction);
  if (!parsed.success) {
    return { ok: false, reason: "invalid" };
  }
  const instruction: ReorientationInstruction = parsed.data;

  const pending = await listPendingRunInstructions({ runId: params.runId });
  const seq =
    pending.length > 0
      ? (pending.at(-1)?.seq ?? 0) + 1
      : Math.floor(Date.now() / 1000) % 1_000_000_000;

  const row = await enqueueRunInstruction({
    runId: params.runId,
    seq,
    stopRequested: instruction.stopRequested,
    text: instruction.text,
  });

  return { instruction: row, ok: true };
}

export type AppliedReorientation = {
  instructions: AgentRunInstructionRecord[];
  stopRequested: boolean;
  text: string;
};

export async function acknowledgeReorientations(params: {
  appliedStepIndex: number;
  ids: string[];
  runId: string;
}): Promise<void> {
  if (params.ids.length === 0) return;
  await markRunInstructionsApplied({
    appliedStepIndex: params.appliedStepIndex,
    ids: params.ids,
  });
  emitAgentBusinessEvent({
    instructionId: params.ids[0]!,
    runId: params.runId,
    toolsRecomputed: true,
    type: "reorientation_applied",
  });
}

// Application au prochain point sûr : lit la file dans l'ordre sans la
// supprimer. L'accusé de réception intervient lorsque le runtime a réellement
// injecté la consigne dans l'étape suivante.
export async function takePendingReorientations(params: {
  appliedStepIndex: number;
  runId: string;
}): Promise<AppliedReorientation | null> {
  const pending = await listPendingRunInstructions({ runId: params.runId });
  if (pending.length === 0) {
    return null;
  }

  const stopRequested = pending.some(
    (instruction) => instruction.stopRequested
  );
  const text = pending.map((instruction) => instruction.text).join("\n");

  return { instructions: pending, stopRequested, text };
}
