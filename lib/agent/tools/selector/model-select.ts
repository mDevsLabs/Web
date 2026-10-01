import "server-only";

import { generateObject } from "ai";
import { recordAgentUsage } from "@/lib/agent/accounting";
import {
  type ToolSelectionOutput,
  toolSelectionOutputSchema,
} from "@/lib/agent/contracts";
import {
  AGENT_FAMILY_LABELS,
  type AgentToolFamily,
  isAgentToolFamily,
} from "@/lib/agent/tools/selector/families";
import { getUtilityModel } from "@/lib/ai/providers";

// Sélection d'outils par sortie structurée du modèle : le modèle exprime les
// familles nécessaires pour la tâche, en JSON validé par zod (generateObject).
// Aucune détection par mots-clés dans le chemin principal — les familles
// détectées par le modèle sont simplement intersectées avec les familles
// réellement disponibles (modèle, forfait, filtres utilisateur). Toute erreur,
// tout timeout ou toute sortie invalide retombe sur le fallback déterministe
// de rules.ts, qui reste sûr.

const SELECT_TIMEOUT_MS = 8000;
const MAX_FAMILIES = 4;

export type StructuredSelectionResult =
  | { kind: "ok"; families: AgentToolFamily[] }
  | { kind: "unavailable" };

export async function selectFamiliesWithModel(params: {
  availableFamilies: AgentToolFamily[];
  sessionToken: string;
  task: string;
  userId: string;
}): Promise<StructuredSelectionResult> {
  if (params.availableFamilies.length <= 1) {
    return { kind: "unavailable" };
  }

  try {
    const result = await generateObject({
      abortSignal: AbortSignal.timeout(SELECT_TIMEOUT_MS),
      model: await getUtilityModel({
        sessionToken: params.sessionToken,
        userId: params.userId,
      }),
      prompt: [
        "Tâche de l'utilisateur :",
        params.task.slice(0, 2000),
        "",
        "Familles d'outils disponibles :",
        ...params.availableFamilies.map(
          (family) => `- ${family} : ${AGENT_FAMILY_LABELS[family]}`
        ),
        "",
        "Renvoie les familles STRICTEMENT nécessaires pour accomplir cette tâche (au plus 2 si la tâche est simple, jamais toutes « par précaution »).",
        `Format attendu : {"families": ["<id>", ...]} avec au plus ${MAX_FAMILIES} identifiants pris dans la liste ci-dessus, et un champ "reasoning" optionnel d'une phrase.`,
      ].join("\n"),
      schema: toolSelectionOutputSchema,
      schemaName: "ToolSelection",
    });

    await recordAgentUsage({
      model: "agent-tool-selector",
      sessionToken: params.sessionToken,
      usage: result.usage,
      userEmail: "",
      userId: params.userId,
    }).catch(() => null);

    return parseStructuredSelection(result.object, params.availableFamilies);
  } catch {
    // Sortie invalide, timeout, modèle indisponible : fallback déterministe.
    return { kind: "unavailable" };
  }
}

// Validation défensive d'une sortie de sélection : filtrage sur les familles
// connues ET disponibles, borne maximale, déduplication. Une liste vide après
// filtrage équivaut à « indisponible » pour laisser le fallback décider.
export function parseStructuredSelection(
  raw: unknown,
  availableFamilies: AgentToolFamily[]
): StructuredSelectionResult {
  const parsed = toolSelectionOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return { kind: "unavailable" };
  }
  const families = parsed.data.families
    .map((value) => value.trim().toLowerCase())
    .filter((value) => isAgentToolFamily(value))
    .filter((family: AgentToolFamily) => availableFamilies.includes(family))
    .slice(0, MAX_FAMILIES);

  const unique = [...new Set(families)];
  return unique.length > 0
    ? { families: unique, kind: "ok" }
    : { kind: "unavailable" };
}
