import { memoryLimitForTier } from "@/lib/auth/plan";
import {
  countMemories,
  getGhostMemoryEnabled,
  getProjectMemories,
  getUserScopeMemoriesForChat,
} from "@/lib/db/queries";

export type MemoryContext = {
  memoryActive: boolean;
  ghostMemoryEnabled: boolean;
  memoryLimit: number;
  memoryAllowAdd: boolean;
  userMemoryBlock: string;
  projectMemoryBlock: string;
};

export async function buildMemoryContext(params: {
  isGhostMode: boolean;
  userId: string;
  effectiveAgentId: string | null;
  effectiveProjectId: string | null | undefined;
  tier: string;
}): Promise<MemoryContext> {
  const { isGhostMode, userId, effectiveAgentId, effectiveProjectId, tier } =
    params;

  // Mémoire personnalisée (globale ou spécifique agent + projet)
  // Désactivée en mode fantôme sauf si la préférence utilisateur "mémoire fantôme" est active
  let ghostMemoryEnabled = false;
  if (isGhostMode) {
    try {
      ghostMemoryEnabled = await getGhostMemoryEnabled(userId);
    } catch {}
  }
  const memoryActive = !isGhostMode || ghostMemoryEnabled;
  const memoryLimit = memoryLimitForTier(tier);
  // Même portée que celle où l'outil écrit (agent sinon globale) : une seule
  // requête ici, réutilisée à l'enregistrement du tool.
  // Dégradation gracieuse : un échec de comptage (drift de schéma, base
  // momentanément indisponible) ne doit jamais faire échouer la requête de
  // chat entière — on laisse passer l'ajout mémoire plutôt que de bloquer
  // l'utilisateur (memoryAllowAdd devient true en dernier recours).
  let memoryAllowAdd = false;
  if (memoryActive) {
    try {
      memoryAllowAdd =
        (await countMemories({
          agentId: effectiveAgentId ?? null,
          userId,
        })) < memoryLimit;
    } catch (error) {
      console.warn(
        "[memory] countMemories indisponible, ajout mémoire autorisé par défaut :",
        error instanceof Error ? error.message : error
      );
      memoryAllowAdd = true;
    }
  }

  let userMemoryBlock = "";
  let projectMemoryBlock = "";
  if (memoryActive) {
    try {
      const { memories } = await getUserScopeMemoriesForChat({
        agentId: effectiveAgentId,
        userId,
      });
      if (memories.length > 0) {
        const lines = memories
          .map((m, i) => `${i + 1}. ${m.content.replace(/\s+/g, " ").trim()}`)
          .join("\n")
          .slice(0, 6000);
        userMemoryBlock = `MÉMOIRE — Informations retenues sur l'utilisateur :\n${lines}\nUtilise ces informations pour personnaliser tes réponses sans les répéter verbatim.`;
      }
      if (effectiveProjectId) {
        const projectMemories = await getProjectMemories({
          projectId: effectiveProjectId,
          userId,
        });
        if (projectMemories.length > 0) {
          const lines = projectMemories
            .map((m, i) => `${i + 1}. ${m.content.replace(/\s+/g, " ").trim()}`)
            .join("\n")
            .slice(0, 6000);
          projectMemoryBlock = `MÉMOIRE DU PROJET — Informations retenues sur ce projet :\n${lines}`;
        }
      }
    } catch {}
  }

  return {
    ghostMemoryEnabled,
    memoryActive,
    memoryAllowAdd,
    memoryLimit,
    projectMemoryBlock,
    userMemoryBlock,
  };
}
