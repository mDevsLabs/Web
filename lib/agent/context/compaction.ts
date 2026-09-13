import "server-only";

import { generateText, type ModelMessage } from "ai";
import { titleModel } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

// Budget de contexte et compaction. La compaction ne concerne QUE ce qui est
// envoyé au modèle : l'historique affiché à l'utilisateur n'est jamais modifié.

const CHARS_PER_TOKEN = 4;
// Part du contexte réservée à l'entrée : le reste couvre la sortie du modèle,
// les définitions d'outils et la marge de sécurité.
const INPUT_BUDGET_RATIO = 0.55;
const FALLBACK_CONTEXT_WINDOW = 64_000;
const MIN_MESSAGES_KEPT = 6;
const SUMMARY_TIMEOUT_MS = 12_000;

export function estimateTokens(params: {
  instructions: string;
  messages: ModelMessage[];
}): number {
  const messagesLength = params.messages.reduce((total, message) => {
    if (typeof message.content === "string") {
      return total + message.content.length;
    }
    return total + JSON.stringify(message.content ?? "").length;
  }, 0);
  return Math.ceil(
    (messagesLength + params.instructions.length) / CHARS_PER_TOKEN
  );
}

export function tokenBudgetFor(contextWindow: number | null): number {
  const window =
    contextWindow && contextWindow > 0
      ? contextWindow
      : FALLBACK_CONTEXT_WINDOW;
  return Math.floor(window * INPUT_BUDGET_RATIO);
}

export function messagesBeyondBudget(params: {
  contextWindow: number | null;
  instructions: string;
  messages: ModelMessage[];
}): boolean {
  return (
    estimateTokens({
      instructions: params.instructions,
      messages: params.messages,
    }) > tokenBudgetFor(params.contextWindow)
  );
}

// Repli déterministe : on conserve le dernier échange complet et l'objectif
// initial de l'utilisateur, sans dépendre d'un appel modèle.
export function trimToKeepRecent(params: {
  keepLast?: number;
  messages: ModelMessage[];
}): ModelMessage[] {
  const keepLast = params.keepLast ?? MIN_MESSAGES_KEPT;
  if (params.messages.length <= keepLast) {
    return params.messages;
  }
  const firstUser = params.messages.find((message) => message.role === "user");
  const recent = params.messages.slice(-keepLast);
  if (firstUser && !recent.includes(firstUser)) {
    return [firstUser, ...recent];
  }
  return recent;
}

export async function summarizeContext(params: {
  messages: ModelMessage[];
  sessionToken: string;
  task: string;
  userId: string;
}): Promise<string | null> {
  const transcript = params.messages
    .slice(0, Math.max(0, params.messages.length - MIN_MESSAGES_KEPT))
    .map((message) => {
      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content ?? "");
      return `${message.role}: ${content}`;
    })
    .join("\n")
    .slice(0, 24_000);

  if (!transcript.trim()) {
    return null;
  }

  const instructions = [
    "Tu compresses l'historique d'une tâche pour libérer du contexte, sans rien perdre d'utile.",
    "Conserve : l'objectif de l'utilisateur, les contraintes, les décisions prises, les faits et résultats d'outils importants, les identifiants et chemins utiles.",
    "Supprime : les politesses, les répétitions, les sorties d'outils obsolètes.",
    "Réponds par une synthèse factuelle en puces, 15 lignes maximum, sans commentaire méta.",
  ].join("\n");

  try {
    const { text } = await generateText({
      abortSignal: AbortSignal.timeout(SUMMARY_TIMEOUT_MS),
      instructions,
      model: getLanguageModel(titleModel.id, {
        sessionToken: params.sessionToken,
        userId: params.userId,
      }),
      prompt: `Objectif de la tâche : ${params.task.slice(0, 800)}\n\nHistorique à compacter :\n${transcript}`,
    });
    const summary = text.trim();
    return summary.length > 0 ? summary : null;
  } catch {
    return null;
  }
}

export function buildCompactedMessages(params: {
  messages: ModelMessage[];
  summary: string;
}): ModelMessage[] {
  const recent = params.messages.slice(-MIN_MESSAGES_KEPT);
  return [
    {
      content: `Synthèse des étapes précédentes (contexte conservé automatiquement) :\n${params.summary}`,
      role: "system",
    },
    ...recent,
  ];
}
