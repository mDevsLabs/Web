import type { AgentRunStatus } from "@/lib/agent/types";
import {
  TECHNICAL_TIMEOUTS_MS,
  type TierRunLimit,
  tierRunLimit,
} from "@/lib/plans/tier-capabilities";

// Limites de durée des runs : la limite PRODUIT dépend du forfait (Plus 1 h,
// Pro 3 h, Max aucune) et s'applique au temps d'ACTIVITÉ cumulé du run — pas au
// temps de latence entre les invocations qui l'avancent. Elle utilise une
// horloge injectable pour rester testable et indépendante de l'hébergement.
// Les timeouts TECHNIQUES (modèle, outil, réseau, invocation) restent courts et
// identiques pour tous les forfaits : ils sont définis une seule fois dans
// lib/plans/tier-capabilities.ts.

export type AgentRunClock = {
  now: () => number;
};

export function systemClock(): AgentRunClock {
  return { now: () => Date.now() };
}

// État de checkpoint de limite : ce qui est persisté dans AgentRun.checkpoint
// pour que la limite survive aux invocations successives d'un long run.
export type DurationCheckpoint = {
  // Temps d'ACTIVITÉ cumulé (ms) : les périodes d'attente utilisateur /
  // approbation ne comptent pas — seule la progression active épuise la limite.
  activeMs: number;
  // Début de la tranche d'activité en cours (horloge système).
  activeSince: number | null;
};

export function emptyDurationCheckpoint(): DurationCheckpoint {
  return { activeMs: 0, activeSince: null };
}

// ─────────────────────────────────────────────
// Transitions pures du checkpoint : testables sans base ni horloge réelle.
// ─────────────────────────────────────────────

// Ouvre une tranche d'activité si aucune n'est en cours (idempotent).
export function openActivity(
  checkpoint: DurationCheckpoint,
  clock: AgentRunClock = systemClock()
): DurationCheckpoint {
  if (checkpoint.activeSince !== null) {
    return checkpoint;
  }
  return { activeMs: checkpoint.activeMs, activeSince: clock.now() };
}

// Ferme la tranche en cours et cumule son temps (idempotent : sans tranche
// ouverte, le checkpoint est rendu inchangé).
export function closeActivity(
  checkpoint: DurationCheckpoint,
  clock: AgentRunClock = systemClock()
): DurationCheckpoint {
  if (checkpoint.activeSince === null) {
    return checkpoint;
  }
  const elapsed = Math.max(0, clock.now() - checkpoint.activeSince);
  return { activeMs: checkpoint.activeMs + elapsed, activeSince: null };
}

// Temps d'activité cumulé, tranche en cours incluse.
export function accumulatedActiveMs(
  checkpoint: DurationCheckpoint,
  clock: AgentRunClock = systemClock()
): number {
  const currentSlice =
    checkpoint.activeSince === null
      ? 0
      : Math.max(0, clock.now() - checkpoint.activeSince);
  return checkpoint.activeMs + currentSlice;
}

export type DurationLimitDecision = {
  exceeded: boolean;
  limitMs: number | null;
  remainingMs: number | null;
};

// Décision pour une limite explicite (produit), sur le temps d'activité
// cumulé. `limitMs === null` (Max) : jamais dépassée.
export function evaluateDurationLimitAgainst(params: {
  checkpoint: DurationCheckpoint;
  clock?: AgentRunClock;
  limitMs: number | null;
}): DurationLimitDecision {
  if (params.limitMs === null) {
    return { exceeded: false, limitMs: null, remainingMs: null };
  }
  const activeMs = accumulatedActiveMs(
    params.checkpoint,
    params.clock ?? systemClock()
  );
  return {
    exceeded: activeMs >= params.limitMs,
    limitMs: params.limitMs,
    remainingMs: Math.max(0, params.limitMs - activeMs),
  };
}

export function evaluateDurationLimit(params: {
  checkpoint: DurationCheckpoint;
  clock?: AgentRunClock;
  tier: string | null | undefined;
}): DurationLimitDecision {
  const limit: TierRunLimit = tierRunLimit(params.tier);
  return evaluateDurationLimitAgainst({
    checkpoint: params.checkpoint,
    ...(params.clock ? { clock: params.clock } : {}),
    limitMs: limit.limitMs,
  });
}

// Point de décision unique du runtime : faut-il s'arrêter au prochain point
// sûr ? La limite produit prime (elle est commerciale) ; le plafond technique
// d'invocation est traité séparément par le runtime (budget de l'invocation).
export type SafeStopDecision =
  | { reason: "product_limit"; remainingMs: number | null; stop: true }
  | { reason: null; remainingMs: number | null; stop: false };

export function shouldStopAtSafePoint(params: {
  checkpoint: DurationCheckpoint;
  clock?: AgentRunClock;
  productLimitMs: number | null | undefined;
}): SafeStopDecision {
  const decision = evaluateDurationLimitAgainst({
    checkpoint: params.checkpoint,
    ...(params.clock ? { clock: params.clock } : {}),
    limitMs: params.productLimitMs ?? null,
  });
  if (decision.exceeded) {
    return {
      reason: "product_limit",
      remainingMs: decision.remainingMs,
      stop: true,
    };
  }
  return { reason: null, remainingMs: decision.remainingMs, stop: false };
}

// Statut persisté quand la limite produit est atteinte : les résultats,
// sources, artifacts et exécutions déjà terminés sont conservés et le travail
// reste consultable ; l'utilisateur peut reprendre dans un nouveau run.
export const TIMED_OUT_STATUS: AgentRunStatus = "timed_out";

export const TECHNICAL_LIMITS = TECHNICAL_TIMEOUTS_MS;
