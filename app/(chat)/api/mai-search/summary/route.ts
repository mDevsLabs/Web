import { streamText, tool } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { requireUser } from "@/lib/auth/require-user";
import { getMaiSessionToken } from "@/lib/auth/session";
import { updateSearchQuerySummary } from "@/lib/db/queries/search-history";
import { getUserPreferences } from "@/lib/db/queries/users";
import { executeMaiSearch } from "@/lib/search/you-client";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const searchId =
      typeof body.searchId === "string" ? body.searchId : undefined;
    const length =
      body.length === "short" || body.length === "long"
        ? body.length
        : "normal";
    const searchResults = Array.isArray(body.searchResults)
      ? body.searchResults
      : [];

    if (!query) {
      return new Response("Requête manquante", { status: 400 });
    }

    // Résolution de l'utilisateur et de son modèle par défaut. L'identité
    // vient du point canonique : `user.id` seul exclut les comptes dont
    // l'identifiant EST l'adresse.
    const session = await requireUser();
    let modelId = DEFAULT_CHAT_MODEL;

    if (session) {
      const prefs = await getUserPreferences(session.userId);
      if (prefs?.defaultChatModel) {
        modelId = prefs.defaultChatModel;
      }
    }

    const sessionToken = await getMaiSessionToken();
    const model = getLanguageModel(modelId, {
      sessionToken,
      userId: session?.userId,
    });

    // Formatage des résultats initiaux
    const formattedResults = searchResults
      .slice(0, 6)
      .map(
        (r: any, idx: number) =>
          `[Source ${idx + 1}] ${r.title}\nURL: ${r.url}\nExtrait: ${r.snippet}`
      )
      .join("\n\n");

    let lengthInstruction =
      "Rédige une synthèse équilibrée en 2 paragraphes clairs avec les points clés.";
    if (length === "short") {
      lengthInstruction =
        "Rédige un résumé très court et concis en 2 ou 3 puces directes. Pas de fioritures.";
    } else if (length === "long") {
      lengthInstruction =
        "Rédige une analyse détaillée et approfondie avec des sous-titres, du contexte, des explications riches et les points à retenir.";
    }

    const systemPrompt = `Tu es le moteur d'intelligence mAI Search.
Ton rôle est de fournir un résumé clair, objectif, sourcé et actualisé basé sur la recherche de l'utilisateur.
Langue : Français.
${lengthInstruction}
N'invente rien qui ne soit pas corroboré par les informations fournies.`;

    const userPrompt = `Recherche : "${query}"\n\nInformations trouvées :\n${formattedResults || "Aucune information préalable fournie."}\n\nRédige la synthèse de ces informations en français.`;

    const result = streamText({
      model,
      onFinish: async ({ text }) => {
        if (searchId && text && session) {
          await updateSearchQuerySummary(searchId, session.userId, text);
        }
      },
      prompt: userPrompt,
      system: systemPrompt,
    });

    const response = result.toTextStreamResponse();
    response.headers.set("X-Model-Id", modelId);
    return response;
  } catch (error: any) {
    console.error("[mAI-Search-Summary] Erreur:", error);
    return new Response(error.message || "Erreur de génération du résumé", {
      status: 500,
    });
  }
}
