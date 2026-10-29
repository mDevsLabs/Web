import type { Metadata } from "next";
import { CoderExperienceView } from "@/components/coder/coder-experience-view";

export const metadata: Metadata = {
  description:
    "mAI Coder : application de bureau avec agent IA autonome, éditeur Monaco, terminaux PTY natifs et Git intégré.",
  title: "Coder | mAI",
};

export default async function CoderPage() {
  return <CoderExperienceView />;
}
