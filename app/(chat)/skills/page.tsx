import { redirect } from "next/navigation";

// Les Skills sont désormais accessibles à tous les forfaits depuis la page
// Outils (onglet Skills).
export default function SkillsPage() {
  redirect("/tools?tab=skills");
}
