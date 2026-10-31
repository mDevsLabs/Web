import { QuizPlayer } from "@/components/quizzly/quiz-player";

export const instant = false;

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string[] }>;
}) {
  const { quizId } = await params;
  const id = quizId.map((segment) => decodeURIComponent(segment)).join("/");
  return <QuizPlayer quizId={id} />;
}
