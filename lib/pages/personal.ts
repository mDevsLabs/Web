import "server-only";

import { buildMemoryContext, joinMemoryBlocks } from "@/lib/chat/memory";

/**
 * Mémoire du compte pour l'assistant de page. Le projet de la page, s'il
 * existe, ajoute ses souvenirs au même bloc que le Chat. Un échec de
 * lecture ne doit pas empêcher l'édition : buildMemoryContext dégrade
 * déjà en bloc vide.
 */
export async function memoryBlockForPage(params: {
  projectId: string | null;
  tier: string;
  userId: string;
}): Promise<string | null> {
  const ctx = await buildMemoryContext({
    effectiveAgentId: null,
    effectiveProjectId: params.projectId,
    isGhostMode: false,
    tier: params.tier,
    userId: params.userId,
  });
  return joinMemoryBlocks(ctx);
}
