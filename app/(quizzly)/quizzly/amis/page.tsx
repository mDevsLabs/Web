import { AmisQuizzly } from "@/components/quizzly/amis";

export const instant = false;

export default async function AmisPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const params = await searchParams;
  return <AmisQuizzly pseudoInitial={params.u ?? null} />;
}
