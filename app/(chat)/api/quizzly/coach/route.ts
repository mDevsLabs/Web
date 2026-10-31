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
import { getUserPreferences } from "@/lib/db/queries/users";
import { ChatbotError } from "@/lib/errors";
import {
  assemblerTentatives,
  COACH_INTENTS,
  COACH_REPLY_MAX,
  COACH_SUIVI_MAX,
  preparerEchangeCoach,
  resoudreModeleCoach,
  validerSuivi,
  vuesErreurs,
} from "@/lib/quizzly/coach";
import { origineConfiance } from "@/lib/quizzly/http";
import { obtenirIndex } from "@/lib/quizzly/load";
import { libelleAnnee } from "@/lib/quizzly/program";
import { chargerCoach } from "@/lib/quizzly/queries";
import { enregistrerUsageCoach } from "@/lib/quizzly/usage";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

const messageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  text: z.string().max(COACH_REPLY_MAX),
});

const corpsSchema = z
  .object({
    intent: z.enum(COACH_INTENTS),
    messages: z.array(messageSchema).max(COACH_SUIVI_MAX).optional(),
    questionId: z.string().max(8).optional(),
    quizId: z.string().max(160).optional(),
  })
  .strict();

async function contexteDuCompte(userId: string) {
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
  return {
    charge,
    contexte: {
      passedCount: charge.passedCount,
      streakCount: charge.streakCount,
      tentatives,
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
    const suivi = validerSuivi(parsed.data.messages ?? []);
    if (!suivi.ok) {
      return errorResponse("invalid_request", { message: suivi.message });
    }
    const { charge, contexte } = await contexteDuCompte(session.userId);
    const pret = preparerEchangeCoach({
      contexte,
      intent: parsed.data.intent,
      questionId: parsed.data.questionId,
      quizId: parsed.data.quizId,
    });
    if (!pret.ok) {
      return errorResponse("invalid_request", {
        message:
          pret.code === "missing_error"
            ? "Choisis une erreur à expliquer."
            : "Cette question n'est pas une erreur de ta dernière tentative.",
      });
    }
    const [catalogue, prefs] = await Promise.all([
      fetchUserModels().catch(() => []),
      getUserPreferences(session.userId).catch(() => null),
    ]);
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
    const result = streamText({
      abortSignal: request.signal,
      instructions: pret.system,
      messages: [
        { content: pret.ouverture, role: "user" },
        ...suivi.messages.map((message) => ({
          content: message.text,
          role: message.role,
        })),
      ],
      model,
      onEnd: async ({ totalUsage }) => {
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
      },
      ...(providerOptions ? { providerOptions } : {}),
    });
    return createTextStreamResponse({
      headers: { "Cache-Control": "private, no-store" },
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
