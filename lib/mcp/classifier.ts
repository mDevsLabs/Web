import type { McpActionType, McpApprovalPolicy } from "./types";

/**
 * Heuristique de détection du type d'action d'un outil MCP
 * (Lecture vs Écriture vs Suppression vs Exécution)
 */
export function classifyToolAction(
  toolName: string,
  description?: string
): McpActionType {
  const normalized = `${toolName} ${description ?? ""}`.toLowerCase();

  // 1. Suppression / Destructif
  if (
    /delete|remove|drop|destroy|purge|truncate|unlink|erase|cancel|revoke/.test(
      normalized
    )
  ) {
    return "delete";
  }

  // 2. Écriture / Modification / Création
  if (
    /create|write|update|insert|modify|patch|set|add|push|append|edit|post|save|send|publish/.test(
      normalized
    )
  ) {
    return "write";
  }

  // 3. Exécution de commande ou de script
  if (
    /execute|run|eval|exec|bash|shell|command|invoke|trigger/.test(normalized)
  ) {
    return "execute";
  }

  // 4. Lecture / Consultation
  if (
    /get|list|read|fetch|search|find|query|describe|inspect|view|show|check/.test(
      normalized
    )
  ) {
    return "read";
  }

  return "read";
}

/**
 * Détermine si un outil MCP nécessite l'approbation explicite de l'utilisateur
 * en fonction de la politique configurée pour le serveur.
 */
export function needsApproval(
  policy: McpApprovalPolicy,
  actionType: McpActionType
): boolean {
  switch (policy) {
    case "always_allow":
      return false;
    case "ask_permission":
      return true;
    case "write_only":
      return (
        actionType === "write" ||
        actionType === "delete" ||
        actionType === "execute"
      );
    default:
      return true;
  }
}
