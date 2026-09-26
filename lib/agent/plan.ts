import "server-only";

import type { AgentPlan, AgentStepStatus } from "@/lib/agent/types";

// Plan de tâche : produit par l'OUTIL `tasks`, jamais par le serveur.
//
// Il n'existe que si l'utilisateur a activé l'option « Tâches » du menu « + »
// (voir `optIn` dans lib/agent/tools/catalog.ts). Le modèle le rédige lui-même au
// premier tour, l'interface l'affiche, et ce module ne fait que le suivre.
//
// Il n'y a pas de générateur de plan côté serveur : un plan calculé en amont
// doublonnait l'outil, coûtait un appel modèle, et surtout existait même quand
// personne n'en voulait — le modèle annonçait alors un plan et s'arrêtait là.
//
// Ce plan est une synthèse opérationnelle (« 1. Lire les documents, 2. Extraire
// les informations… »), jamais le raisonnement privé du modèle.

// Le plan évolue pendant le run : un item correspondant au texte du step est
// marqué comme terminé, sans jamais réécrire l'historique déjà affiché.
export function applyPlanProgress(params: {
  plan: AgentPlan;
  status: AgentStepStatus;
  title: string;
}): AgentPlan {
  const normalizedTitle = params.title.trim().toLowerCase();
  if (!normalizedTitle) {
    return params.plan;
  }
  const items = params.plan.items.map((item) => {
    if (item.status !== "pending") {
      return item;
    }
    const normalizedLabel = item.label.toLowerCase();
    const matches =
      normalizedTitle.includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedTitle.slice(0, 24));
    return matches ? { ...item, status: params.status } : item;
  });

  return { ...params.plan, items };
}
