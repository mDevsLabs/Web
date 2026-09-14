import { z } from "zod";
import { chatOwnerMatches } from "@/lib/agent/channel";
import {
  askUserQuestionSchema,
  userInputSubmissionSchema,
  validateUserInputAnswers,
} from "@/lib/agent/contracts";
import { paramsHashOf } from "@/lib/agent/params-hash";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { enforceChatRateLimit } from "@/lib/chat/auth";
import { createAgentStep, getAgentRunById } from "@/lib/db/agent-queries";
import {
  decideAgentUserInput,
  getAgentUserInputRequestById,
  listAgentUserInputsByRunId,
} from "@/lib/db/agent-user-input-queries";
import { getChatById } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

// Réponse à un questionnaire Agent. Le serveur est seul juge :
//  - la demande appartient au run ET à l'utilisateur authentifié ;
//  - le questionnaire affiché n'a pas changé (empreinte canonique) ;
//  - les réponses respectent le type, le caractère obligatoire et les choix ;
//  - l'écriture est atomique : deux soumissions concurrentes ne peuvent pas
//    aboutir, une question expirée ou périmée est refusée.
// La réponse est ensuite réinjectée dans le MÊME run (jamais une nouvelle
// conversation) : la reprise passe par POST /api/agent, où tous les contrôles
// d'accès, de forfait et de quota sont réappliqués.

const questionsSchema = z.array(askUserQuestionSchema);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  const run = await getAgentRunById({ id, userId });
  if (!run) {
    return errorResponse("not_found", { message: "Run introuvable." });
  }

  const requests = await listAgentUserInputsByRunId({ runId: run.id });
  return Response.json(
    {
      requests: requests.map((request) => ({
        answers: request.answers ?? null,
        context: request.context,
        expiresAt: request.expiresAt,
        id: request.id,
        questions: request.questions,
        revision: request.revision,
        status: request.status,
        title: request.title,
        toolCallId: request.toolCallId,
      })),
      runId: run.id,
      status: run.status,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await handlePost(request, params);
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error(
      "Erreur non gérée dans la réponse à une question Agent :",
      error
    );
    return errorResponse("internal_error", {
      message: "L'enregistrement de la réponse a échoué.",
    });
  }
}

async function handlePost(request: Request, params: Promise<{ id: string }>) {
  const { id } = await params;

  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;
  await enforceChatRateLimit(request, userId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_request", { message: "Requête invalide." });
  }

  const submission = userInputSubmissionSchema.safeParse(body);
  if (!submission.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(submission.error),
    });
  }

  const run = await getAgentRunById({ id, userId });
  if (!run) {
    return errorResponse("not_found", { message: "Run introuvable." });
  }

  // Propriété de la conversation : la réponse ne peut venir que du
  // propriétaire du run.
  const chat = await getChatById({ id: run.chatId });
  if (
    !chat ||
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: user.email,
      userId,
      username: user.username,
    })
  ) {
    return errorResponse("access_denied");
  }

  const userInput = await getAgentUserInputRequestById({
    id: submission.data.requestId,
  });
  if (!userInput || userInput.runId !== run.id) {
    return errorResponse("not_found", {
      message: "Cette question est introuvable pour ce run.",
    });
  }

  const questions = questionsSchema.safeParse(userInput.questions);
  if (!questions.success) {
    return errorResponse("invalid_request", {
      message: "Le questionnaire enregistré est illisible.",
    });
  }

  // Le questionnaire affiché est figé : toute modification après présentation
  // invalide la réponse au lieu d'être silencieusement acceptée.
  const questionsHash = paramsHashOf(questions.data);
  if (questionsHash !== userInput.questionsHash) {
    return errorResponse("invalid_request", {
      message:
        "Le questionnaire a changé depuis son affichage : rechargez la question avant de répondre.",
    });
  }

  const validation = validateUserInputAnswers({
    answers: submission.data.answers,
    questions: questions.data,
  });
  if (!validation.ok) {
    const messages: Record<string, string> = {
      duplicate_answer:
        "Une même question ne peut pas être répondue deux fois.",
      empty_answer: "Une réponse vide n'est pas acceptée ici.",
      invalid_type:
        "Le format de la réponse ne correspond pas au type attendu.",
      missing_required: "Une question obligatoire n'a pas de réponse.",
      not_allowed: "Cette réponse n'est pas autorisée pour cette question.",
      not_in_options: "Choisissez une valeur proposée.",
      out_of_range: "La valeur est hors des bornes autorisées.",
      too_long: "La réponse est trop longue.",
      unknown_question: "Question inconnue dans ce questionnaire.",
    };
    return errorResponse("invalid_request", {
      message: messages[validation.reason] ?? "Réponse invalide.",
    });
  }

  const decision = await decideAgentUserInput({
    answeredBy: userId,
    answers: validation.answers,
    expectedRevision: submission.data.revision,
    id: userInput.id,
    questionsHash,
  });

  if (!decision.ok) {
    if (decision.reason === "not_found") {
      return errorResponse("not_found", {
        message: "Cette question est introuvable pour ce run.",
      });
    }
    if (decision.reason === "expired") {
      return errorResponse("invalid_request", {
        message:
          "Cette question a expiré : Agent ne peut plus reprendre sur cette base. Relancez la tâche pour obtenir une nouvelle question.",
      });
    }
    return errorResponse("invalid_request", {
      message:
        decision.reason === "already_answered"
          ? "Une réponse a déjà été enregistrée pour cette question."
          : "La question a changé depuis son affichage : rechargez-la avant de répondre.",
    });
  }

  // Trace visible dans la timeline : la réponse reçue précède la reprise.
  await createAgentStep({
    index: run.stepCount,
    runId: run.id,
    status: "completed",
    summary: `${validation.answers.length} réponse${
      validation.answers.length > 1 ? "s" : ""
    } enregistrée${validation.answers.length > 1 ? "s" : ""}`,
    title: "Réponse reçue",
    type: "user_input_answer",
  }).catch(() => {});

  return Response.json(
    {
      ok: true,
      resume: { chatId: run.chatId, runId: run.id },
      status: "answered",
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
