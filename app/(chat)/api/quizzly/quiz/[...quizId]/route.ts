import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { origineConfiance } from "@/lib/quizzly/http";
import { obtenirIndex, obtenirQuiz, precedentQuiz } from "@/lib/quizzly/load";
import { progressionPasse, soumettreQuiz } from "@/lib/quizzly/queries";
import { answerSchema, versQuizPublic } from "@/lib/quizzly/schema";

const corpsSchema = z
  .object({
    answers: z.array(answerSchema).max(10),
  })
  .strict();

type Contexte = { params: Promise<{ quizId: string[] }> };

function identifiant(segments: string[]): string {
  return segments.map((segment) => decodeURIComponent(segment)).join("/");
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
    const index = await obtenirIndex();
    const resultat = await soumettreQuiz(
      session.userId,
      index,
      quiz,
      parsed.data.answers
    );
    if (!resultat.ok) {
      const message =
        resultat.code === "no_hearts"
          ? "Plus de cœurs. Ils reviennent avec le temps, ou depuis la boutique."
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
