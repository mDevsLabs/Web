import type { Metadata } from "next";
import SkillsClient from "./skills-client";

// Rendre la gestion personnelle accessible depuis le catalogue permet de
// créer, modifier et importer un Skill avec les validations API existantes.
export const metadata: Metadata = { title: "Mes Skills | mAI" };

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return <SkillsClient initialCreate={params.create === "1"} />;
}
