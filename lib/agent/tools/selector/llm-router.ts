import "server-only";

import { generateText } from "ai";
import {
  AGENT_FAMILY_LABELS,
  type AgentToolFamily,
  isAgentToolFamily,
} from "@/lib/agent/tools/selector/families";
import { getUtilityModel } from "@/lib/ai/providers";

// Escalade volontairement minimale : un appel court à un petit modèle, qui ne
// choisit que des familles — jamais des outils précis — et ne décide de rien
// d'autre. Toute erreur, tout timeout ou toute réponse illisible retombe
// silencieusement sur la sélection déterministe.

const ROUTER_TIMEOUT_MS = 8000;
const MAX_FAMILIES = 4;

export async function routeFamiliesWithModel(params: {
  availableFamilies: AgentToolFamily[];
  sessionToken: string;
  task: string;
  userId: string;
}): Promise<AgentToolFamily[] | null> {
  if (params.availableFamilies.length <= 1) {
    return null;
  }

  const instructions = [
    "Tu choisis les familles d'outils nécessaires pour accomplir une tâche.",
    `Familles disponibles : ${params.availableFamilies
      .map((family) => `${family} (${AGENT_FAMILY_LABELS[family]})`)
      .join(", ")}.`,
    `Réponds uniquement par un tableau JSON de ${MAX_FAMILIES} identifiants maximum, sans texte autour.`,
    "Choisis le strict nécessaire : au plus 2 familles si la tâche est simple.",
    "N'inclus jamais une famille inutile.",
  ].join("\n");

  try {
    const { text } = await generateText({
      abortSignal: AbortSignal.timeout(ROUTER_TIMEOUT_MS),
      instructions,
      model: await getUtilityModel({
        sessionToken: params.sessionToken,
        userId: params.userId,
      }),
      prompt: params.task.slice(0, 2000),
    });

    return parseFamilies(text, params.availableFamilies);
  } catch {
    return null;
  }
}

export function parseFamilies(
  raw: string,
  availableFamilies: AgentToolFamily[]
): AgentToolFamily[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const families = parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim().toLowerCase())
      .filter(isAgentToolFamily)
      .filter((family) => availableFamilies.includes(family))
      .slice(0, MAX_FAMILIES);

    return families.length > 0 ? [...new Set(families)] : null;
  } catch {
    return null;
  }
}
