import "server-only";

import { generateText } from "ai";
import { recordAgentUsage } from "@/lib/agent/accounting";
import type { AgentPlan, AgentStepStatus } from "@/lib/agent/types";
import { getUtilityModel } from "@/lib/ai/providers";

// Plan de tâche : synthèse opérationnelle (« 1. Lire les documents, 2. Extraire
// les informations… »), jamais le raisonnement privé du modèle. Généré par un
// appel court uniquement pour les tâches qui le justifient ; en cas d'échec ou
// de réponse illisible, le run continue simplement sans plan.

const PLAN_TIMEOUT_MS = 10_000;
const MAX_PLAN_ITEMS = 6;
const MIN_TASK_LENGTH_FOR_PLAN = 180;

export function shouldGeneratePlan(params: {
  familyCount: number;
  task: string;
}): boolean {
  if (params.task.trim().length >= MIN_TASK_LENGTH_FOR_PLAN) {
    return true;
  }
  return params.familyCount >= 3;
}

export async function generateTaskPlan(params: {
  families: string[];
  sessionToken: string;
  task: string;
  userId: string;
}): Promise<AgentPlan | null> {
  const instructions = [
    "Tu prépares un plan d'action court et opérationnel pour une tâche.",
    'Réponds uniquement en JSON : {"title": string, "items": string[]}.',
    "Chaque item commence par un verbe à l'infinitif et fait moins de 60 caractères.",
    `Entre 3 et ${MAX_PLAN_ITEMS} items. Pas de numérotation, pas de texte autour.`,
    "Le plan décrit des actions concrètes, jamais un raisonnement interne.",
    `Familles d'outils disponibles : ${params.families.join(", ") || "aucune"}.`,
  ].join("\n");

  try {
    const result = await generateText({
      abortSignal: AbortSignal.timeout(PLAN_TIMEOUT_MS),
      instructions,
      model: await getUtilityModel({
        sessionToken: params.sessionToken,
        userId: params.userId,
      }),
      prompt: params.task.slice(0, 4000),
    });
    await recordAgentUsage({
      model: "agent-plan",
      sessionToken: params.sessionToken,
      usage: result.usage,
      userEmail: "",
      userId: params.userId,
    }).catch(() => null);

    return parsePlan(result.text);
  } catch {
    return null;
  }
}

export function parsePlan(raw: string): AgentPlan | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const record = parsed as { items?: unknown; title?: unknown };
    const rawItems = Array.isArray(record.items) ? record.items : [];
    const items = rawItems
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, MAX_PLAN_ITEMS)
      .map((label, index) => ({
        id: `plan-${index + 1}`,
        label: label.slice(0, 80),
        status: "pending" as AgentStepStatus,
      }));

    if (items.length < 2) {
      return null;
    }

    return {
      items,
      title:
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim().slice(0, 120)
          : "Plan",
    };
  } catch {
    return null;
  }
}

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

export function planToInstructions(plan: AgentPlan): string {
  return [
    `Plan de travail validé pour cette tâche (« ${plan.title} ») :`,
    ...plan.items.map(
      (item, index) =>
        `${index + 1}. ${item.label}${
          item.description ? ` — ${item.description}` : ""
        }`
    ),
    "Suis ce plan, ajuste-le si les résultats l'exigent, et indique brièvement où tu en es.",
  ].join("\n");
}
