import "server-only";

import {
  ensureSettings,
  listCalls,
  listConversations,
  listMemories,
  listSpaces,
  listTasks,
  listWakies,
} from "@/lib/wakies/queries";
import { versClient } from "@/lib/wakies/serialize";
import { wakiesSetupStatus } from "@/lib/wakies/setup";
import type { State, WorkspaceState } from "@/lib/wakies/shared/types";

/**
 * Pré-chargement des données de départ côté serveur pour /wakies.
 * Permet d'éviter l'écran de chargement bloquant au premier montage.
 */
export async function getWakiesInitialData(
  userId: string
): Promise<{ state: State; workspace: WorkspaceState }> {
  const [
    settings,
    tasks,
    memories,
    setup,
    spaces,
    wakies,
    conversations,
    calls,
  ] = await Promise.all([
    ensureSettings(userId),
    listTasks(userId),
    listMemories(userId),
    wakiesSetupStatus(),
    listSpaces(userId),
    listWakies(userId),
    listConversations(userId),
    listCalls(userId),
  ]);

  const rawState = {
    configured: setup.missing.length === 0,
    memories,
    mode: "live" as const,
    settings,
    tasks,
  };

  const rawWorkspace = {
    calls,
    conversations,
    setup,
    spaces,
    wakies,
  };

  return {
    state: versClient(rawState) as unknown as State,
    workspace: versClient(rawWorkspace) as unknown as WorkspaceState,
  };
}
