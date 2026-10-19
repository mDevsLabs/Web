import { streamText } from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { webSearch } from "@/lib/ai/tools/web-search";
import { requireUser } from "@/lib/auth/require-user";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { recordTokenUsage } from "@/lib/db/queries/chats";
import { updateSearchQuerySummary } from "@/lib/db/queries/search-history";
import { getUserPreferences } from "@/lib/db/queries/users";
import {
  collectSummarySources,
  encodeSummaryEvent,
} from "@/lib/search/summary-stream";

export const maxDuration = 45;

export interface SummaryTarget {
  snippet?: string;
  source?: string;
  title: string;
  type: "web" | "news" | "image" | "video";
  url: string;
}

export type SummaryMessage = {
  content: string;
  role: "user" | "assistant" | "system";
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const searchId =
      typeof body.searchId === "string" ? body.searchId : undefined;
    const requestedModelId =
      typeof body.modelId === "string" && body.modelId.trim()
        ? body.modelId.trim()
        : undefined;
    const length =
      body.length === "short" || body.length === "long"
        ? body.length
        : "normal";
    const searchResults = Array.isArray(body.searchResults)
      ? body.searchResults
      : [];
    const target: SummaryTarget | undefined =
      body.target && typeof body.target === "object" ? body.target : undefined;
    const incomingMessages: SummaryMessage[] = Array.isArray(body.messages)
      ? body.messages
      : [];

    if (
      !query &&
      !target?.title &&
      !target?.url &&
      incomingMessages.length === 0
    ) {
      return new Response("Requête manquante", { status: 400 });
    }

    // Résolution de l'utilisateur et de son modèle
    const session = await requireUser();
    let modelId = requestedModelId || DEFAULT_CHAT_MODEL;

    if (!requestedModelId && session) {
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

    let lengthInstruction =
      "Rédige une synthèse équilibrée en 2 paragraphes clairs avec les points clés.";
    if (length === "short") {
      lengthInstruction =
        "Rédige un résumé très court et concis en 2 ou 3 puces directes. Pas de fioritures.";
    } else if (length === "long") {
      lengthInstruction =
        "Rédige une analyse détaillée et approfondie avec des sous-titres, du contexte, des explications riches et les points à retenir.";
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (target) {
      const typeLabel =
        target.type === "video"
          ? "la vidéo"
          : target.type === "image"
            ? "l'image et son contexte"
            : target.type === "news"
              ? "l'article d'actualité"
              : "le site web";

      systemPrompt = `Tu es mAI Search Assistant, l'intelligence artificielle conversationnelle d'exploration et d'analyse documentaire.
Tu accompagnes l'utilisateur au sujet de ${typeLabel} suivant :
- Titre : ${target.title}
- Type : ${target.type}
- Source : ${target.source || target.url}
- Adresse web : ${target.url}
${target.snippet ? `- Extrait / Contenu : ${target.snippet}` : ""}
${query ? `- Recherche d'origine : "${query}"` : ""}

Consignes de réponse et d'outils :
1. Langue : Français soigné, clair et professionnel.
2. Outil disponible : Tu disposes d'un unique outil externe : "webSearch" (recherche sur le web).
   - Utilise "webSearch" UNIQUEMENT si l'utilisateur demande des informations extérieures, des données d'actualité récente non mentionnées dans la ressource, ou une vérification factuelle approfondie.
   - N'utilise PAS "webSearch" si la question porte sur le contenu déjà résumé ou explicité dans la ressource ci-dessus.
3. Si tu utilises "webSearch", cite expressément les sources trouvées avec leurs liens cliquables en Markdown.
4. Structure toujours tes réponses avec élégance (titres, puces, emphase).`;

      userPrompt = `Élément à résumer :
Type : ${target.type}
Titre : ${target.title}
Source : ${target.source || target.url}
Adresse web : ${target.url}
${target.snippet ? `Contenu / Extrait : ${target.snippet}` : ""}
${query ? `Contexte de recherche initial : "${query}"` : ""}
${lengthInstruction}

Rédige un résumé complet, fluide et bien structuré de cette source en français.`;
    } else {
      // Synthèse générale des résultats de recherche
      const formattedResults = searchResults
        .slice(0, 8)
        .map(
          (r: any, idx: number) =>
            `[Source ${idx + 1}] ${r.title}\nURL: ${r.url}\nExtrait: ${r.snippet}`
        )
        .join("\n\n");

      systemPrompt = `Tu es le moteur d'intelligence mAI Search.
Ton rôle est de fournir un résumé clair, objectif, sourcé et actualisé basé sur la recherche de l'utilisateur.
Langue : Français.
${lengthInstruction}
Veille à aller jusqu'au bout de ton analyse et à formuler des phrases complètes et bien terminées.
Tu disposes de l'outil "webSearch" si tu as besoin de vérifier une donnée d'actualité critique. N'invente rien qui ne soit pas corroboré.`;

      userPrompt = `Recherche : "${query}"\n\nInformations trouvées :\n${formattedResults || "Aucune information préalable fournie."}\n\nRédige la synthèse complète de ces informations en français.`;
    }

    // Préparation des messages pour streamText
    const initialSources = collectSummarySources({
      initial: searchResults,
      target,
    });
    const streamOptions: any = {
      maxOutputTokens: 3000,
      model,
      onFinish: async ({ text, usage }: { text: string; usage: any }) => {
        // Décompte précis des tokens
        const inputTokens = usage?.inputTokens ?? usage?.promptTokens ?? 0;
        const outputTokens =
          usage?.outputTokens ?? usage?.completionTokens ?? 0;
        const reasoningTokens = usage?.reasoningTokens ?? 0;
        const totalTokens =
          usage?.totalTokens ?? inputTokens + outputTokens + reasoningTokens;

        // 1. Journalisation obligatoire dans l'endpoint API mAI /log-usage
        try {
          const logPayload = {
            inputTokens,
            isGhostMode: false,
            model: modelId,
            outputTokens,
            reasoningTokens,
            tokensUsed: totalTokens,
          };

          const logRes = await fetch(`${MAI_API_URL}/log-usage`, {
            body: JSON.stringify(logPayload),
            headers: {
              ...(sessionToken
                ? { Authorization: `Bearer ${sessionToken}` }
                : {}),
              "Content-Type": "application/json",
            },
            method: "POST",
          });

          if (!logRes.ok) {
            console.warn(
              "[mAI-Search-Summary] Notification /log-usage statut HTTP:",
              logRes.status
            );
          }
        } catch (logErr) {
          console.error(
            "[mAI-Search-Summary] Erreur lors de l'enregistrement dans /log-usage:",
            logErr
          );
        }

        // 2. Enregistrement local en base de données si utilisateur connecté
        if (session?.userId && totalTokens > 0) {
          try {
            await recordTokenUsage({
              chatMode: "chat",
              inputTokens,
              model: modelId,
              outputTokens,
              reasoningTokens,
              totalTokens,
              userEmail: session.user?.email,
              userId: session.userId,
            });
          } catch (dbErr) {
            console.warn(
              "[mAI-Search-Summary] Erreur d'enregistrement local du token usage:",
              dbErr
            );
          }
        }

        // 3. Mise à jour de l'historique pour le résumé global
        if (!target && searchId && text && session?.userId) {
          await updateSearchQuerySummary(searchId, session.userId, text);
        }
      },
      stopWhen: ({ steps }: any) => steps.length >= 4,
      system: systemPrompt,
      tools: {
        webSearch,
      },
    };

    if (incomingMessages.length > 0) {
      // Conversation de suivi multi-tours dans le tiroir latéral
      streamOptions.messages = incomingMessages;
    } else {
      // Premier tour : prompt de résumé
      streamOptions.prompt = userPrompt;
    }

    // Flux SSE : les sources précèdent le texte, puis un second événement
    // `sources` ajoute celles découvertes par les appels `webSearch` du tour.
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Parameters<typeof encodeSummaryEvent>[0]) => {
          try {
            controller.enqueue(encoder.encode(encodeSummaryEvent(event)));
          } catch {
            // Client parti : ne pas interrompre le comptage d'usage.
          }
        };
        send({ sources: initialSources, type: "sources" });
        const result = streamText(streamOptions);
        try {
          for await (const delta of result.textStream) {
            if (delta) {
              send({ delta, type: "text-delta" });
            }
          }
          const steps = await Promise.resolve(result.steps).catch(() => []);
          const finalSources = collectSummarySources({
            initial: searchResults,
            target,
            toolResults: steps.flatMap((step: any) => step.toolResults ?? []),
          });
          send({ sources: finalSources, type: "sources" });
          send({ type: "done" });
        } catch (streamError) {
          console.error("[mAI-Search-Summary] Erreur de flux:", streamError);
          send({
            message:
              streamError instanceof Error
                ? streamError.message
                : "Erreur de génération du résumé",
            type: "error",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Model-Id": modelId,
      },
    });
  } catch (error: any) {
    console.error("[mAI-Search-Summary] Erreur:", error);
    return new Response(error.message || "Erreur de génération du résumé", {
      status: 500,
    });
  }
}
