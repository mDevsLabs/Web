import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { origineConfiance } from "@/lib/quizzly/http";
import { analyserIdentifiantQuiz, obtenirQuiz } from "@/lib/quizzly/load";
import { enregistrerSignalement } from "@/lib/quizzly/queries";

const corpsSchema = z
  .object({
    message: z.string().min(1).max(1000),
    questionId: z.string().regex(/^q(?:[1-9]|10)$/),
    quizId: z.string().min(1).max(160),
  })
  .strict();

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
  const body = await request.json().catch(() => null);
  const parsed = corpsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const message = parsed.data.message.trim();
  if (message.length < 1 || message.length > 1000) {
    return errorResponse("invalid_request", {
      message: "Le signalement doit contenir entre 1 et 1000 caractères.",
    });
  }
  const lieu = analyserIdentifiantQuiz(parsed.data.quizId);
  if (!lieu) {
    return errorResponse("invalid_request", {
      message: "Ce quiz n'est pas reconnu.",
    });
  }
  try {
    const quiz = await obtenirQuiz(parsed.data.quizId);
    if (!quiz) {
      return errorResponse("not_found", { message: "Ce quiz n'existe pas." });
    }
    const position = quiz.questions.findIndex(
      (question) => question.id === parsed.data.questionId
    );
    const question = quiz.questions[position];
    if (!question) {
      return errorResponse("not_found", {
        message: "Cette question n'existe pas.",
      });
    }
    await enregistrerSignalement({
      chapterFile: lieu.fichier,
      chapterTitle: quiz.chapterTitle,
      email: session.user.email || null,
      message,
      options: question.options,
      questionId: question.id,
      questionNumber: position + 1,
      questionText: question.question,
      quizId: quiz.id,
      quizTitle: quiz.title,
      subjectId: quiz.subjectId,
      subjectLabel: quiz.subjectLabel,
      unitId: lieu.unite,
      unitTitle: quiz.unitTitle,
      userId: session.userId,
      username: session.user.username || null,
      year: quiz.year,
    });
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" }, status: 201 }
    );
  } catch (error) {
    console.error("POST /api/quizzly/signalement", error);
    return errorResponse("database_error");
  }
}
