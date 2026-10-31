import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { QuizzlyShell } from "@/components/quizzly/shell";
import { requireUser } from "@/lib/auth/require-user";
import { EconomyProvider } from "@/lib/resources/economy";

export const metadata = {
  description: "Révisez le collège et le lycée, un quiz à la fois.",
  title: "Quizzly | mAI",
};

export default async function QuizzlyLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireUser();
  if (!session) {
    redirect("/site?connexion=1&redirectUrl=/quizzly");
  }
  return (
    <EconomyProvider>
      <QuizzlyShell>{children}</QuizzlyShell>
    </EconomyProvider>
  );
}
