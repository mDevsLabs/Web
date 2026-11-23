import { generateText, type LanguageModel } from "ai";

export const TITLE_FALLBACK_MODEL_ID = "mai-2.5-omni";

const FORBIDDEN_GENERIC_TITLES = new Set([
  "new conversation",
  "nouvelle discussion",
  "sans titre",
  "untitled",
]);

/**
 * Nettoie un titre renvoyé par un LLM (supprime les balises `<think>`,
 * guillemets, préfixes et titres génériques interdits).
 */
export function sanitizeGeneratedTitle(rawText: string): string | null {
  const withoutThinking = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, " ")
    .trim();

  const firstLine =
    withoutThinking
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  const cleaned = firstLine
    .replace(/^(?:titre|title)\s*:\s*/i, "")
    .replace(/^[#*"'«»\s-]+/, "")
    .replace(/["'«»#]+$/, "")
    .trim();

  if (!cleaned) {
    return null;
  }
  if (FORBIDDEN_GENERIC_TITLES.has(cleaned.toLowerCase())) {
    return null;
  }
  return cleaned.length > 60 ? cleaned.slice(0, 60).trim() : cleaned;
}

export function buildFallbackTitleFromUserText(userText: string): string {
  const trimmed = userText
    .replace(/^[#*"\s]+/, "")
    .slice(0, 60)
    .trim();
  return trimmed || "Nouvelle discussion";
}

/**
 * Génère un titre court avec le modèle actif de la conversation, puis tente un
 * repli sur `mai-2.5-omni` si le premier modèle échoue ou renvoie un résultat vide.
 */
export async function generateConversationTitleWithModel(params: {
  assistantText: string;
  generate?: typeof generateText;
  instructions: string;
  modelId?: string | null;
  resolveModel: (targetModelId: string) => LanguageModel;
  userText: string;
}): Promise<string> {
  const fallbackTitle = buildFallbackTitleFromUserText(params.userText);
  const runGenerate = params.generate ?? generateText;
  const combined = params.assistantText
    ? `Utilisateur: ${params.userText}\nAssistant (début): ${params.assistantText}`
    : params.userText;
  const prompt = combined.slice(0, 2000);

  const candidates: string[] = [];
  const primary = params.modelId?.trim();
  if (primary) {
    candidates.push(primary);
  }
  if (primary?.toLowerCase() !== TITLE_FALLBACK_MODEL_ID) {
    candidates.push(TITLE_FALLBACK_MODEL_ID);
  }

  for (const candidateModelId of candidates) {
    try {
      const { text } = await runGenerate({
        instructions: params.instructions,
        model: params.resolveModel(candidateModelId),
        prompt,
      });
      const sanitized = sanitizeGeneratedTitle(text);
      if (sanitized) {
        return sanitized;
      }
    } catch (error) {
      console.warn(
        `Échec génération titre avec le modèle ${candidateModelId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return fallbackTitle;
}
