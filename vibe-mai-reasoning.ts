/**
 * Extraction de la réflexion des réponses OpenRouter côté Vibe.
 *
 * OpenRouter renvoie le raisonnement à trois endroits selon le modèle :
 * `message.reasoning` (chaîne), `message.reasoning_content` (compatibilité
 * DeepSeek) et `message.reasoning_details` (blocs structurés). Le chat Vibe ne
 * les lisait pas : la réflexion était perdue avant la persistance, alors que
 * l'interface sait déjà afficher des chips et du Markdown.
 *
 * Module pur, sans import Deno : il est testable avec Vitest et réutilisable
 * par le chat, la régénération et la flotte.
 */

const MAX_REASONING_CHARS = 64_000;

function readBlockText(block: unknown): string {
  if (!block || typeof block !== "object") {
    return "";
  }
  const record = block as Record<string, unknown>;
  return typeof record.text === "string"
    ? record.text
    : typeof record.content === "string"
      ? record.content
      : "";
}

/**
 * Concatène les blocs en évitant les doublons exacts. Certains fournisseurs
 * répètent le même bloc dans plusieurs snapshots ; sans cette déduplication,
 * un raisonnement de 2 000 caractères pourrait être stocké dix fois.
 */
function joinUnique(parts: string[]): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const part of parts) {
    const text = part.trim();
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    kept.push(text);
  }
  return kept.join("\n\n").trim();
}

export function extractMaiReasoning(message: unknown): string {
  if (!message || typeof message !== "object") {
    return "";
  }
  const record = message as Record<string, unknown>;
  const fromDetails = Array.isArray(record.reasoning_details)
    ? record.reasoning_details
        .map(readBlockText)
        .filter((text): text is string => Boolean(text))
    : [];
  const direct =
    typeof record.reasoning === "string"
      ? record.reasoning
      : typeof record.reasoning_content === "string"
        ? record.reasoning_content
        : "";
  const text = fromDetails.length > 0 ? joinUnique(fromDetails) : direct.trim();
  return text.slice(0, MAX_REASONING_CHARS);
}
