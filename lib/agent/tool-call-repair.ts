import { InvalidToolInputError, NoSuchToolError } from "ai";

// Pourquoi une réparation locale : un petit modèle (Flint, par exemple)
// produit souvent un JSON d'arguments presque valide, ou invente un nom
// d'outil. Un second appel modèle pour corriger réintroduirait `tool_choice`
// ou un coût inutile. Un nom inconnu n'est jamais réécrit vers un outil réel :
// l'erreur repart au modèle, qui choisit. Le SDK ne rappelle cette fonction
// qu'une fois par appel.

type RepairableToolCall = {
  input: string;
  toolName: string;
};

/**
 * Répare un appel d'outil que le SDK n'a pas pu parser.
 *
 * - Nom inconnu (`sendEmail`) : `null`. Le SDK renvoie l'erreur au modèle.
 * - JSON illisible : une passe locale (parse, puis virgules finales). Si le
 *   texte redevient du JSON, il est renvoyé et le SDK revalide le schéma.
 *   Sinon `null`, et le modèle corrige lui-même.
 */
export async function repairAgentToolCall<
  TOOL_CALL extends RepairableToolCall,
>(options: {
  error: NoSuchToolError | InvalidToolInputError;
  toolCall: TOOL_CALL;
}): Promise<TOOL_CALL | null> {
  if (NoSuchToolError.isInstance(options.error)) {
    return null;
  }
  if (!InvalidToolInputError.isInstance(options.error)) {
    return null;
  }

  const repaired = repairToolInputJson(options.toolCall.input);
  if (repaired === null) {
    return null;
  }

  return { ...options.toolCall, input: repaired };
}

/**
 * Même réparation, refusée quand le budget du run est épuisé.
 *
 * Un JSON réparé lancerait l'outil. Si le temps, les étapes ou les appels
 * sont déjà consommés, on laisse l'erreur repartir au modèle.
 */
export async function repairAgentToolCallWithinBudget<
  TOOL_CALL extends RepairableToolCall,
>(options: {
  budgetExhausted: boolean;
  error: NoSuchToolError | InvalidToolInputError;
  toolCall: TOOL_CALL;
}): Promise<TOOL_CALL | null> {
  if (options.budgetExhausted) {
    return null;
  }
  return repairAgentToolCall(options);
}

/**
 * Rend un payload d'arguments parsable.
 *
 * Un JSON déjà valide n'est pas réécrit : l'échec vient alors du schéma, et
 * renvoyer le même texte ne ferait que masquer l'erreur utile au modèle.
 */
export function repairToolInputJson(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (parseJson(trimmed) !== undefined) {
    return null;
  }

  const withoutTrailingCommas = trimmed.replace(/,\s*([}\]])/g, "$1");
  if (withoutTrailingCommas === trimmed) {
    return null;
  }

  const parsed = parseJson(withoutTrailingCommas);
  if (parsed === undefined) {
    return null;
  }

  return JSON.stringify(parsed);
}

function parseJson(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
