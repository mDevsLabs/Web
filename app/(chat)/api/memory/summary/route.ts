import { generateText } from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import {
  getAgentMemories,
  getGlobalMemories,
  getProjectMemories,
  getUserMemoriesWithScope,
} from "@/lib/db/queries";

export const maxDuration = 60;

export async function POST(request: Request) {
  const [sessionToken, maiUser] = await Promise.all([
    getMaiSessionToken(),
    getMaiUser(),
  ]);

  if (!sessionToken || !maiUser) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const userId = maiUser.id || maiUser.email;

  try {
    const json = await request.json().catch(() => ({}));
    const { agentId, projectId, scope, modelId } = json as {
      agentId?: string | null;
      projectId?: string | null;
      scope?: string;
      modelId?: string;
    };

    // Récupérer les mémoires selon le scope demandé
    let memories: Array<{ content: string; createdAt: Date | string }> = [];

    if (agentId) {
      memories = await getAgentMemories({ agentId, userId });
    } else if (projectId) {
      memories = await getProjectMemories({ projectId, userId });
    } else if (scope === "all") {
      memories = await getUserMemoriesWithScope({ userId });
    } else {
      memories = await getGlobalMemories({ userId });
    }

    if (!memories || memories.length === 0) {
      return Response.json({
        count: 0,
        summary: "Aucune information mémorisée pour le moment.",
      });
    }

    const memoryListText = memories
      .map((m, idx) => `${idx + 1}. ${m.content}`)
      .join("\n");

    const effectiveModel = modelId || DEFAULT_CHAT_MODEL;
    const model = getLanguageModel(effectiveModel);

    const prompt = `Voici l'ensemble des informations enregistrées dans la mémoire de l'utilisateur (${memories.length} entrées) :

${memoryListText}

Ta tâche est de produire une synthèse claire, structurée et élégante de la mémoire de cet utilisateur, organisée obligatoirement selon les 4 sections suivantes au format Markdown :

### 👤 1. Profil & Identité
(Nom, profession, contexte général, langue préférée, etc.)

### 🛠️ 2. Préférences Techniques & Outils
(Langages favoris, frameworks, conventions de code, outils et styles d'architecture)

### 🎯 3. Projets, Objectifs & Intérêts
(Projets en cours, thématiques récurrentes, buts à court et moyen terme)

### 📋 4. Directives, Contraintes & Habitudes
(Format de réponse souhaité, consignes strictes, habitudes de communication)

Rédige une synthèse fluide, concise et valorisante sans inventer d'information qui ne figure pas dans les données fournies.`;

    const result = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    return Response.json({
      count: memories.length,
      model: effectiveModel,
      summary: result.text,
    });
  } catch (error: any) {
    console.error("Erreur génération résumé de mémoire:", error);
    return Response.json(
      {
        error:
          error?.message ||
          "Erreur lors de la génération du résumé de la mémoire.",
      },
      { status: 500 }
    );
  }
}
