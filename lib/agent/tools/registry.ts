import "server-only";

import { AGENT_TOOL_CATALOG } from "@/lib/agent/tools/catalog";
import { toRegisteredTool } from "@/lib/agent/tools/define-tool";
import { askUserTool } from "@/lib/agent/tools/internal/ask-user";
import { createArtifactTool } from "@/lib/agent/tools/internal/create-artifact";
import { readFileTool } from "@/lib/agent/tools/internal/read-file";
import { searchWebTool } from "@/lib/agent/tools/internal/search-web";
import type { AgentTool, RegisteredAgentTool } from "@/lib/agent/types";

// Registre centralisé des outils Agent. Ajouter une capacité se limite à
// définir l'outil (defineTool) puis à l'enregistrer ici : le runtime, le
// sélecteur, la couche d'adaptation et l'interface d'activité le prennent en
// charge automatiquement.

const registry = new Map<string, RegisteredAgentTool>();
let builtinsRegistered = false;

export function registerAgentTool<Input>(tool: AgentTool<Input>): void {
  const registered = toRegisteredTool(tool);
  registry.set(registered.id, registered);
}

export function registerBuiltinAgentTools(): void {
  if (builtinsRegistered) {
    return;
  }
  builtinsRegistered = true;

  registerAgentTool(askUserTool);
  registerAgentTool(searchWebTool);
  registerAgentTool(readFileTool);
  registerAgentTool(createArtifactTool);
}

export function getRegisteredAgentTool(
  toolId: string
): RegisteredAgentTool | null {
  registerBuiltinAgentTools();
  return registry.get(toolId) ?? null;
}

export function listRegisteredAgentTools(): RegisteredAgentTool[] {
  registerBuiltinAgentTools();
  return [...registry.values()];
}

export function listRegisteredAgentToolIds(): string[] {
  return listRegisteredAgentTools().map((tool) => tool.id);
}

export function getRegisteredAgentTools(
  toolIds: string[]
): RegisteredAgentTool[] {
  return toolIds
    .map((toolId) => getRegisteredAgentTool(toolId))
    .filter((tool): tool is RegisteredAgentTool => tool !== null);
}

// Vérification de cohérence : chaque entrée du catalogue (métadonnées, source
// unique de l'interface) doit avoir une exécution enregistrée. Utilisée par les
// tests et en développement pour éviter toute dérive entre les deux.
export function findCatalogEntriesWithoutImplementation(): string[] {
  const registeredIds = new Set(listRegisteredAgentToolIds());
  return Object.keys(AGENT_TOOL_CATALOG).filter((id) => !registeredIds.has(id));
}
