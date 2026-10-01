import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import {
  type AgentPlanItem,
  type AgentStepStatus,
  toolSuccess,
} from "@/lib/agent/types";

// Outil « tasks » : quand l'option Tâches est activée, l'IA commence par
// structurer un plan réel — une liste de tâches concrètes — avant d'exécuter
// quoi que ce soit. La sortie est un contrat validé par zod ; le plan est
// diffusé par l'effet générique ToolOutcome.plan (persistance sur le run +
// événement timeline), sans aucune branche dédiée au nom de l'outil.

const TASK_TITLE_MAX = 80;
const TASK_DESCRIPTION_MAX = 600;
export const AGENT_TASKS_MIN = 2;
export const AGENT_TASKS_MAX = 8;

const taskItemSchema = z.object({
  description: z
    .string()
    .max(TASK_DESCRIPTION_MAX)
    .optional()
    .describe(
      "Précision courte sur la tâche : résultat attendu, critère de réussite."
    ),
  title: z
    .string()
    .min(3)
    .max(TASK_TITLE_MAX)
    .describe(
      "Intitulé de la tâche, commençant par un verbe à l'infinitif (ex : « Rechercher les sources récentes »)."
    ),
});

export const tasksToolInputSchema = z.object({
  tasks: z
    .array(taskItemSchema)
    .min(AGENT_TASKS_MIN)
    .max(AGENT_TASKS_MAX)
    .describe(
      `La liste ordonnée des tâches à accomplir, de ${AGENT_TASKS_MIN} à ${AGENT_TASKS_MAX} entrées.`
    ),
  title: z
    .string()
    .min(3)
    .max(120)
    .optional()
    .describe("Titre court du plan (défaut : « Plan de travail »)."),
});

export type TasksToolInput = z.infer<typeof tasksToolInputSchema>;

export function tasksToPlan(input: TasksToolInput): {
  items: AgentPlanItem[];
  title: string;
} {
  return {
    items: input.tasks.map((task, index) => ({
      ...(task.description?.trim()
        ? {
            description: task.description.trim().slice(0, TASK_DESCRIPTION_MAX),
          }
        : {}),
      id: `task-${index + 1}`,
      label: task.title.slice(0, TASK_TITLE_MAX),
      status: "pending" as AgentStepStatus,
    })),
    title: (input.title?.trim() || "Plan de travail").slice(0, 120),
  };
}

export const tasksTool = defineTool({
  ...requireAgentToolMetadata("tasks"),
  execute: (input) => {
    const plan = tasksToPlan(input);
    return toolSuccess(
      {
        // La sortie de l'outil est ce que le modèle lit IMMÉDIATEMENT après
        // l'appel. Sans cette consigne explicite, il annonçait le plan et
        // s'arrêtait : « le plan est prêt, les tâches restent en attente ».
        next: `Plan enregistré et affiché à l'utilisateur. Tu dois maintenant l'EXÉCUTER, pas le décrire : commence par « ${plan.items[0]?.label ?? "la première tâche"} » dès cette étape, appelle les outils utiles, puis passe à la suivante. Ne réponds pas par un résumé du plan.`,
        tasks: input.tasks,
        title: plan.title,
      },
      undefined,
      { plan }
    );
  },
  schema: tasksToolInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as { tasks?: unknown };
    const count = Array.isArray(value.tasks) ? value.tasks.length : 0;
    return count > 0
      ? `${count} tâche${count > 1 ? "s" : ""} planifiée${count > 1 ? "s" : ""}`
      : "Plan établi";
  },
});
