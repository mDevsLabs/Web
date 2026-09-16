import "server-only";

import {
  getChatsByUserId,
  getProjectById,
  getProjectFilesForInjection,
  getProjectMemories,
} from "@/lib/db/queries";
import { getModelCapabilities } from "@/lib/ai/models";
import { buildProjectFilesPromptBlock } from "@/lib/chat/project-files";
import { getProjectAccess } from "@/lib/projects/access";

// Contexte projet : Agent reçoit des informations ciblées, jamais le projet
// entier. Trois blocs seulement — instructions, mémoire liée au projet, et
// titres des dernières conversations du projet comme ressources consultables.
const MAX_MEMORIES = 12;
const MAX_RECENT_CHATS = 5;

export type AgentProjectContext = {
  instructions: string | null;
  memories: string[];
  recentChatTitles: string[];
  resourcesBlock: string | null;
};

export async function loadAgentProjectContext(params: {
  modelId?: string;
  projectId: string | null;
  userEmail: string;
  userId: string;
}): Promise<AgentProjectContext> {
  if (!params.projectId) {
    return {
      instructions: null,
      memories: [],
      recentChatTitles: [],
      resourcesBlock: null,
    };
  }

  const [project, memories, chatsResult] = await Promise.all([
    getProjectById({
      id: params.projectId,
      userEmail: params.userEmail,
      userId: params.userId,
    }).catch(() => null),
    getProjectMemories({
      includeDisabled: false,
      limit: MAX_MEMORIES,
      projectId: params.projectId,
      userId: params.userId,
    }).catch(() => []),
    getChatsByUserId({
      endingBefore: null,
      id: params.userId,
      includeArchived: false,
      limit: MAX_RECENT_CHATS,
      projectId: params.projectId,
      startingAfter: null,
      userEmail: params.userEmail,
    }).catch(() => ({ chats: [] })),
  ]);

  const instructions = project
    ? [
        project.name ? `Projet « ${project.name} ».` : null,
        project.customInstructions,
      ]
        .filter(Boolean)
        .join("\n")
    : null;

  const memoryLines = (memories ?? [])
    .filter((memory) => memory.isEnabled !== false)
    .map((memory) => `- ${memory.content}`)
    .slice(0, MAX_MEMORIES);

  const recentChatTitles = (chatsResult?.chats ?? [])
    .map((chat) => chat.title)
    .filter((title): title is string => Boolean(title));

  // Fichiers du projet partagé ou personnel : manifest + textes extraits sous
  // budget, filtrés par les capacités du modèle Agent (aucune image envoyée à
  // un modèle texte seul). Accès revalidé par la garde centralisée.
  let filesBlock: string | null = null;
  try {
    const access = await getProjectAccess({
      projectId: params.projectId,
      userEmail: params.userEmail,
      userId: params.userId,
    });
    if (access) {
      const files = await getProjectFilesForInjection({
        projectId: params.projectId,
      });
      filesBlock = buildProjectFilesPromptBlock({
        caps: getModelCapabilities(params.modelId ?? ""),
        files,
      });
    }
  } catch {}

  const resourcesBlock =
    recentChatTitles.length > 0
      ? [
          "Ressources récentes du projet (titres de conversations) :",
          ...recentChatTitles.map((title) => `- ${title}`),
          "Demande à l'utilisateur le contenu précis d'une ressource si tu en as besoin : ne l'invente pas.",
        ].join("\n")
      : null;

  const combinedResources = [filesBlock, resourcesBlock]
    .filter(Boolean)
    .join("\n\n");

  return {
    instructions: instructions || null,
    memories: memoryLines,
    recentChatTitles,
    resourcesBlock: combinedResources || null,
  };
}
