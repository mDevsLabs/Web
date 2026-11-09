import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { fetchUserModels } from "@/lib/ai/models.server";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelCapabilitiesFor } from "@/lib/ai/registry";
import { resolveReasoningEffort } from "@/lib/ai/registry/capabilities";
import { resolveReasoningProviderOptions } from "@/lib/ai/registry/reasoning";
import { isModelAllowedForTier } from "@/lib/ai/registry/tiers";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getMaiSessionToken } from "@/lib/auth/session";
import { enforceChatRateLimit, weeklyQuotaExceeded } from "@/lib/chat/auth";
import { buildMemoryContext, joinMemoryBlocks } from "@/lib/chat/memory";
import { getUserPreferences } from "@/lib/db/queries/users";
import { ChatbotError } from "@/lib/errors";
import {
  assemblerTentatives,
  blocsCompteCoach,
  COACH_INTENTS,
  COACH_MESSAGE_MAX,
  messagesPourModele,
  messageVisibleCoach,
  preparerEchangeCoach,
  promptCoachAvecCompte,
  resoudreModeleCoach,
  texteSuivi,
  vuesErreurs,
} from "@/lib/quizzly/coach";
import { ENTETE_CONVERSATION_COACH } from "@/lib/quizzly/coach-paths";
import {
  enregistrerReponseCoach,
  messageEchecFil,
  ouvrirConversationCoach,
  poursuivreConversationCoach,
} from "@/lib/quizzly/coach-store";
import { origineConfiance } from "@/lib/quizzly/http";
import { obtenirIndex } from "@/lib/quizzly/load";
import { libelleAnnee, PROGRAM } from "@/lib/quizzly/program";
import { libelleLigue } from "@/lib/quizzly/leagues";
import { chargerCoach } from "@/lib/quizzly/queries";
import { enregistrerUsageCoach } from "@/lib/quizzly/usage";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

const corpsSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    intent: z.enum(COACH_INTENTS).optional(),
    questionId: z.string().max(8).optional(),
    quizId: z.string().max(160).optional(),
    sheetId: z.string().max(160).optional(),
    sheetTitle: z.string().max(160).optional(),
    text: z.string().max(COACH_MESSAGE_MAX).optional(),
  })
  .strict();

