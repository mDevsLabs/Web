import { repairChatToolCall } from "@/lib/chat/tool-call-repair";

// Pourquoi sans tool_choice : Flint ne prend pas ce paramètre en charge.
// Une liste d'outils vide fait omettre `tools` et `tool_choice` par le
// provider OpenAI-compatible. La dernière place du budget reste une synthèse
// textuelle ; si le plafond tombe encore sur un appel d'outil, une étape de
// plus est autorisée pour cette synthèse.

export const CHAT_MAX_STEPS = 12;

export const CHAT_FINAL_RESPONSE_INSTRUCTION =
  "ÉTAPE FINALE OBLIGATOIRE : n'appelle plus aucun outil. Réponds par un texte utile, même si le résultat est vide ou partiel.";

export const CHAT_FALLBACK_FINAL_RESPONSE =
  "La génération s'est terminée sans synthèse textuelle. Relancez la demande pour obtenir une réponse détaillée.";

const QUIZZLY_TOOL_NAME = "quizzly";

export type ChatLoopStep = {
  toolCalls?: ReadonlyArray<{ toolName?: string }>;
};

export function shouldForceChatSynthesis(
  stepCount: number,
  maxSteps = CHAT_MAX_STEPS
): boolean {
  return stepCount >= Math.max(0, maxSteps - 1);
}

export function chatEndedOnQuizzly(steps: readonly ChatLoopStep[]): boolean {
  return steps.some((step) =>
    step.toolCalls?.some((call) => call.toolName === QUIZZLY_TOOL_NAME)
  );
}

/**
 * Arrêt de la boucle Chat.
 *
 * Un quiz coupe tout de suite : le modèle ne doit pas commenter l'artefact.
 * Sinon, le plafond n'arrête pas une étape qui se termine sur un outil — une
 * synthèse peut encore partir. L'arrêt dur est l'étape d'après.
 */
export function shouldStopChatLoop(params: {
  maxSteps?: number;
  steps: readonly ChatLoopStep[];
}): boolean {
  if (chatEndedOnQuizzly(params.steps)) {
    return true;
  }

  const maxSteps = params.maxSteps ?? CHAT_MAX_STEPS;
  const stepCount = params.steps.length;
  const lastStepHasToolCalls =
    (params.steps.at(-1)?.toolCalls?.length ?? 0) > 0;

  if (stepCount > maxSteps) {
    return true;
  }
  if (stepCount >= maxSteps && !lastStepHasToolCalls) {
    return true;
  }
  return false;
}

export function composeChatSynthesisInstructions(base: string): string {
  return `${base}\n\n${CHAT_FINAL_RESPONSE_INSTRUCTION}`;
}

export function prepareChatStep(params: {
  instructions: string;
  steps: readonly ChatLoopStep[];
  supportsTools: boolean;
  maxSteps?: number;
}): { activeTools: []; instructions: string } | undefined {
  if (!params.supportsTools) {
    return undefined;
  }
  if (!shouldForceChatSynthesis(params.steps.length, params.maxSteps)) {
    return undefined;
  }
  return {
    activeTools: [],
    instructions: composeChatSynthesisInstructions(params.instructions),
  };
}

export function shouldWriteChatFallback(params: {
  endedOnQuizzly: boolean;
  text: string;
}): boolean {
  return params.text.trim().length === 0 && !params.endedOnQuizzly;
}

/**
 * Réglages de boucle partagés par `streamText` du Chat et `generateText` de
 * la planification. `maxSteps` vaut 12 pour le Chat ; la planification passe
 * son propre plafond. Aucun `toolChoice` : la synthèse retire les outils,
 * elle ne les interdit pas par un paramètre que Flint refuse.
 */
export function createChatStreamControls(params: {
  instructions: string;
  supportsTools: boolean;
  maxSteps?: number;
}) {
  return {
    prepareStep: ({ steps }: { steps: readonly ChatLoopStep[] }) =>
      prepareChatStep({
        instructions: params.instructions,
        maxSteps: params.maxSteps,
        steps,
        supportsTools: params.supportsTools,
      }),
    repairToolCall: repairChatToolCall,
    stopWhen: ({ steps }: { steps: readonly ChatLoopStep[] }) =>
      shouldStopChatLoop({ maxSteps: params.maxSteps, steps }),
  };
}
