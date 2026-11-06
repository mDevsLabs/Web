// Libellé d'un outil MCP pour l'interface. Le nom envoyé au fournisseur
// est `mcp_<empreinte>_<slug>` : le premier segment n'est plus le serveur.
// Les anciens identifiants `mcp_<serveur>_<outil>` ne matchent pas et
// restent affichés par l'appelant.

const HASHED_MCP_TOOL_ID = /^mcp_[0-9a-f]{12,}_(.+)$/;

export function mcpHashedToolLabel(
  toolId: string
): { methodLabel: string; serverLabel: "MCP" } | null {
  const raw = toolId.replace(/^tool-/, "");
  const match = HASHED_MCP_TOOL_ID.exec(raw);
  const methodLabel = match?.[1];
  if (!methodLabel) {
    return null;
  }
  return { methodLabel, serverLabel: "MCP" };
}
