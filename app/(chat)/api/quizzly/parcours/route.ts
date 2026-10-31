import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { obtenirIndex } from "@/lib/quizzly/load";
import { estAnneeScolaire, SCHOOL_YEARS } from "@/lib/quizzly/program";
import {
  idsOuverts,
  progressionPasse,
  resumeQuizzly,
} from "@/lib/quizzly/queries";

export async function GET(request: Request) {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const url = new URL(request.url);
    const demande = url.searchParams.get("year");
    const resume = await resumeQuizzly(session.userId, session.user);
    const year =
      demande && estAnneeScolaire(demande) ? demande : resume.schoolYear;
    const index = await obtenirIndex();
    const passes = await progressionPasse(session.userId);
    const sujets = index.parAnnee.get(year) ?? [];
    const subjects = sujets.map((matiere) => {
      const ouverts = idsOuverts(index, year, matiere.id, passes);
      return {
        ...matiere,
        chapters: matiere.chapters.map((chapitre) => ({
          ...chapitre,
          units: chapitre.units.map((unite) => ({
            ...unite,
            quizzes: unite.quizzes.map((quiz) => ({
              ...quiz,
              passed: passes.has(quiz.id),
              unlocked: ouverts.has(quiz.id),
            })),
          })),
        })),
      };
    });
    return Response.json(
      {
        schoolYear: resume.schoolYear,
        subjects,
        year,
        yearChosen: resume.yearChosen,
        years: SCHOOL_YEARS,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/parcours", error);
    return errorResponse("database_error");
  }
}
