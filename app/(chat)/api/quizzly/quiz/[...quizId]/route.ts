import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { corrigerQuestion } from "@/lib/quizzly/grade";
import { origineConfiance } from "@/lib/quizzly/http";
import {
  analyserIdentifiantQuiz,
  obtenirIndex,
  obtenirQuiz,
  precedentQuiz,
} from "@/lib/quizzly/load";
import {
  progressionPasse,
  resumeQuizzly,
  soumettreQuiz,
} from "@/lib/quizzly/queries";
import { answerSchema, versQuizPublic } from "@/lib/quizzly/schema";
import { matiereSuivie } from "@/lib/quizzly/subjects";

const corpsSchema = z.discriminatedUnion("phase", [
  z
    .object({
      phase: z.literal("reveal"),
      questionId: z.string().regex(/^q(?:[1-9]|10)$/),
      selectedIndexes: z.array(z.number().int().nonnegative().max(5)).max(4),
    })
    .strict(),
  z
    .object({
      answers: z.array(answerSchema).max(10),
      phase: z.literal("finish"),
    })
    .strict(),
]);

type Contexte = { params: Promise<{ quizId: string[] }> };

function identifiant(segments: string[]): string {
  return segments.map((segment) => decodeURIComponent(segment)).join("/");
}

async function matiereEcartee(
  userId: string,
  user: Parameters<typeof resumeQuizzly>[1],
  quizId: string
): Promise<boolean> {
  const analyse = analyserIdentifiantQuiz(quizId);
  if (!analyse) {
    return false;
  }
  const resume = await resumeQuizzly(userId, user);
  return (
    analyse.year === resume.schoolYear &&
    !matiereSuivie(resume.subjects, analyse.matiereId)
  );
}

export async function GET(_request: Request, contexte: Contexte) {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  const { quizId } = await contexte.params;
  const id = identifiant(quizId);
  try {
    const quiz = await obtenirQuiz(id);
    if (!quiz) {
      return errorResponse("not_found", { message: "Ce quiz n'existe pas." });
    }
    if (await matiereEcartee(session.userId, session.user, id)) {
      return errorResponse("access_denied", {
        message: "Cette matière n'est pas dans votre sélection.",
      });
    }
    const index = await obtenirIndex();
    const precedent = precedentQuiz(index, id);
    if (precedent) {
      const passes = await progressionPasse(session.userId);
      if (!passes.has(precedent)) {
        return errorResponse("access_denied", {
          message: "Ce quiz est encore verrouillé.",
        });
      }
    }
    return Response.json(versQuizPublic(quiz), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("GET /api/quizzly/quiz", error);
    return errorResponse("database_error");
  }
}

export async function POST(request: Request, contexte: Contexte) {
  if (!origineConfiance(request)) {
    return errorResponse("access_denied", {
      message: "Origine de la requête non autorisée.",
    });
  }
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  const { quizId } = await contexte.params;
  const id = identifiant(quizId);
  const body = await request.json().catch(() => null);
  const parsed = corpsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  try {
    const quiz = await obtenirQuiz(id);
    if (!quiz) {
      return errorResponse("not_found", { message: "Ce quiz n'existe pas." });
    }
    if (await matiereEcartee(session.userId, session.user, id)) {
      return errorResponse("access_denied", {
        message: "Cette matière n'est pas dans votre sélection.",
      });
    }
    const index = await obtenirIndex();
    const precedent = precedentQuiz(index, id);
    if (precedent) {
      const passes = await progressionPasse(session.userId);
      if (!passes.has(precedent)) {
        return errorResponse("access_denied", {
          message: "Ce quiz est encore verrouillé.",
        });
      }
    }
    const corps = parsed.data;
    if (corps.phase === "reveal") {
      const question = quiz.questions.find(
        (entree) => entree.id === corps.questionId
      );
      if (!question) {
        return errorResponse("not_found", {
          message: "Cette question n'existe pas.",
        });
      }
      return Response.json(corrigerQuestion(question, corps.selectedIndexes), {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    const resultat = await soumettreQuiz(
      session.userId,
      index,
      quiz,
      corps.answers
    );
    if (!resultat.ok) {
      const message =
        resultat.code === "no_hearts"
          ? "Plus de cœurs. Ils reviennent avec le temps, ou depuis la boutique."
          : resultat.code === "subject"
            ? "Cette matière n'est pas dans votre sélection."
            : "Ce quiz est encore verrouillé.";
      return errorResponse(
        resultat.code === "no_hearts" ? "quota_exceeded" : "access_denied",
        { message }
      );
    }
    return Response.json(resultat.resultat, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("POST /api/quizzly/quiz", error);
    return errorResponse("database_error");
  }
}
