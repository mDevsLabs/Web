import type { AgentPlan } from "@/lib/agent/types";

// Visibilité de la liste de tâches — règle unique, partagée par la timeline et
// ses tests.
//
// Le plan n'est PAS la preuve que l'utilisateur a demandé la liste : il est
// généré automatiquement pour toute tâche longue ou à plusieurs familles d'outils
// (lib/agent/plan.ts) et injecté dans le prompt système pour cadrer le travail.
// L'interface, elle, ne montre des tâches que si l'option « Tâches » a été
// activée sur le run. La règle est donc extraite du composant pour être
// vérifiable : `tasksEnabled` est la seule source de vérité, et elle est
// persistée sur AgentRun pour survivre à un rechargement.

export type PlanVisibilityInput = {
  plan: AgentPlan | null;
  tasksEnabled: boolean;
};

/** Le plan réellement affichable, ou `null` si l'option n'a pas été activée. */
export function visiblePlan(input: PlanVisibilityInput): AgentPlan | null {
  return input.tasksEnabled ? input.plan : null;
}

export type TimelineContentInput = PlanVisibilityInput & {
  artifacts: readonly unknown[];
  run: unknown;
  sources: readonly unknown[];
  steps: readonly unknown[];
};

/**
 * La timeline a-t-elle quelque chose à montrer ? Un plan caché n'en compte pas :
 * sinon un run sans étape, sans livrable et sans source afficherait une carte
 * vide au lieu de l'accueil.
 */
export function hasTimelineContent(input: TimelineContentInput): boolean {
  return (
    Boolean(input.run) ||
    Boolean(visiblePlan(input)) ||
    input.steps.length > 0 ||
    input.artifacts.length > 0 ||
    input.sources.length > 0
  );
}
