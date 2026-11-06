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
  /** Lignes brutes du bloc utilisateur, déjà bornées. Sert aux surfaces
   * qui ont leur propre enveloppe (Wakies) et ne doivent pas répéter
   * l'en-tête « MÉMOIRE ». */
  userMemoryLines: string[];
  projectMemoryBlock: string;
};

/** Texte unique des deux blocs, ou null s'il n'y a rien à injecter. */
export function joinMemoryBlocks(
  ctx: Pick<MemoryContext, "projectMemoryBlock" | "userMemoryBlock">
): string | null {
  const body = [ctx.userMemoryBlock, ctx.projectMemoryBlock]
    .filter((part) => part.trim().length > 0)
    .join("\n\n");
  return body || null;
}

/** Coupe au dernier souvenir entier qui tient dans le plafond. */
function lignesMemoire(contents: string[], plafond = 6000): string[] {
  const lignes: string[] = [];
  let taille = 0;
  for (const brut of contents) {
    const ligne = brut.replace(/\s+/g, " ").trim();
    if (!ligne) {
      continue;
    }
    const cout = (lignes.length > 0 ? 1 : 0) + ligne.length;
    if (taille + cout > plafond) {
      break;
    }
    lignes.push(ligne);
    taille += cout;
  }
  return lignes;
}

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
  let userMemoryLines: string[] = [];
  let projectMemoryBlock = "";
  if (memoryActive) {
    try {
      const { memories } = await getUserScopeMemoriesForChat({
        agentId: effectiveAgentId,
        userId,
      });
      userMemoryLines = lignesMemoire(memories.map((m) => m.content));
      if (userMemoryLines.length > 0) {
        const lines = userMemoryLines
          .map((content, index) => `${index + 1}. ${content}`)
          .join("\n");
        userMemoryBlock = `MÉMOIRE — Informations retenues sur l'utilisateur :\n${lines}\nUtilise ces informations pour personnaliser tes réponses sans les répéter verbatim.`;
      }
      if (effectiveProjectId) {
        const projectMemories = await getProjectMemories({
          projectId: effectiveProjectId,
          userId,
        });
        const projectLines = lignesMemoire(
          projectMemories.map((m) => m.content)
        );
        if (projectLines.length > 0) {
          const lines = projectLines
            .map((content, index) => `${index + 1}. ${content}`)
            .join("\n");
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
    userMemoryLines,
  };
}
