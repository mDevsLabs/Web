import type { AgentRunStatus } from "@/lib/agent/types";
import {
  TECHNICAL_TIMEOUTS_MS,
  tierRunLimit,
} from "@/lib/plans/tier-capabilities";

// Limites de durée des runs : la limite PRODUIT dépend du forfait (Plus 1 h,
// Pro 3 h, Max illimité) et s'applique au temps d'activité cumulé du run —
// pas au temps de latence entre les ticks qui l'avancent. Elle utilise une
// horloge injectable pour rester testable et indépendante de l'hébergement.
// Les timeouts TECHNIQUES (modèle, outil, réseau) restent courts et identiques
// pour tous les forfaits.

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

export type DurationLimitDecision = {
  exceeded: boolean;
  limitMs: number | null;
  remainingMs: number | null;
};

export function evaluateDurationLimit(params: {
  checkpoint: DurationCheckpoint;
  clock?: AgentRunClock;
  tier: string | null | undefined;
}): DurationLimitDecision {
  const { limitMs } = tierRunLimit(params.tier);
  if (limitMs === null) {
    return { exceeded: false, limitMs: null, remainingMs: null };
  }
  const now = (params.clock ?? systemClock()).now();
  const currentSlice =
    params.checkpoint.activeSince === null
      ? 0
      : Math.max(0, now - params.checkpoint.activeSince);
  const activeMs = params.checkpoint.activeMs + currentSlice;
  return {
    exceeded: activeMs >= limitMs,
    limitMs,
    remainingMs: Math.max(0, limitMs - activeMs),
  };
}

// Statut persisté quand la limite produit est atteinte : les résultats,
// sources, artifacts et exécutions déjà terminés sont conservés et le travail
// reste consultable ; l'utilisateur peut reprendre dans un nouveau run.
export const TIMED_OUT_STATUS: AgentRunStatus = "timed_out";

export const TECHNICAL_LIMITS = TECHNICAL_TIMEOUTS_MS;
