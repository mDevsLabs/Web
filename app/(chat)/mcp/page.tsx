import { redirect } from "next/navigation";

// La gestion des serveurs MCP vit désormais dans la page Outils (onglet MCP).
// La garde de forfait est appliquée côté page Outils et côté API `/api/mcp`.
export default function McpPage() {
  redirect("/tools?tab=mcp");
}
