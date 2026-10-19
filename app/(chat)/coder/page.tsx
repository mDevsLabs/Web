import type { Metadata } from "next";
import { CoderExperienceView } from "@/components/coder/coder-experience-view";

export const metadata: Metadata = {
  description:
    "Espace de travail desktop agent-first : Agent autonome, éditeur Monaco, terminaux PTY natifs et Git intégré.",
  title: "Coder | mAI",
};

export default async function CoderPage() {
  return <CoderExperienceView />;
}
