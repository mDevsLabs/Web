import { CoachQuizzly } from "@/components/quizzly/coach";

export const instant = false;

function lireParam(valeur: string | string[] | undefined): string | null {
  if (typeof valeur === "string" && valeur.length > 0) {
    return valeur;
  }
  if (Array.isArray(valeur)) {
    const premier = valeur[0];
    if (typeof premier === "string" && premier.length > 0) {
      return premier;
    }
  }
  return null;
}

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{
    question?: string | string[];
    quiz?: string | string[];
  }>;
}) {
  const params = await searchParams;
  return (
    <CoachQuizzly
      questionId={lireParam(params.question)}
      quizId={lireParam(params.quiz)}
    />
  );
}