async function contexteDuCompte(
  userId: string,
  sheetInfo?: { sheetId?: string; sheetTitle?: string }
) {
  const charge = await chargerCoach(userId);
  const index = await obtenirIndex();
  const tentatives = assemblerTentatives(charge.tentatives, (quizId) => {
    const quiz = index.quizzes.get(quizId);
    if (!quiz) {
      return null;
    }
    return {
      chapterTitle: quiz.chapterTitle,
      quizTitle: quiz.title,
      subjectLabel: quiz.subjectLabel,
    };
  });
  const matieresLabels =
    PROGRAM[charge.schoolYear]
      ?.filter((m) => charge.subjects.length === 0 || charge.subjects.includes(m.id))
      ?.map((m) => m.label) ?? [];

  return {
    charge,
    contexte: {
      leagueLabel: libelleLigue(charge.league),
      niveau: charge.niveau,
      passedCount: charge.passedCount,
      sheetContext: sheetInfo?.sheetTitle
        ? {
            id: sheetInfo.sheetId ?? "",
            title: sheetInfo.sheetTitle,
          }
        : undefined,
      streakCount: charge.streakCount,
      subjectsLabels: matieresLabels,
      tentatives,
      weeklyXp: charge.weeklyXp,
      xp: charge.xp,
      yearLabel: libelleAnnee(charge.schoolYear),
    },
  };
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const { charge, contexte } = await contexteDuCompte(session.userId);
    return Response.json(
      {
        misses: vuesErreurs(contexte.tentatives),
        modelId: charge.modelId,
        passedCount: contexte.passedCount,
        streakCount: contexte.streakCount,
        xp: contexte.xp,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/coach", error);
    return errorResponse("database_error");
  }
}

export async function POST(request: Request) {
  if (!origineConfiance(request)) {
    return errorResponse("access_denied", {
      message: "Origine de la requête non autorisée.",
    });
  }
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  if (weeklyQuotaExceeded(session.user)) {
    return errorResponse("quota_exceeded", {
      details: {
        limit: session.user.limit,
        resetAt: session.user.resetAt,
        used: session.user.tokensUsed,
      },
      message:
        "Votre limite hebdomadaire de tokens est atteinte. Consultez la page des forfaits mAI pour continuer.",
    });
  }
  try {
    await enforceChatRateLimit(request, session.userId);
    const body = await request.json().catch(() => null);
    const parsed = corpsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(parsed.error),
      });
    }
    const { charge, contexte } = await contexteDuCompte(session.userId);
    const tour = parsed.data.conversationId
      ? await (async () => {
          const suivi = texteSuivi(parsed.data.text);
          if (!suivi.ok) {
            return { message: suivi.message, ok: false as const };
          }
          return poursuivreConversationCoach({
            id: parsed.data.conversationId as string,
            text: suivi.text,
            userId: session.userId,
          });
        })()
      : await (async () => {
          const intent = parsed.data.intent ?? "chat";
          const visible = messageVisibleCoach({
            contexte,
            intent,
            questionId: parsed.data.questionId,
            quizId: parsed.data.quizId,
            text: parsed.data.text,
          });
          if (!visible.ok) {
            return { message: visible.message, ok: false as const };
          }
          return ouvrirConversationCoach({
            intent,
            questionId:
              intent === "explain" ? (parsed.data.questionId ?? null) : null,
            quizId: intent === "explain" ? (parsed.data.quizId ?? null) : null,
            text: visible.text,
            userId: session.userId,
          });
        })();
    if (!tour.ok) {
      return errorResponse("invalid_request", {
        message:
          "message" in tour
            ? tour.message
            : messageEchecFil(tour.code, "conversation"),
      });
    }
    let pret = preparerEchangeCoach({
      contexte,
      intent: tour.conversation.intent,
      questionId: tour.conversation.questionId ?? undefined,
      quizId: tour.conversation.quizId ?? undefined,
    });
    if (!pret.ok) {
      pret = preparerEchangeCoach({ contexte, intent: "chat" });
    }
    if (!pret.ok) {
      return errorResponse("invalid_request", {
        message: "Le coach n'a pas pu préparer cette demande.",
      });
    }
    const [catalogue, prefs, memoryContext] = await Promise.all([
      fetchUserModels().catch(() => []),
      getUserPreferences(session.userId).catch(() => null),
      buildMemoryContext({
        effectiveAgentId: null,
        effectiveProjectId: null,
        isGhostMode: false,
        tier: session.user.tier,
        userId: session.userId,
      }).catch(() => null),
    ]);
    const memoryString = memoryContext ? joinMemoryBlocks(memoryContext) : null;
    const personal = blocsCompteCoach({
      instructions: prefs?.customInstructions ?? null,
      instructionsEnabled: Boolean(prefs?.enabled),
      memory: memoryString,
    });
    const system = promptCoachAvecCompte(pret.system, personal);
    const modelId = resoudreModeleCoach({
      autorise: (id) => isModelAllowedForTier(id, session.user.tier),
      catalogueIds: catalogue.map((modele) => modele.id),
      fallback: DEFAULT_CHAT_MODEL,
      preferred: prefs?.defaultChatModel,
      stored: charge.modelId,
    });
    const capabilities = getModelCapabilitiesFor(
      modelId,
      catalogue.length > 0 ? catalogue : undefined
    );
    const effort = resolveReasoningEffort({
      capabilities,
      preferred: prefs?.reasoningLevel,
    });
    const providerOptions = effort.effort
      ? resolveReasoningProviderOptions(effort.effort)
      : undefined;
    const sessionToken = await getMaiSessionToken();
    const usageEventKey = generateUUID();
    const model = getLanguageModel(modelId, {
      sessionToken,
      userId: session.userId,
    });
    const conversationId = tour.conversation.id;
    const result = streamText({
      abortSignal: request.signal,
      instructions: `${system}\n\n${pret.faits}`,
      messages: messagesPourModele(tour.messages).map((message) => ({
        content: message.text,
        role: message.role,
      })),
      model,
      onEnd: async ({ text, totalUsage }) => {
        try {
          await enregistrerUsageCoach({
            model: modelId,
            sessionToken,
            usage: totalUsage,
            usageEventKey,
            userEmail: session.user.email,
            userId: session.userId,
          });
        } catch (error) {
          console.error("[quizzly][coach] décompte", error);
        }
        try {
          await enregistrerReponseCoach({
            conversationId,
            text,
            userId: session.userId,
          });
        } catch (error) {
          console.error("[quizzly][coach] enregistrement", error);
        }
      },
      ...(providerOptions ? { providerOptions } : {}),
    });
    return createTextStreamResponse({
      headers: {
        "Cache-Control": "private, no-store",
        [ENTETE_CONVERSATION_COACH]: conversationId,
      },
      stream: toTextStream({ stream: result.stream }),
    });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("POST /api/quizzly/coach", error);
    return errorResponse("database_error");
  }
}
