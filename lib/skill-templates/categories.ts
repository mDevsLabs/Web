// Catalogue public des catégories de modèles de Skills.
import type { SkillTemplateCategory } from "./types";

export const SKILL_CATEGORIES: SkillTemplateCategory[] = [
  { icon: "Cpu", id: "dev", label: "Développement" },
  { icon: "Search", id: "research", label: "Recherche & données" },
  { icon: "Sparkles", id: "writing", label: "Rédaction" },
  { icon: "Briefcase", id: "business", label: "Business" },
  { icon: "Wrench", id: "ops", label: "Opérations & MCP" },
];
